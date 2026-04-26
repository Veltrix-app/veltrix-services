import { XP_SOURCE_TYPES } from "./xp-economy";
import type { UserXpAwardSourceType } from "./xp-awards";

export type QuestSubmissionDecision = "approved" | "rejected";

export type QuestSubmissionDecisionQuest = {
  id: string;
  title: string;
  xp: number;
  projectId: string | null;
  campaignId: string | null;
  questType: string | null;
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
  const shouldAwardXp = input.decision === "approved" && input.quest.xp > 0;
  const baseMetadata = {
    submissionId: input.submissionId,
    questId: input.quest.id,
    questTitle: input.quest.title,
    questType: input.quest.questType,
    reviewerAuthUserId: input.reviewerAuthUserId,
    reviewNotes,
    source: "quest_submission_decision",
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
          baseXp: input.quest.xp,
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
