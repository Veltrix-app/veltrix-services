import type { SuspiciousSignal } from "../aesp/trust.js";

export type TrustRiskStatus =
  | "active"
  | "watch"
  | "review_required"
  | "reward_hold"
  | "xp_suspended"
  | "suspended"
  | "flagged"
  | "banned";

export type TrustRiskLevel = "clear" | "low" | "medium" | "high" | "critical";

export type TrustRecommendedAction =
  | "allow"
  | "watch"
  | "review_required"
  | "reward_hold"
  | "xp_suspended"
  | "suspend"
  | "ban";

export type TrustRiskPatch = {
  trustScore: number;
  sybilScore: number;
  status: TrustRiskStatus;
  riskLevel: TrustRiskLevel;
  recommendedAction: TrustRecommendedAction;
  reviewRequired: boolean;
  rewardHoldRequired: boolean;
  hardBlocked: boolean;
  reasonCodes: string[];
  metadata: {
    signalCount: number;
    criticalSeverityCount: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    source: "vyntro_trust_risk_score_v1";
  };
};

const TERMINAL_ENFORCEMENT_STATUSES = new Set(["banned", "suspended", "xp_suspended", "reward_hold"]);

const SEVERITY_WEIGHTS = {
  critical: {
    sybil: 70,
    trust: 30,
  },
  low: {
    sybil: 8,
    trust: 5,
  },
  medium: {
    sybil: 15,
    trust: 9,
  },
  high: {
    sybil: 30,
    trust: 22,
  },
} as const;

export function deriveTrustRiskPatch(input: {
  currentTrustScore?: number | null;
  currentSybilScore?: number | null;
  currentStatus?: string | null;
  signals: SuspiciousSignal[];
}): TrustRiskPatch {
  const currentTrustScore = clampScore(input.currentTrustScore ?? 50);
  const currentSybilScore = clampScore(input.currentSybilScore ?? 0);
  const currentStatus = normalizeTrustRiskStatus(input.currentStatus);
  const signalStats = input.signals.reduce(
    (stats, signal) => {
      const severity =
        signal.severity === "critical" || signal.severity === "high" || signal.severity === "medium"
          ? signal.severity
          : "low";
      stats.sybilDelta += SEVERITY_WEIGHTS[severity].sybil;
      stats.trustPenalty += SEVERITY_WEIGHTS[severity].trust;
      stats[`${severity}SeverityCount`] += 1;
      return stats;
    },
    {
      sybilDelta: 0,
      trustPenalty: 0,
      criticalSeverityCount: 0,
      highSeverityCount: 0,
      mediumSeverityCount: 0,
      lowSeverityCount: 0,
    }
  );

  const sybilScore = clampScore(currentSybilScore + signalStats.sybilDelta);
  const trustScore = clampScore(currentTrustScore - signalStats.trustPenalty);
  const derivedStatus = deriveStatusFromScores({
    currentStatus,
    sybilScore,
    trustScore,
  });
  const reasonCodes = deriveReasonCodes({
    currentStatus,
    status: derivedStatus,
    sybilScore,
    trustScore,
  });

  return {
    trustScore,
    sybilScore,
    status: derivedStatus,
    riskLevel: deriveRiskLevel(derivedStatus, trustScore, sybilScore),
    recommendedAction: deriveRecommendedAction(derivedStatus),
    reviewRequired: ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
      derivedStatus
    ),
    rewardHoldRequired: ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
      derivedStatus
    ),
    hardBlocked: ["xp_suspended", "suspended", "banned"].includes(derivedStatus),
    reasonCodes,
    metadata: {
      source: "vyntro_trust_risk_score_v1",
      signalCount: input.signals.length,
      criticalSeverityCount: signalStats.criticalSeverityCount,
      highSeverityCount: signalStats.highSeverityCount,
      mediumSeverityCount: signalStats.mediumSeverityCount,
      lowSeverityCount: signalStats.lowSeverityCount,
    },
  };
}

function deriveStatusFromScores(input: {
  currentStatus: TrustRiskStatus;
  sybilScore: number;
  trustScore: number;
}): TrustRiskStatus {
  if (TERMINAL_ENFORCEMENT_STATUSES.has(input.currentStatus)) {
    return input.currentStatus;
  }

  if (input.sybilScore >= 90) return "xp_suspended";
  if (input.sybilScore >= 80 || input.trustScore <= 20) return "reward_hold";
  if (input.sybilScore >= 70 || input.trustScore <= 25) return "review_required";
  if (input.sybilScore >= 50 || input.trustScore < 35) return "watch";
  return "active";
}

function deriveRiskLevel(status: TrustRiskStatus, trustScore: number, sybilScore: number): TrustRiskLevel {
  if (["xp_suspended", "suspended", "banned"].includes(status) || sybilScore >= 90) return "critical";
  if (["review_required", "reward_hold", "flagged"].includes(status) || sybilScore >= 70 || trustScore <= 25) {
    return "high";
  }
  if (status === "watch" || sybilScore >= 50 || trustScore < 35) return "medium";
  if (sybilScore >= 35 || trustScore < 50) return "low";
  return "clear";
}

function deriveRecommendedAction(status: TrustRiskStatus): TrustRecommendedAction {
  switch (status) {
    case "active":
      return "allow";
    case "watch":
      return "watch";
    case "review_required":
    case "flagged":
      return "review_required";
    case "reward_hold":
      return "reward_hold";
    case "xp_suspended":
      return "xp_suspended";
    case "suspended":
      return "suspend";
    case "banned":
      return "ban";
  }
}

function deriveReasonCodes(input: {
  currentStatus: TrustRiskStatus;
  status: TrustRiskStatus;
  sybilScore: number;
  trustScore: number;
}) {
  if (TERMINAL_ENFORCEMENT_STATUSES.has(input.currentStatus)) {
    return [`terminal_status:${input.currentStatus}`];
  }

  const reasonCodes: string[] = [];
  if (input.sybilScore >= 90) reasonCodes.push("sybil_xp_suspension_threshold");
  else if (input.sybilScore >= 80) reasonCodes.push("sybil_reward_hold_threshold");
  else if (input.sybilScore >= 70) reasonCodes.push("sybil_review_threshold");
  else if (input.sybilScore >= 50) reasonCodes.push("sybil_watch_threshold");

  if (input.trustScore <= 20) reasonCodes.push("trust_reward_hold_threshold");
  else if (input.trustScore <= 25) reasonCodes.push("trust_review_threshold");
  else if (input.trustScore < 35) reasonCodes.push("trust_watch_threshold");

  return reasonCodes.length > 0 ? reasonCodes : [input.status === "active" ? "clear" : `${input.status}_threshold`];
}

function normalizeTrustRiskStatus(value: string | null | undefined): TrustRiskStatus {
  if (
    value === "watch" ||
    value === "review_required" ||
    value === "reward_hold" ||
    value === "xp_suspended" ||
    value === "suspended" ||
    value === "flagged" ||
    value === "banned"
  ) {
    return value;
  }

  return "active";
}

function clampScore(value: number) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(nextValue)));
}
