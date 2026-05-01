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

export type TrustRiskPatch = {
  trustScore: number;
  sybilScore: number;
  status: TrustRiskStatus;
  reviewRequired: boolean;
  hardBlocked: boolean;
  metadata: {
    signalCount: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    source: "vyntro_trust_risk_score_v1";
  };
};

const TERMINAL_ENFORCEMENT_STATUSES = new Set(["banned", "suspended", "xp_suspended", "reward_hold"]);

const SEVERITY_WEIGHTS = {
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
      const severity = signal.severity === "high" || signal.severity === "medium" ? signal.severity : "low";
      stats.sybilDelta += SEVERITY_WEIGHTS[severity].sybil;
      stats.trustPenalty += SEVERITY_WEIGHTS[severity].trust;
      stats[`${severity}SeverityCount`] += 1;
      return stats;
    },
    {
      sybilDelta: 0,
      trustPenalty: 0,
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

  return {
    trustScore,
    sybilScore,
    status: derivedStatus,
    reviewRequired: ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
      derivedStatus
    ),
    hardBlocked: ["reward_hold", "xp_suspended", "suspended", "banned"].includes(derivedStatus),
    metadata: {
      source: "vyntro_trust_risk_score_v1",
      signalCount: input.signals.length,
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
  if (input.sybilScore >= 70) return "review_required";
  if (input.sybilScore >= 50 || input.trustScore < 35) return "watch";
  return "active";
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
