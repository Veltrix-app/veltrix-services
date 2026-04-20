import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJourneyMissionLane,
  buildJourneyPreferredRoute,
  buildJourneyReadinessLabel,
  buildJourneyRecognition,
} from "./journey-read-model";

test("buildJourneyMissionLane prioritizes onboarding readiness before first mission pressure", () => {
  const missionLane = buildJourneyMissionLane({
    lane: "onboarding",
    projectName: "Chainwars",
    unreadSignals: 0,
    openMissionCount: 1,
    claimableRewards: 0,
    walletVerified: false,
    linkedProvidersCount: 1,
    joinedProjectsCount: 0,
    actions: [
      {
        key: "providers_ready",
        label: "Link your provider rail",
        description: "Link Discord or Telegram.",
        route: "/profile",
        ctaLabel: "Open loadout",
        tone: "warning",
        completed: false,
        locked: false,
      },
      {
        key: "wallet_verified",
        label: "Verify your wallet",
        description: "Wallet trust is still pending.",
        route: "/profile",
        ctaLabel: "Verify wallet",
        tone: "warning",
        completed: false,
        locked: false,
      },
      {
        key: "community_joined",
        label: "Join Chainwars",
        description: "Enter the world.",
        route: "/communities/project_1",
        ctaLabel: "Open community",
        tone: "default",
        completed: false,
        locked: false,
      },
      {
        key: "first_mission",
        label: "Complete your first mission",
        description: "Open your first mission.",
        route: "/quests/quest_1",
        ctaLabel: "Open first mission",
        tone: "default",
        completed: false,
        locked: true,
      },
    ],
  });

  assert.equal(missionLane[0]?.key, "providers_ready");
  assert.equal(missionLane[0]?.priority, "critical");
  assert.equal(missionLane[1]?.key, "wallet_verified");
  assert.equal(missionLane[1]?.priority, "critical");
  assert.equal(missionLane[3]?.key, "first_mission");
  assert.equal(missionLane[3]?.locked, true);
});

test("journey helpers shape active member read models around rewards, signals and recognition", () => {
  const recognition = buildJourneyRecognition({
    lane: "active",
    recognitionLabel: "Chainwars Elite",
    streakDays: 7,
    milestonesUnlockedCount: 3,
    nextUnlockLabel: "Claim your next pool unlock.",
    contributionStatus: "You are live in the active lane.",
    trustScore: 82,
  });
  const readinessLabel = buildJourneyReadinessLabel({
    lane: "active",
    walletVerified: true,
    linkedProvidersCount: 3,
    joinedProjectsCount: 2,
    unreadSignals: 4,
    openMissionCount: 2,
    claimableRewards: 1,
  });
  const preferredRoute = buildJourneyPreferredRoute({
    lane: "active",
    nextBestAction: {
      key: "keep_streak_alive",
      label: "Keep your streak alive",
      description: "Run the next mission.",
      route: "/quests/quest_77",
      ctaLabel: "Open mission",
      tone: "default",
      completed: false,
      locked: false,
    },
  });
  const missionLane = buildJourneyMissionLane({
    lane: "active",
    projectName: "Chainwars",
    unreadSignals: 4,
    openMissionCount: 2,
    claimableRewards: 1,
    walletVerified: true,
    linkedProvidersCount: 3,
    joinedProjectsCount: 2,
    actions: [
      {
        key: "keep_streak_alive",
        label: "Keep your community streak alive",
        description: "Run the live mission.",
        route: "/quests/quest_77",
        ctaLabel: "Open mission",
        tone: "default",
        completed: false,
        locked: false,
      },
      {
        key: "claim_unlock",
        label: "Claim your community unlock",
        description: "A reward is claimable.",
        route: "/rewards",
        ctaLabel: "Open rewards",
        tone: "positive",
        completed: false,
        locked: false,
      },
    ],
  });

  assert.equal(recognition.posture, "live");
  assert.equal(recognition.trustLabel, "High trust posture");
  assert.equal(readinessLabel, "Claimable rewards are live");
  assert.equal(preferredRoute, "/quests/quest_77");
  assert.equal(missionLane[0]?.key, "keep_streak_alive");
  assert.equal(missionLane[0]?.priority, "critical");
  assert.equal(missionLane[1]?.key, "claim_unlock");
  assert.equal(missionLane[2]?.key, "active_signal_pressure");
});
