import test from "node:test";
import assert from "node:assert/strict";

import {
  XP_CENTRAL_AWARD_SOURCE_TYPES,
  XP_USER_AWARD_SOURCE_TYPES,
  buildUserXpAwardPlan,
  isCentralXpAwardSourceType,
  isUserXpAwardSourceType,
} from "./xp-awards";

test("user xp awards expose only claimable quest raid and streak sources", () => {
  assert.deepEqual(XP_USER_AWARD_SOURCE_TYPES, [
    "quest_completion",
    "raid_completion",
    "streak_bonus",
  ]);

  assert.equal(isUserXpAwardSourceType("quest_completion"), true);
  assert.equal(isUserXpAwardSourceType("defi_mission"), false);
  assert.equal(isUserXpAwardSourceType("manual_adjustment"), false);
});

test("central xp awards can issue verified defi missions without opening public defi claims", () => {
  assert.deepEqual(XP_CENTRAL_AWARD_SOURCE_TYPES, [
    "quest_completion",
    "raid_completion",
    "streak_bonus",
    "defi_mission",
  ]);

  assert.equal(isCentralXpAwardSourceType("defi_mission"), true);
  assert.equal(isUserXpAwardSourceType("defi_mission"), false);

  const plan = buildUserXpAwardPlan({
    sourceType: "defi_mission",
    sourceId: "first-market-supply",
    baseXp: 300,
    reputation: {
      total_xp: 700,
      active_xp: 600,
      streak: 4,
      quests_completed: 2,
      raids_completed: 1,
      rewards_claimed: 3,
    },
    metadata: {
      source: "vyntro_defi_xp",
      missionTitle: "Supply into a lending market",
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.ok ? plan.event.source_type : "", "defi_mission");
  assert.equal(plan.ok ? plan.event.source_ref : "", "defi:first-market-supply");
  assert.equal(plan.ok ? plan.event.effective_xp : 0, 300);
  assert.equal(plan.ok ? plan.reputation.total_xp : 0, 1000);
  assert.equal(plan.ok ? plan.reputation.active_xp : 0, 900);
  assert.equal(plan.ok ? plan.reputation.streak : 0, 4);
  assert.equal(plan.ok ? plan.reputation.quests_completed : 0, 2);
  assert.equal(plan.ok ? plan.reputation.raids_completed : 0, 1);
  assert.equal(plan.ok ? plan.reputation.rewards_claimed : 0, 3);
  assert.equal(plan.ok ? plan.event.metadata.missionTitle : "", "Supply into a lending market");
});

test("quest xp award builds one canonical event and increments quest counters", () => {
  const plan = buildUserXpAwardPlan({
    sourceType: "quest_completion",
    sourceId: "quest-1",
    baseXp: 120,
    reputation: {
      total_xp: 480,
      active_xp: 430,
      level: 1,
      streak: 2,
      trust_score: 80,
      sybil_score: 10,
      quests_completed: 3,
      raids_completed: 1,
      rewards_claimed: 2,
      status: "active",
    },
    metadata: {
      questTitle: "Follow VYNTRO",
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.ok ? plan.event.source_type : "", "quest_completion");
  assert.equal(plan.ok ? plan.event.source_ref : "", "quest_completion:quest-1");
  assert.equal(plan.ok ? plan.event.effective_xp : 0, 120);
  assert.equal(plan.ok ? plan.reputation.total_xp : 0, 600);
  assert.equal(plan.ok ? plan.reputation.active_xp : 0, 550);
  assert.equal(plan.ok ? plan.reputation.level : 0, 2);
  assert.equal(plan.ok ? plan.reputation.quests_completed : 0, 4);
  assert.equal(plan.ok ? plan.reputation.raids_completed : 0, 1);
  assert.equal(plan.ok ? plan.reputation.metadata?.questTitle : "", "Follow VYNTRO");
});

test("raid xp award increments raid counters and caps daily pressure", () => {
  const plan = buildUserXpAwardPlan({
    sourceType: "raid_completion",
    sourceId: "raid-1",
    baseXp: 500,
    recentSourceXp: 950,
    reputation: {
      total_xp: 900,
      active_xp: 900,
      quests_completed: 4,
      raids_completed: 2,
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.ok ? plan.event.source_ref : "", "raid_completion:raid-1");
  assert.equal(plan.ok ? plan.event.effective_xp : 0, 250);
  assert.equal(plan.ok ? plan.event.metadata.antiAbuseStatus : "", "capped");
  assert.equal(plan.ok ? plan.reputation.total_xp : 0, 1150);
  assert.equal(plan.ok ? plan.reputation.raids_completed : 0, 3);
});

test("user xp award rejects duplicate and high sybil requests before writing", () => {
  const duplicate = buildUserXpAwardPlan({
    sourceType: "quest_completion",
    sourceId: "quest-1",
    baseXp: 120,
    claimedSourceRefs: ["quest_completion:quest-1"],
  });
  const sybil = buildUserXpAwardPlan({
    sourceType: "raid_completion",
    sourceId: "raid-1",
    baseXp: 120,
    reputation: {
      sybil_score: 91,
    },
  });

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.ok ? "" : duplicate.reason, "duplicate");
  assert.equal(sybil.ok, false);
  assert.equal(sybil.ok ? "" : sybil.reason, "sybil-risk");
});
