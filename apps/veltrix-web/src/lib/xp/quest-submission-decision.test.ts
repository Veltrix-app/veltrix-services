import test from "node:test";
import assert from "node:assert/strict";

import {
  buildQuestSubmissionDecisionPlan,
  normalizeQuestSubmissionDecision,
} from "./quest-submission-decision";

test("quest submission decisions only accept approved or rejected", () => {
  assert.equal(normalizeQuestSubmissionDecision("approved"), "approved");
  assert.equal(normalizeQuestSubmissionDecision("rejected"), "rejected");
  assert.equal(normalizeQuestSubmissionDecision("pending"), null);
  assert.equal(normalizeQuestSubmissionDecision(""), null);
});

test("approved quest submission decisions create an XP award intent and approved progress patch", () => {
  const plan = buildQuestSubmissionDecisionPlan({
    decision: "approved",
    submissionId: "submission-1",
    reviewerAuthUserId: "reviewer-1",
    quest: {
      id: "quest-1",
      title: "Join the launch",
      xp: 150,
      projectId: "project-1",
      campaignId: "campaign-1",
      questType: "telegram_join",
      verificationType: "bot_check",
      verificationProvider: "telegram",
      completionMode: "integration_auto",
    },
    existingQuestStatuses: {
      "quest-1": "pending",
      "quest-2": "approved",
    },
    reviewNotes: "Looks clean",
  });

  assert.equal(plan.shouldAwardXp, true);
  assert.equal(plan.nextQuestStatuses["quest-1"], "approved");
  assert.equal(plan.xpAward?.sourceId, "quest-1");
  assert.equal(plan.xpAward?.baseXp, 25);
  assert.equal(plan.xpAward?.metadata.projectRequestedXp, 150);
  assert.equal(plan.xpAward?.metadata.globalXpPolicyVersion, "xp-economy-v1");
  assert.equal(plan.xpAward?.metadata.questTitle, "Join the launch");
  assert.equal(plan.audit.action, "quest_submission_approved");
  assert.equal(plan.notification.title, "Quest approved");
});

test("approved quest submission decisions cap inflated manual project xp", () => {
  const plan = buildQuestSubmissionDecisionPlan({
    decision: "approved",
    submissionId: "submission-2",
    reviewerAuthUserId: "reviewer-1",
    quest: {
      id: "quest-2",
      title: "Write a launch recap",
      xp: 5000,
      projectId: "project-1",
      campaignId: "campaign-1",
      questType: "content_submit",
      proofRequired: true,
      proofType: "url",
      verificationType: "manual_review",
      completionMode: "manual",
    },
  });

  assert.equal(plan.shouldAwardXp, true);
  assert.equal(plan.xpAward?.baseXp, 81);
  assert.equal(plan.xpAward?.metadata.projectPoints, 5000);
  assert.equal(plan.xpAward?.metadata.globalXpCappedByPolicy, true);
});

test("rejected quest submission decisions never create an XP award intent", () => {
  const plan = buildQuestSubmissionDecisionPlan({
    decision: "rejected",
    submissionId: "submission-1",
    reviewerAuthUserId: "reviewer-1",
    quest: {
      id: "quest-1",
      title: "Join the launch",
      xp: 150,
      projectId: "project-1",
      campaignId: "campaign-1",
      questType: "telegram_join",
    },
    existingQuestStatuses: {
      "quest-1": "pending",
    },
    reviewNotes: "Proof did not match",
  });

  assert.equal(plan.shouldAwardXp, false);
  assert.equal(plan.xpAward, null);
  assert.equal(plan.nextQuestStatuses["quest-1"], "rejected");
  assert.equal(plan.audit.action, "quest_submission_rejected");
  assert.equal(plan.notification.title, "Quest needs another look");
});
