import type { TrustRecommendedAction } from "./trust-engine";

export type TrustV3RiskCategory =
  | "wallet_graph"
  | "session_velocity"
  | "quest_abuse"
  | "raid_abuse"
  | "reward_abuse"
  | "defi_abuse"
  | "social_abuse"
  | "manual_review";

export type TrustV3Severity = "low" | "medium" | "high" | "critical";

export type TrustV3SourceType =
  | "review_flag"
  | "trust_snapshot"
  | "onchain_signal"
  | "manual"
  | "project_escalation";

export type TrustV3VisibleEvidence = {
  [key: string]: unknown;
};

export type TrustV3PrivateEvidence = {
  relatedWalletAddresses?: string[];
  sessionHash?: string;
  ipHash?: string;
  userAgentHash?: string;
  socialAccountHash?: string;
  [key: string]: unknown;
};

export type TrustV3Signal = {
  projectId: string;
  authUserId: string;
  walletAddress: string | null;
  eventType: string;
  riskCategory: TrustV3RiskCategory;
  severity: TrustV3Severity;
  sourceType: TrustV3SourceType;
  sourceId: string;
  dedupeKey: string;
  reason: string;
  evidence: TrustV3VisibleEvidence;
  privateEvidence: TrustV3PrivateEvidence;
  scoreDelta: number;
  recommendedAction: TrustRecommendedAction;
};

export type ProjectTrustEvidence = {
  riskCategory: TrustV3RiskCategory;
  eventType: string;
  severity: TrustV3Severity;
  reason: string;
  recommendedAction: TrustRecommendedAction;
  visibleEvidence: TrustV3VisibleEvidence;
};

type RewardPressure = "none" | "low" | "medium" | "high";

const PRIVATE_EVIDENCE_KEYS = new Set([
  "ipHash",
  "sessionHash",
  "userAgentHash",
  "socialAccountHash",
  "relatedWalletAddresses",
  "rawIdentifiers",
  "rawEdges",
]);

export function buildWalletGraphSignal(input: {
  projectId: string;
  authUserId: string;
  walletAddress?: string | null;
  relatedWalletCount: number;
  highConfidenceEdgeCount: number;
  sharedFundingEdgeCount: number;
  rewardPressure?: RewardPressure;
  sourceId: string;
  relatedWalletAddresses?: string[];
}): TrustV3Signal {
  const rewardPressure = input.rewardPressure ?? "none";
  const severity =
    input.highConfidenceEdgeCount >= 12 || input.relatedWalletCount >= 24
      ? "critical"
      : input.highConfidenceEdgeCount >= 4 || input.relatedWalletCount >= 8 || rewardPressure === "high"
        ? "high"
        : input.highConfidenceEdgeCount >= 2 || input.relatedWalletCount >= 4 || rewardPressure === "medium"
          ? "medium"
          : "low";
  const recommendedAction =
    severity === "critical"
      ? "xp_suspended"
      : severity === "high" && rewardPressure === "high"
        ? "reward_hold"
        : severity === "high" || severity === "medium"
          ? "review_required"
          : "watch";

  return {
    projectId: input.projectId,
    authUserId: input.authUserId,
    walletAddress: normalizeWallet(input.walletAddress),
    eventType: "wallet_cluster_detected",
    riskCategory: "wallet_graph",
    severity,
    sourceType: "trust_snapshot",
    sourceId: input.sourceId,
    dedupeKey: buildDedupeKey([
      "wallet_graph",
      input.projectId,
      input.authUserId,
      normalizeWallet(input.walletAddress) ?? "unknown_wallet",
      input.sourceId,
    ]),
    reason: "Wallet cluster activity overlaps with reward-sensitive actions.",
    evidence: {
      relatedWalletCount: input.relatedWalletCount,
      highConfidenceEdgeCount: input.highConfidenceEdgeCount,
      sharedFundingEdgeCount: input.sharedFundingEdgeCount,
      rewardPressure,
      threshold: "wallet_graph_cluster_v3",
    },
    privateEvidence: {
      relatedWalletAddresses: input.relatedWalletAddresses ?? [],
    },
    scoreDelta: scoreDeltaForSeverity(severity, recommendedAction),
    recommendedAction,
  };
}

export function buildSessionVelocitySignal(input: {
  projectId: string;
  authUserId: string;
  windowMinutes: number;
  accountCount: number;
  claimAttempts: number;
  sourceId: string;
  sessionHash?: string;
  ipHash?: string;
  userAgentHash?: string;
}): TrustV3Signal {
  const severity =
    input.accountCount >= 8 || input.claimAttempts >= 40
      ? "critical"
      : input.accountCount >= 5 || input.claimAttempts >= 20
        ? "high"
        : input.accountCount >= 3 || input.claimAttempts >= 10
          ? "medium"
          : "low";
  const recommendedAction =
    severity === "critical"
      ? "xp_suspended"
      : severity === "high" || severity === "medium"
        ? "review_required"
        : "watch";

  return {
    projectId: input.projectId,
    authUserId: input.authUserId,
    walletAddress: null,
    eventType: "session_velocity_spike",
    riskCategory: "session_velocity",
    severity,
    sourceType: "trust_snapshot",
    sourceId: input.sourceId,
    dedupeKey: buildDedupeKey([
      "session_velocity",
      input.projectId,
      input.authUserId,
      String(input.windowMinutes),
      input.sourceId,
    ]),
    reason: "Multiple accounts or claim attempts appeared in a short session window.",
    evidence: {
      windowMinutes: input.windowMinutes,
      accountCount: input.accountCount,
      claimAttempts: input.claimAttempts,
      threshold: "session_velocity_v3",
    },
    privateEvidence: {
      sessionHash: input.sessionHash,
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
    },
    scoreDelta: scoreDeltaForSeverity(severity, recommendedAction),
    recommendedAction,
  };
}

export function buildDuplicateSocialSignal(input: {
  projectId: string;
  authUserId: string;
  provider: string;
  linkedAuthUserCount: number;
  proofReuseCount: number;
  sourceId: string;
  socialAccountHash?: string;
}): TrustV3Signal {
  const severity =
    input.linkedAuthUserCount >= 8 || input.proofReuseCount >= 18
      ? "critical"
      : input.linkedAuthUserCount >= 4 || input.proofReuseCount >= 7
        ? "high"
        : input.linkedAuthUserCount >= 2 || input.proofReuseCount >= 3
          ? "medium"
          : "low";
  const recommendedAction =
    severity === "critical"
      ? "xp_suspended"
      : severity === "high"
        ? "reward_hold"
        : severity === "medium"
          ? "review_required"
          : "watch";

  return {
    projectId: input.projectId,
    authUserId: input.authUserId,
    walletAddress: null,
    eventType: "duplicate_social_proof",
    riskCategory: "social_abuse",
    severity,
    sourceType: "trust_snapshot",
    sourceId: input.sourceId,
    dedupeKey: buildDedupeKey([
      "social_abuse",
      input.projectId,
      input.authUserId,
      input.provider,
      input.sourceId,
    ]),
    reason: "Social proof appears reused across multiple accounts.",
    evidence: {
      provider: input.provider,
      linkedAuthUserCount: input.linkedAuthUserCount,
      proofReuseCount: input.proofReuseCount,
      threshold: "duplicate_social_v3",
    },
    privateEvidence: {
      socialAccountHash: input.socialAccountHash,
    },
    scoreDelta: scoreDeltaForSeverity(severity, recommendedAction),
    recommendedAction,
  };
}

export function buildSuspiciousClaimPatternSignal(input: {
  projectId: string;
  authUserId: string;
  claimCount: number;
  uniqueCampaigns: number;
  rewardValueCents: number;
  accountAgeHours: number;
  sourceId: string;
}): TrustV3Signal {
  const accountAgeBand = input.accountAgeHours <= 24 ? "new" : input.accountAgeHours <= 168 ? "warming" : "seasoned";
  const severity =
    input.claimCount >= 30 || input.rewardValueCents >= 100000
      ? "critical"
      : input.claimCount >= 10 || input.uniqueCampaigns >= 6 || input.rewardValueCents >= 25000
        ? "high"
        : input.claimCount >= 5 || input.uniqueCampaigns >= 3
          ? "medium"
          : "low";
  const recommendedAction =
    severity === "critical"
      ? "xp_suspended"
      : severity === "high"
        ? "reward_hold"
        : severity === "medium"
          ? "review_required"
          : "watch";

  return {
    projectId: input.projectId,
    authUserId: input.authUserId,
    walletAddress: null,
    eventType: "suspicious_claim_pattern",
    riskCategory: "reward_abuse",
    severity,
    sourceType: "trust_snapshot",
    sourceId: input.sourceId,
    dedupeKey: buildDedupeKey([
      "reward_abuse",
      input.projectId,
      input.authUserId,
      input.sourceId,
    ]),
    reason: "Reward claim behavior is unusually dense for the account age and campaign spread.",
    evidence: {
      claimCount: input.claimCount,
      uniqueCampaigns: input.uniqueCampaigns,
      rewardValueCents: input.rewardValueCents,
      accountAgeBand,
      threshold: "suspicious_claim_pattern_v3",
    },
    privateEvidence: {},
    scoreDelta: scoreDeltaForSeverity(severity, recommendedAction),
    recommendedAction,
  };
}

export function sanitizeProjectTrustEvidence(signal: TrustV3Signal): ProjectTrustEvidence {
  return {
    riskCategory: signal.riskCategory,
    eventType: signal.eventType,
    severity: signal.severity,
    reason: signal.reason,
    recommendedAction: signal.recommendedAction,
    visibleEvidence: sanitizeVisibleEvidence(signal.evidence),
  };
}

export function severityRank(severity: TrustV3Severity) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

export function recommendedActionRank(action: TrustRecommendedAction) {
  switch (action) {
    case "ban":
      return 7;
    case "suspend":
      return 6;
    case "xp_suspended":
      return 5;
    case "reward_hold":
      return 4;
    case "review_required":
      return 3;
    case "watch":
      return 2;
    case "allow":
      return 1;
  }
}

function sanitizeVisibleEvidence(evidence: TrustV3VisibleEvidence): TrustV3VisibleEvidence {
  return Object.fromEntries(
    Object.entries(evidence).filter(([key]) => !PRIVATE_EVIDENCE_KEYS.has(key))
  );
}

function normalizeWallet(walletAddress: string | null | undefined) {
  const value = walletAddress?.trim();
  return value ? value.toLowerCase() : null;
}

function buildDedupeKey(parts: string[]) {
  return parts.map((part) => part.trim().toLowerCase()).join(":");
}

function scoreDeltaForSeverity(severity: TrustV3Severity, recommendedAction: TrustRecommendedAction) {
  if (recommendedAction === "xp_suspended") return -36;
  if (recommendedAction === "reward_hold") return -24;
  if (severity === "high") return -20;
  if (severity === "medium") return -12;
  return -5;
}
