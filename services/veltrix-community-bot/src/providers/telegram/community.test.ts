import test from "node:test";
import assert from "node:assert/strict";

import { pickBestTelegramContextCandidate } from "./community.js";

function buildCandidate(params: {
  projectId: string;
  commandsEnabled: boolean;
  raidOpsEnabled: boolean;
  updatedAt: string;
}) {
  return {
    context: {
      integrationId: `integration-${params.projectId}`,
      projectId: params.projectId,
      projectName: params.projectId,
      chatId: "-100",
      settings: {
        commandsEnabled: params.commandsEnabled,
        missionCommandsEnabled: true,
        captainCommandsEnabled: true,
        commandDeepLinksEnabled: true,
        captainsEnabled: true,
        leaderboardEnabled: true,
        raidOpsEnabled: params.raidOpsEnabled,
      },
    },
    updatedAt: params.updatedAt,
  };
}

test("prefers the newest enabled Telegram integration when a chat is mapped twice", () => {
  const best = pickBestTelegramContextCandidate([
    buildCandidate({
      projectId: "old-project",
      commandsEnabled: true,
      raidOpsEnabled: true,
      updatedAt: "2026-04-18T14:51:11.388Z",
    }),
    buildCandidate({
      projectId: "new-project",
      commandsEnabled: true,
      raidOpsEnabled: true,
      updatedAt: "2026-04-27T21:12:40.324Z",
    }),
  ]);

  assert.equal(best?.context.projectId, "new-project");
});

