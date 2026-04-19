import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMUNITY_AUTOMATION_TYPES,
  COMMUNITY_PLAYBOOK_KEYS,
  computeNextCommunityAutomationRunAt,
  getCommunityPlaybookSteps,
  isCommunityAutomationDue,
  normalizeCaptainPermissionList,
} from "./model.js";

test("model exports the supported automation and playbook keys", () => {
  assert.deepEqual(COMMUNITY_AUTOMATION_TYPES, [
    "rank_sync",
    "leaderboard_pulse",
    "mission_digest",
    "raid_reminder",
    "newcomer_pulse",
    "reactivation_pulse",
    "activation_board",
  ]);

  assert.deepEqual(COMMUNITY_PLAYBOOK_KEYS, [
    "launch_week",
    "raid_week",
    "comeback_week",
    "campaign_push",
  ]);
});

test("computeNextCommunityAutomationRunAt advances daily and weekly cadences", () => {
  assert.equal(
    computeNextCommunityAutomationRunAt({
      cadence: "daily",
      fromIso: "2026-04-19T08:00:00.000Z",
    }),
    "2026-04-20T08:00:00.000Z"
  );

  assert.equal(
    computeNextCommunityAutomationRunAt({
      cadence: "weekly",
      fromIso: "2026-04-19T08:00:00.000Z",
    }),
    "2026-04-26T08:00:00.000Z"
  );

  assert.equal(
    computeNextCommunityAutomationRunAt({
      cadence: "manual",
      fromIso: "2026-04-19T08:00:00.000Z",
    }),
    null
  );
});

test("isCommunityAutomationDue only returns true for active due rails", () => {
  assert.equal(
    isCommunityAutomationDue({
      status: "active",
      nextRunAt: "2026-04-19T08:00:00.000Z",
      nowIso: "2026-04-19T08:00:00.000Z",
    }),
    true
  );

  assert.equal(
    isCommunityAutomationDue({
      status: "paused",
      nextRunAt: "2026-04-19T08:00:00.000Z",
      nowIso: "2026-04-19T09:00:00.000Z",
    }),
    false
  );

  assert.equal(
    isCommunityAutomationDue({
      status: "active",
      nextRunAt: "2026-04-20T08:00:00.000Z",
      nowIso: "2026-04-19T09:00:00.000Z",
    }),
    false
  );
});

test("normalizeCaptainPermissionList dedupes and ignores unknown entries", () => {
  assert.deepEqual(
    normalizeCaptainPermissionList([
      "leaderboard_post",
      "raid_alert",
      "leaderboard_post",
      "unknown",
      42,
    ]),
    ["leaderboard_post", "raid_alert"]
  );
});

test("getCommunityPlaybookSteps returns the expected ordered rails per playbook", () => {
  assert.deepEqual(getCommunityPlaybookSteps("launch_week"), [
    "activation_board",
    "mission_digest",
    "leaderboard_pulse",
  ]);

  assert.deepEqual(getCommunityPlaybookSteps("raid_week"), [
    "raid_reminder",
    "leaderboard_pulse",
  ]);

  assert.deepEqual(getCommunityPlaybookSteps("comeback_week"), [
    "reactivation_pulse",
    "mission_digest",
    "leaderboard_pulse",
  ]);

  assert.deepEqual(getCommunityPlaybookSteps("campaign_push"), [
    "activation_board",
    "mission_digest",
  ]);
});
