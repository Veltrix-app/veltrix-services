import type { UserProfile } from "@/types/auth";

export function mapProfile(row: Record<string, unknown>): UserProfile {
  const reputation =
    typeof row.user_global_reputation === "object" && row.user_global_reputation
      ? (row.user_global_reputation as Record<string, unknown>)
      : {};

  return {
    id: String(row.id ?? ""),
    authUserId: String(row.auth_user_id ?? ""),
    username: String(row.username ?? "Raider"),
    avatarUrl: String(row.avatar_url ?? ""),
    bannerUrl: String(row.banner_url ?? ""),
    title: String(row.title ?? "Elite Raider"),
    faction: String(row.faction ?? "Unassigned"),
    bio: String(row.bio ?? "No bio set yet."),
    wallet: String(row.wallet ?? ""),
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    streak: Number(row.streak ?? 0),
    trustScore: Number(reputation.trust_score ?? 50),
    sybilScore: Number(reputation.sybil_score ?? 0),
    contributionTier: String(reputation.contribution_tier ?? "explorer"),
    reputationRank: Number(reputation.reputation_rank ?? 0),
    questsCompleted: Number(reputation.quests_completed ?? 0),
    raidsCompleted: Number(reputation.raids_completed ?? 0),
    rewardsClaimed: Number(reputation.rewards_claimed ?? 0),
    status: String(row.status ?? "active"),
  };
}
