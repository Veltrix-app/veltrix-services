import assert from "node:assert/strict";
import test from "node:test";
import type { LiveQuest } from "@/types/live";
import { buildStreakLadderRead } from "./streak-ladder";

function quest(overrides: Partial<LiveQuest> = {}): LiveQuest {
  return {
    id: overrides.id ?? "quest-1",
    projectId: null,
    campaignId: null,
    title: overrides.title ?? "Daily check-in",
    description: overrides.description ?? "Open VYNTRO.",
    type: overrides.type ?? "platform",
    questType: overrides.questType ?? "daily_check_in",
    status: overrides.status ?? "open",
    xp: overrides.xp ?? 20,
    projectPoints: overrides.projectPoints ?? 20,
    actionLabel: overrides.actionLabel ?? "Open home",
    actionUrl: overrides.actionUrl ?? "/home",
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    verificationProvider: null,
    completionMode: "integration_auto",
    verificationConfig: null,
    isPlatformQuest: true,
    platformQuestSlug: overrides.platformQuestSlug ?? "daily-check-in",
    platformQuestCadence: overrides.platformQuestCadence ?? "daily",
    shardRewardAmount: overrides.shardRewardAmount ?? 0,
    shardRewardWindow: overrides.shardRewardWindow ?? "none",
  };
}

test("buildStreakLadderRead highlights daily and weekly streak progress", () => {
  const read = buildStreakLadderRead({
    currentStreak: 4,
    quests: [
      quest({ id: "check-in", platformQuestSlug: "daily-check-in", status: "approved" }),
      quest({
        id: "daily-action",
        title: "Complete a real daily action",
        platformQuestSlug: "daily-real-action",
        status: "open",
        shardRewardAmount: 3,
        shardRewardWindow: "daily",
      }),
      quest({
        id: "weekly",
        title: "Weekly activity streak",
        platformQuestSlug: "weekly-activity-streak",
        platformQuestCadence: "weekly",
        status: "open",
        xp: 100,
        shardRewardAmount: 40,
        shardRewardWindow: "weekly",
      }),
    ],
  });

  assert.equal(read.currentStreak, 4);
  assert.equal(read.dailyStatus, "claimed");
  assert.equal(read.weeklyStatus, "building");
  assert.equal(read.weeklyProgress.current, 1);
  assert.equal(read.weeklyProgress.target, 3);
  assert.equal(read.nextAction?.questId, "daily-action");
  assert.equal(read.weeklyShardUpside, 43);
  assert.deepEqual(
    read.milestones.map((milestone) => [milestone.day, milestone.status]),
    [
      [1, "claimed"],
      [3, "claimed"],
      [7, "next"],
    ]
  );
});

test("buildStreakLadderRead treats a completed weekly quest as the strongest claim", () => {
  const read = buildStreakLadderRead({
    currentStreak: 8,
    quests: [
      quest({
        id: "weekly",
        title: "Weekly activity streak",
        platformQuestSlug: "weekly-activity-streak",
        platformQuestCadence: "weekly",
        status: "approved",
        shardRewardAmount: 40,
        shardRewardWindow: "weekly",
      }),
    ],
  });

  assert.equal(read.weeklyStatus, "claimed");
  assert.equal(read.weeklyProgress.current, 3);
  assert.equal(read.multiplierLabel, "1.3x");
  assert.equal(read.nextAction?.label, "Keep streak alive");
});

test("buildStreakLadderRead has a safe empty state for new members", () => {
  const read = buildStreakLadderRead({
    currentStreak: 0,
    quests: [],
  });

  assert.equal(read.currentStreak, 0);
  assert.equal(read.dailyStatus, "open");
  assert.equal(read.weeklyStatus, "open");
  assert.equal(read.nextAction?.href, "/quests");
  assert.equal(read.milestones[0]?.status, "next");
  assert.equal(read.weeklyProgress.percent, 0);
});
