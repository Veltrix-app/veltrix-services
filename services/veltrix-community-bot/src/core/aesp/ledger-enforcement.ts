import { deriveTrustRiskPatch, type TrustRiskPatch } from "../trust/risk-score.js";

export type LedgerXpCanonicalSourceType =
  | "quest_completion"
  | "raid_completion"
  | "defi_mission"
  | "streak_bonus";

export type LedgerXpReputationSnapshot = {
  trustScore?: unknown;
  sybilScore?: unknown;
  status?: unknown;
};

export type LedgerXpAwardEvent = {
  sourceType: LedgerXpCanonicalSourceType;
  sourceRef: string;
  baseValue: number;
  xpAmount: number;
  qualityMultiplier: number;
  trustMultiplier: number;
  actionMultiplier: number;
  effectiveXp: number;
  metadata: Record<string, unknown>;
};

export type LedgerXpAwardPlan =
  | {
      ok: true;
      event: LedgerXpAwardEvent;
    }
  | {
      ok: false;
      reason:
        | "duplicate"
        | "sybil-risk"
        | "account-review"
        | "invalid-source"
        | "invalid-xp"
        | "daily-cap";
      message: string;
      sourceRef?: string;
    };

type LedgerXpSourceConfig = {
  sourceType: LedgerXpCanonicalSourceType;
  aliases: readonly string[];
  refPrefix: string;
  maxEventXp: number;
  maxDailyXp: number;
};

const LEDGER_XP_SOURCE_CONFIGS: Record<LedgerXpCanonicalSourceType, LedgerXpSourceConfig> = {
  quest_completion: {
    sourceType: "quest_completion",
    aliases: ["quest", "quest_completion"],
    refPrefix: "quest_completion",
    maxEventXp: 200,
    maxDailyXp: 900,
  },
  raid_completion: {
    sourceType: "raid_completion",
    aliases: ["raid", "raid_completion"],
    refPrefix: "raid_completion",
    maxEventXp: 250,
    maxDailyXp: 1200,
  },
  defi_mission: {
    sourceType: "defi_mission",
    aliases: ["onchain_event", "defi_mission"],
    refPrefix: "defi",
    maxEventXp: 200,
    maxDailyXp: 1000,
  },
  streak_bonus: {
    sourceType: "streak_bonus",
    aliases: ["streak_bonus"],
    refPrefix: "streak_bonus",
    maxEventXp: 25,
    maxDailyXp: 250,
  },
};

export function resolveLedgerXpSourceConfig(value: unknown): LedgerXpSourceConfig | null {
  if (typeof value !== "string") {
    return null;
  }

  return (
    Object.values(LEDGER_XP_SOURCE_CONFIGS).find((config) =>
      config.aliases.includes(value)
    ) ?? null
  );
}

export function getLedgerXpSourceAliases(value: unknown): string[] {
  return resolveLedgerXpSourceConfig(value)?.aliases.slice() ?? [];
}

export function buildLedgerXpSourceRef(
  sourceType: LedgerXpCanonicalSourceType,
  sourceRef: string
) {
  const config = LEDGER_XP_SOURCE_CONFIGS[sourceType];
  const trimmed = sourceRef.trim();
  return trimmed.startsWith(`${config.refPrefix}:`) ? trimmed : `${config.refPrefix}:${trimmed}`;
}

export function buildLedgerXpAwardPlan(input: {
  authUserId: string;
  sourceType: unknown;
  sourceRef: unknown;
  baseValue: unknown;
  xpAmount: unknown;
  effectiveXp: unknown;
  recentSourceXp?: unknown;
  claimedSourceRefs?: string[];
  reputation?: LedgerXpReputationSnapshot | null;
  metadata?: Record<string, unknown>;
}): LedgerXpAwardPlan {
  const config = resolveLedgerXpSourceConfig(input.sourceType);
  if (!config) {
    return {
      ok: false,
      reason: "invalid-source",
      message: "Unknown XP ledger source type.",
    };
  }

  const rawSourceRef = typeof input.sourceRef === "string" ? input.sourceRef.trim() : "";
  if (!rawSourceRef) {
    return {
      ok: false,
      reason: "invalid-source",
      message: "XP ledger source reference is required.",
    };
  }

  const sourceRef = buildLedgerXpSourceRef(config.sourceType, rawSourceRef);
  if ((input.claimedSourceRefs ?? []).includes(sourceRef)) {
    return {
      ok: false,
      reason: "duplicate",
      message: "This XP ledger source was already recorded.",
      sourceRef,
    };
  }

  const trustDecision = deriveTrustRiskPatch({
    currentTrustScore: safeNumber(input.reputation?.trustScore, 50),
    currentSybilScore: safeNumber(input.reputation?.sybilScore),
    currentStatus: typeof input.reputation?.status === "string" ? input.reputation.status : "active",
    signals: [],
  });

  if (isXpBlockedByTrustDecision(trustDecision)) {
    return {
      ok: false,
      reason: trustDecision.reasonCodes.includes("sybil_xp_suspension_threshold")
        ? "sybil-risk"
        : "account-review",
      message: "This account is in trust review before more XP can be issued.",
      sourceRef,
    };
  }

  const requestedXp = getRequestedXp(input);
  const cappedBaseXp = Math.min(config.maxEventXp, Math.max(0, Math.floor(requestedXp)));
  if (cappedBaseXp <= 0) {
    return {
      ok: false,
      reason: "invalid-xp",
      message: "XP amount must be positive.",
      sourceRef,
    };
  }

  const trustMultiplier = deriveTrustMultiplier(trustDecision.trustScore);
  const uncappedEffectiveXp = Math.round(cappedBaseXp * trustMultiplier);
  const recentSourceXp = Math.max(0, Math.floor(safeNumber(input.recentSourceXp)));
  const remainingDailyXp = config.maxDailyXp - recentSourceXp;

  if (remainingDailyXp <= 0) {
    return {
      ok: false,
      reason: "daily-cap",
      message: "Daily XP cap reached for this ledger source.",
      sourceRef,
    };
  }

  const effectiveXp = Math.min(uncappedEffectiveXp, remainingDailyXp);

  return {
    ok: true,
    event: {
      sourceType: config.sourceType,
      sourceRef,
      baseValue: cappedBaseXp,
      xpAmount: cappedBaseXp,
      qualityMultiplier: 1,
      trustMultiplier,
      actionMultiplier: 1,
      effectiveXp,
      metadata: {
        ...(input.metadata ?? {}),
        source: "vyntro_bot_xp_enforcement",
        claimGuard: "service_enforced",
        requestedXp,
        cappedBaseXp,
        antiAbuseStatus: effectiveXp < uncappedEffectiveXp ? "capped" : "clear",
        trustDecision: pickTrustDecision(trustDecision),
      },
    },
  };
}

function isXpBlockedByTrustDecision(decision: TrustRiskPatch) {
  return decision.reviewRequired || decision.hardBlocked || decision.status === "flagged";
}

function pickTrustDecision(decision: TrustRiskPatch) {
  return {
    trustScore: decision.trustScore,
    sybilScore: decision.sybilScore,
    status: decision.status,
    riskLevel: decision.riskLevel,
    recommendedAction: decision.recommendedAction,
    reviewRequired: decision.reviewRequired,
    rewardHoldRequired: decision.rewardHoldRequired,
    hardBlocked: decision.hardBlocked,
    reasonCodes: decision.reasonCodes,
  };
}

function getRequestedXp(input: {
  sourceType: unknown;
  baseValue: unknown;
  xpAmount: unknown;
  effectiveXp: unknown;
}) {
  const sourceConfig = resolveLedgerXpSourceConfig(input.sourceType);
  if (sourceConfig?.sourceType === "defi_mission") {
    return firstPositiveNumber(input.effectiveXp, input.xpAmount, input.baseValue);
  }

  return firstPositiveNumber(input.xpAmount, input.effectiveXp, input.baseValue);
}

function deriveTrustMultiplier(trustScore: number) {
  return clampMultiplier(1 + (safeNumber(trustScore, 50) - 50) / 150, 0.75, 1.3);
}

function clampMultiplier(value: number, min: number, max: number) {
  const safeValue = safeNumber(value, 1);
  return Math.min(max, Math.max(min, Number(safeValue.toFixed(2))));
}

function firstPositiveNumber(...values: unknown[]) {
  for (const value of values) {
    const numeric = safeNumber(value);
    if (numeric > 0) {
      return numeric;
    }
  }

  return 0;
}

function safeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
