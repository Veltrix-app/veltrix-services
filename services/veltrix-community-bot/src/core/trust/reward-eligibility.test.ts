import test from "node:test";
import assert from "node:assert/strict";

import { buildRewardDistributionTrustPatch } from "./reward-eligibility.js";

test("reward eligibility keeps active and watch users claimable", () => {
  const active = buildRewardDistributionTrustPatch({
    trustScore: 55,
    sybilScore: 10,
    status: "active",
  });
  const watch = buildRewardDistributionTrustPatch({
    trustScore: 34,
    sybilScore: 52,
    status: "active",
  });

  assert.equal(active.status, "claimable");
  assert.equal(active.metadata.trustDecision.status, "active");
  assert.equal(watch.status, "claimable");
  assert.equal(watch.metadata.trustDecision.status, "watch");
});

test("reward eligibility holds review and reward-hold accounts", () => {
  const review = buildRewardDistributionTrustPatch({
    trustScore: 30,
    sybilScore: 72,
    status: "active",
  });
  const hold = buildRewardDistributionTrustPatch({
    trustScore: 18,
    sybilScore: 84,
    status: "active",
  });

  assert.equal(review.status, "held_for_review");
  assert.equal(review.metadata.trustDecision.recommendedAction, "review_required");
  assert.equal(hold.status, "held_for_review");
  assert.equal(hold.metadata.trustDecision.recommendedAction, "reward_hold");
});

test("reward eligibility blocks suspended and banned accounts", () => {
  for (const status of ["xp_suspended", "suspended", "banned"]) {
    const patch = buildRewardDistributionTrustPatch({
      trustScore: 90,
      sybilScore: 0,
      status,
    });

    assert.equal(patch.status, "blocked", status);
    assert.equal(patch.metadata.trustDecision.hardBlocked, true, status);
  }
});
