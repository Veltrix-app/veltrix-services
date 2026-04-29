import { env } from "../config/env.js";
import { captainHasPermission, loadCaptainByProviderIdentity } from "../core/community/captains.js";
import {
  normalizeManualRaidOverrides,
  type ManualRaidCommandOverrides,
  type NormalizedManualRaidOverrides,
} from "../core/raids/manual-raid-command.js";
import { parseXStatusUrl } from "../core/raids/x-post-url.js";
import {
  clampGeneratedRaidXp,
  summarizeTweetForRaid,
  type TweetToRaidDraft,
} from "../core/raids/tweet-to-raid.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { fetchXPostById, type XRaidPost } from "../providers/x/posts.js";
import { createLiveRaidAndDeliver } from "./live-raid-publisher.js";

export type ManualRaidDefaults = {
  rewardXp: number;
  durationMinutes: number;
  campaignId: string | null;
  buttonLabel: string;
  artworkUrl: string | null;
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function buildManualLiveRaidDraft(params: {
  projectName: string;
  post: XRaidPost;
  defaults: ManualRaidDefaults;
  overrides: NormalizedManualRaidOverrides;
  now: Date;
}): TweetToRaidDraft {
  const rewardXp = clampGeneratedRaidXp(params.overrides.rewardXp ?? params.defaults.rewardXp);
  const durationMinutes = Math.min(
    10080,
    Math.max(15, params.overrides.durationMinutes ?? params.defaults.durationMinutes)
  );
  const startsAt = params.now.toISOString();
  const endsAt = addMinutes(params.now, durationMinutes).toISOString();

  return {
    title: summarizeTweetForRaid(params.post.text, params.projectName),
    shortDescription: params.post.text.replace(/\s+/g, " ").trim(),
    target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
    instructions: [
      "Open the source post.",
      "Like, repost, comment or complete the project action honestly.",
      "Return to VYNTRO and confirm the raid once your action is complete.",
    ],
    sourceUrl: params.post.url,
    sourceExternalId: params.post.id,
    banner: params.post.mediaUrls[0] ?? params.defaults.artworkUrl,
    rewardXp,
    startsAt,
    endsAt,
    campaignId: params.defaults.campaignId,
    buttonLabel: params.overrides.buttonLabel ?? params.defaults.buttonLabel,
  };
}

export function isManualRaidDuplicateReason(reason: string) {
  return reason === "duplicate_post";
}

export function buildFallbackXPostForManualRaid(params: { postId: string; username: string }) {
  return {
    id: params.postId,
    authorId: null,
    username: params.username,
    text: `Raid @${params.username}'s X post.`,
    url: `https://x.com/${params.username}/status/${params.postId}`,
    mediaUrls: [],
    createdAt: null,
    isReply: false,
    isRepost: false,
    replyToPostId: null,
  } satisfies XRaidPost;
}

export function shouldUseManualXPostFallback(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    message.includes("X_API_BEARER_TOKEN") ||
    /X API request failed with (401|402|403|429)/i.test(message) ||
    /fetch failed|aborted|network|timeout/i.test(message)
  );
}

async function loadProject(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .single();

  if (error) throw error;
  return data as { id: string; name: string | null; slug: string | null };
}

async function loadCampaignOverrideId(projectId: string, campaignRef?: string) {
  const normalizedRef = campaignRef?.trim();
  if (!normalizedRef) return null;

  let query = supabaseAdmin.from("campaigns").select("id").eq("project_id", projectId).limit(1);
  query = isUuid(normalizedRef) ? query.eq("id", normalizedRef) : query.eq("slug", normalizedRef);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data?.id) {
    throw new Error("Requested campaign does not belong to this project or could not be found.");
  }

  return data.id as string;
}

async function loadDefaults(params: {
  projectId: string;
  username: string;
  campaignRef?: string;
}): Promise<ManualRaidDefaults> {
  const [{ data, error }, campaignOverrideId] = await Promise.all([
    supabaseAdmin
      .from("x_raid_sources")
      .select(
        "default_reward_xp, default_duration_minutes, default_campaign_id, default_button_label, default_artwork_url"
      )
      .eq("project_id", params.projectId)
      .ilike("x_username", params.username)
      .limit(1)
      .maybeSingle(),
    loadCampaignOverrideId(params.projectId, params.campaignRef),
  ]);

  if (error) throw error;

  return {
    rewardXp: data?.default_reward_xp ?? 50,
    durationMinutes: data?.default_duration_minutes ?? 1440,
    campaignId: campaignOverrideId ?? data?.default_campaign_id ?? null,
    buttonLabel: data?.default_button_label ?? "Open raid",
    artworkUrl: data?.default_artwork_url ?? null,
  };
}

async function assertAuthorizedCaptain(params: {
  projectId: string;
  provider: "telegram" | "discord";
  providerUserId: string;
  skipCaptainAuthorization?: boolean;
}) {
  if (params.skipCaptainAuthorization) {
    return;
  }

  const captain = await loadCaptainByProviderIdentity(params);
  if (!captainHasPermission(captain, "raid_alert", "community_only")) {
    throw new Error("Only project captains with raid alert permission can create live raids.");
  }
}

async function markEventFailed(eventId: string, reason: string) {
  await supabaseAdmin
    .from("x_raid_ingest_events")
    .update({
      decision: "failed",
      decision_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

export async function createManualLiveRaidFromXPost(params: {
  projectId: string;
  xUrl: string;
  actorProvider: "telegram" | "discord";
  actorProviderUserId: string;
  overrides?: ManualRaidCommandOverrides;
  skipCaptainAuthorization?: boolean;
  allowUnfetchedFallback?: boolean;
}) {
  await assertAuthorizedCaptain({
    projectId: params.projectId,
    provider: params.actorProvider,
    providerUserId: params.actorProviderUserId,
    skipCaptainAuthorization: params.skipCaptainAuthorization,
  });

  if (!env.X_API_BEARER_TOKEN && !params.allowUnfetchedFallback) {
    throw new Error("X_API_BEARER_TOKEN is missing on the community bot deployment.");
  }

  const parsed = parseXStatusUrl(params.xUrl);
  if (!parsed.ok) {
    throw new Error("Paste a valid X status URL, for example https://x.com/project/status/123.");
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("id, raid_id")
    .eq("project_id", params.projectId)
    .eq("x_post_id", parsed.postId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    return {
      ok: true as const,
      status: "skipped" as const,
      reason: "duplicate_post" as const,
      eventId: existing.id as string,
      raidId: (existing.raid_id as string | null) ?? null,
    };
  }

  const normalizedOverrides = normalizeManualRaidOverrides(params.overrides ?? {});
  const [project, defaults] = await Promise.all([
    loadProject(params.projectId),
    loadDefaults({
      projectId: params.projectId,
      username: parsed.username,
      campaignRef: normalizedOverrides.campaignRef,
    }),
  ]);
  const post =
    env.X_API_BEARER_TOKEN
      ? await fetchXPostById({
          postId: parsed.postId,
          fallbackUsername: parsed.username,
          bearerToken: env.X_API_BEARER_TOKEN,
        }).catch((error) => {
          if (params.allowUnfetchedFallback && shouldUseManualXPostFallback(error)) {
            return buildFallbackXPostForManualRaid(parsed);
          }

          throw error;
        })
      : buildFallbackXPostForManualRaid(parsed);

  const draft = buildManualLiveRaidDraft({
    projectName: project.name ?? "Project",
    post,
    defaults,
    overrides: normalizedOverrides,
    now: new Date(),
  });

  const { data: event, error: eventError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .insert({
      project_id: params.projectId,
      source_id: null,
      x_post_id: post.id,
      x_author_id: post.authorId,
      x_username: post.username,
      post_url: post.url,
      text: post.text,
      media_urls: post.mediaUrls,
      decision: "created_raid",
      decision_reason: "manual_command",
      raw_payload: {
        manual: true,
        commandSource: params.actorProvider,
        commandActorProviderUserId: params.actorProviderUserId,
        commandAuthorization: params.skipCaptainAuthorization
          ? `${params.actorProvider}_admin`
          : "captain",
        commandOverrides: normalizedOverrides,
        requestedUrl: params.xUrl,
      },
    })
    .select("id")
    .single();

  if (eventError) throw eventError;

  try {
    const liveRaid = await createLiveRaidAndDeliver({
      projectId: params.projectId,
      projectName: project.name ?? "Project",
      draft,
      sourceEventId: event.id,
      sourceProvider: "x_manual_command",
      generatedBy: "manual_raid_command",
      sourceLabel: "X command",
    });

    await supabaseAdmin
      .from("x_raid_ingest_events")
      .update({
        raid_id: liveRaid.raidId,
        delivery_metadata: liveRaid.deliveryMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);

    return {
      ok: true as const,
      status: "created_raid" as const,
      eventId: event.id as string,
      raidId: liveRaid.raidId,
      raidUrl: liveRaid.raidUrl,
      deliveries: liveRaid.deliveries,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Manual live raid creation failed.";
    await markEventFailed(event.id, reason);
    throw error;
  }
}
