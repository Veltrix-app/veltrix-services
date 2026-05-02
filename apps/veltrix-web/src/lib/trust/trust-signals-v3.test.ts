import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDuplicateSocialSignal,
  buildSessionVelocitySignal,
  buildSuspiciousClaimPatternSignal,
  buildWalletGraphSignal,
  sanitizeProjectTrustEvidence,
} from "./trust-signals-v3";

test("wallet graph signal holds rewards when a cluster creates payout pressure", () => {
  const signal = buildWalletGraphSignal({
    projectId: "project-1",
    authUserId: "user-1",
    walletAddress: "0xABCDEF",
    relatedWalletCount: 11,
    highConfidenceEdgeCount: 6,
    sharedFundingEdgeCount: 4,
    rewardPressure: "high",
    sourceId: "graph-scan-1",
    relatedWalletAddresses: ["0xprivate-one", "0xprivate-two"],
  });

  assert.equal(signal.riskCategory, "wallet_graph");
  assert.equal(signal.severity, "high");
  assert.equal(signal.recommendedAction, "reward_hold");
  assert.equal(signal.scoreDelta, -24);
  assert.match(signal.dedupeKey, /^wallet_graph:project-1:user-1:0xabcdef:/);
  assert.equal(signal.evidence.relatedWalletCount, 11);
  assert.equal(signal.privateEvidence.relatedWalletAddresses?.length, 2);
});

test("session velocity signal can suspend XP without exposing fingerprints", () => {
  const signal = buildSessionVelocitySignal({
    projectId: "project-1",
    authUserId: "user-1",
    windowMinutes: 15,
    accountCount: 9,
    claimAttempts: 42,
    sourceId: "session-window-1",
    sessionHash: "session-secret",
    ipHash: "ip-secret",
    userAgentHash: "ua-secret",
  });

  assert.equal(signal.riskCategory, "session_velocity");
  assert.equal(signal.severity, "critical");
  assert.equal(signal.recommendedAction, "xp_suspended");
  assert.equal(signal.evidence.windowMinutes, 15);

  const projectEvidence = sanitizeProjectTrustEvidence(signal);
  const serialized = JSON.stringify(projectEvidence);
  assert.equal(serialized.includes("session-secret"), false);
  assert.equal(serialized.includes("ip-secret"), false);
  assert.equal(serialized.includes("ua-secret"), false);
  assert.equal(projectEvidence.visibleEvidence.accountCount, 9);
});

test("duplicate social signal escalates reused proof without leaking social identifiers", () => {
  const signal = buildDuplicateSocialSignal({
    projectId: "project-1",
    authUserId: "user-1",
    provider: "x",
    linkedAuthUserCount: 4,
    proofReuseCount: 8,
    sourceId: "social-x-1",
    socialAccountHash: "raw-social-secret",
  });

  assert.equal(signal.riskCategory, "social_abuse");
  assert.equal(signal.severity, "high");
  assert.equal(signal.recommendedAction, "reward_hold");

  const projectEvidence = sanitizeProjectTrustEvidence(signal);
  assert.equal(projectEvidence.visibleEvidence.provider, "x");
  assert.equal(JSON.stringify(projectEvidence).includes("raw-social-secret"), false);
});

test("suspicious claim pattern uses reward hold before hard blocking", () => {
  const signal = buildSuspiciousClaimPatternSignal({
    projectId: "project-1",
    authUserId: "user-1",
    claimCount: 14,
    uniqueCampaigns: 9,
    rewardValueCents: 45000,
    accountAgeHours: 3,
    sourceId: "claim-rollup-1",
  });

  assert.equal(signal.riskCategory, "reward_abuse");
  assert.equal(signal.severity, "high");
  assert.equal(signal.recommendedAction, "reward_hold");
  assert.equal(signal.evidence.accountAgeBand, "new");
});
