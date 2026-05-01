export type TrustEngineStatus =
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

export type TrustDecision = {
  trustScore: number;
  sybilScore: number;
  status: TrustEngineStatus;
  riskLevel: TrustRiskLevel;
  recommendedAction: TrustRecommendedAction;
  reviewRequired: boolean;
  rewardHoldRequired: boolean;
  hardBlocked: boolean;
  reasonCodes: string[];
};

export type PublicTrustState = {
  label: string;
  tone: "clear" | "watch" | "review" | "hold" | "blocked";
  message: string;
};

const TERMINAL_STATUSES = new Set<TrustEngineStatus>([
  "reward_hold",
  "xp_suspended",
  "suspended",
  "banned",
]);

const XP_BLOCKED_STATUSES = new Set<TrustEngineStatus>([
  "review_required",
  "reward_hold",
  "xp_suspended",
  "suspended",
  "flagged",
  "banned",
]);

const REWARD_HELD_STATUSES = new Set<TrustEngineStatus>([
  "review_required",
  "reward_hold",
  "xp_suspended",
  "suspended",
  "flagged",
  "banned",
]);

export function deriveTrustDecision(input: {
  trustScore?: unknown;
  sybilScore?: unknown;
  status?: unknown;
}): TrustDecision {
  const trustScore = clampScore(input.trustScore, 50);
  const sybilScore = clampScore(input.sybilScore, 0);
  const currentStatus = normalizeTrustStatus(input.status);

  if (TERMINAL_STATUSES.has(currentStatus)) {
    return buildDecision({
      trustScore,
      sybilScore,
      status: currentStatus,
      reasonCodes: [`terminal_status:${currentStatus}`],
    });
  }

  const reasonCodes: string[] = [];
  if (sybilScore >= 90) {
    reasonCodes.push("sybil_xp_suspension_threshold");
    return buildDecision({
      trustScore,
      sybilScore,
      status: "xp_suspended",
      reasonCodes,
    });
  }

  if (sybilScore >= 80 || trustScore <= 20 || currentStatus === "reward_hold") {
    if (sybilScore >= 80) reasonCodes.push("sybil_reward_hold_threshold");
    if (trustScore <= 20) reasonCodes.push("trust_reward_hold_threshold");
    if (currentStatus === "reward_hold") reasonCodes.push("manual_status:reward_hold");
    return buildDecision({
      trustScore,
      sybilScore,
      status: "reward_hold",
      reasonCodes: ensureReasonCodes(reasonCodes, "reward_hold_threshold"),
    });
  }

  if (sybilScore >= 70 || trustScore <= 25 || currentStatus === "review_required" || currentStatus === "flagged") {
    if (sybilScore >= 70) reasonCodes.push("sybil_review_threshold");
    if (trustScore <= 25) reasonCodes.push("trust_review_threshold");
    if (currentStatus === "review_required") reasonCodes.push("manual_status:review_required");
    if (currentStatus === "flagged") reasonCodes.push("manual_status:flagged");
    return buildDecision({
      trustScore,
      sybilScore,
      status: "review_required",
      reasonCodes: ensureReasonCodes(reasonCodes, "review_threshold"),
    });
  }

  if (sybilScore >= 50 || trustScore < 35 || currentStatus === "watch") {
    if (sybilScore >= 50) reasonCodes.push("sybil_watch_threshold");
    if (trustScore < 35) reasonCodes.push("trust_watch_threshold");
    if (currentStatus === "watch") reasonCodes.push("manual_status:watch");
    return buildDecision({
      trustScore,
      sybilScore,
      status: "watch",
      reasonCodes: ensureReasonCodes(reasonCodes, "watch_threshold"),
    });
  }

  return buildDecision({
    trustScore,
    sybilScore,
    status: "active",
    reasonCodes: ["clear"],
  });
}

export function isXpBlockedByTrust(decision: TrustDecision) {
  return XP_BLOCKED_STATUSES.has(decision.status) || decision.reviewRequired || decision.hardBlocked;
}

export function isRewardHeldByTrust(decision: TrustDecision) {
  return REWARD_HELD_STATUSES.has(decision.status) || decision.rewardHoldRequired || decision.hardBlocked;
}

export function getPublicTrustState(decision: TrustDecision): PublicTrustState {
  switch (decision.status) {
    case "active":
      return {
        label: "Clear",
        tone: "clear",
        message: "Your account is clear for normal VYNTRO participation.",
      };
    case "watch":
      return {
        label: "Monitored",
        tone: "watch",
        message: "Your account is usable while VYNTRO monitors quality signals.",
      };
    case "review_required":
    case "flagged":
      return {
        label: "Under review",
        tone: "review",
        message: "Your progress is saved while VYNTRO reviews trust signals.",
      };
    case "reward_hold":
      return {
        label: "Reward held",
        tone: "hold",
        message: "Rewards are paused while VYNTRO verifies account quality.",
      };
    case "xp_suspended":
      return {
        label: "XP suspended",
        tone: "blocked",
        message: "XP and rewards are paused while VYNTRO reviews account safety.",
      };
    case "suspended":
    case "banned":
      return {
        label: "Suspended",
        tone: "blocked",
        message: "This account cannot participate right now.",
      };
  }
}

function buildDecision(input: {
  trustScore: number;
  sybilScore: number;
  status: TrustEngineStatus;
  reasonCodes: string[];
}): TrustDecision {
  const riskLevel = deriveRiskLevel(input.status, input.trustScore, input.sybilScore);
  return {
    trustScore: input.trustScore,
    sybilScore: input.sybilScore,
    status: input.status,
    riskLevel,
    recommendedAction: deriveRecommendedAction(input.status),
    reviewRequired: ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
      input.status
    ),
    rewardHoldRequired: ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(
      input.status
    ),
    hardBlocked: ["xp_suspended", "suspended", "banned"].includes(input.status),
    reasonCodes: input.reasonCodes,
  };
}

function deriveRiskLevel(status: TrustEngineStatus, trustScore: number, sybilScore: number): TrustRiskLevel {
  if (["xp_suspended", "suspended", "banned"].includes(status) || sybilScore >= 90) return "critical";
  if (["review_required", "reward_hold", "flagged"].includes(status) || sybilScore >= 70 || trustScore <= 25) {
    return "high";
  }
  if (status === "watch" || sybilScore >= 50 || trustScore < 35) return "medium";
  if (sybilScore >= 35 || trustScore < 50) return "low";
  return "clear";
}

function deriveRecommendedAction(status: TrustEngineStatus): TrustRecommendedAction {
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

function normalizeTrustStatus(value: unknown): TrustEngineStatus {
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

function ensureReasonCodes(reasonCodes: string[], fallback: string) {
  return reasonCodes.length > 0 ? reasonCodes : [fallback];
}

function clampScore(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}
