import assert from "node:assert/strict";
import test from "node:test";
import { buildAchievementBadgesRead, type BuildAchievementBadgesInput } from "./achievement-badges";

const baseInput: BuildAchievementBadgesInput = {
  level: 1,
  streak: 0,
  questsCompleted: 0,
  raidsCompleted: 0,
  rewardsClaimed: 0,
  shardBalance: 0,
  walletConnected: false,
  connectedSystemCount: 0,
  projectCount: 0,
  trustedProjectCount: 0,
  completedPlatformQuestCount: 0,
  completedDeFiQuestCount: 0,
  openShardQuestCount: 0,
  inventoryItems: [],
};

test("buildAchievementBadgesRead unlocks earned achievement badges", () => {
  const read = buildAchievementBadgesRead({
    ...baseInput,
    level: 4,
    streak: 5,
    questsCompleted: 8,
    raidsCompleted: 1,
    rewardsClaimed: 3,
    shardBalance: 180,
    walletConnected: true,
    connectedSystemCount: 2,
    projectCount: 2,
    trustedProjectCount: 1,
    completedPlatformQuestCount: 2,
    completedDeFiQuestCount: 1,
    inventoryItems: [
      {
        rarity: "mythic",
        itemType: "profile_cosmetic",
        status: "owned",
        utility: { isEquippedCosmetic: true },
      },
      {
        rarity: "rare",
        itemType: "season_access",
        status: "owned",
        utility: { isActiveSeasonAccess: true },
      },
    ],
  });

  assert.equal(read.totalCount, 12);
  assert.equal(read.unlockedCount, 12);
  assert.equal(read.completionPercent, 100);
  assert.equal(read.nextBadge, null);
  assert.equal(read.badges.find((badge) => badge.id === "mythic-signal")?.status, "unlocked");
});

test("buildAchievementBadgesRead keeps locked progress and picks the closest next badge", () => {
  const read = buildAchievementBadgesRead({
    ...baseInput,
    streak: 2,
    shardBalance: 60,
    openShardQuestCount: 1,
    inventoryItems: [{ rarity: "common", itemType: "title", status: "owned", utility: {} }],
  });

  assert.equal(read.badges.find((badge) => badge.id === "vault-collector")?.status, "unlocked");
  assert.equal(read.badges.find((badge) => badge.id === "streak-builder")?.progress, 67);
  assert.equal(read.badges.find((badge) => badge.id === "shard-hunter")?.progress, 60);
  assert.equal(read.nextBadge?.id, "streak-builder");
});

test("buildAchievementBadgesRead falls back safely for empty accounts", () => {
  const read = buildAchievementBadgesRead(baseInput);

  assert.equal(read.unlockedCount, 0);
  assert.equal(read.completionPercent, 0);
  assert.equal(read.featuredBadge, null);
  assert.equal(read.nextBadge?.id, "first-quest");
  assert.ok(read.badges.every((badge) => badge.progress >= 0));
});
