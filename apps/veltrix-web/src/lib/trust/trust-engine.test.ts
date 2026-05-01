import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveTrustDecision,
  getPublicTrustState,
  isRewardHeldByTrust,
  isXpBlockedByTrust,
} from "./trust-engine";

test("trust engine escalates high sybil posture to review required", () => {
  const decision = deriveTrustDecision({
    trustScore: 42,
    sybilScore: 74,
    status: "active",
  });

  assert.equal(decision.status, "review_required");
  assert.equal(decision.riskLevel, "high");
  assert.equal(decision.recommendedAction, "review_required");
  assert.equal(decision.reviewRequired, true);
  assert.equal(isXpBlockedByTrust(decision), true);
  assert.equal(isRewardHeldByTrust(decision), true);
  assert.deepEqual(decision.reasonCodes, ["sybil_review_threshold"]);
});

test("trust engine uses reward hold before hard suspension", () => {
  const decision = deriveTrustDecision({
    trustScore: 18,
    sybilScore: 82,
    status: "active",
  });

  assert.equal(decision.status, "reward_hold");
  assert.equal(decision.riskLevel, "high");
  assert.equal(decision.recommendedAction, "reward_hold");
  assert.equal(decision.rewardHoldRequired, true);
  assert.equal(isXpBlockedByTrust(decision), true);
  assert.equal(isRewardHeldByTrust(decision), true);
  assert.deepEqual(decision.reasonCodes, ["sybil_reward_hold_threshold", "trust_reward_hold_threshold"]);
});

test("trust engine never auto-downgrades terminal enforcement statuses", () => {
  const decision = deriveTrustDecision({
    trustScore: 80,
    sybilScore: 0,
    status: "xp_suspended",
  });

  assert.equal(decision.status, "xp_suspended");
  assert.equal(decision.riskLevel, "critical");
  assert.equal(decision.recommendedAction, "xp_suspended");
  assert.equal(decision.hardBlocked, true);
  assert.deepEqual(decision.reasonCodes, ["terminal_status:xp_suspended"]);
});

test("public trust state keeps member-facing copy calm", () => {
  const review = getPublicTrustState(
    deriveTrustDecision({
      trustScore: 25,
      sybilScore: 70,
      status: "active",
    })
  );
  const held = getPublicTrustState(
    deriveTrustDecision({
      trustScore: 20,
      sybilScore: 85,
      status: "active",
    })
  );

  assert.deepEqual(review, {
    label: "Under review",
    tone: "review",
    message: "Your progress is saved while VYNTRO reviews trust signals.",
  });
  assert.deepEqual(held, {
    label: "Reward held",
    tone: "hold",
    message: "Rewards are paused while VYNTRO verifies account quality.",
  });
});
