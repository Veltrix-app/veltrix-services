import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFeaturedShardAward,
  createDeterministicShardBonus,
  resolveBestFeaturedShardPool,
  type FeaturedShardPool,
} from "./featured-shard-pools";

const now = new Date("2026-05-06T12:00:00.000Z");

function pool(overrides: Partial<FeaturedShardPool>): FeaturedShardPool {
  return {
    id: "pool-campaign",
    projectId: "project-1",
    campaignId: "campaign-1",
    questId: null,
    raidId: null,
    label: "Shard Boost",
    poolSize: 10000,
    remainingShards: 5000,
    bonusMin: 25,
    bonusMax: 40,
    perUserCap: null,
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: "2026-06-01T00:00:00.000Z",
    status: "active",
    ...overrides,
  };
}

test("resolveBestFeaturedShardPool prefers quest override before campaign pool", () => {
  const campaignPool = pool({ id: "pool-campaign" });
  const questPool = pool({ id: "pool-quest", questId: "quest-1", bonusMin: 80, bonusMax: 120 });

  const selected = resolveBestFeaturedShardPool({
    pools: [campaignPool, questPool],
    campaignId: "campaign-1",
    questId: "quest-1",
    now,
  });

  assert.equal(selected?.id, "pool-quest");
});

test("resolveBestFeaturedShardPool ignores expired paused and depleted pools", () => {
  const selected = resolveBestFeaturedShardPool({
    pools: [
      pool({ id: "expired", endsAt: "2026-05-01T00:00:00.000Z" }),
      pool({ id: "paused", status: "paused" }),
      pool({ id: "depleted", remainingShards: 0 }),
      pool({ id: "active" }),
    ],
    campaignId: "campaign-1",
    now,
  });

  assert.equal(selected?.id, "active");
});

test("calculateFeaturedShardAward clamps bonus to remaining budget", () => {
  const selectedPool = pool({ remainingShards: 12, bonusMin: 25, bonusMax: 40 });
  const award = calculateFeaturedShardAward({
    baseAmount: 75,
    pool: selectedPool,
    authUserId: "user-1",
    sourceRef: "raid-1",
  });

  assert.equal(award.baseAmount, 75);
  assert.equal(award.bonusAmount, 12);
  assert.equal(award.totalAmount, 87);
});

test("createDeterministicShardBonus stays inside the inclusive range", () => {
  const values = Array.from({ length: 20 }, (_, index) =>
    createDeterministicShardBonus({
      min: 25,
      max: 40,
      seed: `user-${index}:pool:quest`,
    })
  );

  assert.ok(values.every((value) => value >= 25 && value <= 40));
  assert.ok(new Set(values).size > 1);
});
