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
  LiveQuest,
  LiveRaid,
  LiveReward,
} from "@/types/live";

type UserProgressRow = {
  quest_statuses: Record<string, LiveQuest["status"]> | null;
  claimed_rewards: string[] | null;
};

export function useLiveUserData() {
  const { authUserId, initialized, authConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [projects, setProjects] = useState<LiveProject[]>([]);
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>([]);
  const [rewards, setRewards] = useState<LiveReward[]>([]);
  const [quests, setQuests] = useState<LiveQuest[]>([]);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardUser[]>([]);
  const [raids, setRaids] = useState<LiveRaid[]>([]);
  const supabase = useMemo(
    () => (authConfigured ? createSupabaseBrowserClient() : null),
    [authConfigured]
  );

  async function reload() {
    if (!authConfigured || !authUserId || !supabase) {
      setConnectedAccounts([]);
      setProjects([]);
      setCampaigns([]);
      setRewards([]);
      setQuests([]);
      setNotifications([]);
      setLeaderboard([]);
      setRaids([]);
      setError(null);
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
        .select("quest_statuses, claimed_rewards")
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
      raidsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const questStatuses =
      ((userProgressResult.data as UserProgressRow | null)?.quest_statuses as
        | Record<string, LiveQuest["status"]>
        | null) ?? {};
    const claimedRewardIds = new Set(
      ((userProgressResult.data as UserProgressRow | null)?.claimed_rewards ?? []) as string[]
    );

    setConnectedAccounts(
      (connectedAccountsResult.data ?? []).map((row) => ({
        id: row.id,
        provider: row.provider,
        providerUserId: row.provider_user_id,
        username: row.username,
        status: row.status,
        connectedAt: row.connected_at,
        updatedAt: row.updated_at,
      }))
    );

    setProjects(
      (projectsResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name ?? "Project",
        description: row.description ?? "No description yet.",
        category: row.category ?? null,
        chain: row.chain ?? null,
        logo: row.logo ?? null,
        bannerUrl: row.banner_url ?? null,
        members: row.members ?? 0,
        website: row.website ?? null,
      }))
    );

    setCampaigns(
      (campaignsResult.data ?? []).map((row) => ({
        id: row.id,
        projectId: row.project_id ?? null,
        title: row.title ?? "Campaign",
        description:
          row.short_description ?? row.long_description ?? "Live campaign from backend.",
        xpBudget: row.xp_budget ?? 0,
        featured: row.featured ?? false,
        completionRate: row.completion_rate ?? 0,
        endsAt: row.ends_at ?? null,
      }))
    );

    setRewards(
      (rewardsResult.data ?? []).map((row) => ({
        id: row.id,
        campaignId: row.campaign_id ?? null,
        title: row.title ?? "Reward",
        description: row.description ?? "Reward from backend.",
        cost: row.cost ?? 0,
        rarity: row.rarity ?? "common",
        claimable: (row.claimable ?? false) && !claimedRewardIds.has(row.id),
        rewardType: row.reward_type ?? row.type ?? "reward",
      }))
    );

    setQuests(
      (questsResult.data ?? []).map((row) => ({
        id: row.id,
        projectId: row.project_id ?? null,
        campaignId: row.campaign_id ?? null,
        title: row.title ?? "Quest",
        description: row.description ?? "",
        type: row.type ?? row.quest_type ?? "Task",
        questType: row.quest_type ?? "custom",
        status: questStatuses[row.id] ?? row.status ?? "open",
        xp: row.xp ?? 0,
        actionLabel: row.action_label ?? "Open Task",
        actionUrl: row.action_url ?? null,
        proofRequired: row.proof_required ?? false,
        proofType: row.proof_type ?? "none",
        verificationType: row.verification_type ?? "manual_review",
        verificationProvider: row.verification_provider ?? null,
        completionMode:
          row.completion_mode ?? ((row.auto_approve ?? false) ? "rule_auto" : "manual"),
        verificationConfig:
          row.verification_config && typeof row.verification_config === "object"
            ? (row.verification_config as Record<string, unknown>)
            : null,
      }))
    );

    setNotifications(
      (notificationsResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title ?? "Notification",
        body: row.body ?? "",
        read: row.read ?? false,
        type: row.type ?? "system",
        createdAt: row.created_at,
      }))
    );

    setLeaderboard(
      (leaderboardResult.data ?? []).map((row) => ({
        id: row.id,
        username: row.username ?? "Raider",
        xp: row.xp ?? 0,
        level: row.level ?? 1,
        avatarUrl: row.avatar_url ?? "",
        bannerUrl: row.banner_url ?? "",
        isCurrentUser: row.auth_user_id === authUserId,
      }))
    );

    setRaids(
      (raidsResult.data ?? []).map((row) => ({
        id: row.id,
        campaignId: row.campaign_id ?? null,
        title: row.title ?? "Raid",
        community: row.community ?? "Community",
        timer: row.timer ?? "Live",
        reward: row.reward ?? 0,
        participants: row.participants ?? 0,
        progress: row.progress ?? 0,
        target: row.target ?? "",
        banner: row.banner ?? "",
        instructions: Array.isArray(row.instructions)
          ? (row.instructions as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
      }))
    );

    setLoading(false);
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
    ...derived,
    reload,
    markNotificationsRead,
  };
}
