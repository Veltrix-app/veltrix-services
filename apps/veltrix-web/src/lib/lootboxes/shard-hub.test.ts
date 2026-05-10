import assert from "node:assert/strict";
import test from "node:test";
import type { LiveFeaturedShardPool, LiveQuest } from "@/types/live";
import { buildShardHubSnapshot } from "./shard-hub";

function quest(overrides: Partial<LiveQuest>): LiveQuest {
  return {
    id: "quest-default",
    projectId: null,
    campaignId: null,
    title: "Default quest",
    description: "",
    type: "platform",
    questType: "platform",
    status: "open",
    xp: 50,
    projectPoints: 50,
    actionLabel: null,
    actionUrl: null,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    verificationProvider: null,
    completionMode: "rule_auto",
    verificationConfig: null,
    isPlatformQuest: true,
    platformQuestSlug: "daily-platform-action",
    platformQuestCadence: "daily",
    shardRewardAmount: 3,
    shardRewardWindow: "daily",
    ...overrides,
  };
}

function pool(overrides: Partial<LiveFeaturedShardPool>): LiveFeaturedShardPool {
  return {
    id: "pool-default",
    projectId: "project",
    campaignId: null,
    questId: null,
    raidId: null,
    label: "Boost pool",
    poolSize: 100,
    remainingShards: 40,
    bonusMin: 1,
    bonusMax: 5,
    perUserCap: null,
    startsAt: null,
    endsAt: null,
    status: "active",
    ...overrides,
  };
}

test("buildShardHubSnapshot prioritizes daily and weekly shard loops", () => {
  const snapshot = buildShardHubSnapshot({
    shardBalance: 12,
    quests: [
      quest({ id: "approved", status: "approved", title: "Already done", shardRewardAmount: 100 }),
      quest({
        id: "weekly",
        title: "Weekly activity streak",
        platformQuestCadence: "weekly",
        shardRewardAmount: 40,
      }),
      quest({ id: "daily", title: "Daily platform action", shardRewardAmount: 3 }),
      quest({ id: "plain", title: "XP only", shardRewardAmount: 0 }),
    ],
    lootboxTiers: [
      { id: "common", label: "Common box", priceShards: 25, eligibility: { unlocked: true, reason: null } },
      { id: "rare", label: "Rare box", priceShards: 80, eligibility: { unlocked: true, reason: null } },
    ],
    featuredShardPools: [pool({ id: "active" }), pool({ id: "ended", status: "ended" })],
    inventory: [],
  });

  assert.equal(snapshot.dailyQuestCount, 1);
  assert.equal(snapshot.weeklyQuestCount, 1);
  assert.equal(snapshot.earnableShardTotal, 43);
  assert.equal(snapshot.nextQuest?.id, "weekly");
  assert.equal(snapshot.activePoolCount, 1);
  assert.equal(snapshot.remainingPoolShards, 40);
});

test("buildShardHubSnapshot chooses the closest spend target and recent activity", () => {
  const snapshot = buildShardHubSnapshot({
    shardBalance: 30,
    quests: [],
    lootboxTiers: [
      { id: "rare", label: "Rare box", priceShards: 80, eligibility: { unlocked: true, reason: null } },
      { id: "common", label: "Common box", priceShards: 25, eligibility: { unlocked: true, reason: null } },
      { id: "locked", label: "Locked box", priceShards: 10, eligibility: { unlocked: false, reason: "Level 5" } },
    ],
    featuredShardPools: [],
    inventory: [
      {
        id: "item-1",
        label: "Founders title",
        rarity: "rare",
        item_type: "profile_title",
        status: "claimable",
        created_at: "2026-05-10T10:00:00.000Z",
        openAudit: { shardSpend: 25, openedAt: "2026-05-10T09:58:00.000Z" },
      },
    ],
  });

  assert.deepEqual(snapshot.nextSpendTarget, {
    tierId: "common",
    label: "Common box",
    priceShards: 25,
    ready: true,
    shortfall: 0,
  });
  assert.equal(snapshot.recentActivity[0]?.tone, "spend");
  assert.match(snapshot.recentActivity[0]?.meta ?? "", /25 shards/);
});
