import { deriveTrustRiskPatch, type TrustRiskPatch } from "./risk-score.js";

export type RewardEligibilityReputationSnapshot = {
  trustScore?: unknown;
  sybilScore?: unknown;
  status?: unknown;
};

export type RewardDistributionTrustStatus = "claimable" | "held_for_review" | "blocked";

export type RewardDistributionTrustPatch = {
  status: RewardDistributionTrustStatus;
  metadata: {
    source: "vyntro_trust_engine_v2";
    trustDecision: Pick<
      TrustRiskPatch,
      | "trustScore"
      | "sybilScore"
      | "status"
      | "riskLevel"
      | "recommendedAction"
      | "reviewRequired"
      | "rewardHoldRequired"
      | "hardBlocked"
      | "reasonCodes"
    >;
  };
};

export function buildRewardDistributionTrustPatch(
  reputation: RewardEligibilityReputationSnapshot | null | undefined
): RewardDistributionTrustPatch {
  const decision = deriveTrustRiskPatch({
    currentTrustScore: safeNumber(reputation?.trustScore, 50),
    currentSybilScore: safeNumber(reputation?.sybilScore),
    currentStatus: typeof reputation?.status === "string" ? reputation.status : "active",
    signals: [],
  });

  const status = decision.hardBlocked
    ? "blocked"
    : decision.rewardHoldRequired || decision.reviewRequired
      ? "held_for_review"
      : "claimable";

  return {
    status,
    metadata: {
      source: "vyntro_trust_engine_v2",
      trustDecision: {
        trustScore: decision.trustScore,
        sybilScore: decision.sybilScore,
        status: decision.status,
        riskLevel: decision.riskLevel,
        recommendedAction: decision.recommendedAction,
        reviewRequired: decision.reviewRequired,
        rewardHoldRequired: decision.rewardHoldRequired,
        hardBlocked: decision.hardBlocked,
        reasonCodes: decision.reasonCodes,
      },
    },
  };
}

export function buildRewardDistributionTrustPatchMap(
  reputations: Array<{
    auth_user_id?: unknown;
    trust_score?: unknown;
    sybil_score?: unknown;
    status?: unknown;
  }>
) {
  return new Map(
    reputations
      .filter((row): row is { auth_user_id: string; trust_score?: unknown; sybil_score?: unknown; status?: unknown } =>
        typeof row.auth_user_id === "string" && row.auth_user_id.length > 0
      )
      .map((row) => [
        row.auth_user_id,
        buildRewardDistributionTrustPatch({
          trustScore: row.trust_score,
          sybilScore: row.sybil_score,
          status: row.status,
        }),
      ])
  );
}

function safeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
