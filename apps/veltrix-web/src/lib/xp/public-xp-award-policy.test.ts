import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublicQuestXpAwardPlan,
  buildPublicRaidXpAwardPlan,
} from "./public-xp-award-policy";

test("public quest awards ignore client-sized XP and recompute global XP from policy", () => {
  const plan = buildPublicQuestXpAwardPlan(
    {
      id: "quest-1",
      title: "Follow the launch",
      project_id: "project-1",
      campaign_id: "campaign-1",
      xp: 5000,
      quest_type: "social_follow",
      proof_required: false,
      proof_type: "none",
      verification_type: "api_check",
      verification_provider: "x",
      completion_mode: "integration_auto",
      verification_config: {
        difficulty: "expert",
      },
    },
    {
      globalXp: 9999,
      projectPoints: 1,
    }
  );

  assert.equal(plan.sourceType, "quest_completion");
  assert.equal(plan.baseXp, 30);
  assert.equal(plan.projectId, "project-1");
  assert.equal(plan.campaignId, "campaign-1");
  assert.equal(plan.metadata.claimGuard, "server_recomputed");
  assert.equal(plan.metadata.globalXp, 30);
  assert.equal(plan.metadata.projectRequestedXp, 5000);
  assert.equal(plan.metadata.projectPoints, 5000);
  assert.equal(plan.metadata.globalXpCappedByPolicy, true);
});

test("public raid awards use the stored raid reward instead of trusting client input", () => {
  const plan = buildPublicRaidXpAwardPlan(
    {
      id: "raid-1",
      title: "Launch raid",
      project_id: "project-1",
      campaign_id: "campaign-1",
      reward_xp: 180,
      status: "active",
    },
    {
      baseXp: 9999,
    }
  );

  assert.equal(plan.sourceType, "raid_completion");
  assert.equal(plan.baseXp, 180);
  assert.equal(plan.projectId, "project-1");
  assert.equal(plan.campaignId, "campaign-1");
  assert.equal(plan.metadata.claimGuard, "server_recomputed");
  assert.equal(plan.metadata.raidTitle, "Launch raid");
});
