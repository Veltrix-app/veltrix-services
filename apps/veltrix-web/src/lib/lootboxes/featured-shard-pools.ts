export type FeaturedShardPoolStatus = "draft" | "scheduled" | "active" | "paused" | "ended";

export type FeaturedShardPool = {
  id: string;
  projectId: string;
  campaignId: string | null;
  questId: string | null;
  raidId: string | null;
  label: string;
  poolSize: number;
  remainingShards: number;
  bonusMin: number;
  bonusMax: number;
  perUserCap: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: FeaturedShardPoolStatus;
};

export type FeaturedShardAward = {
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  pool: FeaturedShardPool | null;
};

export function isFeaturedShardPoolActive(pool: FeaturedShardPool, now = new Date()) {
  if (pool.status !== "active" || pool.remainingShards <= 0) {
    return false;
  }

  const startsAt = pool.startsAt ? new Date(pool.startsAt).getTime() : null;
  const endsAt = pool.endsAt ? new Date(pool.endsAt).getTime() : null;
  const nowMs = now.getTime();

  if (startsAt !== null && Number.isFinite(startsAt) && startsAt > nowMs) {
    return false;
  }

  if (endsAt !== null && Number.isFinite(endsAt) && endsAt <= nowMs) {
    return false;
  }

  return true;
}

export function resolveBestFeaturedShardPool(params: {
  pools: FeaturedShardPool[];
  campaignId?: string | null;
  questId?: string | null;
  raidId?: string | null;
  now?: Date;
}) {
  const activePools = params.pools.filter((pool) =>
    isFeaturedShardPoolActive(pool, params.now ?? new Date())
  );

  const questOverride = params.questId
    ? activePools.find((pool) => pool.questId === params.questId)
    : null;
  if (questOverride) return questOverride;

  const raidOverride = params.raidId
    ? activePools.find((pool) => pool.raidId === params.raidId)
    : null;
  if (raidOverride) return raidOverride;

  if (!params.campaignId) {
    return null;
  }

  return (
    activePools.find(
      (pool) =>
        pool.campaignId === params.campaignId &&
        pool.questId === null &&
        pool.raidId === null
    ) ?? null
  );
}

export function createDeterministicShardBonus(params: {
  min: number;
  max: number;
  seed: string;
}) {
  const min = Math.max(0, Math.floor(params.min));
  const max = Math.max(min, Math.floor(params.max));
  if (max <= min) {
    return min;
  }

  let hash = 2166136261;
  for (const character of params.seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return min + (hash % (max - min + 1));
}

export function calculateFeaturedShardAward(params: {
  baseAmount: number;
  pool: FeaturedShardPool | null;
  authUserId: string;
  sourceRef: string;
}) {
  const baseAmount = Math.max(0, Math.floor(params.baseAmount));
  if (!params.pool) {
    return {
      baseAmount,
      bonusAmount: 0,
      totalAmount: baseAmount,
      pool: null,
    } satisfies FeaturedShardAward;
  }

  const requestedBonus = createDeterministicShardBonus({
    min: params.pool.bonusMin,
    max: params.pool.bonusMax,
    seed: `${params.authUserId}:${params.pool.id}:${params.sourceRef}`,
  });
  const bonusAmount = Math.min(requestedBonus, Math.max(0, params.pool.remainingShards));

  return {
    baseAmount,
    bonusAmount,
    totalAmount: baseAmount + bonusAmount,
    pool: params.pool,
  } satisfies FeaturedShardAward;
}
