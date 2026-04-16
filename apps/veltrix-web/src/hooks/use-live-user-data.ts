"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import type { ConnectedAccount } from "@/types/auth";
import type {
  LiveCampaign,
  LiveLeaderboardUser,
  LiveNotification,
  LiveProject,
  LiveProjectReputation,
  LiveQuest,
  LiveRaid,
  LiveReward,
} from "@/types/live";

type UserProgressRow = {
  quest_statuses: Record<string, LiveQuest["status"]> | null;
  claimed_rewards: string[] | null;
  joined_communities: string[] | null;
  confirmed_raids: string[] | null;
  opened_lootbox_ids: string[] | null;
  unlocked_reward_ids: string[] | null;
};

type LiveUserDataCacheEntry = {
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
};

const liveUserDataCache = new Map<string, LiveUserDataCacheEntry>();

export function seedLiveUserConnectedAccounts(
  authUserId: string,
  accounts: ConnectedAccount[]
) {
  const existing = liveUserDataCache.get(authUserId);

  liveUserDataCache.set(authUserId, {
    connectedAccounts: accounts,
    projects: existing?.projects ?? [],
    campaigns: existing?.campaigns ?? [],
    rewards: existing?.rewards ?? [],
    quests: existing?.quests ?? [],
    notifications: existing?.notifications ?? [],
    leaderboard: existing?.leaderboard ?? [],
    raids: existing?.raids ?? [],
    projectReputation: existing?.projectReputation ?? [],
    joinedCommunityIds: existing?.joinedCommunityIds ?? [],
  });
}

export function useLiveUserData() {
  const { authUserId, initialized, authConfigured, session, profile } = useAuth();
  const cachedState = authUserId ? liveUserDataCache.get(authUserId) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(
    cachedState?.connectedAccounts ?? []
  );
  const [projects, setProjects] = useState<LiveProject[]>(cachedState?.projects ?? []);
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>(cachedState?.campaigns ?? []);
  const [rewards, setRewards] = useState<LiveReward[]>(cachedState?.rewards ?? []);
  const [quests, setQuests] = useState<LiveQuest[]>(cachedState?.quests ?? []);
  const [notifications, setNotifications] = useState<LiveNotification[]>(
    cachedState?.notifications ?? []
  );
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardUser[]>(
    cachedState?.leaderboard ?? []
  );
  const [raids, setRaids] = useState<LiveRaid[]>(cachedState?.raids ?? []);
  const [projectReputation, setProjectReputation] = useState<LiveProjectReputation[]>(
    cachedState?.projectReputation ?? []
  );
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>(
    cachedState?.joinedCommunityIds ?? []
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
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
    ] = await Promise.all([
      supabase
        .from("user_connected_accounts")
        .select("*")
        .eq("auth_user_id", authUserId)
        .order("connected_at", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.from("rewards").select("*").order("created_at", { ascending: false }),
      supabase.from("quests").select("*").order("created_at", { ascending: false }),
      supabase
        .from("app_notifications")
        .select("*")
        .eq("auth_user_id", authUserId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("user_progress")
        .select(
          "joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses"
        )
        .eq("auth_user_id", authUserId)
        .maybeSingle(),
      supabase
        .from("user_profiles")
        .select("*")
        .eq("status", "active")
        .order("xp", { ascending: false })
        .order("level", { ascending: false }),
      supabase
        .from("raids")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_project_reputation")
        .select("*")
        .eq("auth_user_id", authUserId)
        .order("xp", { ascending: false }),
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
      projectReputationResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
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
    setJoinedCommunityIds(joinedCommunities);

    const nextConnectedAccounts = (connectedAccountsResult.data ?? []).map((row) => ({
        id: row.id,
        provider: row.provider,
        providerUserId: row.provider_user_id,
        username: row.username,
        status: row.status,
        connectedAt: row.connected_at,
        updatedAt: row.updated_at,
      }));
    setConnectedAccounts(nextConnectedAccounts);

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
    setProjects(nextProjects);

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
      }));
    setCampaigns(nextCampaigns);

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
    setRewards(nextRewards);

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

        return {
          id: row.id,
          projectId: row.project_id ?? null,
          campaignId: row.campaign_id ?? null,
          title: row.title ?? "Quest",
          description: row.description ?? "",
          type: row.type ?? row.quest_type ?? "Task",
          questType,
          status: questStatuses[row.id] ?? row.status ?? "open",
          xp: row.xp ?? 0,
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
    setQuests(nextQuests);

    const nextNotifications = (notificationsResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title ?? "Notification",
        body: row.body ?? "",
        read: row.read ?? false,
        type: row.type ?? "system",
        createdAt: row.created_at,
      }));
    setNotifications(nextNotifications);

    const nextLeaderboard = (leaderboardResult.data ?? []).map((row) => ({
        id: row.id,
        username: row.username ?? "Raider",
        xp: row.xp ?? 0,
        level: row.level ?? 1,
        avatarUrl: row.avatar_url ?? "",
        bannerUrl: row.banner_url ?? "",
        isCurrentUser: row.auth_user_id === authUserId,
      }));
    setLeaderboard(nextLeaderboard);

    const nextRaids = (raidsResult.data ?? []).map((row) => ({
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
      }));
    setRaids(nextRaids);

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
    setProjectReputation(nextProjectReputation);

    liveUserDataCache.set(authUserId, {
      connectedAccounts: nextConnectedAccounts,
      projects: nextProjects,
      campaigns: nextCampaigns,
      rewards: nextRewards,
      quests: nextQuests,
      notifications: nextNotifications,
      leaderboard: nextLeaderboard,
      raids: nextRaids,
      projectReputation: nextProjectReputation,
      joinedCommunityIds: joinedCommunities,
    });

    setLoading(false);
  }

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
        username: profile?.username ?? session?.user?.email?.split("@")[0] ?? "pilot",
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
  }

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (authConfigured && authUserId && liveUserDataCache.has(authUserId)) {
      setLoading(false);
    } else {
      setLoading(true);
    }

    void reload();
  }, [initialized, authConfigured, authUserId]);

  const derived = useMemo(() => {
    return {
      unreadNotificationCount: notifications.filter((item) => !item.read).length,
      approvedQuestCount: quests.filter((item) => item.status === "approved").length,
      pendingQuestCount: quests.filter((item) => item.status === "pending").length,
    claimableRewardCount: rewards.filter((item) => item.claimable).length,
      activeCampaignCount: campaigns.length,
      activeProjectCount: projects.length,
    };
  }, [notifications, quests, rewards, campaigns, projects]);

  return {
    loading,
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
    ...derived,
    reload,
    markNotificationsRead,
    joinCommunity,
    claimReward,
  };
}
