import assert from "node:assert/strict";
import test from "node:test";
import {
  LOOTBOX_EARNING_RULES,
  LOOTBOX_TIERS,
  getLootboxTier,
  getTierOddsTotal,
} from "./lootbox-catalog";

test("lootbox catalog has the balanced chase prices", () => {
  assert.equal(getLootboxTier("common").priceShards, 250);
  assert.equal(getLootboxTier("rare").priceShards, 750);
  assert.equal(getLootboxTier("epic").priceShards, 2000);
  assert.equal(getLootboxTier("legendary").priceShards, 6000);
  assert.equal(getLootboxTier("mythic").priceShards, 18000);
});

test("each tier odds table totals 100 percent", () => {
  for (const tier of LOOTBOX_TIERS) {
    assert.equal(getTierOddsTotal(tier.id), 100);
  }
});

test("earning rules keep featured and sponsored routes strongest", () => {
  assert.deepEqual(LOOTBOX_EARNING_RULES.normalQuest.range, [10, 20]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.normalRaid.range, [15, 30]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.featuredQuest.range, [50, 90]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.featuredRaid.range, [75, 140]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.sponsoredBoost.range, [25, 100]);
  assert.ok(LOOTBOX_EARNING_RULES.featuredRaid.range[0] > LOOTBOX_EARNING_RULES.normalRaid.range[1]);
});
