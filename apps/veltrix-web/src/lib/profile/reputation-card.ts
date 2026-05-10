import type { UserProfile } from "@/types/auth";

export type ReputationCardBadge = {
  label: string;
  detail: string;
  tone: "cyan" | "lime" | "amber" | "violet";
};

export type ReputationCardRead = {
  username: string;
  title: string;
  rankLabel: string;
  levelLabel: string;
  shardLabel: string;
  headline: string;
  stats: Array<{ label: string; value: string }>;
  badges: ReputationCardBadge[];
  shareText: string;
};

export function buildReputationCardRead(params: {
  profile: UserProfile | null;
  shardBalance: number;
  equippedCosmetic: string | null;
  activeSeasonAccess: string | null;
  connectedSystemCount: number;
}): ReputationCardRead {
  const profile = params.profile;
  const username = profile?.username ?? "Guest member";
  const title = profile?.title ?? "VYNTRO Operator";
  const level = Math.max(1, Math.floor(profile?.level ?? 1));
  const xp = Math.max(0, Math.floor(profile?.xp ?? 0));
  const shards = Math.max(0, Math.floor(params.shardBalance));
  const rank = Math.floor(profile?.reputationRank ?? 0);
  const tier = profile?.contributionTier ?? "explorer";
  const badges: ReputationCardBadge[] = [
    {
      label: tier,
      detail: "Contribution tier",
      tone: "cyan",
    },
  ];

  if (params.equippedCosmetic) {
    badges.push({
      label: params.equippedCosmetic,
      detail: "Equipped cosmetic",
      tone: "violet",
    });
  }

  if (params.activeSeasonAccess) {
    badges.push({
      label: params.activeSeasonAccess,
      detail: "Season access",
      tone: "amber",
    });
  }

  if (profile?.wallet) {
    badges.push({
      label: "Wallet verified",
      detail: "Identity anchor",
      tone: "lime",
    });
  }

  const rankLabel = rank > 0 ? `#${rank}` : "Unranked";
  const headline = `${username} is level ${level} with ${xp.toLocaleString("en-US")} XP, ${shards.toLocaleString("en-US")} shards and ${params.connectedSystemCount} linked systems.`;

  return {
    username,
    title,
    rankLabel,
    levelLabel: `Level ${level}`,
    shardLabel: `${shards.toLocaleString("en-US")} shards`,
    headline,
    stats: [
      { label: "XP", value: xp.toLocaleString("en-US") },
      { label: "Level", value: String(level) },
      { label: "Streak", value: String(Math.max(0, profile?.streak ?? 0)) },
      { label: "Rank", value: rankLabel },
      { label: "Quests", value: String(Math.max(0, profile?.questsCompleted ?? 0)) },
      { label: "Raids", value: String(Math.max(0, profile?.raidsCompleted ?? 0)) },
    ],
    badges: badges.slice(0, 4),
    shareText: `${username} on VYNTRO: ${rankLabel}, Level ${level}, ${xp.toLocaleString("en-US")} XP, ${shards.toLocaleString("en-US")} shards.`,
  };
}
