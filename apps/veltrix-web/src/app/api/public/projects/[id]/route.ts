import { NextResponse } from "next/server";
import { calculateQuestGlobalXp } from "@/lib/xp/xp-economy";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { LiveCampaign, LiveProject, LiveQuest, LiveRaid, LiveReward } from "@/types/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProjectRow = {
  id: string;
  name: string | null;
  description: string | null;
  long_description: string | null;
  category: string | null;
  chain: string | null;
  logo: string | null;
  banner_url: string | null;
  members: number | null;
  website: string | null;
  x_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;
  docs_url: string | null;
  waitlist_url: string | null;
  launch_post_url: string | null;
  token_contract_address: string | null;
  nft_contract_address: string | null;
  primary_wallet: string | null;
  brand_accent: string | null;
  brand_mood: string | null;
  is_featured: boolean | null;
  is_public: boolean | null;
  status: string | null;
};

type CampaignRow = {
  id: string;
  project_id: string | null;
  title: string | null;
  short_description: string | null;
  long_description: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  xp_budget: number | null;
  featured: boolean | null;
  completion_rate: number | null;
  ends_at: string | null;
  campaign_mode: string | null;
  reward_type: string | null;
  reward_pool_amount: number | null;
  min_xp_required: number | null;
  activity_threshold: number | null;
  lock_days: number | null;
};

type RewardRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  cost: number | null;
  rarity: string | null;
  claimable: boolean | null;
  reward_type: string | null;
  type: string | null;
};

type QuestRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  title: string | null;
  description: string | null;
  type: string | null;
  quest_type: string | null;
  status: string | null;
  xp: number | null;
  action_label: string | null;
  action_url: string | null;
  proof_required: boolean | null;
  proof_type: string | null;
  verification_type: string | null;
  verification_provider: string | null;
  verification_config: unknown;
  completion_mode: string | null;
  auto_approve: boolean | null;
};

type RaidRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  title: string | null;
  community: string | null;
  timer: string | null;
  reward: number | null;
  reward_xp: number | null;
  participants: number | null;
  progress: number | null;
  target: string | null;
  banner: string | null;
  instructions: unknown;
  source_provider: string | null;
  source_url: string | null;
  source_external_id: string | null;
  ends_at: string | null;
  generated_by: string | null;
};

const projectSelect = [
  "id",
  "name",
  "description",
  "long_description",
  "category",
  "chain",
  "logo",
  "banner_url",
  "members",
  "website",
  "x_url",
  "telegram_url",
  "discord_url",
  "docs_url",
  "waitlist_url",
  "launch_post_url",
  "token_contract_address",
  "nft_contract_address",
  "primary_wallet",
  "brand_accent",
  "brand_mood",
  "is_featured",
  "is_public",
  "status",
].join(",");

const publicRelatedSelect = "*";

function mapProject(row: ProjectRow): LiveProject {
  return {
    id: row.id,
    name: row.name ?? "Project",
    description: row.description ?? "No description yet.",
    longDescription: row.long_description ?? null,
    category: row.category ?? null,
    chain: row.chain ?? null,
    logo: row.logo ?? null,
    bannerUrl: row.banner_url ?? null,
    members: row.members ?? 0,
    website: row.website ?? null,
    xUrl: row.x_url ?? null,
    telegramUrl: row.telegram_url ?? null,
    discordUrl: row.discord_url ?? null,
    docsUrl: row.docs_url ?? null,
    waitlistUrl: row.waitlist_url ?? null,
    launchPostUrl: row.launch_post_url ?? null,
    tokenContractAddress: row.token_contract_address ?? null,
    nftContractAddress: row.nft_contract_address ?? null,
    primaryWallet: row.primary_wallet ?? null,
    brandAccent: row.brand_accent ?? null,
    brandMood: row.brand_mood ?? null,
    isFeatured: row.is_featured ?? false,
    isPublic: row.is_public ?? true,
  };
}

function mapCampaign(row: CampaignRow): LiveCampaign {
  return {
    id: row.id,
    projectId: row.project_id ?? null,
    title: row.title ?? "Campaign",
    description: row.short_description ?? row.long_description ?? "Live campaign from backend.",
    bannerUrl: row.banner_url ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    xpBudget: row.xp_budget ?? 0,
    featured: row.featured ?? false,
    completionRate: row.completion_rate ?? 0,
    endsAt: row.ends_at ?? null,
    campaignMode: row.campaign_mode ?? null,
    rewardType: row.reward_type ?? null,
    rewardPoolAmount: row.reward_pool_amount ?? 0,
    minXpRequired: row.min_xp_required ?? 0,
    activityThreshold: row.activity_threshold ?? 0,
    lockDays: row.lock_days ?? 0,
  };
}

function mapReward(row: RewardRow): LiveReward {
  const rarity = row.rarity;

  return {
    id: row.id,
    projectId: row.project_id ?? null,
    campaignId: row.campaign_id ?? null,
    title: row.title ?? "Reward",
    description: row.description ?? "Reward from backend.",
    imageUrl: row.image_url ?? null,
    cost: row.cost ?? 0,
    rarity:
      rarity === "rare" || rarity === "epic" || rarity === "legendary" ? rarity : "common",
    claimable: row.claimable ?? false,
    claimed: false,
    rewardType: row.reward_type ?? row.type ?? "reward",
  };
}

function mapQuest(row: QuestRow): LiveQuest {
  const questType = row.quest_type ?? row.type ?? "custom";
  const verificationType = row.verification_type ?? "manual_review";
  const verificationConfig =
    row.verification_config && typeof row.verification_config === "object"
      ? (row.verification_config as Record<string, unknown>)
      : null;
  const verificationProvider =
    row.verification_provider ??
    (questType === "telegram_join"
      ? "telegram"
      : questType === "discord_join"
        ? "discord"
        : questType === "social_follow"
          ? "x"
          : questType === "url_visit"
            ? "website"
            : verificationType === "bot_check" &&
                typeof verificationConfig?.groupUrl === "string" &&
                verificationConfig.groupUrl.trim().length > 0
              ? "telegram"
              : verificationType === "bot_check" &&
                  typeof verificationConfig?.inviteUrl === "string" &&
                  verificationConfig.inviteUrl.trim().length > 0
                ? "discord"
                : verificationType === "api_check"
                  ? "x"
                  : null);
  const completionMode =
    row.completion_mode ??
    (verificationProvider && ["bot_check", "api_check", "event_check"].includes(verificationType)
      ? "integration_auto"
      : row.auto_approve
        ? "rule_auto"
        : "manual");
  const projectPoints = row.xp ?? 0;
  const globalXpPlan = calculateQuestGlobalXp({
    questType,
    requestedXp: projectPoints,
    difficulty:
      typeof verificationConfig?.difficulty === "string"
        ? verificationConfig.difficulty
        : null,
    proofRequired: row.proof_required ?? false,
    proofType: row.proof_type ?? "none",
    verificationType,
    verificationProvider,
    completionMode,
  });

  return {
    id: row.id,
    projectId: row.project_id ?? null,
    campaignId: row.campaign_id ?? null,
    title: row.title ?? "Quest",
    description: row.description ?? "",
    type: row.type ?? row.quest_type ?? "Task",
    questType,
    status:
      row.status === "pending" || row.status === "approved" || row.status === "rejected"
        ? row.status
        : "open",
    xp: globalXpPlan.globalXp,
    projectPoints,
    actionLabel: row.action_label ?? "Open Task",
    actionUrl: row.action_url ?? null,
    proofRequired: row.proof_required ?? false,
    proofType: row.proof_type ?? "none",
    verificationType,
    verificationProvider,
    completionMode,
    verificationConfig,
  };
}

function mapRaid(row: RaidRow): LiveRaid {
  return {
    id: row.id,
    projectId: row.project_id ?? null,
    campaignId: row.campaign_id ?? null,
    title: row.title ?? "Raid",
    community: row.community ?? "Community",
    timer: row.timer ?? "Live",
    reward: row.reward ?? row.reward_xp ?? 0,
    participants: row.participants ?? 0,
    progress: row.progress ?? 0,
    target: row.target ?? "",
    banner: row.banner ?? "",
    instructions: Array.isArray(row.instructions)
      ? row.instructions.filter((item): item is string => typeof item === "string")
      : [],
    sourceProvider: row.source_provider ?? null,
    sourceUrl: row.source_url ?? null,
    sourceExternalId: row.source_external_id ?? null,
    endsAt: row.ends_at ?? null,
    generatedBy: row.generated_by ?? null,
  };
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = id?.trim();

  if (!projectId) {
    return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(projectSelect)
      .eq("id", projectId)
      .eq("status", "active")
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ ok: false, error: projectError.message }, { status: 500 });
    }

    const projectRow = projectData as ProjectRow | null;
    if (!projectRow || projectRow.is_public === false) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select(publicRelatedSelect)
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (campaignError) {
      return NextResponse.json({ ok: false, error: campaignError.message }, { status: 500 });
    }

    const campaigns = (campaignData ?? []).map((row) => mapCampaign(row as unknown as CampaignRow));
    const campaignIds = campaigns.map((campaign) => campaign.id);
    const emptyRows = Promise.resolve({ data: [], error: null });

    const [
      directRewards,
      campaignRewards,
      directQuests,
      campaignQuests,
      directRaids,
      campaignRaids,
    ] = await Promise.all([
      supabase
        .from("rewards")
        .select(publicRelatedSelect)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      campaignIds.length > 0
        ? supabase
            .from("rewards")
            .select(publicRelatedSelect)
            .in("campaign_id", campaignIds)
            .order("created_at", { ascending: false })
        : emptyRows,
      supabase
        .from("quests")
        .select(publicRelatedSelect)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      campaignIds.length > 0
        ? supabase
            .from("quests")
            .select(publicRelatedSelect)
            .in("campaign_id", campaignIds)
            .order("created_at", { ascending: false })
        : emptyRows,
      supabase
        .from("raids")
        .select(publicRelatedSelect)
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      campaignIds.length > 0
        ? supabase
            .from("raids")
            .select(publicRelatedSelect)
            .in("campaign_id", campaignIds)
            .eq("status", "active")
            .order("created_at", { ascending: false })
        : emptyRows,
    ]);

    const firstError =
      directRewards.error ??
      campaignRewards.error ??
      directQuests.error ??
      campaignQuests.error ??
      directRaids.error ??
      campaignRaids.error;

    if (firstError) {
      return NextResponse.json({ ok: false, error: firstError.message }, { status: 500 });
    }

    const nowMs = Date.now();
    const rewards = uniqueById([
      ...(directRewards.data ?? []).map((row) => mapReward(row as unknown as RewardRow)),
      ...(campaignRewards.data ?? []).map((row) => mapReward(row as unknown as RewardRow)),
    ]);
    const quests = uniqueById([
      ...(directQuests.data ?? []).map((row) => mapQuest(row as unknown as QuestRow)),
      ...(campaignQuests.data ?? []).map((row) => mapQuest(row as unknown as QuestRow)),
    ]);
    const raids = uniqueById([
      ...(directRaids.data ?? []).map((row) => mapRaid(row as unknown as RaidRow)),
      ...(campaignRaids.data ?? []).map((row) => mapRaid(row as unknown as RaidRow)),
    ]).filter((raid) => {
      if (!raid.endsAt) return true;
      const endsAtMs = new Date(raid.endsAt).getTime();
      return Number.isNaN(endsAtMs) || endsAtMs > nowMs;
    });

    return NextResponse.json(
      {
        ok: true,
        project: mapProject(projectRow),
        campaigns,
        quests,
        rewards,
        raids,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=20, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Public project showcase could not be loaded.",
      },
      { status: 500 }
    );
  }
}
