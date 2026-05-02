import test from "node:test";
import assert from "node:assert/strict";

import { deriveTrustDecisionV3 } from "./trust-engine-v3";
import {
  buildSessionVelocitySignal,
  buildSuspiciousClaimPatternSignal,
  buildWalletGraphSignal,
} from "./trust-signals-v3";

test("trust v3 escalates high reward pressure to a review-first reward hold", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 68,
    sybilScore: 14,
    status: "active",
    signals: [
      buildWalletGraphSignal({
        projectId: "project-1",
        authUserId: "user-1",
        walletAddress: "0xabc",
        relatedWalletCount: 10,
        highConfidenceEdgeCount: 5,
        sharedFundingEdgeCount: 3,
        rewardPressure: "high",
        sourceId: "graph-1",
        relatedWalletAddresses: ["0xprivate"],
      }),
      buildSuspiciousClaimPatternSignal({
        projectId: "project-1",
        authUserId: "user-1",
        claimCount: 10,
        uniqueCampaigns: 6,
        rewardValueCents: 25000,
        accountAgeHours: 6,
        sourceId: "claims-1",
      }),
    ],
  });

  assert.equal(decision.status, "reward_hold");
  assert.equal(decision.riskLevel, "high");
  assert.equal(decision.recommendedAction, "reward_hold");
  assert.equal(decision.enforcement.canEarnXp, false);
  assert.equal(decision.enforcement.canClaimRewards, false);
  assert.equal(decision.enforcement.canUseAdvancedDefi, false);
  assert.equal(decision.enforcement.appealAvailable, true);
  assert.equal(decision.projectSummary.visibleRiskCategories.includes("wallet_graph"), true);
  assert.equal(JSON.stringify(decision.projectSummary).includes("0xprivate"), false);
});

test("trust v3 uses watch for low signal pressure without blocking participation", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 78,
    sybilScore: 12,
    status: "active",
    signals: [
      buildSessionVelocitySignal({
        projectId: "project-1",
        authUserId: "user-1",
        windowMinutes: 60,
        accountCount: 2,
        claimAttempts: 4,
        sourceId: "session-low-1",
      }),
    ],
  });

  assert.equal(decision.status, "watch");
  assert.equal(decision.riskLevel, "low");
  assert.equal(decision.recommendedAction, "watch");
  assert.equal(decision.enforcement.canEarnXp, true);
  assert.equal(decision.enforcement.canClaimRewards, true);
  assert.equal(decision.enforcement.appealAvailable, false);
});

test("trust v3 does not auto-ban on critical signals without a manual status", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 55,
    sybilScore: 20,
    status: "active",
    signals: [
      buildSessionVelocitySignal({
        projectId: "project-1",
        authUserId: "user-1",
        windowMinutes: 10,
        accountCount: 12,
        claimAttempts: 60,
        sourceId: "session-critical-1",
      }),
    ],
  });

  assert.equal(decision.status, "xp_suspended");
  assert.equal(decision.recommendedAction, "xp_suspended");
  assert.equal(decision.hardBlocked, true);
  assert.equal(decision.reasonCodes.includes("v3_signal:session_velocity:critical"), true);
});

test("trust v3 never downgrades terminal v2 statuses", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 95,
    sybilScore: 0,
    status: "suspended",
    signals: [],
  });

  assert.equal(decision.status, "suspended");
  assert.equal(decision.recommendedAction, "suspend");
  assert.equal(decision.enforcement.canEarnXp, false);
  assert.equal(decision.enforcement.canClaimRewards, false);
  assert.deepEqual(decision.reasonCodes, ["terminal_status:suspended"]);
});
