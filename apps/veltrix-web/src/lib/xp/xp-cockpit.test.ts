import test from "node:test";
import assert from "node:assert/strict";

import { buildXpCockpitRead } from "./xp-cockpit";

const baseInput = {
  walletReady: true,
  totalXp: 1400,
  activeXp: 1250,
  level: 3,
  streak: 3,
  trustScore: 65,
  sybilScore: 12,
  contributionTier: "explorer",
  questsCompleted: 5,
  raidsCompleted: 2,
  rewardsClaimed: 1,
  openQuestCount: 8,
  pendingQuestCount: 1,
  approvedQuestCount: 5,
  liveRaidCount: 3,
  claimableRewardCount: 2,
  claimableDefiXp: 550,
  claimedDefiXp: 300,
  completedDefiXp: 850,
  defiStatus: "ready",
  nextDefiAction: "Claim 550 XP before adding new DeFi actions",
};

test("xp cockpit prioritizes claimable defi xp and central source lanes", () => {
  const read = buildXpCockpitRead(baseInput);

  assert.equal(read.status, "claim-ready");
  assert.match(read.headline, /claimable/i);
  assert.match(read.nextAction, /claim 550 xp/i);
  assert.equal(read.levelRead.totalXp, 1400);
  assert.equal(read.levelRead.levelLabel, "Level 3");
  assert.equal(read.sourceLanes.find((lane) => lane.key === "quests")?.value, "5 approved");
  assert.equal(read.sourceLanes.find((lane) => lane.key === "raids")?.value, "2 cleared");
  assert.equal(read.sourceLanes.find((lane) => lane.key === "defi")?.value, "550 XP");
  assert.equal(read.sourceLanes.find((lane) => lane.key === "streak")?.value, "3 days");
  assert.equal(read.guardrails.some((guardrail) => /borrow volume/i.test(guardrail.copy)), true);
});

test("xp cockpit blocks growth recommendations when wallet or trust posture is not ready", () => {
  const walletRead = buildXpCockpitRead({
    ...baseInput,
    walletReady: false,
    claimableDefiXp: 0,
    completedDefiXp: 0,
  });
  const reviewRead = buildXpCockpitRead({
    ...baseInput,
    sybilScore: 92,
    claimableDefiXp: 0,
  });

  assert.equal(walletRead.status, "wallet-needed");
  assert.match(walletRead.nextAction, /connect wallet/i);
  assert.equal(reviewRead.status, "review-watch");
  assert.match(reviewRead.nextAction, /review/i);
  assert.equal(reviewRead.guardrails.find((guardrail) => guardrail.key === "sybil")?.tone, "warning");
});

test("xp cockpit recommends the next earning route when no claims are waiting", () => {
  const read = buildXpCockpitRead({
    ...baseInput,
    claimableDefiXp: 0,
    pendingQuestCount: 0,
    nextDefiAction: "Complete the next eligible DeFi mission",
  });

  assert.equal(read.status, "growth-ready");
  assert.match(read.nextAction, /quest|raid|defi/i);
  assert.equal(read.metrics.claimableXp, 2);
  assert.equal(read.metrics.earnedDefiXp, 850);
});
