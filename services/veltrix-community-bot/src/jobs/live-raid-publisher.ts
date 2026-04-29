import {
  type ProviderScope,
  appUrl,
  dispatchProjectCommunityMessageWithResults,
  getDefaultCommunityArtwork,
} from "../core/community/delivery.js";
import { type TweetToRaidDraft } from "../core/raids/tweet-to-raid.js";
import { supabaseAdmin } from "../lib/supabase.js";

export function resolveLiveRaidBanner(banner: string | null | undefined) {
  return banner?.trim() || getDefaultCommunityArtwork("raid");
}

export function buildLiveRaidInsertPayload(params: {
  projectId: string;
  projectName: string;
  campaignId: string | null;
  draft: TweetToRaidDraft;
  sourceEventId: string;
  sourceProvider: string;
  generatedBy: string;
}) {
  return {
    project_id: params.projectId,
    campaign_id: params.campaignId,
    title: params.draft.title,
    short_description: params.draft.shortDescription,
    community: params.projectName,
    timer: "Live",
    reward: params.draft.rewardXp,
    reward_xp: params.draft.rewardXp,
    participants: 0,
    progress: 0,
    target: params.draft.target,
    banner: resolveLiveRaidBanner(params.draft.banner),
    instructions: params.draft.instructions,
    status: "active",
    source_provider: params.sourceProvider,
    source_url: params.draft.sourceUrl,
    source_external_id: params.draft.sourceExternalId,
    source_event_id: params.sourceEventId,
    ends_at: params.draft.endsAt,
    generated_by: params.generatedBy,
  };
}

export function buildLiveRaidDeliveryMessage(params: {
  title: string;
  shortDescription: string;
  rewardXp: number;
  sourceLabel: string;
}) {
  return {
    title: `LIVE RAID: ${params.title}`,
    body: `${params.shortDescription}\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO.`,
    meta: [
      { label: "Reward", value: `+${params.rewardXp} XP` },
      { label: "Source", value: params.sourceLabel },
    ],
  };
}

function normalizeSupabaseError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error;
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

    return new Error(parts.length > 0 ? parts.join(" ") : fallback);
  }

  return new Error(fallback);
}

export async function createLiveRaidAndDeliver(params: {
  projectId: string;
  projectName: string;
  draft: TweetToRaidDraft;
  sourceEventId: string;
  sourceProvider: string;
  generatedBy: string;
  providerScope?: ProviderScope;
  sourceLabel: string;
}) {
  const banner = resolveLiveRaidBanner(params.draft.banner);
  const { data: raid, error: raidError } = await supabaseAdmin
    .from("raids")
    .insert(
      buildLiveRaidInsertPayload({
        projectId: params.projectId,
        projectName: params.projectName,
        campaignId: params.draft.campaignId,
        draft: params.draft,
        sourceEventId: params.sourceEventId,
        sourceProvider: params.sourceProvider,
        generatedBy: params.generatedBy,
      })
    )
    .select("id")
    .single();

  if (raidError) {
    throw normalizeSupabaseError(raidError, "Failed to create live raid.");
  }

  const raidUrl = `${appUrl}/raids/${raid.id}`;
  const message = buildLiveRaidDeliveryMessage({
    title: params.draft.title,
    shortDescription: params.draft.shortDescription,
    rewardXp: params.draft.rewardXp,
    sourceLabel: params.sourceLabel,
  });
  const deliveries = await dispatchProjectCommunityMessageWithResults({
    projectId: params.projectId,
    providerScope: params.providerScope ?? "both",
    title: message.title,
    body: message.body,
    eyebrow: "LIVE RAID",
    projectName: params.projectName,
    imageUrl: banner,
    fallbackImageUrl: banner,
    meta: message.meta,
    url: raidUrl,
    buttonLabel: params.draft.buttonLabel,
  });

  const deliveryMetadata = {
    deliveries,
    deliveredAt: new Date().toISOString(),
    sourceUrl: params.draft.sourceUrl,
  };

  await supabaseAdmin
    .from("raids")
    .update({ delivery_metadata: deliveryMetadata })
    .eq("id", raid.id);

  return {
    raidId: raid.id as string,
    raidUrl,
    deliveries,
    deliveryMetadata,
  };
}
