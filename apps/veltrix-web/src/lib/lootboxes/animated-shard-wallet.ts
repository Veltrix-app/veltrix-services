export type AnimatedShardWalletTier = {
  id: string;
  label: string;
  priceShards: number;
  eligibility: {
    unlocked: boolean;
    reason: string | null;
  };
};

export type AnimatedShardWalletPulseTone = "idle" | "earn" | "spend";

export type AnimatedShardWalletRead = {
  balance: number;
  pulseTone: AnimatedShardWalletPulseTone;
  deltaLabel: string | null;
  affordableCount: number;
  spendForecast: string;
  nextUnlock: {
    tierId: string;
    label: string;
    priceShards: number;
    ready: boolean;
    shortfall: number;
  } | null;
  progressPercent: number;
};

export function buildAnimatedShardWalletRead(params: {
  shardBalance: number;
  previousShardBalance?: number | null;
  lootboxTiers: AnimatedShardWalletTier[];
}): AnimatedShardWalletRead {
  const balance = toSafeInteger(params.shardBalance);
  const previousBalance =
    typeof params.previousShardBalance === "number" ? toSafeInteger(params.previousShardBalance) : balance;
  const delta = balance - previousBalance;
  const unlockedTiers = params.lootboxTiers
    .filter((tier) => tier.eligibility.unlocked && tier.priceShards > 0)
    .map((tier) => ({
      tierId: tier.id,
      label: tier.label,
      priceShards: toSafeInteger(tier.priceShards),
      ready: balance >= tier.priceShards,
      shortfall: Math.max(0, tier.priceShards - balance),
    }))
    .sort((left, right) => left.priceShards - right.priceShards);
  const affordableCount = unlockedTiers.filter((tier) => tier.ready).length;
  const nextLockedByBalance = unlockedTiers.find((tier) => !tier.ready);
  const highestAffordable = [...unlockedTiers].reverse().find((tier) => tier.ready) ?? null;
  const nextUnlock = nextLockedByBalance ?? highestAffordable;
  const progressPercent = nextUnlock
    ? Math.min(100, Math.round((balance / Math.max(1, nextUnlock.priceShards)) * 100))
    : 0;

  return {
    balance,
    pulseTone: delta > 0 ? "earn" : delta < 0 ? "spend" : "idle",
    deltaLabel: delta === 0 ? null : `${delta > 0 ? "+" : ""}${delta}`,
    affordableCount,
    spendForecast:
      affordableCount > 0
        ? `Can open ${affordableCount} ${affordableCount === 1 ? "lootbox" : "lootboxes"}`
        : nextUnlock
          ? `${nextUnlock.shortfall} shards until ${nextUnlock.label}`
          : "Earn shards to unlock boxes",
    nextUnlock,
    progressPercent,
  };
}

function toSafeInteger(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}
