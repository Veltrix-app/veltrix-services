import test from "node:test";
import assert from "node:assert/strict";
import {
  findNextDiscordRankRule,
  getDiscordRankSignalValue,
  getMatchedDiscordRankRules,
} from "./ranks.js";
import type { DiscordRankRule } from "./community.js";

const snapshot = {
  globalXp: 1200,
  projectXp: 600,
  trust: 72,
  walletVerified: true,
};

const rules: DiscordRankRule[] = [
  {
    id: "project-100",
    sourceType: "project_xp",
    threshold: 100,
    discordRoleId: "role-1",
    label: "Scout",
  },
  {
    id: "project-500",
    sourceType: "project_xp",
    threshold: 500,
    discordRoleId: "role-2",
    label: "Vanguard",
  },
  {
    id: "project-1000",
    sourceType: "project_xp",
    threshold: 1000,
    discordRoleId: "role-3",
    label: "Elite Raider",
  },
  {
    id: "global-1000",
    sourceType: "global_xp",
    threshold: 1000,
    discordRoleId: "role-4",
    label: "Signal Graph",
  },
  {
    id: "trust-80",
    sourceType: "trust",
    threshold: 80,
    discordRoleId: "role-5",
    label: "Trusted Core",
  },
  {
    id: "wallet",
    sourceType: "wallet_verified",
    threshold: 1,
    discordRoleId: "role-6",
    label: "Verified Wallet",
  },
];

test("getMatchedDiscordRankRules returns every live match for the snapshot", () => {
  const matched = getMatchedDiscordRankRules(snapshot, rules).map((rule) => rule.label);

  assert.deepEqual(matched, ["Verified Wallet", "Scout", "Vanguard", "Signal Graph"]);
});

test("getDiscordRankSignalValue resolves numeric values for each source", () => {
  assert.equal(getDiscordRankSignalValue(snapshot, "project_xp"), 600);
  assert.equal(getDiscordRankSignalValue(snapshot, "global_xp"), 1200);
  assert.equal(getDiscordRankSignalValue(snapshot, "trust"), 72);
  assert.equal(getDiscordRankSignalValue(snapshot, "wallet_verified"), 1);
});

test("findNextDiscordRankRule picks the nearest unmet unlock for the chosen source", () => {
  const nextRule = findNextDiscordRankRule(snapshot, rules, "project_xp");

  assert.ok(nextRule);
  assert.equal(nextRule.rule.label, "Elite Raider");
  assert.equal(nextRule.currentValue, 600);
  assert.equal(nextRule.gap, 400);
});

test("findNextDiscordRankRule returns null when every rule for the source is already matched", () => {
  const nextRule = findNextDiscordRankRule(snapshot, rules, "wallet_verified");

  assert.equal(nextRule, null);
});
