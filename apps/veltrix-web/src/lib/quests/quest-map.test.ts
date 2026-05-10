import assert from "node:assert/strict";
import test from "node:test";
import type { LiveQuest } from "@/types/live";
import { buildQuestJourneyMap, resolveQuestJourneyLane } from "./quest-map";

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
    xp: 100,
    projectPoints: 100,
    actionLabel: null,
    actionUrl: null,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    verificationProvider: null,
    completionMode: "rule_auto",
    verificationConfig: null,
    isPlatformQuest: false,
    platformQuestSlug: null,
    platformQuestCadence: null,
    shardRewardAmount: 0,
    shardRewardWindow: null,
    ...overrides,
  };
}

test("resolveQuestJourneyLane classifies platform cadence quests", () => {
  assert.equal(
    resolveQuestJourneyLane(
      quest({
        title: "Connect wallet",
        isPlatformQuest: true,
        platformQuestSlug: "first-wallet-connect",
        platformQuestCadence: "onboarding",
      })
    ),
    "onboarding"
  );

  assert.equal(
    resolveQuestJourneyLane(
      quest({
        title: "Daily platform action",
        isPlatformQuest: true,
        platformQuestCadence: "daily",
        shardRewardWindow: "daily",
      })
    ),
    "daily"
  );

  assert.equal(
    resolveQuestJourneyLane(
      quest({
        title: "Weekly activity streak",
        isPlatformQuest: true,
        platformQuestCadence: "weekly",
        shardRewardWindow: "weekly",
      })
    ),
    "weekly"
  );
});

test("resolveQuestJourneyLane classifies DeFi, social and reward lanes", () => {
  assert.equal(
    resolveQuestJourneyLane(quest({ title: "Complete your first verified swap", actionUrl: "/swap" })),
    "defi"
  );
  assert.equal(
    resolveQuestJourneyLane(quest({ title: "Invite a friend", verificationProvider: "telegram" })),
    "social"
  );
  assert.equal(
    resolveQuestJourneyLane(
      quest({ title: "Open a lootbox", questType: "lootbox_unlock", shardRewardAmount: 15 })
    ),
    "lootbox"
  );
});

test("buildQuestJourneyMap totals lanes and prioritizes open shard-bearing platform quests", () => {
  const map = buildQuestJourneyMap([
    quest({ id: "approved", title: "Approved intro", status: "approved", xp: 500 }),
    quest({
      id: "weekly",
      title: "Weekly activity streak",
      isPlatformQuest: true,
      platformQuestCadence: "weekly",
      shardRewardAmount: 40,
      shardRewardWindow: "weekly",
      xp: 100,
    }),
    quest({ id: "high-xp", title: "Project mission", xp: 450 }),
    quest({ id: "pending", title: "Pending proof", status: "pending", shardRewardAmount: 100, xp: 200 }),
  ]);

  assert.equal(map.totalCount, 4);
  assert.equal(map.openCount, 3);
  assert.equal(map.completedCount, 1);
  assert.equal(map.xpAvailable, 750);
  assert.equal(map.shardsAvailable, 140);
  assert.equal(map.progressPercent, 25);
  assert.equal(map.nextQuest?.id, "weekly");
  assert.equal(map.lanes.find((lane) => lane.id === "weekly")?.nextQuest?.id, "weekly");
  assert.equal(map.lanes.find((lane) => lane.id === "weekly")?.shardsAvailable, 40);
});
