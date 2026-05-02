import test from "node:test";
import assert from "node:assert/strict";

import { buildLedgerXpAwardPlan } from "./ledger-enforcement.js";

test("ledger xp enforcement canonicalizes legacy bot sources and caps payload-sized quest XP", () => {
  const plan = buildLedgerXpAwardPlan({
    authUserId: "user-1",
    sourceType: "quest",
    sourceRef: "quest-1",
    baseValue: 5000,
    xpAmount: 5000,
    effectiveXp: 5000,
    recentSourceXp: 850,
    reputation: {
      trustScore: 50,
      sybilScore: 0,
      status: "active",
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.ok ? plan.event.sourceType : "", "quest_completion");
  assert.equal(plan.ok ? plan.event.sourceRef : "", "quest_completion:quest-1");
  assert.equal(plan.ok ? plan.event.baseValue : 0, 200);
  assert.equal(plan.ok ? plan.event.xpAmount : 0, 200);
  assert.equal(plan.ok ? plan.event.effectiveXp : 0, 50);
  assert.equal(plan.ok ? plan.event.metadata.antiAbuseStatus : "", "capped");
  assert.equal(plan.ok ? plan.event.metadata.claimGuard : "", "service_enforced");
});

test("ledger xp enforcement blocks review and reward-held accounts before database writes", () => {
  const review = buildLedgerXpAwardPlan({
    authUserId: "user-review",
    sourceType: "raid",
    sourceRef: "raid-1",
    baseValue: 100,
    xpAmount: 100,
    effectiveXp: 100,
    reputation: {
      trustScore: 48,
      sybilScore: 72,
      status: "active",
    },
  });
  const rewardHold = buildLedgerXpAwardPlan({
    authUserId: "user-hold",
    sourceType: "onchain_event",
    sourceRef: "event-1",
    baseValue: 100,
    xpAmount: 100,
    effectiveXp: 100,
    reputation: {
      trustScore: 80,
      sybilScore: 10,
      status: "reward_hold",
    },
  });

  assert.equal(review.ok, false);
  assert.equal(review.ok ? "" : review.reason, "account-review");
  assert.equal(rewardHold.ok, false);
  assert.equal(rewardHold.ok ? "" : rewardHold.reason, "account-review");
});

test("ledger xp enforcement lets watch accounts earn with reduced trust multiplier and audit metadata", () => {
  const plan = buildLedgerXpAwardPlan({
    authUserId: "user-watch",
    sourceType: "raid",
    sourceRef: "raid-watch",
    baseValue: 100,
    xpAmount: 100,
    effectiveXp: 100,
    reputation: {
      trustScore: 34,
      sybilScore: 52,
      status: "active",
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.ok ? plan.event.effectiveXp : 0, 89);
  assert.equal(plan.ok ? plan.event.trustMultiplier : 0, 0.89);
  assert.equal(
    plan.ok ? (plan.event.metadata.trustDecision as { status?: string }).status : "",
    "watch"
  );
});

test("ledger xp enforcement rejects duplicate and unknown source writes", () => {
  const duplicate = buildLedgerXpAwardPlan({
    authUserId: "user-dup",
    sourceType: "quest",
    sourceRef: "quest-1",
    baseValue: 25,
    xpAmount: 25,
    effectiveXp: 25,
    claimedSourceRefs: ["quest_completion:quest-1"],
  });
  const invalid = buildLedgerXpAwardPlan({
    authUserId: "user-invalid",
    sourceType: "manual_adjustment",
    sourceRef: "operator-grant",
    baseValue: 1000,
    xpAmount: 1000,
    effectiveXp: 1000,
  });

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.ok ? "" : duplicate.reason, "duplicate");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.ok ? "" : invalid.reason, "invalid-source");
});
