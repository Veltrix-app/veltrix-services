import type { LiveFeaturedShardPool, LiveQuest } from "@/types/live";

export type ShardHubLootboxTier = {
  id: string;
  label: string;
  priceShards: number;
  eligibility: {
    unlocked: boolean;
    reason: string | null;
  };
};

export type ShardHubInventoryItem = {
  id: string;
  label: string;
  rarity: string;
  item_type: string;
  status: string;
  created_at: string;
  openAudit?: {
    shardSpend: number;
    openedAt: string;
  } | null;
};

export type ShardHubSnapshot = {
  balance: number;
  dailyQuestCount: number;
  weeklyQuestCount: number;
  earnableShardTotal: number;
  activePoolCount: number;
  remainingPoolShards: number;
  nextQuest: LiveQuest | null;
  nextSpendTarget: {
    tierId: string;
    label: string;
    priceShards: number;
    ready: boolean;
    shortfall: number;
  } | null;
  recentActivity: Array<{
    id: string;
    label: string;
    meta: string;
    tone: "earn" | "spend" | "reward";
  }>;
};

export function buildShardHubSnapshot(params: {
  shardBalance: number;
  quests: LiveQuest[];
  lootboxTiers: ShardHubLootboxTier[];
  featuredShardPools: LiveFeaturedShardPool[];
  inventory: ShardHubInventoryItem[];
}): ShardHubSnapshot {
  const shardQuests = params.quests
    .filter((quest) => quest.status !== "approved" && (quest.shardRewardAmount ?? 0) > 0)
    .sort(
      (left, right) =>
        (right.shardRewardAmount ?? 0) - (left.shardRewardAmount ?? 0) ||
        Number(right.isPlatformQuest) - Number(left.isPlatformQuest) ||
        right.xp - left.xp
    );
  const dailyQuestCount = shardQuests.filter(
    (quest) =>
      quest.platformQuestCadence !== "weekly" &&
      (quest.platformQuestCadence === "daily" || quest.shardRewardWindow === "daily")
  ).length;
  const weeklyQuestCount = shardQuests.filter(
    (quest) => quest.platformQuestCadence === "weekly" || quest.shardRewardWindow === "weekly"
  ).length;
  const earnableShardTotal = shardQuests.reduce(
    (total, quest) => total + Math.max(0, quest.shardRewardAmount ?? 0),
    0
  );
  const activePools = params.featuredShardPools.filter(
    (pool) => pool.status === "active" && pool.remainingShards > 0
  );
  const spendTargets = params.lootboxTiers
    .filter((tier) => tier.eligibility.unlocked)
    .map((tier) => ({
      tierId: tier.id,
      label: tier.label,
      priceShards: Math.max(0, tier.priceShards),
      ready: params.shardBalance >= tier.priceShards,
      shortfall: Math.max(0, tier.priceShards - params.shardBalance),
    }))
    .sort(
      (left, right) =>
        Number(right.ready) - Number(left.ready) ||
        left.shortfall - right.shortfall ||
        left.priceShards - right.priceShards
    );
  const recentSpend = params.inventory
    .filter((item) => item.openAudit)
    .sort(
      (left, right) =>
        new Date(right.openAudit?.openedAt ?? right.created_at).getTime() -
        new Date(left.openAudit?.openedAt ?? left.created_at).getTime()
    )
    .slice(0, 3)
    .map((item) => ({
      id: `spend-${item.id}`,
      label: item.label,
      meta: `${item.openAudit?.shardSpend ?? 0} shards spent / ${item.rarity}`,
      tone: "spend" as const,
    }));
  const questActivity = shardQuests.slice(0, Math.max(0, 4 - recentSpend.length)).map((quest) => ({
    id: `earn-${quest.id}`,
    label: quest.title,
    meta: `+${quest.shardRewardAmount ?? 0} shards / ${quest.platformQuestCadence ?? "quest"}`,
    tone: "earn" as const,
  }));

  return {
    balance: Math.max(0, params.shardBalance),
    dailyQuestCount,
    weeklyQuestCount,
    earnableShardTotal,
    activePoolCount: activePools.length,
    remainingPoolShards: activePools.reduce(
      (total, pool) => total + Math.max(0, pool.remainingShards),
      0
    ),
    nextQuest: shardQuests[0] ?? null,
    nextSpendTarget: spendTargets[0] ?? null,
    recentActivity: [...recentSpend, ...questActivity],
  };
}
