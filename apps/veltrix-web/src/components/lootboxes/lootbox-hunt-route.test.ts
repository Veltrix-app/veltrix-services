import assert from "node:assert/strict";
import test from "node:test";
import { buildLootboxHuntRoute } from "./lootbox-hunt-route";

test("buildLootboxHuntRoute points short members toward the strongest featured shard lane", () => {
  const route = buildLootboxHuntRoute({
    shardBalance: 620,
    lootboxTiers: [
      { id: "common", label: "Common Lootbox", priceShards: 250 },
      { id: "rare", label: "Rare Lootbox", priceShards: 750 },
      { id: "epic", label: "Epic Lootbox", priceShards: 2000 },
    ],
    featuredShardPools: [
      {
        status: "active",
        remainingShards: 1200,
        poolSize: 2500,
        bonusMin: 20,
        bonusMax: 45,
        questId: "quest-1",
        raidId: null,
      },
      {
        status: "scheduled",
        remainingShards: 600,
        poolSize: 1500,
        bonusMin: 10,
        bonusMax: 30,
        questId: null,
        raidId: "raid-1",
      },
      {
        status: "ended",
        remainingShards: 900,
        poolSize: 1200,
        bonusMin: 10,
        bonusMax: 25,
        questId: null,
        raidId: "raid-2",
      },
    ],
  });

  assert.equal(route.state, "hunt_more");
  assert.equal(route.targetTierLabel, "Rare Lootbox");
  assert.equal(route.shortfall, 130);
  assert.equal(route.shortfallLabel, "130 shards short");
  assert.equal(route.activeBoostCount, 2);
  assert.equal(route.remainingBoostShards, 1800);
  assert.equal(route.highestBonusLabel, "20-45 bonus shards");
  assert.equal(route.primaryHref, "/quests");
  assert.equal(route.primaryCta, "Hunt featured quests");
});

test("buildLootboxHuntRoute marks the member ready when a target tier is affordable", () => {
  const route = buildLootboxHuntRoute({
    shardBalance: 2500,
    lootboxTiers: [
      { id: "common", label: "Common Lootbox", priceShards: 250 },
      { id: "rare", label: "Rare Lootbox", priceShards: 750 },
      { id: "epic", label: "Epic Lootbox", priceShards: 2000 },
    ],
    featuredShardPools: [],
  });

  assert.equal(route.state, "ready_to_open");
  assert.equal(route.targetTierLabel, "Epic Lootbox");
  assert.equal(route.shortfall, 0);
  assert.equal(route.shortfallLabel, "Ready to open");
  assert.equal(route.activeBoostCount, 0);
  assert.equal(route.primaryHref, "/quests");
  assert.equal(route.primaryCta, "Find featured quests");
});
