import type { LiveCampaign, LiveQuest, LiveReward } from "@/types/live";

export type MissionCockpitStepState = "complete" | "active" | "waiting";
export type MissionCockpitCtaState = "ready" | "blocked" | "proof" | "complete" | "unavailable";

export type MissionCockpitStep = {
  label: string;
  detail: string;
  state: MissionCockpitStepState;
};

export type MissionCockpitPayoff = {
  xp: number;
  projectPoints: number;
  shards: number;
  rewardCount: number;
  campaignTitle: string | null;
};

export type MissionCockpit = {
  headline: string;
  primaryCtaLabel: string;
  primaryCtaState: MissionCockpitCtaState;
  routeLabel: string;
  payoff: MissionCockpitPayoff;
  steps: MissionCockpitStep[];
  nextQuest: LiveQuest | null;
};

export function buildMissionCockpit(input: {
  currentQuest: LiveQuest;
  allQuests: LiveQuest[];
  linkedRewards: LiveReward[];
  linkedCampaign: LiveCampaign | null;
  accountReadyState: string;
  requiredAccount: string | null;
  providerAccountConnected: boolean;
  derivedActionUrl: string;
  usesIntegrationVerification: boolean;
}): MissionCockpit {
  const { currentQuest } = input;
  const complete = currentQuest.status === "approved";
  const missingAccount = Boolean(input.requiredAccount && !input.providerAccountConnected);
  const hasDestination = input.derivedActionUrl.trim().length > 0;
  const needsManualProof = !input.usesIntegrationVerification && currentQuest.proofRequired && currentQuest.proofType !== "none";
  const routeLabel = resolveRouteLabel(currentQuest, input.usesIntegrationVerification);

  return {
    headline: buildMissionHeadline({
      quest: currentQuest,
      requiredAccount: input.requiredAccount,
      missingAccount,
      routeLabel,
      complete,
    }),
    primaryCtaLabel: buildPrimaryCtaLabel({
      quest: currentQuest,
      requiredAccount: input.requiredAccount,
      missingAccount,
      hasDestination,
      complete,
      needsManualProof,
      usesIntegrationVerification: input.usesIntegrationVerification,
    }),
    primaryCtaState: buildPrimaryCtaState({
      complete,
      missingAccount,
      hasDestination,
      needsManualProof,
      usesIntegrationVerification: input.usesIntegrationVerification,
    }),
    routeLabel,
    payoff: {
      xp: Math.max(0, currentQuest.xp),
      projectPoints: Math.max(0, currentQuest.projectPoints),
      shards: Math.max(0, Math.floor(Number(currentQuest.shardRewardAmount ?? 0))),
      rewardCount: input.linkedRewards.length,
      campaignTitle: input.linkedCampaign?.title ?? null,
    },
    steps: buildMissionSteps({
      currentQuest,
      accountReadyState: input.accountReadyState,
      requiredAccount: input.requiredAccount,
      providerAccountConnected: input.providerAccountConnected,
      hasDestination,
      usesIntegrationVerification: input.usesIntegrationVerification,
      needsManualProof,
      complete,
    }),
    nextQuest: resolveNextQuest(currentQuest, input.allQuests),
  };
}

function buildMissionHeadline(input: {
  quest: LiveQuest;
  requiredAccount: string | null;
  missingAccount: boolean;
  routeLabel: string;
  complete: boolean;
}) {
  if (input.complete) {
    return "Mission complete. Pick the next quest from this route.";
  }

  if (input.missingAccount && input.requiredAccount) {
    return `${formatAccount(input.requiredAccount)} is the blocker before this mission can verify.`;
  }

  if ((input.quest.shardRewardAmount ?? 0) > 0) {
    return `Earn XP and ${Math.floor(Number(input.quest.shardRewardAmount))} shards through this ${input.routeLabel.toLowerCase()} route.`;
  }

  return `Complete this ${input.routeLabel.toLowerCase()} route and keep your quest chain moving.`;
}

function buildPrimaryCtaLabel(input: {
  quest: LiveQuest;
  requiredAccount: string | null;
  missingAccount: boolean;
  hasDestination: boolean;
  complete: boolean;
  needsManualProof: boolean;
  usesIntegrationVerification: boolean;
}) {
  if (input.complete) return "Mission complete";
  if (input.missingAccount && input.requiredAccount) return `Link ${formatAccount(input.requiredAccount)} first`;
  if (input.needsManualProof) return "Submit proof";
  if (!input.hasDestination && input.usesIntegrationVerification) return "Destination missing";
  return input.quest.actionLabel ?? "Start mission";
}

function buildPrimaryCtaState(input: {
  complete: boolean;
  missingAccount: boolean;
  hasDestination: boolean;
  needsManualProof: boolean;
  usesIntegrationVerification: boolean;
}): MissionCockpitCtaState {
  if (input.complete) return "complete";
  if (input.missingAccount) return "blocked";
  if (input.needsManualProof) return "proof";
  if (!input.hasDestination && input.usesIntegrationVerification) return "unavailable";
  return "ready";
}

function buildMissionSteps(input: {
  currentQuest: LiveQuest;
  accountReadyState: string;
  requiredAccount: string | null;
  providerAccountConnected: boolean;
  hasDestination: boolean;
  usesIntegrationVerification: boolean;
  needsManualProof: boolean;
  complete: boolean;
}): MissionCockpitStep[] {
  if (input.complete) {
    return [
      { label: "Account", detail: "Required account state is settled.", state: "complete" },
      { label: "Action", detail: "Mission action has been completed.", state: "complete" },
      { label: "Reward", detail: "Completion is locked into your progress.", state: "complete" },
    ];
  }

  const accountStep: MissionCockpitStep = {
    label: input.requiredAccount ? `${formatAccount(input.requiredAccount)} account` : "Account gate",
    detail: input.requiredAccount
      ? `${formatAccount(input.requiredAccount)} readiness is ${input.accountReadyState.toLowerCase()}.`
      : "No external account gate is required for this mission.",
    state: input.requiredAccount && !input.providerAccountConnected ? "active" : "complete",
  };

  const actionStep: MissionCockpitStep = {
    label: "Mission action",
    detail: input.hasDestination
      ? "Open the destination and complete the requested action."
      : "This mission does not have a live destination configured yet.",
    state: accountStep.state === "complete" ? "active" : "waiting",
  };

  const verificationStep: MissionCockpitStep = {
    label: input.usesIntegrationVerification ? "Auto verification" : "Proof review",
    detail: input.usesIntegrationVerification
      ? "VYNTRO checks the provider route after the action starts."
      : input.needsManualProof
        ? `Submit ${input.currentQuest.proofType} proof so review can begin.`
        : "Transmit completion after the action is done.",
    state: actionStep.state === "active" && !input.usesIntegrationVerification ? "active" : "waiting",
  };

  return [accountStep, actionStep, verificationStep];
}

function resolveNextQuest(currentQuest: LiveQuest, allQuests: LiveQuest[]) {
  const candidates = allQuests
    .filter((quest) => quest.id !== currentQuest.id && quest.status !== "approved")
    .sort((left, right) => {
      const sameCampaignDelta =
        Number(right.campaignId === currentQuest.campaignId) -
        Number(left.campaignId === currentQuest.campaignId);

      return (
        sameCampaignDelta ||
        Number(right.isPlatformQuest) - Number(left.isPlatformQuest) ||
        Math.max(0, right.shardRewardAmount ?? 0) - Math.max(0, left.shardRewardAmount ?? 0) ||
        right.xp - left.xp ||
        left.title.localeCompare(right.title)
      );
    });

  return candidates[0] ?? null;
}

function resolveRouteLabel(quest: LiveQuest, usesIntegrationVerification: boolean) {
  if (/swap|vault|stake|onchain|wallet|defi|market|portfolio/.test(toSearchText(quest))) {
    return "DeFi";
  }

  if (/discord|telegram|social|follow|invite|community|x-follow/.test(toSearchText(quest))) {
    return "Social";
  }

  if ((quest.shardRewardAmount ?? 0) > 0 || /lootbox|shard|reward/.test(toSearchText(quest))) {
    return "Shard";
  }

  return usesIntegrationVerification ? "Verified" : "Manual";
}

function toSearchText(quest: LiveQuest) {
  return [
    quest.title,
    quest.description,
    quest.type,
    quest.questType,
    quest.verificationProvider,
    quest.verificationType,
    quest.actionUrl,
  ]
    .join(" ")
    .toLowerCase();
}

function formatAccount(value: string) {
  if (value === "x") return "X";
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
