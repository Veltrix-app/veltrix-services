import type { OnchainIngressEvent, SupportedOnchainEventType } from "../../types/aesp.js";

type SuspiciousSeverity = "low" | "medium" | "high";

export type SuspiciousSignal = {
  flagType: string;
  severity: SuspiciousSeverity;
  reason: string;
  metadata?: Record<string, unknown>;
};

type TrustAssessmentInput = {
  event: OnchainIngressEvent;
  latestTrustScore: number;
  walletVerifiedAt?: string | null;
  walletCreatedAt?: string | null;
  riskLabel?: string | null;
  connectedSocialCount: number;
  recentEventCount24h: number;
  recentEventTypeCount24h: number;
  recentLowValueTransferCount24h: number;
  riskFlags: Record<string, unknown>;
};

type TrustAssessment = {
  score: number;
  reasons: Record<string, unknown>;
  suspiciousSignals: SuspiciousSignal[];
  rejectReason: string | null;
};

const EVENT_TYPE_DAILY_CAPS: Record<SupportedOnchainEventType, number> = {
  buy: 20,
  hold: 8,
  transfer_in: 12,
  transfer_out: 12,
  stake: 10,
  unstake: 8,
  lp_add: 10,
  lp_remove: 8,
  contract_call: 16,
};

const TOTAL_DAILY_EVENT_CAP = 40;
const LOW_VALUE_TRANSFER_ALERT_THRESHOLD = 3;
const LOW_VALUE_TRANSFER_REJECT_THRESHOLD = 4;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roundMetric(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function getWalletAgeDays(input: TrustAssessmentInput) {
  const timestamp = input.walletVerifiedAt ?? input.walletCreatedAt ?? null;
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return roundMetric((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24), 2);
}

function getEventTypeCap(eventType: SupportedOnchainEventType) {
  return EVENT_TYPE_DAILY_CAPS[eventType] ?? 12;
}

export function deriveOnchainTrustAssessment(input: TrustAssessmentInput): TrustAssessment {
  const scoreBonuses: string[] = [];
  const scorePenalties: string[] = [];
  const suspiciousSignals: SuspiciousSignal[] = [];
  let nextScore = Number.isFinite(input.latestTrustScore) ? input.latestTrustScore : 50;
  const walletAgeDays = getWalletAgeDays(input);
  const usdValue = Number(input.event.usdValue ?? 0);
  const transferLike =
    input.event.eventType === "transfer_in" || input.event.eventType === "transfer_out";
  const exitLike =
    input.event.eventType === "unstake" ||
    input.event.eventType === "lp_remove" ||
    input.event.eventType === "transfer_out";
  const eventTypeCap = getEventTypeCap(input.event.eventType);
  let rejectReason: string | null = null;

  if (walletAgeDays !== null) {
    if (walletAgeDays >= 30) {
      nextScore += 6;
      scoreBonuses.push("wallet_age_30d_plus");
    } else if (walletAgeDays >= 7) {
      nextScore += 3;
      scoreBonuses.push("wallet_age_7d_plus");
    } else if (walletAgeDays < 1) {
      nextScore -= 8;
      scorePenalties.push("wallet_age_under_1d");
      suspiciousSignals.push({
        flagType: "fresh_wallet_activity",
        severity: "medium",
        reason: "A very fresh verified wallet is already generating tracked on-chain activity.",
        metadata: {
          walletAgeDays,
        },
      });
    } else {
      nextScore -= 4;
      scorePenalties.push("wallet_age_under_7d");
    }
  }

  if (input.connectedSocialCount >= 3) {
    nextScore += 7;
    scoreBonuses.push("three_socials_linked");
  } else if (input.connectedSocialCount === 2) {
    nextScore += 5;
    scoreBonuses.push("two_socials_linked");
  } else if (input.connectedSocialCount === 1) {
    nextScore -= 4;
    scorePenalties.push("single_social_identity");
  } else {
    nextScore -= 10;
    scorePenalties.push("no_social_identity");
    suspiciousSignals.push({
      flagType: "no_social_proof",
      severity: "medium",
      reason: "On-chain activity arrived for a wallet with no linked social proof on the account.",
      metadata: {
        connectedSocialCount: input.connectedSocialCount,
      },
    });
  }

  if (input.recentEventCount24h >= TOTAL_DAILY_EVENT_CAP) {
    nextScore -= 12;
    scorePenalties.push("daily_onchain_cap_reached");
    rejectReason = "Daily on-chain activity cap reached for this wallet.";
    suspiciousSignals.push({
      flagType: "onchain_daily_cap_reached",
      severity: "high",
      reason: "This wallet exceeded the daily tracked on-chain activity cap.",
      metadata: {
        recentEventCount24h: input.recentEventCount24h,
        totalDailyEventCap: TOTAL_DAILY_EVENT_CAP,
      },
    });
  }

  if (input.recentEventTypeCount24h >= eventTypeCap) {
    nextScore -= 10;
    scorePenalties.push("event_type_cap_reached");
    rejectReason =
      rejectReason ??
      `Daily ${input.event.eventType.replace(/_/g, " ")} cap reached for this wallet.`;
    suspiciousSignals.push({
      flagType: "onchain_event_type_cap_reached",
      severity: "high",
      reason: `This wallet exceeded the daily cap for ${input.event.eventType.replace(/_/g, " ")} events.`,
      metadata: {
        eventType: input.event.eventType,
        recentEventTypeCount24h: input.recentEventTypeCount24h,
        eventTypeCap,
      },
    });
  }

  if (transferLike && usdValue > 0 && usdValue < 5) {
    if (input.recentLowValueTransferCount24h >= LOW_VALUE_TRANSFER_REJECT_THRESHOLD) {
      nextScore -= 12;
      scorePenalties.push("low_value_transfer_spam_rejected");
      rejectReason = rejectReason ?? "Low-value transfer activity exceeded the anti-abuse threshold.";
      suspiciousSignals.push({
        flagType: "low_value_transfer_spam",
        severity: "high",
        reason: "Repeated low-value transfer activity crossed the anti-abuse threshold.",
        metadata: {
          usdValue,
          recentLowValueTransferCount24h: input.recentLowValueTransferCount24h,
        },
      });
    } else if (input.recentLowValueTransferCount24h >= LOW_VALUE_TRANSFER_ALERT_THRESHOLD) {
      nextScore -= 7;
      scorePenalties.push("low_value_transfer_spam_alert");
      suspiciousSignals.push({
        flagType: "low_value_transfer_pattern",
        severity: "medium",
        reason: "Repeated low-value transfer activity is starting to look farm-like.",
        metadata: {
          usdValue,
          recentLowValueTransferCount24h: input.recentLowValueTransferCount24h,
        },
      });
    } else {
      nextScore -= 3;
      scorePenalties.push("low_value_transfer");
    }
  } else if (usdValue >= 250) {
    nextScore += 6;
    scoreBonuses.push("high_value_activity");
  } else if (usdValue >= 50) {
    nextScore += 4;
    scoreBonuses.push("meaningful_value_activity");
  }

  if (exitLike) {
    nextScore -= 5;
    scorePenalties.push("exit_like_activity");
    suspiciousSignals.push({
      flagType: "exit_pattern",
      severity: "medium",
      reason: "Exit-like activity was detected and should be reviewed against campaign intent.",
      metadata: {
        eventType: input.event.eventType,
      },
    });
  }

  if ((input.riskLabel ?? "").toLowerCase() === "watch") {
    nextScore -= 8;
    scorePenalties.push("wallet_watch_label");
    suspiciousSignals.push({
      flagType: "wallet_watch_label",
      severity: "medium",
      reason: "The verified wallet is already marked as watch-risk and generated new on-chain activity.",
    });
  }

  const score = clampScore(nextScore);
  if (score <= 35) {
    suspiciousSignals.push({
      flagType: "low_trust_posture",
      severity: "high",
      reason: "The latest on-chain trust posture fell into the high-risk band.",
      metadata: {
        score,
      },
    });
  } else if (score <= 45) {
    suspiciousSignals.push({
      flagType: "watch_trust_posture",
      severity: "medium",
      reason: "The latest on-chain trust posture fell into the watch band.",
      metadata: {
        score,
      },
    });
  }

  return {
    score,
    suspiciousSignals,
    rejectReason,
    reasons: {
      derivedAt: new Date().toISOString(),
      eventType: input.event.eventType,
      usdValue: usdValue || null,
      walletAgeDays,
      connectedSocialCount: input.connectedSocialCount,
      recentEventCount24h: input.recentEventCount24h,
      recentEventTypeCount24h: input.recentEventTypeCount24h,
      recentLowValueTransferCount24h: input.recentLowValueTransferCount24h,
      riskLabel: input.riskLabel ?? "unknown",
      score,
      previousScore: input.latestTrustScore,
      bonuses: scoreBonuses,
      penalties: scorePenalties,
      suspiciousFlags: suspiciousSignals.map((signal) => ({
        flagType: signal.flagType,
        severity: signal.severity,
      })),
      capState: {
        totalDailyEventCap: TOTAL_DAILY_EVENT_CAP,
        eventTypeCap,
      },
      riskFlags: input.riskFlags,
    },
  };
}
