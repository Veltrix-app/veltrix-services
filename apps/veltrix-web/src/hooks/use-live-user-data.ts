"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { calculateQuestGlobalXp } from "@/lib/xp/xp-economy";
import type { ConnectedAccount } from "@/types/auth";
import type {
  LiveCampaign,
  LiveLeaderboardUser,
  LiveNotification,
  LiveProject,
  LiveProjectReputation,
  LiveQuest,
  LiveRaid,
  LiveRewardDistribution,
  LiveReward,
  LiveXpStake,
} from "@/types/live";

type UserProgressRow = {
  quest_statuses: Record<string, LiveQuest["status"]> | null;
  claimed_rewards: string[] | null;
  joined_communities: string[] | null;
  confirmed_raids: string[] | null;
  opened_lootbox_ids: string[] | null;
  unlocked_reward_ids: string[] | null;
};

export type LiveUserDataDataset =
  | "connectedAccounts"
  | "projects"
  | "campaigns"
  | "rewards"
  | "quests"
  | "notifications"
  | "leaderboard"
  | "raids"
  | "projectReputation"
  | "joinedCommunityIds"
  | "xpStakes"
  | "rewardDistributions";

type UseLiveUserDataOptions = {
  datasets?: LiveUserDataDataset[];
};

type LiveUserDataCacheEntry = {
  loadedDatasets: LiveUserDataDataset[];
  connectedAccounts: ConnectedAccount[];
  projects: LiveProject[];
  campaigns: LiveCampaign[];
  rewards: LiveReward[];
  quests: LiveQuest[];
  notifications: LiveNotification[];
  leaderboard: LiveLeaderboardUser[];
  raids: LiveRaid[];
  projectReputation: LiveProjectReputation[];
  joinedCommunityIds: string[];
  xpStakes: LiveXpStake[];
  rewardDistributions: LiveRewardDistribution[];
};

const ALL_LIVE_USER_DATASETS: LiveUserDataDataset[] = [
  "connectedAccounts",
  "projects",
  "campaigns",
  "rewards",
  "quests",
  "notifications",
  "leaderboard",
  "raids",
  "projectReputation",
  "joinedCommunityIds",
  "xpStakes",
  "rewardDistributions",
];

const liveUserDataCache = new Map<string, LiveUserDataCacheEntry>();

function normalizeRequestedDatasets(datasets?: LiveUserDataDataset[]) {
  if (!Array.isArray(datasets) || datasets.length === 0) {
    return ALL_LIVE_USER_DATASETS;
  }

  const normalized = datasets.filter((dataset): dataset is LiveUserDataDataset =>
    ALL_LIVE_USER_DATASETS.includes(dataset)
  );

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : ALL_LIVE_USER_DATASETS;
}

function createEmptyCacheEntry(): LiveUserDataCacheEntry {
  return {
    loadedDatasets: [],
    connectedAccounts: [],
    projects: [],
    campaigns: [],
    rewards: [],
    quests: [],
    notifications: [],
    leaderboard: [],
    raids: [],
    projectReputation: [],
    joinedCommunityIds: [],
    xpStakes: [],
    rewardDistributions: [],
  };
}

function mergeLiveUserDataCacheEntry(params: {
  authUserId: string;
  patch: Partial<Omit<LiveUserDataCacheEntry, "loadedDatasets">>;
  loadedDatasets?: LiveUserDataDataset[];
}) {
  const existing = liveUserDataCache.get(params.authUserId) ?? createEmptyCacheEntry();

  liveUserDataCache.set(params.authUserId, {
    ...existing,
    ...params.patch,
    loadedDatasets: Array.from(
      new Set([...(existing.loadedDatasets ?? []), ...(params.loadedDatasets ?? [])])
    ),
  });
}

function readCachedDataset<T>(
  entry: LiveUserDataCacheEntry | null | undefined,
  dataset: LiveUserDataDataset,
  fallback: T
) {
  if (!entry || !entry.loadedDatasets.includes(dataset)) {
    return fallback;
  }

  return entry[dataset] as T;
}

function applyLiveUserDataCacheEntry(
  entry: LiveUserDataCacheEntry,
  requestedDatasets: Set<LiveUserDataDataset>,
  setters: {
    setConnectedAccounts: (value: ConnectedAccount[]) => void;
    setProjects: (value: LiveProject[]) => void;
    setCampaigns: (value: LiveCampaign[]) => void;
    setRewards: (value: LiveReward[]) => void;
    setQuests: (value: LiveQuest[]) => void;
    setNotifications: (value: LiveNotification[]) => void;
    setLeaderboard: (value: LiveLeaderboardUser[]) => void;
    setRaids: (value: LiveRaid[]) => void;
    setProjectReputation: (value: LiveProjectReputation[]) => void;
    setJoinedCommunityIds: (value: string[]) => void;
    setXpStakes: (value: LiveXpStake[]) => void;
    setRewardDistributions: (value: LiveRewardDistribution[]) => void;
  }
) {
  setters.setConnectedAccounts(
    readCachedDataset(entry, "connectedAccounts", requestedDatasets.has("connectedAccounts") ? [] : [])
  );
  setters.setProjects(readCachedDataset(entry, "projects", requestedDatasets.has("projects") ? [] : []));
  setters.setCampaigns(
    readCachedDataset(entry, "campaigns", requestedDatasets.has("campaigns") ? [] : [])
  );
  setters.setRewards(readCachedDataset(entry, "rewards", requestedDatasets.has("rewards") ? [] : []));
  setters.setQuests(readCachedDataset(entry, "quests", requestedDatasets.has("quests") ? [] : []));
  setters.setNotifications(
    readCachedDataset(entry, "notifications", requestedDatasets.has("notifications") ? [] : [])
  );
  setters.setLeaderboard(
    readCachedDataset(entry, "leaderboard", requestedDatasets.has("leaderboard") ? [] : [])
  );
  setters.setRaids(readCachedDataset(entry, "raids", requestedDatasets.has("raids") ? [] : []));
  setters.setProjectReputation(
    readCachedDataset(entry, "projectReputation", requestedDatasets.has("projectReputation") ? [] : [])
  );
  setters.setJoinedCommunityIds(
    readCachedDataset(entry, "joinedCommunityIds", requestedDatasets.has("joinedCommunityIds") ? [] : [])
  );
  setters.setXpStakes(
    readCachedDataset(entry, "xpStakes", requestedDatasets.has("xpStakes") ? [] : [])
  );
  setters.setRewardDistributions(
    readCachedDataset(
      entry,
      "rewardDistributions",
      requestedDatasets.has("rewardDistributions") ? [] : []
    )
  );
}

function mapClaimStatusToDistributionStatus(status: string | null | undefined) {
  switch (status) {
    case "processing":
      return "processing";
    case "fulfilled":
      return "paid";
    case "rejected":
      return "rejected";
    case "pending":
    default:
      return "queued";
  }
}

export function seedLiveUserConnectedAccounts(
  authUserId: string,
  accounts: ConnectedAccount[]
) {
  mergeLiveUserDataCacheEntry({
    authUserId,
    patch: {
      connectedAccounts: accounts,
    },
    loadedDatasets: ["connectedAccounts"],
  });
}

export function invalidateLiveUserDataCache(authUserId: string, datasets?: LiveUserDataDataset[]) {
  const existing = liveUserDataCache.get(authUserId);
  if (!existing) {
    return;
  }

  if (!datasets || datasets.length === 0) {
    liveUserDataCache.delete(authUserId);
    return;
  }

  const nextLoadedDatasets = existing.loadedDatasets.filter(
    (dataset) => !datasets.includes(dataset)
  );

  liveUserDataCache.set(authUserId, {
    ...existing,
    loadedDatasets: nextLoadedDatasets,
  });
}

export function prependLiveUserNotification(
  authUserId: string,
  notification: LiveNotification
) {
  const existing = liveUserDataCache.get(authUserId) ?? createEmptyCacheEntry();
  const nextNotifications = [notification, ...existing.notifications].slice(0, 24);

  liveUserDataCache.set(authUserId, {
    ...existing,
    notifications: nextNotifications,
    loadedDatasets: Array.from(new Set([...(existing.loadedDatasets ?? []), "notifications"])),
  });
}

export function useLiveUserData(options?: UseLiveUserDataOptions) {
  const { authUserId, initialized, authConfigured, session, profile } = useAuth();
  const datasetKey = Array.isArray(options?.datasets)
    ? Array.from(new Set(options.datasets)).sort().join("|")
    : "all";
  const requestedDatasets = useMemo(
    () =>
      datasetKey === "all"
        ? normalizeRequestedDatasets()
        : normalizeRequestedDatasets(datasetKey.split("|") as LiveUserDataDataset[]),
    [datasetKey]
  );
  const requestedDatasetSet = useMemo(
    () => new Set<LiveUserDataDataset>(requestedDatasets),
    [requestedDatasets]
  );
  const cachedState = authUserId ? liveUserDataCache.get(authUserId) : null;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(
    readCachedDataset(cachedState, "connectedAccounts", [])
  );
  const [projects, setProjects] = useState<LiveProject[]>(readCachedDataset(cachedState, "projects", []));
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>(
    readCachedDataset(cachedState, "campaigns", [])
  );
  const [rewards, setRewards] = useState<LiveReward[]>(readCachedDataset(cachedState, "rewards", []));
  const [quests, setQuests] = useState<LiveQuest[]>(readCachedDataset(cachedState, "quests", []));
  const [notifications, setNotifications] = useState<LiveNotification[]>(
    readCachedDataset(cachedState, "notifications", [])
  );
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardUser[]>(
    readCachedDataset(cachedState, "leaderboard", [])
  );
  const [raids, setRaids] = useState<LiveRaid[]>(readCachedDataset(cachedState, "raids", []));
  const [projectReputation, setProjectReputation] = useState<LiveProjectReputation[]>(
    readCachedDataset(cachedState, "projectReputation", [])
  );
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>(
    readCachedDataset(cachedState, "joinedCommunityIds", [])
  );
  const [xpStakes, setXpStakes] = useState<LiveXpStake[]>(readCachedDataset(cachedState, "xpStakes", []));
  const [rewardDistributions, setRewardDistributions] = useState<LiveRewardDistribution[]>(
    readCachedDataset(cachedState, "rewardDistributions", [])
  );
  const supabase = useMemo(
    () => (authConfigured ? createSupabaseBrowserClient() : null),
    [authConfigured]
  );

  async function reload() {
    if (!authConfigured || !authUserId || !supabase) {
      if (authUserId) {
        liveUserDataCache.delete(authUserId);
      }
      setConnectedAccounts([]);
      setProjects([]);
      setCampaigns([]);
      setRewards([]);
      setQuests([]);
      setNotifications([]);
      setLeaderboard([]);
      setRaids([]);
      setProjectReputation([]);
      setJoinedCommunityIds([]);
      setXpStakes([]);
      setRewardDistributions([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextCachedState = liveUserDataCache.get(authUserId);
    const hasRequestedCache = requestedDatasets.every((dataset) =>
      nextCachedState?.loadedDatasets.includes(dataset)
    );

    if (nextCachedState) {
      applyLiveUserDataCacheEntry(nextCachedState, requestedDatasetSet, {
        setConnectedAccounts,
        setProjects,
        setCampaigns,
        setRewards,
        setQuests,
        setNotifications,
        setLeaderboard,
        setRaids,
        setProjectReputation,
        setJoinedCommunityIds,
        setXpStakes,
        setRewardDistributions,
      });
      setLoading(!hasRequestedCache);
      setRefreshing(hasRequestedCache);
    } else {
      setLoading(true);
      setRefreshing(false);
    }
    setError(null);

    const shouldLoadConnectedAccounts = requestedDatasetSet.has("connectedAccounts");
    const shouldLoadProjects = requestedDatasetSet.has("projects");
    const shouldLoadCampaigns = requestedDatasetSet.has("campaigns");
    const shouldLoadRewards = requestedDatasetSet.has("rewards");
    const shouldLoadQuests = requestedDatasetSet.has("quests");
    const shouldLoadNotifications = requestedDatasetSet.has("notifications");
    const shouldLoadLeaderboard = requestedDatasetSet.has("leaderboard");
    const shouldLoadRaids = requestedDatasetSet.has("raids");
    const shouldLoadProjectReputation = requestedDatasetSet.has("projectReputation");
    const shouldLoadJoinedCommunityIds = requestedDatasetSet.has("joinedCommunityIds");
    const shouldLoadXpStakes = requestedDatasetSet.has("xpStakes");
    const shouldLoadRewardDistributions = requestedDatasetSet.has("rewardDistributions");
    const shouldLoadUserProgress =
      shouldLoadJoinedCommunityIds || shouldLoadQuests || shouldLoadRewards;

    const [
      connectedAccountsResult,
      projectsResult,
      campaignsResult,
      rewardsResult,
      questsResult,
      notificationsResult,
      userProgressResult,
      leaderboardResult,
      raidsResult,
      projectReputationResult,
      xpStakesResult,
      rewardDistributionsResult,
    ] = await Promise.all([
      shouldLoadConnectedAccounts
        ? supabase
            .from("user_connected_accounts")
            .select("*")
            .eq("auth_user_id", authUserId)
            .order("connected_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadProjects
        ? supabase
            .from("projects")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadCampaigns
        ? supabase
            .from("campaigns")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadRewards
        ? supabase.from("rewards").select("*").order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadQuests
        ? supabase.from("quests").select("*").order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadNotifications
        ? supabase
            .from("app_notifications")
            .select("*")
            .eq("auth_user_id", authUserId)
            .order("created_at", { ascending: false })
            .limit(12)
        : Promise.resolve({ data: [], error: null }),
      shouldLoadUserProgress
        ? supabase
            .from("user_progress")
            .select(
              "joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses"
            )
            .eq("auth_user_id", authUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      shouldLoadLeaderboard
        ? supabase
            .from("user_profiles")
            .select("*")
            .eq("status", "active")
            .order("xp", { ascending: false })
            .order("level", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadRaids
        ? supabase
            .from("raids")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadProjectReputation
        ? supabase
            .from("user_project_reputation")
            .select("*")
            .eq("auth_user_id", authUserId)
            .order("xp", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadXpStakes
        ? supabase
            .from("xp_stakes")
            .select("*")
            .eq("auth_user_id", authUserId)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadRewardDistributions
        ? supabase
            .from("reward_distributions")
            .select("*")
            .eq("auth_user_id", authUserId)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const firstError =
      connectedAccountsResult.error ??
      projectsResult.error ??
      campaignsResult.error ??
      rewardsResult.error ??
      questsResult.error ??
      notificationsResult.error ??
      userProgressResult.error ??
      leaderboardResult.error ??
      raidsResult.error ??
      projectReputationResult.error ??
      xpStakesResult.error ??
      rewardDistributionsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const questStatuses =
      ((userProgressResult.data as UserProgressRow | null)?.quest_statuses as
        | Record<string, LiveQuest["status"]>
        | null) ?? {};
    const joinedCommunities =
      ((userProgressResult.data as UserProgressRow | null)?.joined_communities ?? []) as string[];
    const claimedRewardIds = new Set(
      ((userProgressResult.data as UserProgressRow | null)?.claimed_rewards ?? []) as string[]
    );
    if (shouldLoadJoinedCommunityIds) {
      setJoinedCommunityIds(joinedCommunities);
    }

    const nextConnectedAccounts = (connectedAccountsResult.data ?? []).map((row) => ({
        id: row.id,
        provider: row.provider,
        providerUserId: row.provider_user_id,
        username: row.username,
        status: row.status,
        connectedAt: row.connected_at,
        updatedAt: row.updated_at,
      }));
    if (shouldLoadConnectedAccounts) {
      setConnectedAccounts(nextConnectedAccounts);
    }

    const nextProjects = (projectsResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name ?? "Project",
        description: row.description ?? "No description yet.",
        category: row.category ?? null,
        chain: row.chain ?? null,
        logo: row.logo ?? null,
        bannerUrl: row.banner_url ?? null,
        members: row.members ?? 0,
        website: row.website ?? null,
        telegramUrl: row.telegram_url ?? null,
        discordUrl: row.discord_url ?? null,
      }));
    if (shouldLoadProjects) {
      setProjects(nextProjects);
    }

    const nextCampaigns = (campaignsResult.data ?? []).map((row) => ({
        id: row.id,
        projectId: row.project_id ?? null,
        title: row.title ?? "Campaign",
        description:
          row.short_description ?? row.long_description ?? "Live campaign from backend.",
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
      }));
    if (shouldLoadCampaigns) {
      setCampaigns(nextCampaigns);
    }

    const nextRewards = (rewardsResult.data ?? []).map((row) => ({
        id: row.id,
        campaignId: row.campaign_id ?? null,
        title: row.title ?? "Reward",
        description: row.description ?? "Reward from backend.",
        imageUrl: row.image_url ?? null,
        cost: row.cost ?? 0,
        rarity: row.rarity ?? "common",
        claimable: (row.claimable ?? false) && !claimedRewardIds.has(row.id),
        claimed: claimedRewardIds.has(row.id),
        rewardType: row.reward_type ?? row.type ?? "reward",
      }));
    if (shouldLoadRewards) {
      setRewards(nextRewards);
    }

    const nextQuests = (questsResult.data ?? []).map((row) => {
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
          ((verificationProvider &&
            ["bot_check", "api_check", "event_check"].includes(verificationType))
            ? "integration_auto"
            : (row.auto_approve ?? false)
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
          status: questStatuses[row.id] ?? row.status ?? "open",
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
      });
    if (shouldLoadQuests) {
      setQuests(nextQuests);
    }

    const nextNotifications = (notificationsResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title ?? "Notification",
        body: row.body ?? "",
        read: row.read ?? false,
        type: row.type ?? "system",
        createdAt: row.created_at,
      }));
    if (shouldLoadNotifications) {
      setNotifications(nextNotifications);
    }

    const nextLeaderboard = (leaderboardResult.data ?? []).map((row) => ({
        id: row.id,
        username: row.username ?? "Raider",
        xp: row.xp ?? 0,
        level: row.level ?? 1,
        avatarUrl: row.avatar_url ?? "",
        bannerUrl: row.banner_url ?? "",
        title: row.title ?? "Explorer",
        faction: row.faction ?? "Unassigned",
        isCurrentUser: row.auth_user_id === authUserId,
      }));
    if (shouldLoadLeaderboard) {
      setLeaderboard(nextLeaderboard);
    }

    const nowMs = Date.now();
    const nextRaids = (raidsResult.data ?? [])
      .filter((row) => {
        if (!row.ends_at) return true;
        const endsAtMs = new Date(row.ends_at).getTime();
        return Number.isNaN(endsAtMs) || endsAtMs > nowMs;
      })
      .map((row) => ({
        id: row.id,
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
          ? (row.instructions as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        sourceProvider: row.source_provider ?? null,
        sourceUrl: row.source_url ?? null,
        sourceExternalId: row.source_external_id ?? null,
        endsAt: row.ends_at ?? null,
        generatedBy: row.generated_by ?? null,
      }));
    if (shouldLoadRaids) {
      setRaids(nextRaids);
    }

    const nextProjectReputation = (projectReputationResult.data ?? []).map((row) => ({
        projectId: row.project_id,
        projectName:
          projectsResult.data?.find((project) => project.id === row.project_id)?.name ?? "Project",
        xp: row.xp ?? 0,
        level: row.level ?? 1,
        streak: row.streak ?? 0,
        trustScore: row.trust_score ?? 50,
        contributionTier: row.contribution_tier ?? "explorer",
        questsCompleted: row.quests_completed ?? 0,
        raidsCompleted: row.raids_completed ?? 0,
        rewardsClaimed: row.rewards_claimed ?? 0,
        rank: row.rank ?? 0,
      }));
    if (shouldLoadProjectReputation) {
      setProjectReputation(nextProjectReputation);
    }

    const nextXpStakes = (xpStakesResult.data ?? []).map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      stakedXp: row.staked_xp ?? 0,
      activeMultiplier: row.active_multiplier ?? 1,
      lockStartAt: row.lock_start_at ?? null,
      lockEndAt: row.lock_end_at ?? null,
      lastActivityAt: row.last_activity_at ?? null,
      state: row.state ?? "active",
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
    }));
    if (shouldLoadXpStakes) {
      setXpStakes(nextXpStakes);
    }

    const nextRewardDistributions = (rewardDistributionsResult.data ?? []).map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      rewardAsset: row.reward_asset ?? "campaign_pool",
      rewardAmount: row.reward_amount ?? 0,
      status: row.status ?? "pending",
      calculationSnapshot:
        row.calculation_snapshot && typeof row.calculation_snapshot === "object"
          ? (row.calculation_snapshot as Record<string, unknown>)
          : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    if (shouldLoadRewardDistributions) {
      setRewardDistributions(nextRewardDistributions);
    }

    mergeLiveUserDataCacheEntry({
      authUserId,
      patch: {
        ...(shouldLoadConnectedAccounts ? { connectedAccounts: nextConnectedAccounts } : {}),
        ...(shouldLoadProjects ? { projects: nextProjects } : {}),
        ...(shouldLoadCampaigns ? { campaigns: nextCampaigns } : {}),
        ...(shouldLoadRewards ? { rewards: nextRewards } : {}),
        ...(shouldLoadQuests ? { quests: nextQuests } : {}),
        ...(shouldLoadNotifications ? { notifications: nextNotifications } : {}),
        ...(shouldLoadLeaderboard ? { leaderboard: nextLeaderboard } : {}),
        ...(shouldLoadRaids ? { raids: nextRaids } : {}),
        ...(shouldLoadProjectReputation ? { projectReputation: nextProjectReputation } : {}),
        ...(shouldLoadJoinedCommunityIds ? { joinedCommunityIds: joinedCommunities } : {}),
        ...(shouldLoadXpStakes ? { xpStakes: nextXpStakes } : {}),
        ...(shouldLoadRewardDistributions
          ? { rewardDistributions: nextRewardDistributions }
          : {}),
      },
      loadedDatasets: requestedDatasets,
    });

    setLoading(false);
    setRefreshing(false);
  }
  const reloadLiveUserData = useEffectEvent(async () => {
    await reload();
  });

  async function joinCommunity(projectId: string) {
    if (!authConfigured || !authUserId || !supabase) {
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("user_progress")
      .select(
        "joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses"
      )
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existingError) {
      setError(existingError.message);
      return;
    }

    const currentJoined = Array.isArray(existing?.joined_communities)
      ? (existing.joined_communities as string[])
      : [];
    const nextJoined = currentJoined.includes(projectId)
      ? currentJoined.filter((id) => id !== projectId)
      : [...currentJoined, projectId];

    const { error: updateError } = await supabase.from("user_progress").upsert({
      auth_user_id: authUserId,
      joined_communities: nextJoined,
      confirmed_raids: existing?.confirmed_raids ?? [],
      claimed_rewards: existing?.claimed_rewards ?? [],
      opened_lootbox_ids: existing?.opened_lootbox_ids ?? [],
      unlocked_reward_ids: existing?.unlocked_reward_ids ?? [],
      quest_statuses: existing?.quest_statuses ?? {},
    });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setJoinedCommunityIds(nextJoined);
    mergeLiveUserDataCacheEntry({
      authUserId,
      patch: {
        joinedCommunityIds: nextJoined,
      },
      loadedDatasets: ["joinedCommunityIds"],
    });
  }

  async function claimReward(rewardId: string) {
    if (!authConfigured || !authUserId || !supabase) {
      return { ok: false, error: "You need an active session before claiming a reward." };
    }

    const reward = rewards.find((item) => item.id === rewardId);
    if (!reward) {
      return { ok: false, error: "Reward not found." };
    }

    if (!reward.claimable) {
      return { ok: false, error: "This reward is not ready to claim yet." };
    }

    const linkedCampaign = campaigns.find((campaign) => campaign.id === reward.campaignId);
    const linkedProject = projects.find((project) => project.id === linkedCampaign?.projectId);

    const { data: existing, error: existingError } = await supabase
      .from("user_progress")
      .select(
        "joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses"
      )
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existingError) {
      setError(existingError.message);
      return { ok: false, error: existingError.message };
    }

    const claimedRewards = Array.isArray(existing?.claimed_rewards)
      ? (existing.claimed_rewards as string[])
      : [];

    if (claimedRewards.includes(rewardId)) {
      setRewards((current) =>
        current.map((item) => (item.id === rewardId ? { ...item, claimable: false } : item))
      );
      return { ok: true, alreadyClaimed: true };
    }

    const nextClaimedRewards = [...claimedRewards, rewardId];

    const insertClaim = async () =>
      supabase.from("reward_claims").insert({
        auth_user_id: authUserId,
        username: profile?.username ?? session?.user?.email?.split("@")[0] ?? "member",
        reward_id: rewardId,
        reward_title: reward.title,
        project_id: linkedProject?.id ?? null,
        project_name: linkedProject?.name ?? null,
        campaign_id: linkedCampaign?.id ?? null,
        campaign_title: linkedCampaign?.title ?? null,
        claim_method: "manual_fulfillment",
        status: "pending",
      });

    const { error: claimInsertError } = await insertClaim();

    if (
      claimInsertError &&
      !claimInsertError.message.toLowerCase().includes("duplicate") &&
      !claimInsertError.message.toLowerCase().includes("unique")
    ) {
      setError(claimInsertError.message);
      return { ok: false, error: claimInsertError.message };
    }

    const { error: progressError } = await supabase.from("user_progress").upsert({
      auth_user_id: authUserId,
      joined_communities: existing?.joined_communities ?? [],
      confirmed_raids: existing?.confirmed_raids ?? [],
      claimed_rewards: nextClaimedRewards,
      opened_lootbox_ids: existing?.opened_lootbox_ids ?? [],
      unlocked_reward_ids: existing?.unlocked_reward_ids ?? [],
      quest_statuses: existing?.quest_statuses ?? {},
    });

    if (progressError) {
      setError(progressError.message);
      return { ok: false, error: progressError.message };
    }

    const claimedAt = new Date().toISOString();
    setRewards((current) =>
      current.map((item) =>
        item.id === rewardId
          ? {
              ...item,
              claimable: false,
              claimed: true,
              claimedAt,
            }
          : item
      )
    );
    const nextRewards = rewards.map((item) =>
      item.id === rewardId
        ? {
            ...item,
            claimable: false,
            claimed: true,
            claimedAt,
          }
        : item
    );
    mergeLiveUserDataCacheEntry({
      authUserId,
      patch: {
        rewards: nextRewards,
        notifications: [
          {
            id: `local-claim-${rewardId}-${claimedAt}`,
            title: "Vault claim routed",
            body: `${reward.title} moved into the claim queue.`,
            read: false,
            type: "reward",
            createdAt: claimedAt,
          },
          ...notifications,
        ],
      },
      loadedDatasets: ["rewards", "notifications"],
    });

    setNotifications((current) => [
      {
        id: `local-claim-${rewardId}-${claimedAt}`,
        title: "Vault claim routed",
        body: `${reward.title} moved into the claim queue.`,
        read: false,
        type: "reward",
        createdAt: claimedAt,
      },
      ...current,
    ]);

    return { ok: true };
  }

  async function claimRewardDistribution(distributionId: string) {
    if (!authConfigured || !authUserId || !supabase) {
      return {
        ok: false,
        error: "You need an active session before routing a campaign payout claim.",
      };
    }

    const distribution = rewardDistributions.find((item) => item.id === distributionId);
    if (!distribution) {
      return { ok: false, error: "Campaign pool distribution not found." };
    }

    if (distribution.status !== "claimable") {
      return {
        ok: false,
        error: "This campaign pool distribution is not claimable right now.",
      };
    }

    const linkedCampaign = campaigns.find((campaign) => campaign.id === distribution.campaignId);
    const linkedProject = projects.find((project) => project.id === linkedCampaign?.projectId);
    const rewardAmount = Number(distribution.rewardAmount ?? 0);
    const rewardTitle = `${linkedCampaign?.title ?? "Campaign"} payout`;

    const { data: existingClaims, error: existingClaimsError } = await supabase
      .from("reward_claims")
      .select("id, status, delivery_payload")
      .eq("auth_user_id", authUserId)
      .eq("campaign_id", distribution.campaignId)
      .eq("claim_method", "campaign_distribution")
      .order("created_at", { ascending: false });

    if (existingClaimsError) {
      setError(existingClaimsError.message);
      return { ok: false, error: existingClaimsError.message };
    }

    const existingClaim = (existingClaims ?? []).find((claim) => {
      const payload =
        claim.delivery_payload && typeof claim.delivery_payload === "object"
          ? (claim.delivery_payload as Record<string, unknown>)
          : null;

      return payload?.distributionId === distributionId;
    });

    if (existingClaim && existingClaim.status !== "rejected") {
      const nextStatus = mapClaimStatusToDistributionStatus(existingClaim.status);
      setRewardDistributions((current) =>
        current.map((item) =>
          item.id === distributionId
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        )
      );

      return { ok: true, alreadyQueued: true, status: nextStatus };
    }

    const queuedAt = new Date().toISOString();
    const { error: claimInsertError } = await supabase.from("reward_claims").insert({
      auth_user_id: authUserId,
      username: profile?.username ?? session?.user?.email?.split("@")[0] ?? "member",
      reward_id: null,
      reward_title: rewardTitle,
      project_id: linkedProject?.id ?? null,
      project_name: linkedProject?.name ?? null,
      campaign_id: linkedCampaign?.id ?? distribution.campaignId,
      campaign_title: linkedCampaign?.title ?? null,
      claim_method: "campaign_distribution",
      status: "pending",
      delivery_payload: {
        source: "reward_distribution",
        distributionId,
        rewardAsset: distribution.rewardAsset,
        rewardAmount,
      },
    });

    if (claimInsertError) {
      setError(claimInsertError.message);
      return { ok: false, error: claimInsertError.message };
    }

    const { error: distributionUpdateError } = await supabase
      .from("reward_distributions")
      .update({
        status: "queued",
        updated_at: queuedAt,
      })
      .eq("id", distributionId)
      .eq("auth_user_id", authUserId);

    if (distributionUpdateError) {
      setError(distributionUpdateError.message);
      return { ok: false, error: distributionUpdateError.message };
    }

    setRewardDistributions((current) =>
      current.map((item) =>
        item.id === distributionId
          ? {
              ...item,
              status: "queued",
              updatedAt: queuedAt,
            }
          : item
      )
    );
    const nextRewardDistributions = rewardDistributions.map((item) =>
      item.id === distributionId
        ? {
            ...item,
            status: "queued",
            updatedAt: queuedAt,
          }
        : item
    );
    mergeLiveUserDataCacheEntry({
      authUserId,
      patch: {
        rewardDistributions: nextRewardDistributions,
        notifications: [
          {
            id: `local-distribution-claim-${distributionId}-${queuedAt}`,
            title: "Campaign payout queued",
            body: `${rewardTitle} moved into the payout queue.`,
            read: false,
            type: "reward",
            createdAt: queuedAt,
          },
          ...notifications,
        ],
      },
      loadedDatasets: ["rewardDistributions", "notifications"],
    });

    setNotifications((current) => [
      {
        id: `local-distribution-claim-${distributionId}-${queuedAt}`,
        title: "Campaign payout queued",
        body: `${rewardTitle} moved into the payout queue.`,
        read: false,
        type: "reward",
        createdAt: queuedAt,
      },
      ...current,
    ]);

    return { ok: true };
  }

  async function markNotificationsRead() {
    if (!authConfigured || !authUserId || !supabase) {
      return;
    }

    const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    const { error: updateError } = await supabase
      .from("app_notifications")
      .update({ read: true })
      .in("id", unreadIds)
      .eq("auth_user_id", authUserId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );
    mergeLiveUserDataCacheEntry({
      authUserId,
      patch: {
        notifications: notifications.map((item) => ({
          ...item,
          read: true,
        })),
      },
      loadedDatasets: ["notifications"],
    });
  }

  useEffect(() => {
    if (!initialized) {
      return;
    }

    async function primeAndReload() {
      if (authConfigured && authUserId && liveUserDataCache.has(authUserId)) {
        applyLiveUserDataCacheEntry(liveUserDataCache.get(authUserId)!, requestedDatasetSet, {
          setConnectedAccounts,
          setProjects,
          setCampaigns,
          setRewards,
          setQuests,
          setNotifications,
          setLeaderboard,
          setRaids,
          setProjectReputation,
          setJoinedCommunityIds,
          setXpStakes,
          setRewardDistributions,
        });
        const fullyCached = requestedDatasets.every((dataset) =>
          liveUserDataCache.get(authUserId)!.loadedDatasets.includes(dataset)
        );
        setLoading(!fullyCached);
        setRefreshing(fullyCached);
      } else {
        setLoading(true);
        setRefreshing(false);
      }

      await reloadLiveUserData();
    }

    void primeAndReload();
  }, [initialized, authConfigured, authUserId, datasetKey, requestedDatasetSet, requestedDatasets]);

  const derived = useMemo(() => {
    return {
      unreadNotificationCount: notifications.filter((item) => !item.read).length,
      approvedQuestCount: quests.filter((item) => item.status === "approved").length,
      pendingQuestCount: quests.filter((item) => item.status === "pending").length,
      claimableRewardCount: rewards.filter((item) => item.claimable).length,
      claimableDistributionCount: rewardDistributions.filter((item) => item.status === "claimable")
        .length,
      activeCampaignCount: campaigns.length,
      activeProjectCount: projects.length,
    };
  }, [notifications, quests, rewards, rewardDistributions, campaigns, projects]);

  return {
    loading,
    refreshing,
    error,
    connectedAccounts,
    projects,
    campaigns,
    rewards,
    quests,
    notifications,
    leaderboard,
    raids,
    projectReputation,
    joinedCommunityIds,
    xpStakes,
    rewardDistributions,
    ...derived,
    reload,
    markNotificationsRead,
    joinCommunity,
    claimReward,
    claimRewardDistribution,
  };
}
