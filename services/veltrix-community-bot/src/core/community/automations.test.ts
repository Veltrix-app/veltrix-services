import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveCommunityAutomationDeepLink,
  resolveCommunityAutomationJourneyLane,
} from "./automation-links.js";

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
