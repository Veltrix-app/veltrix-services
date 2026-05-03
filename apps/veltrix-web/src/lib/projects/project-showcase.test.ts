import test from "node:test";
import assert from "node:assert/strict";

import { buildProjectShowcase } from "./project-showcase";
import type { LiveProject } from "../../types/live";

const baseProject: LiveProject = {
  id: "project-1",
  name: "VYNTRO Labs",
  description: "Launch OS for community growth.",
  longDescription: "A complete showcase story for launch, token and community context.",
  category: "Growth",
  chain: "Base",
  logo: "https://cdn.example.com/logo.png",
  bannerUrl: "https://cdn.example.com/banner.png",
  members: 12500,
  website: "https://vyntro.example",
  xUrl: "https://x.com/vyntro",
  telegramUrl: "https://t.me/vyntro",
  discordUrl: "https://discord.gg/vyntro",
  docsUrl: "https://docs.example.com",
  waitlistUrl: null,
  launchPostUrl: null,
  tokenContractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  nftContractAddress: null,
  primaryWallet: "0x1234567890abcdef1234567890abcdef12345678",
  brandAccent: "blue",
  brandMood: "premium",
  isFeatured: true,
  isPublic: true,
};

test("project showcase turns existing project data into premium public modules", () => {
  const showcase = buildProjectShowcase({
    project: baseProject,
    campaigns: [
      {
        id: "campaign-1",
        projectId: "project-1",
        title: "Genesis launch",
        description: "Launch campaign",
        bannerUrl: null,
        thumbnailUrl: null,
        xpBudget: 5000,
        featured: true,
        completionRate: 32,
        endsAt: null,
      },
    ],
    quests: [
      {
        id: "quest-1",
        projectId: "project-1",
        campaignId: "campaign-1",
        title: "Daily signal",
        description: "Complete the daily social action.",
        type: "Social",
        questType: "x_follow",
        status: "open",
        xp: 50,
        projectPoints: 50,
        actionLabel: "Open X",
        actionUrl: "https://x.com/vyntro",
        proofRequired: false,
        proofType: "none",
        verificationType: "integration",
        verificationProvider: "x",
        completionMode: "auto",
        verificationConfig: {},
      },
    ],
    rewards: [
      {
        id: "reward-1",
        projectId: "project-1",
        campaignId: "campaign-1",
        title: "Launch reward",
        description: "Funded reward",
        imageUrl: null,
        cost: 100,
        rarity: "rare",
        claimable: true,
        rewardType: "token",
      },
    ],
    raids: [],
  });

  assert.equal(showcase.readinessScore, 100);
  assert.equal(showcase.token.label, "USDC");
  assert.equal(showcase.token.explorerUrl, "https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  assert.equal(showcase.modules.find((module) => module.key === "swap")?.status, "live");
  assert.equal(showcase.metrics.find((metric) => metric.label === "Quests")?.value, "1");
});

test("project showcase clearly reports missing premium fields", () => {
  const showcase = buildProjectShowcase({
    project: {
      ...baseProject,
      bannerUrl: null,
      longDescription: null,
      tokenContractAddress: null,
      primaryWallet: null,
      xUrl: null,
      telegramUrl: null,
      discordUrl: null,
    },
    campaigns: [],
    quests: [],
    rewards: [],
    raids: [],
  });

  assert.ok(showcase.readinessScore < 50);
  assert.equal(showcase.token.configured, false);
  assert.equal(showcase.modules.find((module) => module.key === "token")?.status, "missing");
  assert.match(showcase.nextAction, /Public identity|Story depth|Token contract/);
});
