type HuntRouteTier = {
  id: string;
  label: string;
  priceShards: number;
  eligibility?: {
    unlocked: boolean;
    reason: string | null;
  };
};

type HuntRouteShardPool = {
  status: string;
  remainingShards: number;
  poolSize: number;
  bonusMin: number;
  bonusMax: number;
  questId: string | null;
  raidId: string | null;
};

export type LootboxHuntRouteState = "ready_to_open" | "hunt_more" | "locked";

export function buildLootboxHuntRoute(params: {
  shardBalance: number;
  lootboxTiers: HuntRouteTier[];
  featuredShardPools: HuntRouteShardPool[];
}) {
  const openPools = params.featuredShardPools.filter(
    (pool) =>
      (pool.status === "active" || pool.status === "scheduled") &&
      Math.max(0, Number(pool.remainingShards)) > 0
  );
  const questBoosts = openPools.filter((pool) => Boolean(pool.questId)).length;
  const raidBoosts = openPools.filter((pool) => Boolean(pool.raidId)).length;
  const remainingBoostShards = openPools.reduce(
    (sum, pool) => sum + Math.max(0, Number(pool.remainingShards)),
    0
  );
  const highestBonusPool =
    openPools
      .slice()
      .sort((left, right) => right.bonusMax - left.bonusMax || right.bonusMin - left.bonusMin)[0] ??
    null;
  const unlockedTiers = params.lootboxTiers
    .filter((tier) => tier.eligibility?.unlocked !== false)
    .slice()
    .sort((left, right) => left.priceShards - right.priceShards);
  const affordableTiers = unlockedTiers.filter((tier) => tier.priceShards <= params.shardBalance);
  const nextLockedTarget =
    unlockedTiers.find((tier) => tier.priceShards > params.shardBalance) ??
    unlockedTiers[unlockedTiers.length - 1] ??
    null;
  const targetTier = nextLockedTarget ?? affordableTiers[affordableTiers.length - 1] ?? null;
  const shortfall = targetTier ? Math.max(0, targetTier.priceShards - params.shardBalance) : 0;
  const state: LootboxHuntRouteState = targetTier
    ? shortfall > 0
      ? "hunt_more"
      : "ready_to_open"
    : "locked";
  const primaryRoute = questBoosts >= raidBoosts ? "quests" : "raids";

  return {
    state,
    targetTierId: targetTier?.id ?? null,
    targetTierLabel: targetTier?.label ?? "Lootbox",
    targetPriceShards: targetTier?.priceShards ?? 0,
    affordableTierCount: affordableTiers.length,
    shortfall,
    shortfallLabel:
      shortfall > 0 ? `${shortfall.toLocaleString("en-US")} shards short` : "Ready to open",
    activeBoostCount: openPools.length,
    questBoosts,
    raidBoosts,
    remainingBoostShards,
    highestBonusLabel: highestBonusPool
      ? formatBonusRange(highestBonusPool.bonusMin, highestBonusPool.bonusMax)
      : "No boost live",
    primaryHref: `/${primaryRoute}`,
    primaryCta:
      openPools.length > 0
        ? `Hunt featured ${primaryRoute}`
        : primaryRoute === "quests"
          ? "Find featured quests"
          : "Find featured raids",
  };
}

function formatBonusRange(min: number, max: number) {
  const safeMin = Math.max(0, Number(min));
  const safeMax = Math.max(0, Number(max));

  if (safeMin > 0 && safeMax > safeMin) {
    return `${safeMin.toLocaleString("en-US")}-${safeMax.toLocaleString("en-US")} bonus shards`;
  }

  if (safeMax > 0) {
    return `${safeMax.toLocaleString("en-US")} bonus shards`;
  }

  return "Boost amount varies";
}
