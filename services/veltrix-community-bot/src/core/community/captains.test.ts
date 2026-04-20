import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCaptainSeatKey,
  captainHasPermission,
  captainSeatMatchesScope,
  getCaptainScopeForAutomation,
  normalizeCaptainConfigMetadata,
  normalizeCaptainSeatScope,
} from "./captains.js";
import type { CommunityCaptainPermission } from "./model.js";

test("normalizeCaptainConfigMetadata expands legacy auth-user permission and scope maps into seat keys", () => {
  const authUserId = "user_123";
  const captainSeatKey = buildCaptainSeatKey(authUserId, "community_captain");
  const raidLeadSeatKey = buildCaptainSeatKey(authUserId, "raid_lead");

  const normalized = normalizeCaptainConfigMetadata({
    captainAssignments: [
      {
        authUserId,
        role: "community_captain",
        label: "Main captain",
      },
      {
        authUserId,
        role: "raid_lead",
        label: "Raid lead",
      },
    ],
    captainPermissionMap: {
      [authUserId]: ["leaderboard_post", "raid_alert"],
    },
    captainSeatScopeMap: {
      [authUserId]: "community_only",
    },
  });

  assert.deepEqual(normalized.assignments, [
    {
      authUserId,
      role: "community_captain",
      label: "Main captain",
    },
    {
      authUserId,
      role: "raid_lead",
      label: "Raid lead",
    },
  ]);
  assert.deepEqual(normalized.permissionMap[captainSeatKey], [
    "leaderboard_post",
    "raid_alert",
  ]);
  assert.deepEqual(normalized.permissionMap[raidLeadSeatKey], [
    "leaderboard_post",
    "raid_alert",
  ]);
  assert.equal(normalized.seatScopeMap[captainSeatKey], "community_only");
  assert.equal(normalized.seatScopeMap[raidLeadSeatKey], "community_only");
});

test("captainHasPermission respects required seat scopes instead of broad captain titles", () => {
  const leaderboardPermissions = ["leaderboard_post"] as CommunityCaptainPermission[];
  const activationPermissions = ["activation_board"] as CommunityCaptainPermission[];
  const captain = {
    permissions: [
      "activation_board",
      "leaderboard_post",
    ] as CommunityCaptainPermission[],
    seatScopes: [
      {
        scope: "community_only" as const,
        permissions: leaderboardPermissions,
      },
      {
        scope: "project_only" as const,
        permissions: activationPermissions,
      },
    ],
  };

  assert.equal(
    captainHasPermission(captain, "leaderboard_post", "community_only"),
    true
  );
  assert.equal(
    captainHasPermission(captain, "leaderboard_post", "project_and_community"),
    false
  );
  assert.equal(
    captainHasPermission(captain, "activation_board", "project_and_community"),
    false
  );
  assert.equal(
    captainHasPermission(captain, "activation_board", "project_only"),
    true
  );
});

test("scope helpers keep automation lanes and seat scope matching explicit", () => {
  assert.equal(getCaptainScopeForAutomation("rank_sync"), "community_only");
  assert.equal(getCaptainScopeForAutomation("newcomer_pulse"), "project_and_community");
  assert.equal(captainSeatMatchesScope("project_and_community", "community_only"), true);
  assert.equal(captainSeatMatchesScope("project_only", "community_only"), false);
  assert.equal(normalizeCaptainSeatScope("unknown"), "project_and_community");
});
