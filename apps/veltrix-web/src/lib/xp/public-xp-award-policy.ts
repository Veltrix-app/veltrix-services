import {
  XP_ECONOMY_V1_POLICY,
  XP_SOURCE_TYPES,
  calculateQuestGlobalXp,
} from "./xp-economy";
import type { PublicUserXpAwardSourceType } from "./xp-awards";

export type PublicQuestAwardRow = {
  id: string;
  title: string | null;
  project_id: string | null;
  campaign_id: string | null;
  xp: number | null;
  quest_type: string | null;
  proof_required: boolean | null;
  proof_type: string | null;
  verification_type: string | null;
  verification_provider: string | null;
  completion_mode: string | null;
  verification_config: unknown;
};

export type PublicRaidAwardRow = {
  id: string;
  title: string | null;
  project_id: string | null;
  campaign_id: string | null;
  reward_xp: number | null;
  status: string | null;
};

export type PublicXpAwardPolicyPlan = {
  sourceType: PublicUserXpAwardSourceType;
  sourceId: string;
  baseXp: number;
  projectId: string | null;
  campaignId: string | null;
  metadata: Record<string, unknown>;
};

export function buildPublicQuestXpAwardPlan(
  quest: PublicQuestAwardRow,
  metadata: Record<string, unknown> = {}
): PublicXpAwardPolicyPlan {
  const verificationConfig = toRecord(quest.verification_config);
  const globalXpPlan = calculateQuestGlobalXp({
    questType: quest.quest_type,
    requestedXp: quest.xp,
    difficulty:
      typeof verificationConfig?.difficulty === "string"
        ? verificationConfig.difficulty
        : null,
    proofRequired: quest.proof_required,
    proofType: quest.proof_type,
    verificationType: quest.verification_type,
    verificationProvider: quest.verification_provider,
    completionMode: quest.completion_mode,
  });

  return {
    sourceType: XP_SOURCE_TYPES.quest,
    sourceId: quest.id,
    baseXp: globalXpPlan.globalXp,
    projectId: quest.project_id,
    campaignId: quest.campaign_id,
    metadata: {
      ...metadata,
      source: "vyntro_public_quest_claim",
      claimGuard: "server_recomputed",
      globalXpPolicyVersion: XP_ECONOMY_V1_POLICY.version,
      globalXp: globalXpPlan.globalXp,
      globalXpBand: globalXpPlan.band,
      globalXpDifficulty: globalXpPlan.difficulty,
      globalXpVerificationStrength: globalXpPlan.verificationStrength,
      globalXpCappedByPolicy: globalXpPlan.cappedByPolicy,
      projectRequestedXp: globalXpPlan.projectRequestedXp,
      projectPoints: globalXpPlan.projectPoints,
      questTitle: quest.title ?? "Quest",
      questType: quest.quest_type ?? "custom",
      proofRequired: quest.proof_required === true,
      proofType: quest.proof_type ?? "none",
      verificationType: quest.verification_type ?? "manual_review",
      verificationProvider: quest.verification_provider ?? null,
      completionMode: quest.completion_mode ?? null,
    },
  };
}

export function buildPublicRaidXpAwardPlan(
  raid: PublicRaidAwardRow,
  metadata: Record<string, unknown> = {}
): PublicXpAwardPolicyPlan {
  const baseXp = Math.max(0, Math.floor(toSafeNumber(raid.reward_xp)));

  return {
    sourceType: XP_SOURCE_TYPES.raid,
    sourceId: raid.id,
    baseXp,
    projectId: raid.project_id,
    campaignId: raid.campaign_id,
    metadata: {
      ...metadata,
      source: "vyntro_public_raid_claim",
      claimGuard: "server_recomputed",
      raidTitle: raid.title ?? "Raid",
      raidStatus: raid.status ?? "active",
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toSafeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
