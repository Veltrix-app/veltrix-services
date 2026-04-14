"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import type { ConnectedAccount } from "@/types/auth";
import type {
  LiveCampaign,
  LiveNotification,
  LiveProject,
  LiveQuest,
  LiveReward,
} from "@/types/live";

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
    ]);

    const firstError =
      connectedAccountsResult.error ??
      projectsResult.error ??
      campaignsResult.error ??
      rewardsResult.error ??
      questsResult.error ??
      notificationsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

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
        claimable: row.claimable ?? false,
        rewardType: row.reward_type ?? row.type ?? "reward",
      }))
    );

    setQuests(
      (questsResult.data ?? []).map((row) => ({
        id: row.id,
        campaignId: row.campaign_id ?? null,
        title: row.title ?? "Quest",
        status: row.status ?? "open",
        xp: row.xp ?? 0,
        verificationProvider: row.verification_provider ?? null,
        completionMode: row.completion_mode ?? null,
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

    setLoading(false);
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
    ...derived,
    reload,
  };
}
