import {
  deriveTrustDecision,
  isRewardHeldByTrust,
  isXpBlockedByTrust,
  type TrustDecision,
  type TrustEngineStatus,
  type TrustRecommendedAction,
  type TrustRiskLevel,
} from "./trust-engine";
import {
  buildProjectTrustSummary,
  deriveTrustNextSafeAction,
  type TrustV3ProjectSummary,
} from "./project-trust-summary";
import {
  recommendedActionRank,
  severityRank,
  type TrustV3Severity,
  type TrustV3Signal,
} from "./trust-signals-v3";

export type TrustV3Enforcement = {
  canEarnXp: boolean;
  canClaimRewards: boolean;
  canUseAdvancedDefi: boolean;
  appealAvailable: boolean;
  nextSafeAction: string;
};

export type TrustDecisionV3 = TrustDecision & {
  signalCount: number;
  highestSignalSeverity: TrustV3Severity | "none";
  signalSeverityCounts: Record<TrustV3Severity, number>;
  enforcement: TrustV3Enforcement;
  projectSummary: TrustV3ProjectSummary;
  privateEvidenceRefs: string[];
};

const TERMINAL_STATUSES = new Set<TrustEngineStatus>([
  "reward_hold",
  "xp_suspended",
  "suspended",
  "banned",
]);

export function deriveTrustDecisionV3(input: {
  trustScore?: unknown;
  sybilScore?: unknown;
  status?: unknown;
  signals?: TrustV3Signal[];
}): TrustDecisionV3 {
  const baseDecision = deriveTrustDecision({
    trustScore: input.trustScore,
    sybilScore: input.sybilScore,
    status: input.status,
  });
  const signals = input.signals ?? [];

  if (TERMINAL_STATUSES.has(baseDecision.status)) {
    return enrichDecision(baseDecision, signals);
  }

  const strongestSignalAction = getStrongestSignalAction(signals);
  if (!strongestSignalAction || recommendedActionRank(strongestSignalAction) <= recommendedActionRank(baseDecision.recommendedAction)) {
    return enrichDecision(baseDecision, signals);
  }

  return enrichDecision(
    buildDecisionFromAction({
      trustScore: baseDecision.trustScore,
      sybilScore: baseDecision.sybilScore,
      action: strongestSignalAction,
      reasonCodes: [
        ...baseDecision.reasonCodes.filter((reasonCode) => reasonCode !== "clear"),
        ...buildSignalReasonCodes(signals),
      ],
    }),
    signals
  );
}

function enrichDecision(decision: TrustDecision, signals: TrustV3Signal[]): TrustDecisionV3 {
  const signalSeverityCounts = countSeverities(signals);
  const highestSignalSeverity = getHighestSignalSeverity(signals);
  const enforcement = buildEnforcement(decision);

  return {
    ...decision,
    signalCount: signals.length,
    highestSignalSeverity,
    signalSeverityCounts,
    enforcement,
    projectSummary: buildProjectTrustSummary({ decision, signals }),
    privateEvidenceRefs: buildPrivateEvidenceRefs(signals),
  };
}

function buildDecisionFromAction(input: {
  trustScore: number;
  sybilScore: number;
  action: TrustRecommendedAction;
  reasonCodes: string[];
}): TrustDecision {
  const status = statusForAction(input.action);
  const riskLevel = riskLevelForStatus(status);
  const reviewRequired = ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
    status
  );
  const rewardHoldRequired = ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
    status
  );

  return {
    trustScore: input.trustScore,
    sybilScore: input.sybilScore,
    status,
    riskLevel,
    recommendedAction: input.action,
    reviewRequired,
    rewardHoldRequired,
    hardBlocked: ["xp_suspended", "suspended", "banned"].includes(status),
    reasonCodes: input.reasonCodes.length ? input.reasonCodes : [`v3_action:${input.action}`],
  };
}

function getStrongestSignalAction(signals: TrustV3Signal[]) {
  return signals
    .map((signal) => signal.recommendedAction)
    .sort((first, second) => recommendedActionRank(second) - recommendedActionRank(first))[0];
}

function buildSignalReasonCodes(signals: TrustV3Signal[]) {
  return signals
    .filter((signal) => signal.severity !== "low")
    .map((signal) => `v3_signal:${signal.riskCategory}:${signal.severity}`);
}

function countSeverities(signals: TrustV3Signal[]): Record<TrustV3Severity, number> {
  return signals.reduce<Record<TrustV3Severity, number>>(
    (counts, signal) => ({
      ...counts,
      [signal.severity]: counts[signal.severity] + 1,
    }),
    {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }
  );
}

function getHighestSignalSeverity(signals: TrustV3Signal[]): TrustV3Severity | "none" {
  return signals
    .map((signal) => signal.severity)
    .sort((first, second) => severityRank(second) - severityRank(first))[0] ?? "none";
}

function buildEnforcement(decision: TrustDecision): TrustV3Enforcement {
  const xpBlocked = isXpBlockedByTrust(decision);
  const rewardHeld = isRewardHeldByTrust(decision);
  const hardBlocked = decision.hardBlocked || ["suspended", "banned"].includes(decision.status);

  return {
    canEarnXp: !xpBlocked,
    canClaimRewards: !rewardHeld,
    canUseAdvancedDefi: !xpBlocked && !rewardHeld && !hardBlocked,
    appealAvailable: ["review_required", "reward_hold", "xp_suspended", "suspended"].includes(decision.status),
    nextSafeAction: deriveTrustNextSafeAction(decision),
  };
}

function buildPrivateEvidenceRefs(signals: TrustV3Signal[]) {
  return signals.map((signal) => signal.dedupeKey);
}

function statusForAction(action: TrustRecommendedAction): TrustEngineStatus {
  switch (action) {
    case "allow":
      return "active";
    case "watch":
      return "watch";
    case "review_required":
      return "review_required";
    case "reward_hold":
      return "reward_hold";
    case "xp_suspended":
      return "xp_suspended";
    case "suspend":
      return "suspended";
    case "ban":
      return "banned";
  }
}

function riskLevelForStatus(status: TrustEngineStatus): TrustRiskLevel {
  if (["xp_suspended", "suspended", "banned"].includes(status)) return "critical";
  if (["review_required", "reward_hold", "flagged"].includes(status)) return "high";
  if (status === "watch") return "low";
  return "clear";
}
