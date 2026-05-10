import assert from "node:assert/strict";
import test from "node:test";
import type { LiveCampaign, LiveQuest, LiveReward } from "@/types/live";
import { buildMissionCockpit } from "./mission-cockpit";

function quest(overrides: Partial<LiveQuest>): LiveQuest {
  return {
    id: "quest-default",
    projectId: "project-1",
    campaignId: "campaign-1",
    title: "Default quest",
    description: "",
    type: "task",
    questType: "url_visit",
    status: "open",
    xp: 100,
    projectPoints: 100,
    actionLabel: null,
    actionUrl: "/defi/swap",
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    verificationProvider: "website",
    completionMode: "integration_auto",
    verificationConfig: null,
    isPlatformQuest: false,
    platformQuestSlug: null,
    platformQuestCadence: null,
    shardRewardAmount: 0,
    shardRewardWindow: null,
    ...overrides,
  };
}

function campaign(overrides: Partial<LiveCampaign> = {}): LiveCampaign {
  return {
    id: "campaign-1",
    projectId: "project-1",
    title: "Main campaign",
    description: "Campaign lane",
    bannerUrl: null,
    thumbnailUrl: null,
    xpBudget: 1000,
    featured: false,
    completionRate: 40,
    endsAt: null,
    ...overrides,
  };
}

function reward(overrides: Partial<LiveReward>): LiveReward {
  return {
    id: "reward-1",
    campaignId: "campaign-1",
    title: "Reward",
    description: "",
    imageUrl: null,
    cost: 50,
    rarity: "rare",
    claimable: false,
    rewardType: "lootbox",
    ...overrides,
  };
}

test("buildMissionCockpit creates a direct action plan for ready integration quests", () => {
  const cockpit = buildMissionCockpit({
    currentQuest: quest({
      id: "swap",
      title: "First verified swap",
      questType: "first_swap",
      actionUrl: "/defi/swap",
      xp: 160,
      shardRewardAmount: 25,
    }),
    allQuests: [quest({ id: "swap" }), quest({ id: "next", title: "Weekly streak", xp: 300 })],
    linkedRewards: [reward({ id: "reward-1" })],
    linkedCampaign: campaign(),
    accountReadyState: "Ready",
    requiredAccount: "wallet",
    providerAccountConnected: true,
    derivedActionUrl: "/defi/swap",
    usesIntegrationVerification: true,
  });

  assert.equal(cockpit.primaryCtaLabel, "Start mission");
  assert.equal(cockpit.primaryCtaState, "ready");
  assert.equal(cockpit.payoff.shards, 25);
  assert.equal(cockpit.payoff.rewardCount, 1);
  assert.equal(cockpit.steps[0]?.state, "complete");
  assert.equal(cockpit.steps[1]?.state, "active");
  assert.equal(cockpit.nextQuest?.id, "next");
});

test("buildMissionCockpit blocks the primary route when a required account is missing", () => {
  const cockpit = buildMissionCockpit({
    currentQuest: quest({ questType: "telegram_join", verificationProvider: "telegram" }),
    allQuests: [],
    linkedRewards: [],
    linkedCampaign: null,
    accountReadyState: "Missing",
    requiredAccount: "telegram",
    providerAccountConnected: false,
    derivedActionUrl: "https://t.me/vyntro",
    usesIntegrationVerification: true,
  });

  assert.equal(cockpit.primaryCtaLabel, "Link Telegram first");
  assert.equal(cockpit.primaryCtaState, "blocked");
  assert.equal(cockpit.steps[0]?.state, "active");
  assert.match(cockpit.headline, /Telegram/i);
});

test("buildMissionCockpit exposes proof submission and completed states", () => {
  const manual = buildMissionCockpit({
    currentQuest: quest({
      id: "proof",
      status: "open",
      proofRequired: true,
      proofType: "tx_hash",
      verificationType: "manual_review",
      verificationProvider: null,
      completionMode: "manual",
      actionUrl: "",
    }),
    allQuests: [],
    linkedRewards: [],
    linkedCampaign: null,
    accountReadyState: "Not required",
    requiredAccount: null,
    providerAccountConnected: true,
    derivedActionUrl: "",
    usesIntegrationVerification: false,
  });

  assert.equal(manual.primaryCtaLabel, "Submit proof");
  assert.equal(manual.primaryCtaState, "proof");
  assert.equal(manual.steps.at(-1)?.state, "active");

  const closed = buildMissionCockpit({
    currentQuest: quest({ status: "approved" }),
    allQuests: [quest({ id: "open", status: "open", xp: 120 })],
    linkedRewards: [],
    linkedCampaign: null,
    accountReadyState: "Ready",
    requiredAccount: null,
    providerAccountConnected: true,
    derivedActionUrl: "/quests",
    usesIntegrationVerification: true,
  });

  assert.equal(closed.primaryCtaLabel, "Mission complete");
  assert.equal(closed.primaryCtaState, "complete");
  assert.equal(closed.steps.every((step) => step.state === "complete"), true);
});
