import test from "node:test";
import assert from "node:assert/strict";

import { buildProjectShowcase } from "./project-showcase";
import { VYNTRO_SWAP_CHAIN_ID, type ProjectSwapTokenRegistryEntry } from "../defi/vyntro-swap";
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

test("project showcase marks swap live for a token registered by project contract", () => {
  const projectSwapTokens: ProjectSwapTokenRegistryEntry[] = [
    {
      projectId: "project-1",
      symbol: "VYN",
      label: "VYNTRO Labs Token",
      address: "0x1111111111111111111111111111111111111111",
      decimals: 18,
      chainId: VYNTRO_SWAP_CHAIN_ID,
      accent: "violet",
      priceId: "dexscreener:base:0x1111111111111111111111111111111111111111",
    },
  ];
  const showcase = buildProjectShowcase({
    project: {
      ...baseProject,
      tokenContractAddress: "0x1111111111111111111111111111111111111111",
    },
    campaigns: [],
    quests: [],
    rewards: [],
    raids: [],
    projectSwapTokens,
  });

  assert.equal(showcase.token.label, "VYN");
  assert.equal(showcase.token.knownSwapToken?.source, "project");
  assert.equal(showcase.modules.find((module) => module.key === "swap")?.status, "live");
  assert.equal(showcase.token.swapHref, "/defi/swap?buy=VYN&project=project-1");
});

test("project showcase can expose a live token price snapshot", () => {
  const showcase = buildProjectShowcase({
    project: baseProject,
    campaigns: [],
    quests: [],
    rewards: [],
    raids: [],
    tokenPrice: {
      status: "live",
      symbol: "USDC",
      tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      priceUsd: 1.0004,
      formattedPrice: "$1.00",
      priceChange24hPercent: 0.02,
      liquidityUsd: 12000000,
      fdvUsd: 1000000000,
      dexId: "aerodrome",
      pairAddress: "0xpair",
      pairUrl: "https://dexscreener.com/base/0xpair",
      updatedAt: "2026-05-03T12:00:00.000Z",
    },
  });

  assert.equal(showcase.token.price?.status, "live");
  assert.equal(showcase.token.price?.formattedPrice, "$1.00");
  assert.equal(showcase.metrics.find((metric) => metric.label === "Price")?.value, "$1.00");
  assert.equal(showcase.metrics.find((metric) => metric.label === "24h")?.value, "+0.02%");
});

test("project showcase produces a live AI contract scan when registry and market signals are present", () => {
  const tokenAddress = "0x1111111111111111111111111111111111111111";
  const showcase = buildProjectShowcase({
    project: {
      ...baseProject,
      tokenContractAddress: tokenAddress,
    },
    campaigns: [],
    quests: [],
    rewards: [],
    raids: [],
    projectSwapTokens: [
      {
        projectId: "project-1",
        symbol: "VYN",
        label: "VYNTRO Labs Token",
        address: tokenAddress,
        decimals: 18,
        chainId: VYNTRO_SWAP_CHAIN_ID,
        accent: "cyan",
        priceId: `dexscreener:base:${tokenAddress}`,
      },
    ],
    tokenPrice: {
      status: "live",
      symbol: "VYN",
      tokenAddress,
      priceUsd: 0.12,
      formattedPrice: "$0.120000",
      priceChange24hPercent: 4.25,
      liquidityUsd: 250000,
      fdvUsd: 12000000,
      dexId: "aerodrome",
      pairAddress: "0xpair",
      pairUrl: "https://dexscreener.com/base/0xpair",
      updatedAt: "2026-05-03T12:00:00.000Z",
    },
  });

  assert.equal(showcase.contractScan.status, "live");
  assert.equal(showcase.contractScan.riskLevel, "low");
  assert.ok(showcase.contractScan.score >= 80);
  assert.equal(showcase.modules.find((module) => module.key === "security")?.status, "live");
  assert.ok(showcase.contractScan.findings.some((finding) => finding.label === "Swap registry"));
});

test("project showcase enriches the contract scan from explorer source and audit metadata", () => {
  const tokenAddress = "0x1111111111111111111111111111111111111111";
  const showcase = buildProjectShowcase({
    project: {
      ...baseProject,
      tokenContractAddress: tokenAddress,
    },
    campaigns: [],
    quests: [],
    rewards: [],
    raids: [],
    projectSwapTokens: [
      {
        projectId: "project-1",
        symbol: "VYN",
        label: "VYNTRO Labs Token",
        address: tokenAddress,
        decimals: 18,
        chainId: VYNTRO_SWAP_CHAIN_ID,
        accent: "cyan",
      },
    ],
    contractScanEnrichment: {
      sourceVerified: true,
      abiAvailable: true,
      auditUrl: "https://audit.example.com/vyn",
      proxyDetected: false,
      ownerRenounced: true,
      explorerSourceUrl: "https://basescan.org/address/0x1111111111111111111111111111111111111111#code",
    },
  });

  assert.equal(showcase.contractScan.enrichment.sourceVerified, true);
  assert.equal(showcase.contractScan.enrichment.auditUrl, "https://audit.example.com/vyn");
  assert.ok(showcase.contractScan.score >= 90);
  assert.ok(showcase.contractScan.findings.some((finding) => finding.label === "Verified source"));
  assert.ok(showcase.contractScan.findings.some((finding) => finding.label === "External audit"));
});

test("project showcase builds richer premium project page modules", () => {
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
    raids: [
      {
        id: "raid-1",
        projectId: "project-1",
        campaignId: "campaign-1",
        title: "Launch raid",
        community: "VYNTRO",
        timer: "24h",
        reward: 250,
        participants: 80,
        progress: 45,
        target: "Share launch",
        banner: "https://cdn.example.com/raid.png",
        instructions: [],
      },
    ],
  });

  assert.deepEqual(
    showcase.premiumModules.map((module) => module.key),
    ["market-intelligence", "contract-intelligence", "activation-engine", "reward-assurance"]
  );
  assert.equal(showcase.premiumModules.find((module) => module.key === "activation-engine")?.status, "live");
  assert.equal(showcase.premiumModules.find((module) => module.key === "reward-assurance")?.primaryMetric, "1");
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
  assert.equal(showcase.contractScan.status, "missing");
  assert.equal(showcase.contractScan.riskLevel, "unknown");
  assert.equal(showcase.modules.find((module) => module.key === "token")?.status, "missing");
  assert.match(showcase.nextAction, /Public identity|Story depth|Token contract/);
  assert.match(showcase.contractScan.nextAction, /token or NFT contract/i);
});
