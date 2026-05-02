import test from "node:test";
import assert from "node:assert/strict";

import { deriveTrustDecisionV3 } from "./trust-engine-v3";
import {
  buildTrustAppealState,
  buildTrustReviewCasePlan,
} from "./trust-review-flow";
import {
  buildSessionVelocitySignal,
  buildSuspiciousClaimPatternSignal,
} from "./trust-signals-v3";

test("review flow opens a high-priority case for reward holds", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 70,
    sybilScore: 10,
    status: "active",
    signals: [
      buildSuspiciousClaimPatternSignal({
        projectId: "project-1",
        authUserId: "user-1",
        claimCount: 12,
        uniqueCampaigns: 8,
        rewardValueCents: 30000,
        accountAgeHours: 4,
        sourceId: "claims-1",
      }),
    ],
  });

  const plan = buildTrustReviewCasePlan({
    projectId: "project-1",
    authUserId: "user-1",
    walletAddress: "0xabc",
    decision,
  });

  assert.equal(plan.shouldOpen, true);
  assert.equal(plan.priority, "high");
  assert.equal(plan.caseType, "reward_hold_review");
  assert.equal(plan.slaLabel, "Review within 24 hours");
  assert.equal(typeof plan.dedupeKey, "string");
  assert.match(plan.dedupeKey ?? "", /^trust_review:project-1:user-1:reward_hold:/);
});

test("review flow does not open cases for watch states", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 80,
    sybilScore: 8,
    status: "active",
    signals: [],
  });

  const plan = buildTrustReviewCasePlan({
    projectId: "project-1",
    authUserId: "user-1",
    walletAddress: null,
    decision,
  });

  assert.equal(plan.shouldOpen, false);
  assert.equal(plan.caseType, "not_needed");
  assert.equal(plan.priority, "low");
});

test("appeals are available for review states and disabled for clear states", () => {
  const reviewDecision = deriveTrustDecisionV3({
    trustScore: 50,
    sybilScore: 15,
    status: "active",
    signals: [
      buildSessionVelocitySignal({
        projectId: "project-1",
        authUserId: "user-1",
        windowMinutes: 20,
        accountCount: 5,
        claimAttempts: 18,
        sourceId: "velocity-1",
      }),
    ],
  });
  const clearDecision = deriveTrustDecisionV3({
    trustScore: 90,
    sybilScore: 0,
    status: "active",
    signals: [],
  });

  assert.equal(buildTrustAppealState({ decision: reviewDecision }).canAppeal, true);
  assert.equal(buildTrustAppealState({ decision: clearDecision }).canAppeal, false);
});

test("banned users receive manual support copy instead of normal appeal copy", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 99,
    sybilScore: 0,
    status: "banned",
    signals: [],
  });

  const appeal = buildTrustAppealState({ decision });

  assert.equal(appeal.canAppeal, false);
  assert.equal(appeal.state, "manual_support_only");
  assert.match(appeal.message, /manual/i);
});
