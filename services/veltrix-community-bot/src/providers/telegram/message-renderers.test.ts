import test from "node:test";
import assert from "node:assert/strict";

import { formatTelegramMissionBoard } from "./message-renderers.js";

test("telegram mission board labels quest rewards as project points", () => {
  const message = formatTelegramMissionBoard({
    campaigns: [{ id: "campaign-1", title: "Launch season" }],
    quests: [{ id: "quest-1", title: "Join Discord", projectPoints: 750 }],
    rewards: [{ id: "reward-1", title: "Allowlist", cost: 250 }],
  });

  assert.match(message, /\+750 project pts/);
  assert.doesNotMatch(message, /\+750 XP/);
});
