import test from "node:test";
import assert from "node:assert/strict";

import { deriveTrustRiskPatch } from "./risk-score.js";

test("deriveTrustRiskPatch moves medium signal clusters into review without hard banning", () => {
  const patch = deriveTrustRiskPatch({
    currentTrustScore: 62,
    currentSybilScore: 45,
    currentStatus: "active",
    signals: [
      {
        flagType: "fresh_wallet_activity",
        severity: "medium",
        reason: "Fresh wallet activity.",
      },
      {
        flagType: "no_social_proof",
        severity: "medium",
        reason: "No linked social proof.",
      },
    ],
  });

  assert.equal(patch.trustScore, 44);
  assert.equal(patch.sybilScore, 75);
  assert.equal(patch.status, "review_required");
  assert.equal(patch.reviewRequired, true);
  assert.equal(patch.hardBlocked, false);
});

test("deriveTrustRiskPatch hard suspends high severity farming signals", () => {
  const patch = deriveTrustRiskPatch({
    currentTrustScore: 50,
    currentSybilScore: 70,
    currentStatus: "watch",
    signals: [
      {
        flagType: "low_value_transfer_spam",
        severity: "high",
        reason: "Repeated low-value transfer activity crossed the anti-abuse threshold.",
      },
    ],
  });

  assert.equal(patch.trustScore, 28);
  assert.equal(patch.sybilScore, 100);
  assert.equal(patch.status, "xp_suspended");
  assert.equal(patch.reviewRequired, true);
  assert.equal(patch.hardBlocked, true);
});

test("deriveTrustRiskPatch treats critical signals as immediate XP suspension pressure", () => {
  const patch = deriveTrustRiskPatch({
    currentTrustScore: 60,
    currentSybilScore: 20,
    currentStatus: "active",
    signals: [
      {
        flagType: "reward_trust_risk",
        severity: "critical",
        reason: "Confirmed reward farming ring.",
      },
    ],
  });

  assert.equal(patch.sybilScore, 90);
  assert.equal(patch.trustScore, 30);
  assert.equal(patch.status, "xp_suspended");
  assert.equal(patch.riskLevel, "critical");
  assert.equal(patch.recommendedAction, "xp_suspended");
  assert.equal(patch.metadata.criticalSeverityCount, 1);
});

test("deriveTrustRiskPatch escalates very low trust into review pressure", () => {
  const patch = deriveTrustRiskPatch({
    currentTrustScore: 24,
    currentSybilScore: 10,
    currentStatus: "active",
    signals: [],
  });

  assert.equal(patch.status, "review_required");
  assert.equal(patch.reviewRequired, true);
  assert.equal(patch.reasonCodes.includes("trust_review_threshold"), true);
});

test("deriveTrustRiskPatch never downgrades terminal enforcement statuses", () => {
  const patch = deriveTrustRiskPatch({
    currentTrustScore: 20,
    currentSybilScore: 95,
    currentStatus: "banned",
    signals: [
      {
        flagType: "watch_trust_posture",
        severity: "low",
        reason: "Watch trust posture.",
      },
    ],
  });

  assert.equal(patch.status, "banned");
  assert.equal(patch.hardBlocked, true);
});
