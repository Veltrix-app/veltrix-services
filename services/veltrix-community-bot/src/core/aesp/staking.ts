import { supabaseAdmin } from "../../lib/supabase.js";

const CAMPAIGN_MODE_MULTIPLIER: Record<string, number> = {
  offchain: 1,
  onchain: 1.25,
  hybrid: 1.15,
};

const STAKE_STATE_WEIGHT: Record<string, number> = {
  active: 1,
  warning: 0.85,
  inactive: 0.5,
  completed: 1,
  slashed: 0,
};

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function roundAmount(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function getCampaignModeMultiplier(mode: unknown) {
  return CAMPAIGN_MODE_MULTIPLIER[asTrimmedString(mode).toLowerCase()] ?? 1;
}

export function getStakeWeight(input: {
  stakedXp: number;
  activeMultiplier: number;
  state: string;
}) {
  const stateFactor = STAKE_STATE_WEIGHT[input.state] ?? 1;
  return roundAmount(input.stakedXp * input.activeMultiplier * stateFactor, 6);
}

async function loadStakeEligibilityContext(authUserId: string, campaignId: string) {
  const [
    { data: campaign, error: campaignError },
    { data: walletLink, error: walletLinkError },
    { count: connectedSocialCount, error: connectedSocialError },
    { data: reputation, error: reputationError },
    { data: trustSnapshot, error: trustSnapshotError },
  ] = await Promise.all([
    supabaseAdmin
      .from("campaigns")
      .select(
        "id, project_id, title, status, campaign_mode, reward_type, reward_pool_amount, min_xp_required, activity_threshold, lock_days"
      )
      .eq("id", campaignId)
      .maybeSingle(),
    supabaseAdmin
      .from("wallet_links")
      .select("wallet_address, chain, verified")
      .eq("auth_user_id", authUserId)
      .eq("verified", true)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("user_connected_accounts")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", authUserId)
      .eq("status", "connected")
      .in("provider", ["discord", "telegram", "x"]),
    supabaseAdmin
      .from("user_global_reputation")
      .select("total_xp, active_xp, trust_score")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabaseAdmin
      .from("trust_snapshots")
      .select("score")
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (campaignError) throw campaignError;
  if (walletLinkError) throw walletLinkError;
  if (connectedSocialError) throw connectedSocialError;
  if (reputationError) throw reputationError;
  if (trustSnapshotError) throw trustSnapshotError;

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const activeXp = asNumber(reputation?.active_xp ?? reputation?.total_xp, 0);
  const minXpRequired = asNumber(campaign.min_xp_required, 0);
  const activityThreshold = asNumber(campaign.activity_threshold, 0);
  const trustScore = asNumber(trustSnapshot?.score ?? reputation?.trust_score, 50);
  const requiredActiveXp = Math.max(minXpRequired, activityThreshold);

  return {
    campaign: {
      id: campaign.id,
      projectId: campaign.project_id as string | null,
      title: asTrimmedString(campaign.title) || "Campaign",
      status: asTrimmedString(campaign.status) || "draft",
      campaignMode: asTrimmedString(campaign.campaign_mode) || "offchain",
      rewardType: asTrimmedString(campaign.reward_type) || "campaign_pool",
      rewardPoolAmount: asNumber(campaign.reward_pool_amount, 0),
      minXpRequired,
      activityThreshold,
      lockDays: asNumber(campaign.lock_days, 0),
    },
    walletLinked: Boolean(walletLink?.verified),
    walletAddress: asTrimmedString(walletLink?.wallet_address),
    walletChain: asTrimmedString(walletLink?.chain) || "evm",
    connectedSocialCount: connectedSocialCount ?? 0,
    trustScore,
    activeXp,
    totalXp: asNumber(reputation?.total_xp, 0),
    requiredActiveXp,
  };
}

export async function stakeXpIntoCampaign(input: {
  authUserId: string;
  campaignId: string;
  stakedXp: number;
}) {
  const context = await loadStakeEligibilityContext(input.authUserId, input.campaignId);
  const desiredStakeXp = asNumber(input.stakedXp, 0);

  if (context.campaign.status !== "active") {
    throw new Error("This campaign is not live yet, so staking is still locked.");
  }

  if (!context.walletLinked) {
    throw new Error("A verified wallet is required before staking into this campaign.");
  }

  if (context.connectedSocialCount <= 0) {
    throw new Error("Link at least one social account before staking into this campaign.");
  }

  if (context.trustScore < 40) {
    throw new Error("This pilot does not meet the trust threshold for campaign staking.");
  }

  if (context.activeXp < context.requiredActiveXp) {
    throw new Error(
      `This campaign requires at least ${context.requiredActiveXp} active XP before staking can start.`
    );
  }

  if (desiredStakeXp <= 0) {
    throw new Error("Choose a positive XP amount to stake.");
  }

  if (desiredStakeXp > context.activeXp) {
    throw new Error("You cannot stake more active XP than your current live balance.");
  }

  const activeMultiplier = getCampaignModeMultiplier(context.campaign.campaignMode);
  const now = new Date();
  const timestamp = now.toISOString();
  const lockEndAt =
    context.campaign.lockDays > 0
      ? new Date(now.getTime() + context.campaign.lockDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data: existingStake, error: existingStakeError } = await supabaseAdmin
    .from("xp_stakes")
    .select("id, state")
    .eq("auth_user_id", input.authUserId)
    .eq("campaign_id", input.campaignId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingStakeError) {
    throw existingStakeError;
  }

  const metadata = {
    campaignMode: context.campaign.campaignMode,
    rewardType: context.campaign.rewardType,
    rewardPoolAmount: context.campaign.rewardPoolAmount,
    walletAddress: context.walletAddress,
    walletChain: context.walletChain,
    connectedSocialCount: context.connectedSocialCount,
    trustScore: context.trustScore,
    requiredActiveXp: context.requiredActiveXp,
  };

  let stakeId = existingStake?.id ?? null;

  if (
    existingStake &&
    existingStake.state !== "completed" &&
    existingStake.state !== "slashed"
  ) {
    const { error: updateError } = await supabaseAdmin
      .from("xp_stakes")
      .update({
        staked_xp: desiredStakeXp,
        active_multiplier: activeMultiplier,
        lock_start_at: timestamp,
        lock_end_at: lockEndAt,
        last_activity_at: timestamp,
        state: "active",
        metadata,
        updated_at: timestamp,
      })
      .eq("id", existingStake.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { data: createdStake, error: createError } = await supabaseAdmin
      .from("xp_stakes")
      .insert({
        auth_user_id: input.authUserId,
        campaign_id: input.campaignId,
        staked_xp: desiredStakeXp,
        active_multiplier: activeMultiplier,
        lock_start_at: timestamp,
        lock_end_at: lockEndAt,
        last_activity_at: timestamp,
        state: "active",
        metadata,
        updated_at: timestamp,
      })
      .select("id")
      .single();

    if (createError) {
      throw createError;
    }

    stakeId = createdStake.id;
  }

  const { data: refreshedStake, error: refreshedStakeError } = await supabaseAdmin
    .from("xp_stakes")
    .select("id, campaign_id, staked_xp, active_multiplier, lock_start_at, lock_end_at, last_activity_at, state, metadata, created_at, updated_at")
    .eq("id", stakeId)
    .single();

  if (refreshedStakeError) {
    throw refreshedStakeError;
  }

  return {
    ok: true,
    stake: {
      id: refreshedStake.id,
      campaignId: refreshedStake.campaign_id,
      stakedXp: asNumber(refreshedStake.staked_xp, 0),
      activeMultiplier: asNumber(refreshedStake.active_multiplier, 1),
      lockStartAt: refreshedStake.lock_start_at,
      lockEndAt: refreshedStake.lock_end_at,
      lastActivityAt: refreshedStake.last_activity_at,
      state: asTrimmedString(refreshedStake.state) || "active",
      weightedXp: getStakeWeight({
        stakedXp: asNumber(refreshedStake.staked_xp, 0),
        activeMultiplier: asNumber(refreshedStake.active_multiplier, 1),
        state: asTrimmedString(refreshedStake.state) || "active",
      }),
      metadata:
        refreshedStake.metadata && typeof refreshedStake.metadata === "object"
          ? refreshedStake.metadata
          : {},
    },
    readiness: {
      activeXp: context.activeXp,
      requiredActiveXp: context.requiredActiveXp,
      trustScore: context.trustScore,
      walletLinked: context.walletLinked,
      connectedSocialCount: context.connectedSocialCount,
    },
  };
}

export async function refreshCampaignStake(input: {
  authUserId: string;
  campaignId: string;
  stakeId: string;
}) {
  const { data: stake, error: stakeError } = await supabaseAdmin
    .from("xp_stakes")
    .select("id, auth_user_id, campaign_id, staked_xp, active_multiplier, lock_end_at, state, metadata")
    .eq("id", input.stakeId)
    .eq("campaign_id", input.campaignId)
    .maybeSingle();

  if (stakeError) {
    throw stakeError;
  }

  if (!stake || stake.auth_user_id !== input.authUserId) {
    throw new Error("Stake not found for this pilot.");
  }

  const timestamp = new Date().toISOString();
  const nextState = stake.state === "completed" || stake.state === "slashed" ? stake.state : "active";

  const { data: refreshedStake, error: refreshError } = await supabaseAdmin
    .from("xp_stakes")
    .update({
      last_activity_at: timestamp,
      state: nextState,
      updated_at: timestamp,
    })
    .eq("id", input.stakeId)
    .select("id, campaign_id, staked_xp, active_multiplier, lock_start_at, lock_end_at, last_activity_at, state, metadata, created_at, updated_at")
    .single();

  if (refreshError) {
    throw refreshError;
  }

  return {
    ok: true,
    stake: {
      id: refreshedStake.id,
      campaignId: refreshedStake.campaign_id,
      stakedXp: asNumber(refreshedStake.staked_xp, 0),
      activeMultiplier: asNumber(refreshedStake.active_multiplier, 1),
      lockStartAt: refreshedStake.lock_start_at,
      lockEndAt: refreshedStake.lock_end_at,
      lastActivityAt: refreshedStake.last_activity_at,
      state: asTrimmedString(refreshedStake.state) || nextState,
      weightedXp: getStakeWeight({
        stakedXp: asNumber(refreshedStake.staked_xp, 0),
        activeMultiplier: asNumber(refreshedStake.active_multiplier, 1),
        state: asTrimmedString(refreshedStake.state) || nextState,
      }),
      metadata:
        refreshedStake.metadata && typeof refreshedStake.metadata === "object"
          ? refreshedStake.metadata
          : {},
    },
  };
}

export async function getCampaignStakeLeaderboard(input: {
  campaignId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const { data: stakes, error: stakesError } = await supabaseAdmin
    .from("xp_stakes")
    .select("id, auth_user_id, staked_xp, active_multiplier, state, lock_end_at, last_activity_at, updated_at")
    .eq("campaign_id", input.campaignId)
    .neq("state", "slashed")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (stakesError) {
    throw stakesError;
  }

  const rankedStakes = (stakes ?? [])
    .map((stake) => ({
      id: stake.id,
      authUserId: stake.auth_user_id,
      stakedXp: asNumber(stake.staked_xp, 0),
      activeMultiplier: asNumber(stake.active_multiplier, 1),
      state: asTrimmedString(stake.state) || "active",
      weightedXp: getStakeWeight({
        stakedXp: asNumber(stake.staked_xp, 0),
        activeMultiplier: asNumber(stake.active_multiplier, 1),
        state: asTrimmedString(stake.state) || "active",
      }),
      lockEndAt: stake.lock_end_at,
      lastActivityAt: stake.last_activity_at,
    }))
    .filter((stake) => stake.weightedXp > 0)
    .sort((left, right) => right.weightedXp - left.weightedXp || right.stakedXp - left.stakedXp);

  const authUserIds = Array.from(new Set(rankedStakes.map((stake) => stake.authUserId)));

  const [{ data: profiles, error: profilesError }, { data: distributions, error: distributionsError }] =
    await Promise.all([
      authUserIds.length > 0
        ? supabaseAdmin
            .from("user_profiles")
            .select("auth_user_id, username, avatar_url")
            .in("auth_user_id", authUserIds)
        : Promise.resolve({ data: [], error: null }),
      authUserIds.length > 0
        ? supabaseAdmin
            .from("reward_distributions")
            .select("auth_user_id, reward_amount, reward_asset, status")
            .eq("campaign_id", input.campaignId)
            .in("auth_user_id", authUserIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (profilesError) {
    throw profilesError;
  }

  if (distributionsError) {
    throw distributionsError;
  }

  const profilesByAuthUserId = new Map(
    (profiles ?? []).map((profile) => [profile.auth_user_id as string, profile])
  );
  const distributionsByAuthUserId = new Map<
    string,
    { rewardAmount: number; rewardAsset: string; status: string }[]
  >();

  for (const distribution of distributions ?? []) {
    const authUserId = distribution.auth_user_id as string;
    const current = distributionsByAuthUserId.get(authUserId) ?? [];
    current.push({
      rewardAmount: asNumber(distribution.reward_amount, 0),
      rewardAsset: asTrimmedString(distribution.reward_asset) || "campaign_pool",
      status: asTrimmedString(distribution.status) || "pending",
    });
    distributionsByAuthUserId.set(authUserId, current);
  }

  return {
    ok: true,
    items: rankedStakes.slice(0, limit).map((stake, index) => {
      const profile = profilesByAuthUserId.get(stake.authUserId);
      const distributionEntries = distributionsByAuthUserId.get(stake.authUserId) ?? [];

      return {
        rank: index + 1,
        stakeId: stake.id,
        username: asTrimmedString(profile?.username) || "Pilot",
        avatarUrl: asTrimmedString(profile?.avatar_url),
        stakedXp: stake.stakedXp,
        weightedXp: stake.weightedXp,
        state: stake.state,
        lockEndAt: stake.lockEndAt,
        lastActivityAt: stake.lastActivityAt,
        rewardStatus: distributionEntries.some((entry) => entry.status === "claimable")
          ? "claimable"
          : distributionEntries[0]?.status ?? "pending",
        rewardAmount: roundAmount(
          distributionEntries.reduce((sum, entry) => sum + entry.rewardAmount, 0),
          6
        ),
        rewardAsset: distributionEntries[0]?.rewardAsset ?? null,
      };
    }),
  };
}
