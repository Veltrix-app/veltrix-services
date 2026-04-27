import { XP_ECONOMY_V1_POLICY, XP_SOURCE_TYPES, calculateQuestGlobalXp } from "./xp-economy";
import type { UserXpAwardSourceType } from "./xp-awards";

export type QuestSubmissionDecision = "approved" | "rejected";

export type QuestSubmissionDecisionQuest = {
  id: string;
  title: string;
  xp: number;
  projectId: string | null;
  campaignId: string | null;
  questType: string | null;
  proofRequired?: boolean | null;
  proofType?: string | null;
  verificationType?: string | null;
  verificationProvider?: string | null;
  completionMode?: string | null;
  difficulty?: string | null;
};

export type QuestSubmissionDecisionPlan = {
  decision: QuestSubmissionDecision;
  nextQuestStatuses: Record<string, string>;
  shouldAwardXp: boolean;
  xpAward: {
    sourceType: UserXpAwardSourceType;
    sourceId: string;
    baseXp: number;
    projectId: string | null;
    campaignId: string | null;
    metadata: Record<string, unknown>;
  } | null;
  audit: {
    action: "quest_submission_approved" | "quest_submission_rejected";
    summary: string;
    metadata: Record<string, unknown>;
  };
  notification: {
    title: string;
    body: string;
    metadata: Record<string, unknown>;
  };
};

export function normalizeQuestSubmissionDecision(value: unknown): QuestSubmissionDecision | null {
  return value === "approved" || value === "rejected" ? value : null;
}

export function buildQuestSubmissionDecisionPlan(input: {
  decision: QuestSubmissionDecision;
  submissionId: string;
  reviewerAuthUserId: string;
  quest: QuestSubmissionDecisionQuest;
  existingQuestStatuses?: Record<string, string>;
  reviewNotes?: string;
}): QuestSubmissionDecisionPlan {
  const reviewNotes = input.reviewNotes?.trim() ?? "";
  const globalXpPlan = calculateQuestGlobalXp({
    questType: input.quest.questType,
    requestedXp: input.quest.xp,
    difficulty: input.quest.difficulty,
    proofRequired: input.quest.proofRequired,
    proofType: input.quest.proofType,
    verificationType: input.quest.verificationType,
    verificationProvider: input.quest.verificationProvider,
    completionMode: input.quest.completionMode,
  });
  const shouldAwardXp = input.decision === "approved" && globalXpPlan.globalXp > 0;
  const baseMetadata = {
    submissionId: input.submissionId,
    questId: input.quest.id,
    questTitle: input.quest.title,
    questType: input.quest.questType,
    proofRequired: input.quest.proofRequired ?? null,
    proofType: input.quest.proofType ?? null,
    verificationType: input.quest.verificationType ?? null,
    verificationProvider: input.quest.verificationProvider ?? null,
    completionMode: input.quest.completionMode ?? null,
    reviewerAuthUserId: input.reviewerAuthUserId,
    reviewNotes,
    source: "quest_submission_decision",
    globalXpPolicyVersion: XP_ECONOMY_V1_POLICY.version,
    globalXp: globalXpPlan.globalXp,
    globalXpBand: globalXpPlan.band,
    globalXpDifficulty: globalXpPlan.difficulty,
    globalXpVerificationStrength: globalXpPlan.verificationStrength,
    globalXpCappedByPolicy: globalXpPlan.cappedByPolicy,
    projectRequestedXp: globalXpPlan.projectRequestedXp,
    projectPoints: globalXpPlan.projectPoints,
  };

  return {
    decision: input.decision,
    nextQuestStatuses: {
      ...(input.existingQuestStatuses ?? {}),
      [input.quest.id]: input.decision,
    },
    shouldAwardXp,
    xpAward: shouldAwardXp
      ? {
          sourceType: XP_SOURCE_TYPES.quest,
          sourceId: input.quest.id,
          baseXp: globalXpPlan.globalXp,
          projectId: input.quest.projectId,
          campaignId: input.quest.campaignId,
          metadata: baseMetadata,
        }
      : null,
    audit: {
      action:
        input.decision === "approved"
          ? "quest_submission_approved"
          : "quest_submission_rejected",
      summary:
        input.decision === "approved"
          ? `${input.quest.title} was approved and routed through the central XP economy.`
          : `${input.quest.title} was rejected and no XP was issued.`,
      metadata: baseMetadata,
    },
    notification:
      input.decision === "approved"
        ? {
            title: "Quest approved",
            body: `${input.quest.title} was approved. XP is now synced through VYNTRO's central economy.`,
            metadata: baseMetadata,
          }
        : {
            title: "Quest needs another look",
            body: `${input.quest.title} was rejected. Review the notes and submit clearer proof when you are ready.`,
            metadata: baseMetadata,
          },
  };
}
