import assert from "node:assert/strict";
import test from "node:test";
import { buildAnimatedShardWalletRead } from "./animated-shard-wallet";

const tiers = [
  { id: "common", label: "Spark Box", priceShards: 250, eligibility: { unlocked: true, reason: null } },
  { id: "rare", label: "Surge Box", priceShards: 750, eligibility: { unlocked: true, reason: null } },
  { id: "locked", label: "Mythic Box", priceShards: 1200, eligibility: { unlocked: false, reason: "Level 9" } },
];

test("animated shard wallet reads earning pulse and next lootbox unlock", () => {
  const read = buildAnimatedShardWalletRead({
    shardBalance: 500,
    previousShardBalance: 420,
    lootboxTiers: tiers,
  });

  assert.equal(read.balance, 500);
  assert.equal(read.pulseTone, "earn");
  assert.equal(read.deltaLabel, "+80");
  assert.equal(read.nextUnlock?.label, "Surge Box");
  assert.equal(read.nextUnlock?.shortfall, 250);
  assert.equal(read.progressPercent, 67);
  assert.match(read.spendForecast, /1 lootbox/i);
});

test("animated shard wallet reads spending pulse and ready state", () => {
  const read = buildAnimatedShardWalletRead({
    shardBalance: 900,
    previousShardBalance: 1250,
    lootboxTiers: tiers,
  });

  assert.equal(read.pulseTone, "spend");
  assert.equal(read.deltaLabel, "-350");
  assert.equal(read.nextUnlock?.ready, true);
  assert.equal(read.progressPercent, 100);
  assert.match(read.spendForecast, /2 lootboxes/i);
});
