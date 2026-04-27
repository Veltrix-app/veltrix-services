import test from "node:test";
import assert from "node:assert/strict";

import { buildDiscordMissionFields } from "./command-renderers.js";

test("mission board renders quest rewards as project points, not global XP", () => {
  const fields = buildDiscordMissionFields({
    campaigns: [{ id: "campaign-1", title: "Launch season" }],
    quests: [{ id: "quest-1", title: "Follow the launch", projectPoints: 5000 }],
    rewards: [{ id: "reward-1", title: "Allowlist", cost: 250 }],
  });

  assert.equal(fields[1]?.name, "Quest lane");
  assert.match(fields[1]?.value ?? "", /\+5000 project pts/);
  assert.doesNotMatch(fields[1]?.value ?? "", /\+5000 XP/);
});
