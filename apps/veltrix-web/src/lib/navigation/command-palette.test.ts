import assert from "node:assert/strict";
import test from "node:test";
import { buildCommandPaletteActions, filterCommandPaletteActions } from "./command-palette";
import { PLATFORM_QUEST_PROJECT_ID } from "../platform-quests/platform-quest-catalog";
import type { LiveProject, LiveQuest, LiveReward } from "../../types/live";

function quest(overrides: Partial<LiveQuest>): LiveQuest {
  return {
    id: "quest-1",
    projectId: null,
    campaignId: null,
    title: "Open the daily loop",
    description: "Open VYNTRO.",
    type: "daily",
    questType: "daily",
    status: "open",
    xp: 100,
    projectPoints: 0,
    actionLabel: null,
    actionUrl: null,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    verificationProvider: null,
    completionMode: null,
    verificationConfig: null,
    ...overrides,
  };
}

function reward(overrides: Partial<LiveReward>): LiveReward {
  return {
    id: "reward-1",
    campaignId: null,
    title: "Shard chest",
    description: "Ready reward.",
    imageUrl: null,
    cost: 100,
    rarity: "rare",
    claimable: false,
    rewardType: "lootbox",
    ...overrides,
  };
}

function project(overrides: Partial<LiveProject>): LiveProject {
  return {
    id: "project-1",
    name: "Other",
    description: "Project",
    category: null,
    chain: null,
    logo: null,
    bannerUrl: null,
    members: 0,
    website: null,
    ...overrides,
  };
}

test("command palette prioritizes claimable reward next quest and VYNTRO project", () => {
  const actions = buildCommandPaletteActions({
    accountReady: true,
    rewards: [reward({ id: "locked", claimable: false, cost: 500 }), reward({ id: "claimable", claimable: true, cost: 250 })],
    quests: [quest({ id: "done", status: "approved", xp: 900 }), quest({ id: "next", status: "open", xp: 300 })],
    projects: [project({ id: PLATFORM_QUEST_PROJECT_ID, name: "VYNTRO" })],
  });

  assert.equal(actions[0]?.href, "/rewards/claimable");
  assert.equal(actions.find((action) => action.id === "open-next-quest-next")?.href, "/quests/next");
  assert.equal(actions.find((action) => action.id === "go-to-vyntro-project")?.href, `/projects/${PLATFORM_QUEST_PROJECT_ID}`);
  assert.ok(actions.some((action) => action.id === "open-swap" && action.href === "/defi/swap"));
});

test("command palette filters actions by label description and keywords", () => {
  const actions = buildCommandPaletteActions({
    accountReady: false,
    rewards: [],
    quests: [],
    projects: [],
  });

  assert.deepEqual(filterCommandPaletteActions(actions, "swap").map((action) => action.id), ["open-swap"]);
  assert.equal(filterCommandPaletteActions(actions, "sign").at(0)?.href, "/sign-in");
});
