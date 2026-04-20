import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCommunityCohortSnapshots,
  buildCommunityHealthRollups,
} from "./outcomes.js";

test("buildCommunityCohortSnapshots summarizes newcomer, active, reactivation, high-trust and watchlist lanes", () => {
  const snapshots = buildCommunityCohortSnapshots({
    snapshots: [
      {
        authUserId: "alpha",
        journeyType: "onboarding",
        status: "active",
        linkedProvidersCount: 1,
        walletVerified: false,
        trust: 38,
        openFlagCount: 1,
        claimableRewards: 0,
      },
      {
        authUserId: "beta",
        journeyType: "active",
        status: "active",
        linkedProvidersCount: 3,
        walletVerified: true,
        trust: 88,
        openFlagCount: 0,
        claimableRewards: 2,
      },
      {
        authUserId: "gamma",
        journeyType: "comeback",
        status: "active",
        linkedProvidersCount: 2,
        walletVerified: true,
        trust: 71,
        openFlagCount: 0,
        claimableRewards: 1,
      },
    ],
    computedAt: "2026-04-20T09:00:00.000Z",
  });

  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.cohortKey),
    ["newcomer", "active", "reactivation", "high_trust", "watchlist"]
  );

  const newcomer = snapshots.find((snapshot) => snapshot.cohortKey === "newcomer");
  const active = snapshots.find((snapshot) => snapshot.cohortKey === "active");
  const reactivation = snapshots.find((snapshot) => snapshot.cohortKey === "reactivation");
  const highTrust = snapshots.find((snapshot) => snapshot.cohortKey === "high_trust");
  const watchlist = snapshots.find((snapshot) => snapshot.cohortKey === "watchlist");

  assert.equal(newcomer?.memberCount, 1);
  assert.equal(newcomer?.readyCount, 0);
  assert.equal(newcomer?.blockedCount, 1);

  assert.equal(active?.memberCount, 1);
  assert.equal(active?.readyCount, 1);
  assert.equal(active?.activeCount, 1);

  assert.equal(reactivation?.memberCount, 1);
  assert.equal(reactivation?.readyCount, 1);

  assert.equal(highTrust?.memberCount, 1);
  assert.equal(highTrust?.readyCount, 1);

  assert.equal(watchlist?.memberCount, 1);
  assert.equal(watchlist?.blockedCount, 1);
});

test("buildCommunityHealthRollups turns cohort and outcome pressure into owner-facing health signals", () => {
  const rollups = buildCommunityHealthRollups({
    computedAt: "2026-04-20T09:00:00.000Z",
    cohortSnapshots: [
      {
        cohortKey: "newcomer",
        memberCount: 12,
        readyCount: 4,
        blockedCount: 5,
        activeCount: 9,
        averageTrust: 54,
        computedAt: "2026-04-20T09:00:00.000Z",
      },
      {
        cohortKey: "active",
        memberCount: 18,
        readyCount: 14,
        blockedCount: 1,
        activeCount: 16,
        averageTrust: 77,
        computedAt: "2026-04-20T09:00:00.000Z",
      },
      {
        cohortKey: "reactivation",
        memberCount: 8,
        readyCount: 3,
        blockedCount: 2,
        activeCount: 5,
        averageTrust: 63,
        computedAt: "2026-04-20T09:00:00.000Z",
      },
      {
        cohortKey: "high_trust",
        memberCount: 6,
        readyCount: 6,
        blockedCount: 0,
        activeCount: 6,
        averageTrust: 89,
        computedAt: "2026-04-20T09:00:00.000Z",
      },
      {
        cohortKey: "watchlist",
        memberCount: 5,
        readyCount: 0,
        blockedCount: 5,
        activeCount: 2,
        averageTrust: 34,
        computedAt: "2026-04-20T09:00:00.000Z",
      },
    ],
    journeyOutcomes: {
      onboardingCompletionRate: 42,
      comebackCompletionRate: 38,
      activationCompletionRate: 68,
      retentionCompletionRate: 61,
    },
    captain: {
      blockedQueueCount: 2,
      escalatedQueueCount: 1,
    },
    automation: {
      recentRunCount: 7,
      recentFailureCount: 2,
    },
    reward: {
      claimableReadyMembers: 5,
      totalReadyMembers: 23,
    },
  });

  assert.equal(rollups.length, 5);
  assert.equal(rollups[0]?.signalKey, "participation_posture");
  assert.equal(rollups[0]?.signalTone, "warning");

  assert.equal(rollups[1]?.signalKey, "conversion_posture");
  assert.equal(rollups[1]?.signalTone, "warning");

  const reward = rollups.find((rollup) => rollup.signalKey === "reward_quality");
  assert.equal(reward?.signalTone, "success");
  assert.match(reward?.summary ?? "", /claimable/i);
});
