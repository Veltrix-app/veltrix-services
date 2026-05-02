import {
  getPublicTrustState,
  isRewardHeldByTrust,
  isXpBlockedByTrust,
  type TrustDecision,
  type TrustEngineStatus,
  type TrustRiskLevel,
} from "./trust-engine";
import {
  sanitizeProjectTrustEvidence,
  severityRank,
  type TrustV3RiskCategory,
  type TrustV3Severity,
  type TrustV3Signal,
} from "./trust-signals-v3";

export type TrustV3ProjectSummary = {
  label: string;
  tone: "clear" | "watch" | "review" | "hold" | "blocked";
  status: TrustEngineStatus;
  riskLevel: TrustRiskLevel;
  visibleRiskCategories: TrustV3RiskCategory[];
  visibleSignalCount: number;
  highestSeverity: TrustV3Severity | "none";
  rewardEligibility: "eligible" | "held" | "blocked";
  xpEligibility: "eligible" | "paused" | "blocked";
  nextAction: string;
  evidence: ReturnType<typeof sanitizeProjectTrustEvidence>[];
};

export function buildProjectTrustSummary(input: {
  decision: TrustDecision;
  signals: TrustV3Signal[];
}): TrustV3ProjectSummary {
  const publicState = getPublicTrustState(input.decision);

  return {
    label: publicState.label,
    tone: publicState.tone,
    status: input.decision.status,
    riskLevel: input.decision.riskLevel,
    visibleRiskCategories: Array.from(new Set(input.signals.map((signal) => signal.riskCategory))),
    visibleSignalCount: input.signals.length,
    highestSeverity: getHighestSignalSeverity(input.signals),
    rewardEligibility: deriveRewardEligibility(input.decision),
    xpEligibility: deriveXpEligibility(input.decision),
    nextAction: deriveTrustNextSafeAction(input.decision),
    evidence: input.signals.map(sanitizeProjectTrustEvidence),
  };
}

export function deriveTrustNextSafeAction(decision: TrustDecision) {
  switch (decision.status) {
    case "active":
      return "Continue normal participation.";
    case "watch":
      return "Keep activity natural while quality signals warm up.";
    case "review_required":
    case "flagged":
      return "Wait for review or submit a short appeal with context.";
    case "reward_hold":
      return "Rewards are held until the trust review clears.";
    case "xp_suspended":
      return "Pause XP actions and request review before continuing.";
    case "suspended":
      return "Contact support for a manual trust review.";
    case "banned":
      return "Participation is blocked unless VYNTRO manually reopens the case.";
  }
}

export function deriveRewardEligibility(decision: TrustDecision): TrustV3ProjectSummary["rewardEligibility"] {
  if (["xp_suspended", "suspended", "banned"].includes(decision.status)) return "blocked";
  if (isRewardHeldByTrust(decision)) return "held";
  return "eligible";
}

export function deriveXpEligibility(decision: TrustDecision): TrustV3ProjectSummary["xpEligibility"] {
  if (["xp_suspended", "suspended", "banned"].includes(decision.status)) return "blocked";
  if (isXpBlockedByTrust(decision)) return "paused";
  return "eligible";
}

function getHighestSignalSeverity(signals: TrustV3Signal[]): TrustV3Severity | "none" {
  return signals
    .map((signal) => signal.severity)
    .sort((first, second) => severityRank(second) - severityRank(first))[0] ?? "none";
}
