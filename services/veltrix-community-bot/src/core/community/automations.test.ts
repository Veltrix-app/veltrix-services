import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveCommunityAutomationDeepLink,
  resolveCommunityAutomationJourneyLane,
} from "./automation-links.js";
import { buildActivationBoardCandidate } from "./activation-board.js";
import {
  getProjectRewardVisibilityFilter,
  PROJECT_REWARD_SELECT_COLUMNS,
} from "./project-state-selects.js";

test("project reward state select only uses live rewards columns", () => {
  const selectedColumns = PROJECT_REWARD_SELECT_COLUMNS.split(",").map((column) => column.trim());

  assert.deepEqual(selectedColumns, [
    "id",
    "title",
    "cost",
    "rarity",
    "image_url",
    "campaign_id",
  ]);
  assert.equal(selectedColumns.includes("description"), false);
});

test("project reward state filters use the live rewards visibility contract", () => {
  const filter = getProjectRewardVisibilityFilter();

  assert.deepEqual(filter, { column: "visible", value: true });
  assert.notEqual(filter.column, "status");
});

test("activation board can use a draft campaign once live surfaces are attached", () => {
  const candidate = buildActivationBoardCandidate({
    campaigns: [
      {
        id: "campaign-draft",
        title: "Community Starter",
        featured: true,
        status: "draft",
        created_at: "2026-04-29T08:00:00.000Z",
      },
    ],
    quests: [],
    raids: [{ campaign_id: "campaign-draft" }],
    rewards: [],
    segmentSummary: {
      newcomers: 3,
      reactivation: 0,
      core: 0,
      commandReady: 2,
    },
  });

  assert.equal(candidate?.campaignId, "campaign-draft");
  assert.equal(candidate?.campaignStatus, "draft");
  assert.equal(candidate?.activationReadiness, "content_ready");
  assert.match(candidate?.recommendedCopy ?? "", /live surfaces/i);
});

test("resolveCommunityAutomationJourneyLane maps pulse automations onto the right journey lane", () => {
  assert.equal(resolveCommunityAutomationJourneyLane("newcomer_pulse"), "onboarding");
  assert.equal(resolveCommunityAutomationJourneyLane("reactivation_pulse"), "comeback");
  assert.equal(resolveCommunityAutomationJourneyLane("mission_digest"), "active");
  assert.equal(resolveCommunityAutomationJourneyLane("activation_board"), "active");
});

test("resolveCommunityAutomationDeepLink sends onboarding and comeback pulses into the member journey rails", () => {
  assert.match(
    resolveCommunityAutomationDeepLink({
      projectId: "project-123",
      automationType: "newcomer_pulse",
    }),
    /\/community\/onboarding\?projectId=project-123$/
  );

  assert.match(
    resolveCommunityAutomationDeepLink({
      projectId: "project-123",
      automationType: "reactivation_pulse",
    }),
    /\/community\/comeback\?projectId=project-123$/
  );

  assert.match(
    resolveCommunityAutomationDeepLink({
      projectId: "project-123",
      automationType: "activation_board",
    }),
    /\/community\?projectId=project-123$/
  );
});
