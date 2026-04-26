export const XP_SOURCE_TYPES = {
  quest: "quest_completion",
  raid: "raid_completion",
  defi: "defi_mission",
  streak: "streak_bonus",
  manual: "manual_adjustment",
} as const;

export type XpSourceType = (typeof XP_SOURCE_TYPES)[keyof typeof XP_SOURCE_TYPES];
export type XpAntiAbuseWindow = "none" | "daily" | "campaign" | "lifetime";
export type XpSourceCategory = "mission" | "coordination" | "defi" | "retention" | "operator";
export type XpContributionTier = "explorer" | "contender" | "champion" | "legend";
export type XpStreakStatus = "active" | "grace" | "reset";

export type XpSourceConfig = {
  sourceType: XpSourceType;
  refPrefix: string;
  category: XpSourceCategory;
  antiAbuseWindow: XpAntiAbuseWindow;
  maxDailyXp: number;
  rewardBorrowVolume: boolean;
};

export type XpProgressionRead = {
  totalXp: number;
  level: number;
  levelLabel: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  contributionTier: XpContributionTier;
};

export type XpAwardEvent = {
  sourceType: XpSourceType;
  sourceRef: string;
  baseXp: number;
  qualityMultiplier: number;
  trustMultiplier: number;
  actionMultiplier: number;
  streakMultiplier: number;
  effectiveXp: number;
  antiAbuseStatus: "clear" | "capped";
};

export type XpAwardPlan =
  | {
      ok: true;
      event: XpAwardEvent;
    }
  | {
      ok: false;
      reason: "duplicate" | "sybil-risk" | "invalid-source" | "invalid-xp" | "daily-cap";
      message: string;
    };

export type XpAwardPlanInput = {
  sourceType: XpSourceType;
  sourceId: string;
  baseXp: number;
  claimedSourceRefs?: string[];
  recentSourceXp?: number;
  qualityMultiplier?: number;
  trustScore?: number;
  sybilScore?: number;
  actionMultiplier?: number;
  streakDays?: number;
};

export type XpStreakRead = {
  status: XpStreakStatus;
  currentStreak: number;
  nextStreak: number;
  multiplier: number;
  label: string;
};

export type XpStreakInput = {
  currentStreak: number;
  lastActivityAt: string | null;
  now?: string;
};

const LEVEL_THRESHOLDS = [0, 500, 1250, 2250, 3500, 5000, 7000, 9500, 12500, 16000];
const SOURCE_CONFIGS: Record<XpSourceType, XpSourceConfig> = {
  quest_completion: {
    sourceType: "quest_completion",
    refPrefix: "quest_completion",
    category: "mission",
    antiAbuseWindow: "daily",
    maxDailyXp: 900,
    rewardBorrowVolume: false,
  },
  raid_completion: {
    sourceType: "raid_completion",
    refPrefix: "raid_completion",
    category: "coordination",
    antiAbuseWindow: "daily",
    maxDailyXp: 1200,
    rewardBorrowVolume: false,
  },
  defi_mission: {
    sourceType: "defi_mission",
    refPrefix: "defi",
    category: "defi",
    antiAbuseWindow: "lifetime",
    maxDailyXp: 1000,
    rewardBorrowVolume: false,
  },
  streak_bonus: {
    sourceType: "streak_bonus",
    refPrefix: "streak_bonus",
    category: "retention",
    antiAbuseWindow: "daily",
    maxDailyXp: 250,
    rewardBorrowVolume: false,
  },
  manual_adjustment: {
    sourceType: "manual_adjustment",
    refPrefix: "manual_adjustment",
    category: "operator",
    antiAbuseWindow: "none",
    maxDailyXp: 5000,
    rewardBorrowVolume: false,
  },
};

export function getXpSourceConfig(sourceType: XpSourceType): XpSourceConfig {
  return SOURCE_CONFIGS[sourceType];
}

export function buildXpSourceRef(sourceType: XpSourceType, sourceId: string) {
  const config = getXpSourceConfig(sourceType);
  return `${config.refPrefix}:${sourceId.trim()}`;
}

export function buildXpProgressionRead(totalXpInput: number): XpProgressionRead {
  const totalXp = Math.max(0, Math.floor(toSafeNumber(totalXpInput)));
  let thresholdIndex = 0;
  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (totalXp >= LEVEL_THRESHOLDS[index]) {
      thresholdIndex = index;
    }
  }
  const level = Math.max(1, thresholdIndex + 1);
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const nextLevelXp =
    LEVEL_THRESHOLDS[level] ?? currentLevelXp + Math.max(4000, level * 500);
  const progressSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalXp - currentLevelXp) / progressSpan) * 100))
  );

  return {
    totalXp,
    level,
    levelLabel: `Level ${level}`,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    contributionTier: deriveContributionTier(totalXp),
  };
}

export function buildXpAwardPlan(input: XpAwardPlanInput): XpAwardPlan {
  const sourceConfig = getXpSourceConfig(input.sourceType);
  if (!sourceConfig) {
    return {
      ok: false,
      reason: "invalid-source",
      message: "Unknown XP source type.",
    };
  }

  const sourceRef = buildXpSourceRef(input.sourceType, input.sourceId);
  if ((input.claimedSourceRefs ?? []).includes(sourceRef)) {
    return {
      ok: false,
      reason: "duplicate",
      message: "This XP source was already claimed.",
    };
  }

  if (toSafeNumber(input.sybilScore) >= 90) {
    return {
      ok: false,
      reason: "sybil-risk",
      message: "This account needs review before more XP can be issued.",
    };
  }

  const baseXp = Math.max(0, Math.floor(toSafeNumber(input.baseXp)));
  if (baseXp <= 0) {
    return {
      ok: false,
      reason: "invalid-xp",
      message: "XP amount must be positive.",
    };
  }

  const qualityMultiplier = clampMultiplier(input.qualityMultiplier ?? 1, 0.5, 1.5);
  const actionMultiplier = clampMultiplier(input.actionMultiplier ?? 1, 0.5, 1.5);
  const trustMultiplier = deriveTrustMultiplier(input.trustScore ?? 50);
  const streakMultiplier = deriveStreakMultiplier(input.streakDays ?? 0);
  const uncappedXp = Math.round(
    baseXp * qualityMultiplier * trustMultiplier * actionMultiplier * streakMultiplier
  );
  const remainingDailyXp = sourceConfig.maxDailyXp - Math.max(0, Math.floor(toSafeNumber(input.recentSourceXp)));

  if (sourceConfig.antiAbuseWindow === "daily" && remainingDailyXp <= 0) {
    return {
      ok: false,
      reason: "daily-cap",
      message: "Daily XP cap reached for this source.",
    };
  }

  const effectiveXp =
    sourceConfig.antiAbuseWindow === "daily"
      ? Math.min(uncappedXp, remainingDailyXp)
      : uncappedXp;

  return {
    ok: true,
    event: {
      sourceType: input.sourceType,
      sourceRef,
      baseXp,
      qualityMultiplier,
      trustMultiplier,
      actionMultiplier,
      streakMultiplier,
      effectiveXp,
      antiAbuseStatus: effectiveXp < uncappedXp ? "capped" : "clear",
    },
  };
}

export function buildXpStreakRead(input: XpStreakInput): XpStreakRead {
  const currentStreak = Math.max(0, Math.floor(toSafeNumber(input.currentStreak)));
  const lastActivityTime = input.lastActivityAt ? Date.parse(input.lastActivityAt) : Number.NaN;
  const nowTime = Date.parse(input.now ?? new Date().toISOString());

  if (!Number.isFinite(lastActivityTime) || !Number.isFinite(nowTime)) {
    return {
      status: "reset",
      currentStreak,
      nextStreak: 1,
      multiplier: deriveStreakMultiplier(1),
      label: "Start streak",
    };
  }

  const hoursSinceActivity = Math.max(0, (nowTime - lastActivityTime) / 3_600_000);
  if (hoursSinceActivity <= 24) {
    return {
      status: "active",
      currentStreak,
      nextStreak: currentStreak,
      multiplier: deriveStreakMultiplier(currentStreak + 1),
      label: "Streak active",
    };
  }

  if (hoursSinceActivity <= 48) {
    return {
      status: "grace",
      currentStreak,
      nextStreak: currentStreak + 1,
      multiplier: deriveStreakMultiplier(currentStreak + 1),
      label: "Grace window",
    };
  }

  return {
    status: "reset",
    currentStreak,
    nextStreak: 1,
    multiplier: deriveStreakMultiplier(1),
    label: "Streak reset",
  };
}

export function buildXpReputationPatch(input: {
  currentTotalXp: number;
  currentActiveXp?: number;
  xpAwarded: number;
}) {
  const totalXp = Math.max(0, Math.floor(toSafeNumber(input.currentTotalXp) + toSafeNumber(input.xpAwarded)));
  const activeXp = Math.max(
    0,
    Math.floor(toSafeNumber(input.currentActiveXp ?? input.currentTotalXp) + toSafeNumber(input.xpAwarded))
  );
  const progression = buildXpProgressionRead(totalXp);

  return {
    totalXp,
    activeXp,
    level: progression.level,
    contributionTier: progression.contributionTier,
  };
}

function deriveContributionTier(totalXp: number): XpContributionTier {
  if (totalXp >= 10_000) return "legend";
  if (totalXp >= 5_000) return "champion";
  if (totalXp >= 2_000) return "contender";
  return "explorer";
}

function deriveTrustMultiplier(trustScore: number) {
  return clampMultiplier(1 + (toSafeNumber(trustScore) - 50) / 150, 0.75, 1.3);
}

function deriveStreakMultiplier(streakDays: number) {
  const streak = Math.max(0, Math.floor(toSafeNumber(streakDays)));
  return clampMultiplier(1 + Math.floor(streak / 2) * 0.1, 1, 1.3);
}

function clampMultiplier(value: number, min: number, max: number) {
  const safeValue = toSafeNumber(value, 1);
  return Math.min(max, Math.max(min, Number(safeValue.toFixed(2))));
}

function toSafeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
