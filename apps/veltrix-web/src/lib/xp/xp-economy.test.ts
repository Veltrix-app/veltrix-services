import test from "node:test";
import assert from "node:assert/strict";

import {
  XP_ECONOMY_V1_POLICY,
  XP_SOURCE_TYPES,
  buildXpAwardPlan,
  buildXpProgressionRead,
  buildXpSourceRef,
  buildXpStreakRead,
  calculateQuestGlobalXp,
  getXpSourceConfig,
} from "./xp-economy";

test("xp economy v1 exposes one source registry for quests raids defi and streaks", () => {
  assert.deepEqual(Object.keys(XP_SOURCE_TYPES), [
    "quest",
    "raid",
    "defi",
    "streak",
    "manual",
  ]);

  assert.equal(getXpSourceConfig("quest_completion").antiAbuseWindow, "daily");
  assert.equal(getXpSourceConfig("raid_completion").maxDailyXp, 1200);
  assert.equal(getXpSourceConfig("defi_mission").rewardBorrowVolume, false);
  assert.equal(getXpSourceConfig("streak_bonus").category, "retention");
});

test("xp economy v1 publishes final caps levels and anti abuse policy", () => {
  assert.equal(XP_ECONOMY_V1_POLICY.version, "xp-economy-v1");
  assert.deepEqual(XP_ECONOMY_V1_POLICY.levelThresholds.slice(0, 4), [
    0,
    500,
    1250,
    2250,
  ]);
  assert.equal(XP_ECONOMY_V1_POLICY.sources.defi.maxDailyXp, 1000);
  assert.equal(XP_ECONOMY_V1_POLICY.sources.defi.rewardBorrowVolume, false);
  assert.equal(XP_ECONOMY_V1_POLICY.antiAbuse.sybilReviewScore, 90);
  assert.equal(XP_ECONOMY_V1_POLICY.streak.graceHours, 48);
  assert.equal(XP_ECONOMY_V1_POLICY.questRewards.maxGlobalQuestXp, 200);
  assert.equal(XP_ECONOMY_V1_POLICY.questRewards.projectManagedPoints, true);
});

test("xp progression uses one central level curve and contribution tiers", () => {
  const early = buildXpProgressionRead(0);
  const active = buildXpProgressionRead(1300);
  const legend = buildXpProgressionRead(12_000);

  assert.equal(early.level, 1);
  assert.equal(early.nextLevelXp, 500);
  assert.equal(active.level, 3);
  assert.equal(active.contributionTier, "explorer");
  assert.equal(legend.contributionTier, "legend");
  assert.ok(active.progressPercent > 0);
  assert.ok(active.progressPercent <= 100);
});

test("xp award plan blocks duplicates high sybil accounts and capped daily sources", () => {
  const duplicate = buildXpAwardPlan({
    sourceType: "quest_completion",
    sourceId: "quest-1",
    baseXp: 100,
    claimedSourceRefs: [buildXpSourceRef("quest_completion", "quest-1")],
  });
  const sybilBlocked = buildXpAwardPlan({
    sourceType: "raid_completion",
    sourceId: "raid-1",
    baseXp: 200,
    sybilScore: 92,
  });
  const capped = buildXpAwardPlan({
    sourceType: "raid_completion",
    sourceId: "raid-2",
    baseXp: 600,
    recentSourceXp: 900,
  });

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.ok ? false : duplicate.reason, "duplicate");
  assert.equal(sybilBlocked.ok, false);
  assert.equal(sybilBlocked.ok ? false : sybilBlocked.reason, "sybil-risk");
  assert.equal(capped.ok, true);
  assert.equal(capped.ok ? capped.event.effectiveXp : 0, 300);
});

test("xp award plan applies trust quality action and streak multipliers conservatively", () => {
  const plan = buildXpAwardPlan({
    sourceType: "quest_completion",
    sourceId: "quest-2",
    baseXp: 100,
    qualityMultiplier: 1.4,
    actionMultiplier: 1.2,
    trustScore: 80,
    streakDays: 4,
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.ok ? plan.event.sourceRef : "", "quest_completion:quest-2");
  assert.equal(plan.ok ? plan.event.effectiveXp : 0, 242);
  assert.equal(plan.ok ? plan.event.streakMultiplier : 0, 1.2);
});

test("quest global xp ignores inflated project supplied xp and preserves project points", () => {
  const plan = calculateQuestGlobalXp({
    questType: "social_follow",
    requestedXp: 5000,
    verificationType: "api_check",
    verificationProvider: "x",
    completionMode: "integration_auto",
  });

  assert.equal(plan.globalXp, 25);
  assert.equal(plan.projectPoints, 5000);
  assert.equal(plan.cappedByPolicy, true);
  assert.equal(plan.verificationStrength, "verified");
});

test("quest global xp rewards stronger proof without letting one quest dominate", () => {
  const onchain = calculateQuestGlobalXp({
    questType: "onchain_action",
    requestedXp: 50,
    proofRequired: true,
    proofType: "tx_hash",
    verificationType: "wallet_check",
    completionMode: "integration_auto",
  });
  const manualProof = calculateQuestGlobalXp({
    questType: "content_submit",
    requestedXp: 999,
    proofRequired: true,
    proofType: "url",
    verificationType: "manual_review",
    completionMode: "manual",
  });

  assert.equal(onchain.globalXp, 169);
  assert.equal(onchain.band, "onchain");
  assert.equal(manualProof.globalXp, 81);
  assert.equal(manualProof.band, "reviewed");
  assert.equal(manualProof.cappedByPolicy, true);
});

test("xp streak read keeps the daily retention loop explicit", () => {
  const active = buildXpStreakRead({
    currentStreak: 3,
    lastActivityAt: "2026-04-26T08:00:00.000Z",
    now: "2026-04-26T20:00:00.000Z",
  });
  const grace = buildXpStreakRead({
    currentStreak: 3,
    lastActivityAt: "2026-04-25T08:00:00.000Z",
    now: "2026-04-26T20:00:00.000Z",
  });
  const reset = buildXpStreakRead({
    currentStreak: 3,
    lastActivityAt: "2026-04-20T08:00:00.000Z",
    now: "2026-04-26T20:00:00.000Z",
  });

  assert.equal(active.status, "active");
  assert.equal(grace.status, "grace");
  assert.equal(reset.status, "reset");
  assert.equal(active.multiplier, 1.2);
  assert.equal(reset.nextStreak, 1);
});
