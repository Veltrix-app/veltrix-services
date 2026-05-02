import type { TrustEngineStatus } from "./trust-engine";
import type { TrustDecisionV3 } from "./trust-engine-v3";

export type TrustReviewCasePriority = "low" | "medium" | "high" | "critical";

export type TrustReviewCaseType =
  | "not_needed"
  | "trust_signal_review"
  | "reward_hold_review"
  | "xp_suspension_review"
  | "suspension_review"
  | "ban_review";

export type TrustReviewCasePlan = {
  shouldOpen: boolean;
  caseType: TrustReviewCaseType;
  priority: TrustReviewCasePriority;
  reason: string;
  slaLabel: string;
  dedupeKey: string | null;
};

export type TrustAppealStatus = "none" | "submitted" | "in_review" | "approved" | "rejected";

export type TrustAppealState = {
  canAppeal: boolean;
  state:
    | "not_needed"
    | "available"
    | "already_pending"
    | "recently_resolved"
    | "manual_support_only";
  title: string;
  message: string;
};

export function buildTrustReviewCasePlan(input: {
  projectId: string | null;
  authUserId: string;
  walletAddress: string | null;
  decision: TrustDecisionV3;
}): TrustReviewCasePlan {
  if (!shouldOpenReviewCase(input.decision.status)) {
    return {
      shouldOpen: false,
      caseType: "not_needed",
      priority: "low",
      reason: "Trust posture does not require manual review.",
      slaLabel: "No review needed",
      dedupeKey: null,
    };
  }

  const caseType = caseTypeForStatus(input.decision.status);
  const priority = priorityForStatus(input.decision.status);

  return {
    shouldOpen: true,
    caseType,
    priority,
    reason: reasonForStatus(input.decision.status),
    slaLabel: slaLabelForPriority(priority),
    dedupeKey: buildReviewDedupeKey({
      projectId: input.projectId,
      authUserId: input.authUserId,
      walletAddress: input.walletAddress,
      status: input.decision.status,
    }),
  };
}

export function buildTrustAppealState(input: {
  decision: TrustDecisionV3;
  existingAppealStatus?: TrustAppealStatus | null;
}): TrustAppealState {
  const existingAppealStatus = input.existingAppealStatus ?? "none";

  if (existingAppealStatus === "submitted" || existingAppealStatus === "in_review") {
    return {
      canAppeal: false,
      state: "already_pending",
      title: "Appeal already in review",
      message: "Your appeal is already in the VYNTRO review queue.",
    };
  }

  if (existingAppealStatus === "approved" || existingAppealStatus === "rejected") {
    return {
      canAppeal: false,
      state: "recently_resolved",
      title: "Appeal resolved",
      message: "The latest appeal has already been resolved. Contact support if new context exists.",
    };
  }

  if (input.decision.status === "banned") {
    return {
      canAppeal: false,
      state: "manual_support_only",
      title: "Manual support review only",
      message: "This account requires a manual VYNTRO support review before any appeal can reopen.",
    };
  }

  if (["review_required", "reward_hold", "xp_suspended", "suspended", "flagged"].includes(input.decision.status)) {
    return {
      canAppeal: true,
      state: "available",
      title: "Appeal available",
      message: "Add concise context so VYNTRO can review the trust hold without exposing private evidence.",
    };
  }

  return {
    canAppeal: false,
    state: "not_needed",
    title: "No appeal needed",
    message: "This account is not currently blocked by trust enforcement.",
  };
}

function shouldOpenReviewCase(status: TrustEngineStatus) {
  return ["review_required", "reward_hold", "xp_suspended", "suspended", "flagged", "banned"].includes(status);
}

function caseTypeForStatus(status: TrustEngineStatus): TrustReviewCaseType {
  switch (status) {
    case "review_required":
    case "flagged":
      return "trust_signal_review";
    case "reward_hold":
      return "reward_hold_review";
    case "xp_suspended":
      return "xp_suspension_review";
    case "suspended":
      return "suspension_review";
    case "banned":
      return "ban_review";
    case "active":
    case "watch":
      return "not_needed";
  }
}

function priorityForStatus(status: TrustEngineStatus): TrustReviewCasePriority {
  switch (status) {
    case "banned":
    case "suspended":
    case "xp_suspended":
      return "critical";
    case "reward_hold":
      return "high";
    case "review_required":
    case "flagged":
      return "medium";
    case "active":
    case "watch":
      return "low";
  }
}

function reasonForStatus(status: TrustEngineStatus) {
  switch (status) {
    case "review_required":
    case "flagged":
      return "Trust signals need an operator read before XP or rewards continue.";
    case "reward_hold":
      return "Rewards are paused until the account quality review clears.";
    case "xp_suspended":
      return "XP and reward actions are paused because critical trust signals were detected.";
    case "suspended":
      return "Account participation is suspended pending manual review.";
    case "banned":
      return "Account participation is blocked and requires senior manual review.";
    case "active":
    case "watch":
      return "Trust posture does not require manual review.";
  }
}

function slaLabelForPriority(priority: TrustReviewCasePriority) {
  switch (priority) {
    case "critical":
      return "Priority review";
    case "high":
      return "Review within 24 hours";
    case "medium":
      return "Review within 48 hours";
    case "low":
      return "No review needed";
  }
}

function buildReviewDedupeKey(input: {
  projectId: string | null;
  authUserId: string;
  walletAddress: string | null;
  status: TrustEngineStatus;
}) {
  return [
    "trust_review",
    input.projectId ?? "global",
    input.authUserId,
    input.status,
    input.walletAddress?.trim().toLowerCase() || "no_wallet",
  ].join(":");
}
