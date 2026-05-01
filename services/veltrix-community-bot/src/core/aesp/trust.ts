import type { OnchainIngressEvent, SupportedOnchainEventType } from "../../types/aesp.js";

type SuspiciousSeverity = "low" | "medium" | "high" | "critical";

export type SuspiciousSignal = {
  flagType: string;
  severity: SuspiciousSeverity;
  reason: string;
  metadata?: Record<string, unknown>;
};

type TrustAssessmentInput = {
  event: OnchainIngressEvent;
  trackedAssetMetadata?: Record<string, unknown>;
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

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
        .filter((item) => item.length > 0)
    : [];
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
  const buyLike =
    input.event.eventType === "buy" ||
    input.event.eventType === "stake" ||
    input.event.eventType === "lp_add";
  const eventTypeCap = getEventTypeCap(input.event.eventType);
  const metadata = asObject(input.event.metadata);
  const trackedAssetMetadata = asObject(input.trackedAssetMetadata);
  const netUsdDelta = asNumber(metadata.netUsdDelta);
  const holdDurationHours = asNumber(metadata.holdDurationHours);
  const lpRetentionHours = asNumber(metadata.lpRetentionHours);
  const functionName = asString(metadata.functionName).toLowerCase();
  const allowedFunctions = asStringList(trackedAssetMetadata.allowedFunctions);
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

  if (buyLike && netUsdDelta !== null && netUsdDelta <= 0) {
    nextScore -= 14;
    scorePenalties.push("net_buy_violation");
    rejectReason = rejectReason ?? "This event did not increase the wallet's net exposure, so XP was not awarded.";
    suspiciousSignals.push({
      flagType: "net_buy_only_violation",
      severity: "high",
      reason: "A buy-like event was received without a positive net exposure delta.",
      metadata: {
        eventType: input.event.eventType,
        netUsdDelta,
      },
    });
  }

  if (input.event.eventType === "hold" && holdDurationHours !== null) {
    if (holdDurationHours < 24) {
      nextScore -= 12;
      scorePenalties.push("hold_duration_below_minimum");
      rejectReason = rejectReason ?? "Hold activity did not meet the minimum duration threshold.";
      suspiciousSignals.push({
        flagType: "short_hold_duration",
        severity: "high",
        reason: "A hold event arrived before the minimum hold window was reached.",
        metadata: {
          holdDurationHours,
        },
      });
    } else if (holdDurationHours < 72) {
      nextScore -= 5;
      scorePenalties.push("hold_duration_watch_band");
      suspiciousSignals.push({
        flagType: "watch_hold_duration",
        severity: "medium",
        reason: "A hold event barely cleared the minimum threshold and should stay in the watch band.",
        metadata: {
          holdDurationHours,
        },
      });
    } else {
      nextScore += 4;
      scoreBonuses.push("meaningful_hold_duration");
    }
  }

  if (input.event.eventType === "lp_remove" && lpRetentionHours !== null) {
    if (lpRetentionHours < 48) {
      nextScore -= 12;
      scorePenalties.push("lp_retention_below_minimum");
      rejectReason = rejectReason ?? "LP activity did not meet the minimum retention threshold.";
      suspiciousSignals.push({
        flagType: "short_lp_retention",
        severity: "high",
        reason: "An LP removal event happened before the minimum LP retention window.",
        metadata: {
          lpRetentionHours,
        },
      });
    } else if (lpRetentionHours < 168) {
      nextScore -= 5;
      scorePenalties.push("lp_retention_watch_band");
      suspiciousSignals.push({
        flagType: "watch_lp_retention",
        severity: "medium",
        reason: "LP retention was short enough to stay in the watch band.",
        metadata: {
          lpRetentionHours,
        },
      });
    }
  }

  if (input.event.eventType === "contract_call" && allowedFunctions.length > 0) {
    if (!functionName || !allowedFunctions.includes(functionName)) {
      nextScore -= 15;
      scorePenalties.push("contract_call_allowlist_violation");
      rejectReason =
        rejectReason ?? "Contract call was not part of the tracked allowlist for this project asset.";
      suspiciousSignals.push({
        flagType: "contract_call_allowlist_violation",
        severity: "high",
        reason: "A contract call arrived outside the tracked allowlist for this asset.",
        metadata: {
          functionName: functionName || null,
          allowedFunctions,
        },
      });
    } else {
      nextScore += 3;
      scoreBonuses.push("allowlisted_contract_call");
    }
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
      netUsdDelta,
      holdDurationHours,
      lpRetentionHours,
      functionName: functionName || null,
      allowedFunctions,
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
