import { supabaseAdmin } from "../lib/supabase.js";
import {
  buildTweetToRaidDecision,
  normalizeXUsername,
  type TweetToRaidPost,
  type TweetToRaidSource,
} from "../core/raids/tweet-to-raid.js";
import {
  appUrl,
  dispatchProjectCommunityMessageWithResults,
} from "../core/community/delivery.js";

export type IngestXRaidPostInput = {
  projectId: string;
  sourceId?: string;
  post: {
    id: string;
    authorId?: string | null;
    username: string;
    text: string;
    url?: string | null;
    mediaUrls?: string[];
    createdAt?: string | null;
    isReply?: boolean;
    isRepost?: boolean;
    replyToPostId?: string | null;
  };
  forceMode?: "review" | "auto_live";
};

type SourceRow = {
  id: string;
  project_id: string;
  x_account_id: string | null;
  x_username: string;
  mode: "review" | "auto_live";
  status: "active" | "paused" | "blocked";
  required_hashtags: string[] | null;
  exclude_replies: boolean | null;
  exclude_reposts: boolean | null;
  cooldown_minutes: number | null;
  max_raids_per_day: number | null;
  default_reward_xp: number | null;
  default_duration_minutes: number | null;
  default_campaign_id: string | null;
  default_button_label: string | null;
  default_artwork_url: string | null;
  projects: {
    name: string | null;
    slug: string | null;
  } | null;
};

function mapSource(row: SourceRow, forceMode?: "review" | "auto_live"): TweetToRaidSource {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.projects?.name ?? "Project",
    projectSlug: row.projects?.slug ?? null,
    xAccountId: row.x_account_id,
    xUsername: row.x_username,
    mode: forceMode ?? row.mode ?? "review",
    status: row.status ?? "paused",
    requiredHashtags: row.required_hashtags ?? [],
    excludeReplies: row.exclude_replies ?? true,
    excludeReposts: row.exclude_reposts ?? true,
    cooldownMinutes: row.cooldown_minutes ?? 30,
    maxRaidsPerDay: row.max_raids_per_day ?? 6,
    defaultRewardXp: row.default_reward_xp ?? 50,
    defaultDurationMinutes: row.default_duration_minutes ?? 1440,
    defaultCampaignId: row.default_campaign_id,
    defaultButtonLabel: row.default_button_label ?? "Open raid",
    defaultArtworkUrl: row.default_artwork_url,
  };
}

function mapPost(post: IngestXRaidPostInput["post"]): TweetToRaidPost {
  return {
    id: post.id,
    authorId: post.authorId ?? null,
    username: post.username,
    text: post.text,
    url: post.url ?? `https://x.com/${normalizeXUsername(post.username)}/status/${post.id}`,
    mediaUrls: post.mediaUrls ?? [],
    createdAt: post.createdAt ?? null,
    isReply: post.isReply ?? Boolean(post.replyToPostId),
    isRepost: post.isRepost ?? false,
  };
}

async function loadSource(input: IngestXRaidPostInput) {
  let query = supabaseAdmin
    .from("x_raid_sources")
    .select("*, projects(name, slug)")
    .eq("project_id", input.projectId);

  if (input.sourceId) {
    query = query.eq("id", input.sourceId);
  } else {
    query = query.ilike("x_username", normalizeXUsername(input.post.username));
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data as SourceRow | null;
}

async function countDailyCreatedRaids(sourceId: string, now: Date) {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("id", { count: "exact", head: true })
    .eq("source_id", sourceId)
    .eq("decision", "created_raid")
    .gte("created_at", startOfDay.toISOString());

  if (error) throw error;
  return count ?? 0;
}

async function loadLastCreatedRaidAt(sourceId: string) {
  const { data, error } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("created_at")
    .eq("source_id", sourceId)
    .eq("decision", "created_raid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.created_at ?? null;
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

export async function ingestXRaidPost(input: IngestXRaidPostInput) {
  const now = new Date();
  const sourceRow = await loadSource(input);

  if (!sourceRow) {
    return {
      ok: false,
      status: "skipped" as const,
      reason: "source_not_found",
    };
  }

  const source = mapSource(sourceRow, input.forceMode);
  const post = mapPost(input.post);

  const { data: existingEvent, error: existingError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("id, decision, decision_reason, raid_id, candidate_id")
    .eq("project_id", source.projectId)
    .eq("x_post_id", post.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const dailyCreatedRaidCount = await countDailyCreatedRaids(source.id, now);
  const lastCreatedRaidAt = await loadLastCreatedRaidAt(source.id);
  const decision = buildTweetToRaidDecision({
    source,
    post,
    alreadyIngested: Boolean(existingEvent),
    dailyCreatedRaidCount,
    lastCreatedRaidAt,
    now,
  });

  if (decision.action === "skip") {
    if (!existingEvent) {
      await supabaseAdmin.from("x_raid_ingest_events").insert({
        project_id: source.projectId,
        source_id: source.id,
        x_post_id: post.id,
        x_author_id: post.authorId,
        x_username: normalizeXUsername(post.username),
        post_url: post.url,
        text: post.text,
        media_urls: post.mediaUrls,
        decision: "skipped",
        decision_reason: decision.reason,
        raw_payload: input,
      });
    }

    return {
      ok: true,
      status: "skipped" as const,
      reason: decision.reason,
      existingEventId: existingEvent?.id ?? null,
    };
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .insert({
      project_id: source.projectId,
      source_id: source.id,
      x_post_id: post.id,
      x_author_id: post.authorId,
      x_username: normalizeXUsername(post.username),
      post_url: post.url,
      text: post.text,
      media_urls: post.mediaUrls,
      decision: decision.action === "create_raid" ? "created_raid" : "created_candidate",
      decision_reason: decision.reason,
      raw_payload: input,
    })
    .select("id")
    .single();

  if (eventError) throw eventError;

  try {
    if (decision.action === "create_candidate") {
      const { data: candidate, error: candidateError } = await supabaseAdmin
        .from("raid_generation_candidates")
        .insert({
          project_id: source.projectId,
          source_event_id: event.id,
          status: "pending",
          title: decision.draft.title,
          short_description: decision.draft.shortDescription,
          tweet_url: decision.draft.sourceUrl,
          banner: decision.draft.banner,
          reward_xp: decision.draft.rewardXp,
          starts_at: decision.draft.startsAt,
          ends_at: decision.draft.endsAt,
          metadata: {
            sourceProvider: "x",
            sourceExternalId: decision.draft.sourceExternalId,
            instructions: decision.draft.instructions,
            target: decision.draft.target,
          },
        })
        .select("id")
        .single();

      if (candidateError) throw candidateError;

      await supabaseAdmin
        .from("x_raid_ingest_events")
        .update({ candidate_id: candidate.id, updated_at: new Date().toISOString() })
        .eq("id", event.id);

      return {
        ok: true,
        status: "created_candidate" as const,
        eventId: event.id,
        candidateId: candidate.id,
      };
    }

    const { data: raid, error: raidError } = await supabaseAdmin
      .from("raids")
      .insert({
        project_id: source.projectId,
        campaign_id: decision.draft.campaignId,
        title: decision.draft.title,
        short_description: decision.draft.shortDescription,
        community: source.projectName,
        timer: "Live",
        reward: decision.draft.rewardXp,
        reward_xp: decision.draft.rewardXp,
        participants: 0,
        progress: 0,
        target: decision.draft.target,
        banner: decision.draft.banner,
        instructions: decision.draft.instructions,
        status: "active",
        source_provider: "x",
        source_url: decision.draft.sourceUrl,
        source_external_id: decision.draft.sourceExternalId,
        source_event_id: event.id,
        ends_at: decision.draft.endsAt,
        generated_by: "tweet_to_raid",
      })
      .select("id")
      .single();

    if (raidError) throw raidError;

    const raidUrl = `${appUrl}/raids/${raid.id}`;
    const deliveries = await dispatchProjectCommunityMessageWithResults({
      projectId: source.projectId,
      providerScope: "both",
      title: `LIVE RAID: ${decision.draft.title}`,
      body: `${decision.draft.shortDescription}\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO.`,
      eyebrow: "LIVE RAID",
      projectName: source.projectName,
      imageUrl: decision.draft.banner,
      fallbackImageUrl: decision.draft.banner,
      meta: [
        { label: "Reward", value: `+${decision.draft.rewardXp} XP` },
        { label: "Source", value: "X" },
      ],
      url: raidUrl,
      buttonLabel: decision.draft.buttonLabel,
    });

    const deliveryMetadata = {
      deliveries,
      deliveredAt: new Date().toISOString(),
      sourceUrl: decision.draft.sourceUrl,
    };

    await Promise.all([
      supabaseAdmin
        .from("x_raid_ingest_events")
        .update({
          raid_id: raid.id,
          delivery_metadata: deliveryMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id),
      supabaseAdmin
        .from("raids")
        .update({ delivery_metadata: deliveryMetadata })
        .eq("id", raid.id),
      supabaseAdmin
        .from("x_raid_sources")
        .update({
          last_event_at: new Date().toISOString(),
          last_raid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", source.id),
    ]);

    return {
      ok: true,
      status: "created_raid" as const,
      eventId: event.id,
      raidId: raid.id,
      deliveries,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "X raid ingest failed.";
    await markEventFailed(event.id, reason);
    throw error;
  }
}
