import {
  XP_SOURCE_TYPES,
  buildXpAwardPlan,
  buildXpProgressionRead,
  buildXpReputationPatch,
  type XpSourceType,
} from "./xp-economy";

export type PublicUserXpAwardSourceType =
  | typeof XP_SOURCE_TYPES.quest
  | typeof XP_SOURCE_TYPES.raid
  | typeof XP_SOURCE_TYPES.streak;

export type UserXpAwardSourceType =
  | PublicUserXpAwardSourceType
  | typeof XP_SOURCE_TYPES.defi;

export type XpReputationSnapshot = {
  total_xp?: unknown;
  active_xp?: unknown;
  level?: unknown;
  streak?: unknown;
  trust_score?: unknown;
  sybil_score?: unknown;
  contribution_tier?: unknown;
  quests_completed?: unknown;
  raids_completed?: unknown;
  rewards_claimed?: unknown;
  status?: unknown;
};

export type UserXpAwardEventPayload = {
  source_type: UserXpAwardSourceType;
  source_ref: string;
  base_value: number;
  xp_amount: number;
  quality_multiplier: number;
  trust_multiplier: number;
  action_multiplier: number;
  effective_xp: number;
  metadata: Record<string, unknown>;
};

export type UserXpAwardReputationPatch = {
  total_xp: number;
  active_xp: number;
  level: number;
  streak: number;
  trust_score: number;
  sybil_score: number;
  contribution_tier: string;
  quests_completed: number;
  raids_completed: number;
  rewards_claimed: number;
  status: string;
  metadata?: Record<string, unknown>;
};

export type UserXpAwardPlan =
  | {
      ok: true;
      event: UserXpAwardEventPayload;
      reputation: UserXpAwardReputationPatch;
      sourceRef: string;
      xpAwarded: number;
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
    };

const XP_BLOCKED_REPUTATION_STATUSES = new Set([
  "review_required",
  "xp_suspended",
  "reward_hold",
  "banned",
  "suspended",
  "flagged",
]);

export const XP_USER_AWARD_SOURCE_TYPES = [
  XP_SOURCE_TYPES.quest,
  XP_SOURCE_TYPES.raid,
  XP_SOURCE_TYPES.streak,
] as const satisfies readonly XpSourceType[];

export const XP_CENTRAL_AWARD_SOURCE_TYPES = [
  ...XP_USER_AWARD_SOURCE_TYPES,
  XP_SOURCE_TYPES.defi,
] as const satisfies readonly XpSourceType[];

export function isUserXpAwardSourceType(value: unknown): value is PublicUserXpAwardSourceType {
  return XP_USER_AWARD_SOURCE_TYPES.includes(value as PublicUserXpAwardSourceType);
}

export function isCentralXpAwardSourceType(value: unknown): value is UserXpAwardSourceType {
  return XP_CENTRAL_AWARD_SOURCE_TYPES.includes(value as UserXpAwardSourceType);
}

export function buildUserXpAwardPlan(input: {
  sourceType: UserXpAwardSourceType;
  sourceId: string;
  baseXp: number;
  reputation?: XpReputationSnapshot | null;
  claimedSourceRefs?: string[];
  recentSourceXp?: number;
  metadata?: Record<string, unknown>;
}): UserXpAwardPlan {
  const reputation = input.reputation ?? {};
  const status = typeof reputation.status === "string" ? reputation.status : "active";
  if (XP_BLOCKED_REPUTATION_STATUSES.has(status)) {
    return {
      ok: false,
      reason: "account-review",
      message: "This account is in trust review before more XP can be issued.",
    };
  }

  const awardPlan = buildXpAwardPlan({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    baseXp: input.baseXp,
    claimedSourceRefs: input.claimedSourceRefs,
    recentSourceXp: input.recentSourceXp,
    sybilScore: safeNumber(reputation.sybil_score),
    trustScore: safeNumber(reputation.trust_score, 50),
    streakDays: input.sourceType === XP_SOURCE_TYPES.streak ? safeNumber(reputation.streak) : 0,
  });

  if (!awardPlan.ok) {
    return awardPlan;
  }

  const currentTotalXp = safeNumber(reputation.total_xp);
  const reputationPatch = buildXpReputationPatch({
    currentTotalXp,
    currentActiveXp: safeNumber(reputation.active_xp, currentTotalXp),
    xpAwarded: awardPlan.event.effectiveXp,
  });
  const progression = buildXpProgressionRead(reputationPatch.totalXp);
  const nextStreak =
    input.sourceType === XP_SOURCE_TYPES.streak
      ? safeNumber(reputation.streak) + 1
      : safeNumber(reputation.streak);
  const questIncrement = input.sourceType === XP_SOURCE_TYPES.quest ? 1 : 0;
  const raidIncrement = input.sourceType === XP_SOURCE_TYPES.raid ? 1 : 0;
  const metadata = {
    source: "vyntro_xp_award",
    sourceType: awardPlan.event.sourceType,
    sourceId: input.sourceId,
    antiAbuseStatus: awardPlan.event.antiAbuseStatus,
    streakMultiplier: awardPlan.event.streakMultiplier,
    ...(input.metadata ?? {}),
  };

  return {
    ok: true,
    sourceRef: awardPlan.event.sourceRef,
    xpAwarded: awardPlan.event.effectiveXp,
    event: {
      source_type: input.sourceType,
      source_ref: awardPlan.event.sourceRef,
      base_value: awardPlan.event.baseXp,
      xp_amount: awardPlan.event.baseXp,
      quality_multiplier: awardPlan.event.qualityMultiplier,
      trust_multiplier: awardPlan.event.trustMultiplier,
      action_multiplier: awardPlan.event.actionMultiplier,
      effective_xp: awardPlan.event.effectiveXp,
      metadata,
    },
    reputation: {
      total_xp: reputationPatch.totalXp,
      active_xp: reputationPatch.activeXp,
      level: progression.level,
      streak: nextStreak,
      trust_score: safeNumber(reputation.trust_score, 50),
      sybil_score: safeNumber(reputation.sybil_score),
      contribution_tier: progression.contributionTier,
      quests_completed: safeNumber(reputation.quests_completed) + questIncrement,
      raids_completed: safeNumber(reputation.raids_completed) + raidIncrement,
      rewards_claimed: safeNumber(reputation.rewards_claimed),
      status,
      metadata,
    },
  };
}

function safeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
