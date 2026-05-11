import assert from "node:assert/strict";
import test from "node:test";
import { buildMissionCompletionMoment } from "./mission-completion-moment";

test("buildMissionCompletionMoment creates a premium quest reveal", () => {
  const read = buildMissionCompletionMoment({
    kind: "quest",
    title: "Daily shard route",
    xpAwarded: 75,
    shardsAwarded: 25,
    streakDays: 4,
    primaryHref: "/quests",
  });

  assert.equal(read.eyebrow, "Mission complete");
  assert.equal(read.title, "Daily shard route");
  assert.equal(read.tone, "lime");
  assert.deepEqual(
    read.rewards.map((reward) => reward.label),
    ["XP", "Shards", "Streak"]
  );
  assert.equal(read.primaryHref, "/quests");
  assert.match(read.shareText, /75 XP/);
});

test("buildMissionCompletionMoment emphasizes raid confirmations", () => {
  const read = buildMissionCompletionMoment({
    kind: "raid",
    title: "Launch raid",
    xpAwarded: 140,
    shardsAwarded: 12,
    primaryHref: "/raids",
  });

  assert.equal(read.eyebrow, "Raid confirmed");
  assert.equal(read.tone, "rose");
  assert.equal(read.rewards.find((reward) => reward.label === "Shards")?.value, "+12");
});

test("buildMissionCompletionMoment stays useful with missing rewards", () => {
  const read = buildMissionCompletionMoment({
    kind: "defi",
    title: "Vault XP",
    primaryHref: "/defi",
  });

  assert.equal(read.eyebrow, "DeFi XP claimed");
  assert.equal(read.rewards.length, 1);
  assert.equal(read.rewards[0]?.label, "Progress");
});
