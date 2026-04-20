import type {
  LiveCommunityJourneyAction,
  LiveCommunityMissionLaneItem,
  LiveCommunityRecognitionSnapshot,
} from "@/types/live";

type BuildJourneyRecognitionInput = {
  lane: "onboarding" | "active" | "comeback";
  recognitionLabel: string;
  streakDays: number;
  milestonesUnlockedCount: number;
  nextUnlockLabel: string;
  contributionStatus: string;
  trustScore: number;
};

type BuildJourneyMissionLaneInput = {
  lane: "onboarding" | "active" | "comeback";
  actions: LiveCommunityJourneyAction[];
  projectName: string;
  unreadSignals: number;
  openMissionCount: number;
  claimableRewards: number;
  walletVerified: boolean;
  linkedProvidersCount: number;
  joinedProjectsCount: number;
};

type BuildJourneyReadinessLabelInput = {
  lane: "onboarding" | "active" | "comeback";
  walletVerified: boolean;
  linkedProvidersCount: number;
  joinedProjectsCount: number;
  unreadSignals: number;
  openMissionCount: number;
  claimableRewards: number;
};

export function buildJourneyPreferredRoute(input: {
  lane: "onboarding" | "active" | "comeback";
  nextBestAction: LiveCommunityJourneyAction | null;
}) {
  if (input.nextBestAction?.route) {
    return input.nextBestAction.route;
  }

  if (input.lane === "onboarding") {
    return "/community/onboarding";
  }

  if (input.lane === "comeback") {
    return "/community/comeback";
  }

  return "/community";
}

export function buildJourneyReadinessLabel(input: BuildJourneyReadinessLabelInput) {
  if (input.lane === "onboarding") {
    if (!input.walletVerified) {
      return "Wallet trust still pending";
    }

    if (input.linkedProvidersCount < 2) {
      return "Identity loadout still arming";
    }

    if (input.joinedProjectsCount === 0) {
      return "World entry still pending";
    }

    return "Onboarding rail ready for first contribution";
  }

  if (input.lane === "comeback") {
    if (input.unreadSignals > 0) {
      return "Fresh signals are waiting";
    }

    if (input.openMissionCount > 0) {
      return "A comeback mission is live";
    }

    if (input.claimableRewards > 0) {
      return "A claimable unlock can pull you back in";
    }

    return "Comeback rail is standing by";
  }

  if (input.claimableRewards > 0) {
    return "Claimable rewards are live";
  }

  if (input.openMissionCount > 0) {
    return "Your active lane has live pressure";
  }

  return "Your active lane is stable";
}

export function buildJourneyRecognition(
  input: BuildJourneyRecognitionInput
): LiveCommunityRecognitionSnapshot {
  return {
    label: input.recognitionLabel,
    posture:
      input.lane === "onboarding"
        ? "arming"
        : input.lane === "comeback"
          ? "returning"
          : "live",
    streakLabel:
      input.streakDays > 0 ? `${input.streakDays}-day streak` : "Streak not armed",
    milestoneLabel:
      input.milestonesUnlockedCount > 0
        ? `${input.milestonesUnlockedCount} milestones unlocked`
        : "First milestone still ahead",
    contributionLabel: input.contributionStatus,
    nextUnlockLabel: input.nextUnlockLabel,
    trustLabel:
      input.trustScore >= 80
        ? "High trust posture"
        : input.trustScore >= 60
          ? "Trusted and climbing"
          : "Trust still building",
  };
}

function getMissionLaneEyebrow(kind: LiveCommunityMissionLaneItem["kind"]) {
  if (kind === "readiness") {
    return "Readiness";
  }
  if (kind === "reward") {
    return "Reward";
  }
  if (kind === "signal") {
    return "Signals";
  }
  if (kind === "raid") {
    return "Raid";
  }
  return "Mission";
}

function buildMissionLaneEntry(input: {
  action: LiveCommunityJourneyAction;
  kind: LiveCommunityMissionLaneItem["kind"];
  priority: LiveCommunityMissionLaneItem["priority"];
}) {
  return {
    key: input.action.key,
    label: input.action.label,
    eyebrow: getMissionLaneEyebrow(input.kind),
    description: input.action.description,
    route: input.action.route,
    ctaLabel: input.action.ctaLabel,
    priority: input.priority,
    kind: input.kind,
    completed: input.action.completed,
    locked: input.action.locked,
  } satisfies LiveCommunityMissionLaneItem;
}

export function buildJourneyMissionLane(
  input: BuildJourneyMissionLaneInput
): LiveCommunityMissionLaneItem[] {
  const actionMap = new Map(input.actions.map((action) => [action.key, action]));
  const items: LiveCommunityMissionLaneItem[] = [];

  if (input.lane === "onboarding") {
    const providerAction = actionMap.get("providers_ready");
    const walletAction = actionMap.get("wallet_verified");
    const joinAction = actionMap.get("community_joined");
    const missionAction = actionMap.get("first_mission");

    if (providerAction) {
      items.push(
        buildMissionLaneEntry({
          action: providerAction,
          kind: "readiness",
          priority: input.linkedProvidersCount < 2 ? "critical" : "medium",
        })
      );
    }

    if (walletAction) {
      items.push(
        buildMissionLaneEntry({
          action: walletAction,
          kind: "readiness",
          priority: input.walletVerified ? "medium" : "critical",
        })
      );
    }

    if (joinAction) {
      items.push(
        buildMissionLaneEntry({
          action: joinAction,
          kind: "readiness",
          priority: input.joinedProjectsCount > 0 ? "medium" : "high",
        })
      );
    }

    if (missionAction) {
      items.push(
        buildMissionLaneEntry({
          action: missionAction,
          kind: "mission",
          priority: input.joinedProjectsCount > 0 ? "high" : "medium",
        })
      );
    }

    return items.slice(0, 4);
  }

  if (input.lane === "comeback") {
    const signalsAction = actionMap.get("comeback_signal");
    const missionAction = actionMap.get("mission_return");
    const raidAction = actionMap.get("raid_return");
    const rewardAction = actionMap.get("claim_unlock");

    if (signalsAction) {
      items.push(
        buildMissionLaneEntry({
          action: signalsAction,
          kind: "signal",
          priority: input.unreadSignals > 0 ? "critical" : "high",
        })
      );
    }

    if (missionAction) {
      items.push(
        buildMissionLaneEntry({
          action: missionAction,
          kind: "mission",
          priority: input.openMissionCount > 0 ? "high" : "medium",
        })
      );
    }

    if (raidAction) {
      items.push(
        buildMissionLaneEntry({
          action: raidAction,
          kind: "raid",
          priority: "medium",
        })
      );
    }

    if (rewardAction) {
      items.push(
        buildMissionLaneEntry({
          action: rewardAction,
          kind: "reward",
          priority: input.claimableRewards > 0 ? "high" : "medium",
        })
      );
    }

    return items.slice(0, 4);
  }

  const activeMission = actionMap.get("keep_streak_alive");
  const rewardClaim = actionMap.get("claim_unlock");

  if (activeMission) {
    items.push(
      buildMissionLaneEntry({
        action: activeMission,
        kind: "mission",
        priority: input.openMissionCount > 0 ? "critical" : "high",
      })
    );
  }

  if (rewardClaim) {
    items.push(
      buildMissionLaneEntry({
        action: rewardClaim,
        kind: "reward",
        priority: input.claimableRewards > 0 ? "high" : "medium",
      })
    );
  }

  if (input.unreadSignals > 0) {
    items.push({
      key: "active_signal_pressure",
      label: `Read live signals for ${input.projectName}`,
      eyebrow: getMissionLaneEyebrow("signal"),
      description:
        "Unread community signals often hide the next raid, reward or mission push that should shape your lane.",
      route: "/notifications",
      ctaLabel: "Open signals",
      priority: "medium",
      kind: "signal",
      completed: false,
      locked: false,
    });
  }

  return items.slice(0, 4);
}
