import assert from "node:assert/strict";
import test from "node:test";
import { getLootboxTier } from "./lootbox-catalog";
import {
  calculateShardBalance,
  createShardSourceDedupeKey,
  isLootboxTierUnlocked,
  pickLootboxPoolItem,
  pickLootboxRarity,
} from "./lootbox-engine";

test("calculateShardBalance sums grants, spends, and refunds", () => {
  assert.equal(
    calculateShardBalance([
      { amount: 90 },
      { amount: 25 },
      { amount: -250 },
      { amount: 40 },
    ]),
    -95
  );
});

test("createShardSourceDedupeKey keeps shard grants idempotent per source action", () => {
  assert.equal(
    createShardSourceDedupeKey({
      sourceType: "featured_raid",
      sourceRef: "raid-123",
      action: "confirmed",
    }),
    "featured_raid:raid-123:confirmed"
  );
});

test("isLootboxTierUnlocked allows epic through featured completions even below level eight", () => {
  const result = isLootboxTierUnlocked(getLootboxTier("epic"), {
    level: 5,
    featuredCompletions: 3,
    cleanTrust: true,
    seasonWindowActive: false,
  });

  assert.deepEqual(result, { unlocked: true, reason: null });
});

test("isLootboxTierUnlocked blocks mythic without an active season window", () => {
  const result = isLootboxTierUnlocked(getLootboxTier("mythic"), {
    level: 25,
    featuredCompletions: 10,
    cleanTrust: true,
    seasonWindowActive: false,
  });

  assert.equal(result.unlocked, false);
  assert.match(result.reason ?? "", /season/i);
});

test("pickLootboxRarity selects a rarity from tier odds deterministically", () => {
  assert.equal(pickLootboxRarity(getLootboxTier("common").odds, 0), "common");
  assert.equal(pickLootboxRarity(getLootboxTier("common").odds, 0.705), "rare");
  assert.equal(pickLootboxRarity(getLootboxTier("common").odds, 0.999), "mythic");
});

test("pickLootboxPoolItem never returns inactive, depleted, or empty outcomes", () => {
  const item = pickLootboxPoolItem(
    [
      { id: "inactive", active: false, weight: 100, stock: null, unlimited_stock: true },
      { id: "depleted", active: true, weight: 100, stock: 0, unlimited_stock: false },
      { id: "winner", active: true, weight: 1, stock: 1, unlimited_stock: false },
    ],
    0.99
  );

  assert.equal(item.id, "winner");
});
