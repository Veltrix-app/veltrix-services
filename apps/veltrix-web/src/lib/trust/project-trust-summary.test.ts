import test from "node:test";
import assert from "node:assert/strict";

import { deriveTrustDecisionV3 } from "./trust-engine-v3";
import { buildProjectTrustSummary } from "./project-trust-summary";
import {
  buildDuplicateSocialSignal,
  buildSessionVelocitySignal,
  buildWalletGraphSignal,
} from "./trust-signals-v3";

test("project trust summary exposes action and eligibility without raw fraud evidence", () => {
  const signals = [
    buildWalletGraphSignal({
      projectId: "project-1",
      authUserId: "user-1",
      walletAddress: "0xabc",
      relatedWalletCount: 12,
      highConfidenceEdgeCount: 6,
      sharedFundingEdgeCount: 3,
      rewardPressure: "high",
      sourceId: "wallet-1",
      relatedWalletAddresses: ["0xprivate-wallet"],
    }),
    buildDuplicateSocialSignal({
      projectId: "project-1",
      authUserId: "user-1",
      provider: "x",
      linkedAuthUserCount: 5,
      proofReuseCount: 9,
      sourceId: "social-1",
      socialAccountHash: "private-social",
    }),
  ];
  const decision = deriveTrustDecisionV3({
    trustScore: 72,
    sybilScore: 12,
    status: "active",
    signals,
  });

  const summary = buildProjectTrustSummary({ decision, signals });

  assert.equal(summary.status, "reward_hold");
  assert.equal(summary.rewardEligibility, "held");
  assert.equal(summary.xpEligibility, "paused");
  assert.equal(summary.nextAction, "Rewards are held until the trust review clears.");
  assert.deepEqual(summary.visibleRiskCategories.sort(), ["social_abuse", "wallet_graph"]);
  assert.equal(JSON.stringify(summary).includes("0xprivate-wallet"), false);
  assert.equal(JSON.stringify(summary).includes("private-social"), false);
});

test("project trust summary keeps clear users compact", () => {
  const decision = deriveTrustDecisionV3({
    trustScore: 88,
    sybilScore: 4,
    status: "active",
    signals: [],
  });

  const summary = buildProjectTrustSummary({ decision, signals: [] });

  assert.equal(summary.label, "Clear");
  assert.equal(summary.status, "active");
  assert.equal(summary.visibleSignalCount, 0);
  assert.equal(summary.highestSeverity, "none");
  assert.equal(summary.rewardEligibility, "eligible");
  assert.equal(summary.xpEligibility, "eligible");
});

test("project trust summary hides fingerprints on critical velocity signals", () => {
  const signals = [
    buildSessionVelocitySignal({
      projectId: "project-1",
      authUserId: "user-1",
      windowMinutes: 10,
      accountCount: 11,
      claimAttempts: 52,
      sourceId: "velocity-1",
      sessionHash: "private-session",
      ipHash: "private-ip",
      userAgentHash: "private-ua",
    }),
  ];
  const decision = deriveTrustDecisionV3({
    trustScore: 70,
    sybilScore: 10,
    status: "active",
    signals,
  });

  const summary = buildProjectTrustSummary({ decision, signals });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.status, "xp_suspended");
  assert.equal(summary.rewardEligibility, "blocked");
  assert.equal(summary.xpEligibility, "blocked");
  assert.equal(serialized.includes("private-session"), false);
  assert.equal(serialized.includes("private-ip"), false);
  assert.equal(serialized.includes("private-ua"), false);
});
