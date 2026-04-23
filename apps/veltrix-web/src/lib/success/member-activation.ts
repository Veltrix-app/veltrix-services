import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type SuccessMemberState = {
  authUserId: string;
  activationLane: "onboarding" | "active" | "comeback";
  memberHealthState: "new" | "active" | "drifting" | "reactivation_needed";
  completedMilestones: string[];
  blockers: string[];
  nextBestActionKey?: string;
  nextBestActionLabel?: string;
  nextBestActionRoute?: string;
  linkedProviderCount: number;
  walletVerified: boolean;
  joinedProjectCount: number;
  completedQuestCount: number;
  claimedRewardCount: number;
  streakDays: number;
  lastActivityAt?: string;
};

function diffDays(input?: string | null) {
  if (!input) {
    return null;
  }

  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - value.getTime()) / (1000 * 60 * 60 * 24));
}

function pushIfMissing(target: string[], value: string, enabled: boolean) {
  if (enabled && !target.includes(value)) {
    target.push(value);
  }
}

export async function loadSuccessMemberState(authUserId: string): Promise<SuccessMemberState> {
  const supabase = createSupabaseServiceClient();
  const [
    { data: progress, error: progressError },
    { data: reputation, error: reputationError },
    { count: linkedProviderCount, error: providerError },
    { data: walletLink, error: walletError },
    { count: completedQuestCount, error: questError },
    { count: claimedRewardCount, error: rewardError },
    { data: xpEvent, error: xpError },
  ] = await Promise.all([
    supabase
      .from("user_progress")
      .select("joined_communities")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabase
      .from("user_global_reputation")
      .select("streak, updated_at")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabase
      .from("user_connected_accounts")
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId)
      .eq("status", "connected"),
    supabase
      .from("wallet_links")
      .select("wallet_address")
      .eq("auth_user_id", authUserId)
      .eq("verified", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("quest_submissions")
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId),
    supabase
      .from("reward_claims")
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId),
    supabase
      .from("xp_events")
      .select("created_at")
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (progressError) throw new Error(progressError.message);
  if (reputationError) throw new Error(reputationError.message);
  if (providerError) throw new Error(providerError.message);
  if (walletError) throw new Error(walletError.message);
  if (questError) throw new Error(questError.message);
  if (rewardError) throw new Error(rewardError.message);
  if (xpError) throw new Error(xpError.message);

  const joinedProjectCount = Array.isArray(progress?.joined_communities) ? progress.joined_communities.length : 0;
  const lastActivityAt = xpEvent?.created_at ?? reputation?.updated_at ?? undefined;
  const lastActivityAge = diffDays(lastActivityAt);
  const activationLane: SuccessMemberState["activationLane"] =
    (linkedProviderCount ?? 0) === 0 || !walletLink?.wallet_address || joinedProjectCount === 0
      ? "onboarding"
      : lastActivityAge !== null && lastActivityAge >= 14
        ? "comeback"
        : "active";
  const memberHealthState: SuccessMemberState["memberHealthState"] =
    activationLane === "onboarding"
      ? "new"
      : lastActivityAge !== null && lastActivityAge >= 30
        ? "reactivation_needed"
        : activationLane === "comeback"
          ? "drifting"
          : "active";
  const completedMilestones: string[] = [];
  const blockers: string[] = [];

  pushIfMissing(completedMilestones, "Provider linked", (linkedProviderCount ?? 0) > 0);
  pushIfMissing(completedMilestones, "Wallet verified", Boolean(walletLink?.wallet_address));
  pushIfMissing(completedMilestones, "Joined first project", joinedProjectCount > 0);
  pushIfMissing(completedMilestones, "First quest completed", (completedQuestCount ?? 0) > 0);
  pushIfMissing(completedMilestones, "First reward claimed", (claimedRewardCount ?? 0) > 0);

  pushIfMissing(blockers, "Link the first provider account.", (linkedProviderCount ?? 0) === 0);
  pushIfMissing(blockers, "Verify the first wallet.", !walletLink?.wallet_address);
  pushIfMissing(blockers, "Join the first project community.", joinedProjectCount === 0);
  pushIfMissing(blockers, "Complete the first quest to move into the active lane.", joinedProjectCount > 0 && (completedQuestCount ?? 0) === 0);
  pushIfMissing(blockers, "Return through a comeback path to restore momentum.", lastActivityAge !== null && lastActivityAge >= 14);

  const nextBestAction =
    (linkedProviderCount ?? 0) === 0
      ? { key: "link_first_provider", label: "Link first provider", route: "/community/onboarding" }
      : !walletLink?.wallet_address
        ? { key: "verify_first_wallet", label: "Verify first wallet", route: "/community/onboarding" }
        : joinedProjectCount === 0
          ? { key: "join_first_project", label: "Join first project", route: "/community/onboarding" }
          : lastActivityAge !== null && lastActivityAge >= 14
            ? { key: "resume_member_momentum", label: "Resume momentum", route: "/community/comeback" }
            : { key: "open_live_missions", label: "Open live missions", route: "/home" };

  return {
    authUserId,
    activationLane,
    memberHealthState,
    completedMilestones,
    blockers,
    nextBestActionKey: nextBestAction.key,
    nextBestActionLabel: nextBestAction.label,
    nextBestActionRoute: nextBestAction.route,
    linkedProviderCount: linkedProviderCount ?? 0,
    walletVerified: Boolean(walletLink?.wallet_address),
    joinedProjectCount,
    completedQuestCount: completedQuestCount ?? 0,
    claimedRewardCount: claimedRewardCount ?? 0,
    streakDays: reputation?.streak ?? 0,
    lastActivityAt,
  };
}
