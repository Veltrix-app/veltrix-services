import assert from "node:assert/strict";
import test from "node:test";
import {
  PLATFORM_QUEST_PROJECT_ID,
  PLATFORM_QUESTS,
  getPlatformQuestBySlug,
  getShardBearingPlatformQuests,
} from "./platform-quest-catalog";

test("platform quest catalog uses the existing VYNTRO project and excludes duplicate social joins", () => {
  assert.equal(PLATFORM_QUEST_PROJECT_ID, "c0951cfd-b434-41d5-977d-813156934493");
  assert.equal(PLATFORM_QUESTS.some((quest) => quest.questType === "discord_join"), false);
  assert.equal(PLATFORM_QUESTS.some((quest) => quest.questType === "telegram_join"), false);
  assert.equal(getPlatformQuestBySlug("first-verified-swap")?.shardRewardAmount, 25);
});

test("platform quest catalog exposes only shard-bearing quests for shard claim routes", () => {
  const shardQuests = getShardBearingPlatformQuests();
  assert.deepEqual(
    shardQuests.map((quest) => [quest.slug, quest.shardRewardAmount]),
    [
      ["first-verified-swap", 25],
      ["daily-real-action", 3],
      ["weekly-activity-streak", 40],
      ["verified-invite", 20],
      ["first-lootbox-open", 15],
    ]
  );
});
