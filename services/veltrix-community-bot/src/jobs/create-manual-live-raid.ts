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

type ExistingManualRaidEvent = {
  id: string;
  raid_id: string | null;
  decision: string | null;
};

type ManualRaidSourceDefaultsRow = {
  default_reward_xp: number | null;
  default_duration_minutes: number | null;
  default_campaign_id: string | null;
  default_button_label: string | null;
  default_artwork_url: string | null;
};

type CampaignLookupRow = {
  id: string;
  status: string | null;
  created_at: string | null;
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

export function buildFallbackXPostForManualRaid(params: {
  postId: string;
  username: string;
  projectName?: string;
  requestedUrl?: string;
}) {
  const isGenericXStatusUrl = params.username === "i";
  const label = isGenericXStatusUrl
    ? `${params.projectName ?? "the project"} X post`
    : `@${params.username}'s X post`;
  const url =
    params.requestedUrl?.trim() || `https://x.com/${params.username}/status/${params.postId}`;

  return {
    id: params.postId,
    authorId: null,
    username: params.username,
    text: `Raid ${label}.`,
    url,
    mediaUrls: [],
    createdAt: null,
    isReply: false,
    isRepost: false,
    replyToPostId: null,
  } satisfies XRaidPost;
}

export function shouldUseManualXPostFallback(error: unknown) {
  const message = getManualRaidErrorMessage(error, "");

  return (
    message.includes("X_API_BEARER_TOKEN") ||
    /X API request failed with (401|402|403|429)/i.test(message) ||
    /fetch failed|aborted|network|timeout/i.test(message)
  );
}

export function getManualRaidErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code ? `code ${String(record.code)}` : null,
    ]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .map((part) => part.trim());

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return fallback;
}

export function shouldRetryExistingManualRaidEvent(event: ExistingManualRaidEvent | null) {
  return Boolean(event && !event.raid_id);
}

export function shouldSkipExistingManualRaidEvent(event: ExistingManualRaidEvent | null) {
  return Boolean(event?.raid_id);
}

export function pickManualRaidCampaignId(params: {
  campaignOverrideId?: string | null;
  sourceDefaultCampaignId?: string | null;
  fallbackCampaignId?: string | null;
}) {
  return (
    params.campaignOverrideId?.trim() ||
    params.sourceDefaultCampaignId?.trim() ||
    params.fallbackCampaignId?.trim() ||
    null
  );
}

function sortProjectCampaignsForManualRaid(left: CampaignLookupRow, right: CampaignLookupRow) {
  const leftActive = left.status === "active" ? 1 : 0;
  const rightActive = right.status === "active" ? 1 : 0;
  if (leftActive !== rightActive) {
    return rightActive - leftActive;
  }

  return Date.parse(left.created_at ?? "") - Date.parse(right.created_at ?? "");
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

async function loadProjectFallbackCampaignId(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("id, status, created_at")
    .eq("project_id", projectId);

  if (error) throw error;

  const campaigns = ((data ?? []) as CampaignLookupRow[]).sort(sortProjectCampaignsForManualRaid);
  return campaigns[0]?.id ?? null;
}

async function loadDefaults(params: {
  projectId: string;
  username: string;
  campaignRef?: string;
}): Promise<ManualRaidDefaults> {
  const [{ data: matchedSource, error: matchedSourceError }, { data: fallbackSource, error: fallbackSourceError }, campaignOverrideId, fallbackCampaignId] = await Promise.all([
    supabaseAdmin
      .from("x_raid_sources")
      .select(
        "default_reward_xp, default_duration_minutes, default_campaign_id, default_button_label, default_artwork_url"
      )
      .eq("project_id", params.projectId)
      .ilike("x_username", params.username)
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("x_raid_sources")
      .select(
        "default_reward_xp, default_duration_minutes, default_campaign_id, default_button_label, default_artwork_url"
      )
      .eq("project_id", params.projectId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadCampaignOverrideId(params.projectId, params.campaignRef),
    loadProjectFallbackCampaignId(params.projectId),
  ]);

  if (matchedSourceError) throw matchedSourceError;
  if (fallbackSourceError) throw fallbackSourceError;

  const source = (matchedSource ?? fallbackSource ?? null) as ManualRaidSourceDefaultsRow | null;
  const campaignId = pickManualRaidCampaignId({
    campaignOverrideId,
    sourceDefaultCampaignId: source?.default_campaign_id,
    fallbackCampaignId,
  });

  if (!campaignId) {
    throw new Error(
      "Live raids need a campaign. Create a campaign or select a default campaign in the VYNTRO portal first."
    );
  }

  return {
    rewardXp: source?.default_reward_xp ?? 50,
    durationMinutes: source?.default_duration_minutes ?? 1440,
    campaignId,
    buttonLabel: source?.default_button_label ?? "Open raid",
    artworkUrl: source?.default_artwork_url ?? null,
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

async function persistManualRaidEvent(params: {
  eventId?: string;
  projectId: string;
  post: XRaidPost;
  actorProvider: "telegram" | "discord";
  actorProviderUserId: string;
  skipCaptainAuthorization?: boolean;
  normalizedOverrides: NormalizedManualRaidOverrides;
  requestedUrl: string;
}) {
  const payload = {
    project_id: params.projectId,
    source_id: null,
    x_post_id: params.post.id,
    x_author_id: params.post.authorId,
    x_username: params.post.username,
    post_url: params.post.url,
    text: params.post.text,
    media_urls: params.post.mediaUrls,
    decision: "created_raid",
    decision_reason: params.eventId ? "manual_command_retry" : "manual_command",
    raid_id: null,
    delivery_metadata: {},
    raw_payload: {
      manual: true,
      commandSource: params.actorProvider,
      commandActorProviderUserId: params.actorProviderUserId,
      commandAuthorization: params.skipCaptainAuthorization
        ? `${params.actorProvider}_admin`
        : "captain",
      commandOverrides: params.normalizedOverrides,
      requestedUrl: params.requestedUrl,
    },
    updated_at: new Date().toISOString(),
  };

  if (params.eventId) {
    const { data, error } = await supabaseAdmin
      .from("x_raid_ingest_events")
      .update(payload)
      .eq("id", params.eventId)
      .select("id")
      .single();

    if (error) throw error;
    return data as { id: string };
  }

  const { data, error } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
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
    .select("id, raid_id, decision")
    .eq("project_id", params.projectId)
    .eq("x_post_id", parsed.postId)
    .maybeSingle();

  if (existingError) throw existingError;
  const existingEvent = existing as ExistingManualRaidEvent | null;
  if (existingEvent?.raid_id) {
    return {
      ok: true as const,
      status: "skipped" as const,
      reason: "duplicate_post" as const,
      eventId: existingEvent.id,
      raidId: existingEvent.raid_id,
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
            return buildFallbackXPostForManualRaid({
              ...parsed,
              projectName: project.name ?? "Project",
              requestedUrl: params.xUrl,
            });
          }

          throw error;
        })
      : buildFallbackXPostForManualRaid({
          ...parsed,
          projectName: project.name ?? "Project",
          requestedUrl: params.xUrl,
        });

  const draft = buildManualLiveRaidDraft({
    projectName: project.name ?? "Project",
    post,
    defaults,
    overrides: normalizedOverrides,
    now: new Date(),
  });

  const event = await persistManualRaidEvent({
    eventId: shouldRetryExistingManualRaidEvent(existingEvent) ? existingEvent?.id : undefined,
    projectId: params.projectId,
    post,
    actorProvider: params.actorProvider,
    actorProviderUserId: params.actorProviderUserId,
    skipCaptainAuthorization: params.skipCaptainAuthorization,
    normalizedOverrides,
    requestedUrl: params.xUrl,
  });

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
    const reason = getManualRaidErrorMessage(error, "Manual live raid creation failed.");
    await markEventFailed(event.id, reason);
    throw error;
  }
}
