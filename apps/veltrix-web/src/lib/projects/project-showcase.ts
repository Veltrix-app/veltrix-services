import {
  getSwapTokenByAddress,
  isEvmAddress,
  type ProjectSwapTokenRegistryEntry,
  type SwapToken,
} from "../defi/vyntro-swap";
import type { ProjectTokenPriceSnapshot } from "../defi/vyntro-prices";
import type {
  LiveCampaign,
  LiveProject,
  LiveQuest,
  LiveRaid,
  LiveReward,
} from "../../types/live";

export type ProjectShowcaseStatus = "live" | "ready" | "missing";

export type ProjectShowcaseMetric = {
  label: string;
  value: string;
  sub: string;
};

export type ProjectShowcaseModule = {
  key: string;
  label: string;
  title: string;
  description: string;
  status: ProjectShowcaseStatus;
  href: string;
};

export type ProjectShowcaseCheck = {
  label: string;
  detail: string;
  status: ProjectShowcaseStatus;
};

export type ProjectShowcaseScanSeverity = "positive" | "info" | "warning" | "danger";

export type ProjectShowcaseContractScanEnrichment = {
  sourceVerified: boolean | null;
  abiAvailable: boolean | null;
  proxyDetected: boolean | null;
  ownerRenounced: boolean | null;
  auditUrl: string | null;
  explorerSourceUrl: string | null;
  updatedAt: string | null;
};

export type ProjectShowcaseContractScanFinding = {
  label: string;
  detail: string;
  evidence: string;
  severity: ProjectShowcaseScanSeverity;
};

export type ProjectShowcaseContractScan = {
  status: ProjectShowcaseStatus;
  riskLevel: "low" | "medium" | "high" | "unknown";
  score: number;
  summary: string;
  enrichment: ProjectShowcaseContractScanEnrichment;
  findings: ProjectShowcaseContractScanFinding[];
  nextAction: string;
};

export type ProjectShowcasePremiumModule = {
  key: "market-intelligence" | "contract-intelligence" | "activation-engine" | "reward-assurance";
  eyebrow: string;
  title: string;
  description: string;
  status: ProjectShowcaseStatus;
  primaryMetric: string;
  secondaryMetric: string;
  highlights: string[];
  href: string;
  ctaLabel: string;
};

export type ProjectShowcaseModel = {
  project: LiveProject;
  heroImageUrl: string | null;
  headline: string;
  story: string;
  badges: string[];
  metrics: ProjectShowcaseMetric[];
  modules: ProjectShowcaseModule[];
  checks: ProjectShowcaseCheck[];
  premiumModules: ProjectShowcasePremiumModule[];
  contractScan: ProjectShowcaseContractScan;
  readinessScore: number;
  nextAction: string;
  socialLinks: Array<{
    label: string;
    href: string;
  }>;
  token: {
    configured: boolean;
    contractAddress: string | null;
    explorerUrl: string | null;
    knownSwapToken: SwapToken | null;
    swapHref: string;
    label: string;
    price: ProjectTokenPriceSnapshot | null;
  };
};

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function clean(value: string | null | undefined) {
  return hasValue(value) ? value!.trim() : null;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPriceChange(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Pending";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function buildExplorerUrl(chain: string | null | undefined, address: string | null) {
  if (!address) return null;
  const normalizedChain = (chain ?? "").toLowerCase();

  if (normalizedChain.includes("base")) return `https://basescan.org/address/${address}`;
  if (normalizedChain.includes("bnb") || normalizedChain.includes("bsc")) {
    return `https://bscscan.com/address/${address}`;
  }
  if (normalizedChain.includes("eth")) return `https://etherscan.io/address/${address}`;

  return null;
}

function getStatus(ready: boolean, live: boolean = ready): ProjectShowcaseStatus {
  if (live) return "live";
  if (ready) return "ready";
  return "missing";
}

function scoreStatus(status: ProjectShowcaseStatus) {
  if (status === "live") return 1;
  if (status === "ready") return 0.75;
  return 0;
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getScanRiskLevel(score: number, hasCriticalFinding: boolean) {
  if (hasCriticalFinding) return "high";
  if (score >= 80) return "low";
  if (score >= 55) return "medium";
  return "high";
}

const EMPTY_SCAN_ENRICHMENT: ProjectShowcaseContractScanEnrichment = {
  sourceVerified: null,
  abiAvailable: null,
  proxyDetected: null,
  ownerRenounced: null,
  auditUrl: null,
  explorerSourceUrl: null,
  updatedAt: null,
};

function normalizeScanEnrichment(
  enrichment: Partial<ProjectShowcaseContractScanEnrichment> | null | undefined
): ProjectShowcaseContractScanEnrichment {
  return {
    ...EMPTY_SCAN_ENRICHMENT,
    sourceVerified:
      typeof enrichment?.sourceVerified === "boolean" ? enrichment.sourceVerified : null,
    abiAvailable: typeof enrichment?.abiAvailable === "boolean" ? enrichment.abiAvailable : null,
    proxyDetected: typeof enrichment?.proxyDetected === "boolean" ? enrichment.proxyDetected : null,
    ownerRenounced: typeof enrichment?.ownerRenounced === "boolean" ? enrichment.ownerRenounced : null,
    auditUrl: clean(enrichment?.auditUrl),
    explorerSourceUrl: clean(enrichment?.explorerSourceUrl),
    updatedAt: clean(enrichment?.updatedAt),
  };
}

function buildProjectContractScan(input: {
  project: LiveProject;
  tokenContractAddress: string | null;
  knownSwapToken: SwapToken | null;
  explorerUrl: string | null;
  tokenPrice: ProjectTokenPriceSnapshot | null | undefined;
  enrichment?: Partial<ProjectShowcaseContractScanEnrichment> | null;
}): ProjectShowcaseContractScan {
  const nftContractAddress = clean(input.project.nftContractAddress);
  const primaryWallet = clean(input.project.primaryWallet);
  const hasContractSource = Boolean(input.tokenContractAddress || nftContractAddress);
  const enrichment = normalizeScanEnrichment(input.enrichment);

  if (!hasContractSource) {
    return {
      status: "missing",
      riskLevel: "unknown",
      score: 0,
      summary: "No contract source has been connected for the public scan yet.",
      enrichment,
      findings: [
        {
          label: "Contract source",
          detail: "Add a token or NFT contract before VYNTRO can publish a safety read.",
          evidence: "Project Settings",
          severity: "warning",
        },
      ],
      nextAction: "Add a token or NFT contract to start the AI contract scan.",
    };
  }

  const findings: ProjectShowcaseContractScanFinding[] = [];
  let score = 32;
  let hasCriticalFinding = false;

  if (input.tokenContractAddress) {
    if (isEvmAddress(input.tokenContractAddress)) {
      score += 16;
      findings.push({
        label: "Token contract",
        detail: "Token contract is a valid EVM address and can be routed to explorer checks.",
        evidence: input.tokenContractAddress,
        severity: "positive",
      });
    } else {
      score -= 28;
      hasCriticalFinding = true;
      findings.push({
        label: "Token contract",
        detail: "Token contract does not look like a valid EVM address.",
        evidence: input.tokenContractAddress,
        severity: "danger",
      });
    }
  } else {
    score -= 6;
    findings.push({
      label: "Token contract",
      detail: "No project token contract is present, so the scan can only use secondary sources.",
      evidence: "Project Settings",
      severity: "warning",
    });
  }

  if (nftContractAddress) {
    if (isEvmAddress(nftContractAddress)) {
      score += 8;
      findings.push({
        label: "NFT contract",
        detail: "NFT contract is available as a secondary on-chain identity signal.",
        evidence: nftContractAddress,
        severity: "info",
      });
    } else {
      score -= 18;
      hasCriticalFinding = true;
      findings.push({
        label: "NFT contract",
        detail: "NFT contract does not look like a valid EVM address.",
        evidence: nftContractAddress,
        severity: "danger",
      });
    }
  }

  if (input.knownSwapToken?.source === "project") {
    score += 18;
    findings.push({
      label: "Swap registry",
      detail: "Project token is registered for VYNTRO swap prefill and token list discovery.",
      evidence: input.knownSwapToken.symbol,
      severity: "positive",
    });
  } else if (input.knownSwapToken) {
    score += 12;
    findings.push({
      label: "Swap registry",
      detail: "Contract is recognized by the launch swap registry.",
      evidence: input.knownSwapToken.symbol,
      severity: "positive",
    });
  } else if (input.tokenContractAddress && isEvmAddress(input.tokenContractAddress)) {
    score -= 8;
    findings.push({
      label: "Swap registry",
      detail: "Contract is valid but not yet registered as a public project swap asset.",
      evidence: "Project Assets",
      severity: "warning",
    });
  }

  if (input.tokenPrice?.status === "live") {
    score += 12;
    findings.push({
      label: "Market price",
      detail: "Live DEX market snapshot is available for the public token module.",
      evidence: input.tokenPrice.formattedPrice,
      severity: "positive",
    });
  } else if (input.tokenContractAddress && isEvmAddress(input.tokenContractAddress)) {
    score -= 6;
    findings.push({
      label: "Market price",
      detail: "Live price source is pending, so users do not yet see market depth context.",
      evidence: "DexScreener",
      severity: "warning",
    });
  }

  if (input.explorerUrl) {
    score += 10;
    findings.push({
      label: "Explorer route",
      detail: "Chain-specific explorer link is ready for public diligence.",
      evidence: input.explorerUrl,
      severity: "positive",
    });
  } else {
    score -= 6;
    findings.push({
      label: "Explorer route",
      detail: "Chain route is not mapped to a public explorer yet.",
      evidence: input.project.chain ?? "Unknown chain",
      severity: "warning",
    });
  }

  if (primaryWallet) {
    if (isEvmAddress(primaryWallet)) {
      score += 10;
      findings.push({
        label: "Treasury context",
        detail: "Primary wallet is available as treasury or operations context.",
        evidence: primaryWallet,
        severity: "positive",
      });
    } else {
      score -= 8;
      findings.push({
        label: "Treasury context",
        detail: "Primary wallet is present but does not look like a valid EVM address.",
        evidence: primaryWallet,
        severity: "warning",
      });
    }
  } else {
    score -= 4;
    findings.push({
      label: "Treasury context",
      detail: "No primary wallet is present for ownership or treasury context.",
      evidence: "Project Settings",
      severity: "warning",
    });
  }

  if (enrichment.sourceVerified === true) {
    score += 12;
    findings.push({
      label: "Verified source",
      detail: "Explorer source verification is marked as complete for the public scan.",
      evidence: enrichment.explorerSourceUrl ?? input.explorerUrl ?? "Explorer",
      severity: "positive",
    });
  } else if (enrichment.sourceVerified === false) {
    score -= 12;
    findings.push({
      label: "Verified source",
      detail: "Explorer source verification is marked as missing.",
      evidence: enrichment.explorerSourceUrl ?? input.explorerUrl ?? "Explorer",
      severity: "warning",
    });
  }

  if (enrichment.abiAvailable === true) {
    score += 8;
    findings.push({
      label: "ABI read",
      detail: "ABI availability is confirmed, so deeper function-level scans can be attached.",
      evidence: enrichment.explorerSourceUrl ?? "Explorer ABI",
      severity: "positive",
    });
  } else if (enrichment.abiAvailable === false) {
    score -= 6;
    findings.push({
      label: "ABI read",
      detail: "ABI availability is not confirmed yet.",
      evidence: "Explorer ABI",
      severity: "warning",
    });
  }

  if (enrichment.auditUrl) {
    score += 10;
    findings.push({
      label: "External audit",
      detail: "Audit evidence is attached to the public contract scan.",
      evidence: enrichment.auditUrl,
      severity: "positive",
    });
  }

  if (enrichment.proxyDetected === true) {
    score -= 10;
    findings.push({
      label: "Proxy posture",
      detail: "Proxy contract signal is enabled; users should see upgradeability context.",
      evidence: "Project Assets metadata",
      severity: "warning",
    });
  } else if (enrichment.proxyDetected === false) {
    score += 5;
    findings.push({
      label: "Proxy posture",
      detail: "No proxy contract signal is marked for this asset.",
      evidence: "Project Assets metadata",
      severity: "info",
    });
  }

  if (enrichment.ownerRenounced === true) {
    score += 8;
    findings.push({
      label: "Ownership posture",
      detail: "Ownership is marked as renounced or materially constrained.",
      evidence: "Project Assets metadata",
      severity: "positive",
    });
  } else if (enrichment.ownerRenounced === false) {
    score -= 6;
    findings.push({
      label: "Ownership posture",
      detail: "Ownership is not marked as renounced, so admin-key context should remain visible.",
      evidence: "Project Assets metadata",
      severity: "warning",
    });
  }

  const normalizedScore = clampScore(score);
  const riskLevel = getScanRiskLevel(normalizedScore, hasCriticalFinding);
  const status: ProjectShowcaseStatus =
    normalizedScore >= 80 && riskLevel === "low" ? "live" : normalizedScore >= 45 ? "ready" : "missing";
  const nextFinding =
    findings.find((finding) => finding.severity === "danger") ??
    findings.find((finding) => finding.severity === "warning") ??
    null;

  return {
    status,
    riskLevel,
    score: normalizedScore,
    summary:
      status === "live"
        ? "AI scan has registry, market, explorer and enrichment signals ready for public diligence."
        : "AI scan preview is available, but more contract context is needed before it should read as low risk.",
    enrichment,
    findings,
    nextAction: nextFinding
      ? `${nextFinding.label}: ${nextFinding.detail}`
      : "Scan can graduate into ABI and source-code analysis.",
  };
}

function buildProjectPremiumModules(input: {
  project: LiveProject;
  projectCampaigns: LiveCampaign[];
  projectQuests: LiveQuest[];
  projectRaids: LiveRaid[];
  projectRewards: LiveReward[];
  tokenContractAddress: string | null;
  knownSwapToken: SwapToken | null;
  swapHref: string;
  tokenPrice: ProjectTokenPriceSnapshot | null;
  contractScan: ProjectShowcaseContractScan;
}): ProjectShowcasePremiumModule[] {
  const claimableRewards = input.projectRewards.filter((reward) => reward.claimable).length;
  const liveTokenPrice = input.tokenPrice?.status === "live" ? input.tokenPrice : null;

  return [
    {
      key: "market-intelligence",
      eyebrow: "Market",
      title: `${input.knownSwapToken?.symbol ?? input.project.name} market read`,
      description: "Live price, explorer route and swap intent condensed into one investor-style module.",
      status: getStatus(Boolean(input.tokenContractAddress), Boolean(liveTokenPrice && input.knownSwapToken)),
      primaryMetric: liveTokenPrice?.formattedPrice ?? "Pending",
      secondaryMetric: input.knownSwapToken ? "Swap route live" : "Registry pending",
      highlights: [
        input.tokenContractAddress ? "Contract attached" : "Contract missing",
        liveTokenPrice ? "DEX price live" : "Price pending",
        input.knownSwapToken ? "Swap prefill ready" : "Add project token registry",
      ],
      href: input.swapHref,
      ctaLabel: "Open swap",
    },
    {
      key: "contract-intelligence",
      eyebrow: "Security",
      title: "AI contract intelligence",
      description: "Explorer, registry, ABI, source and ownership signals shaped into a public trust read.",
      status: input.contractScan.status,
      primaryMetric: `${input.contractScan.score}%`,
      secondaryMetric:
        input.contractScan.riskLevel === "unknown"
          ? "Risk unknown"
          : `${input.contractScan.riskLevel} risk`,
      highlights: input.contractScan.findings.slice(0, 3).map((finding) => finding.label),
      href: `/projects/${input.project.id}#security`,
      ctaLabel: "Review scan",
    },
    {
      key: "activation-engine",
      eyebrow: "Activation",
      title: "Community action engine",
      description: "Campaigns, quests and raids show users exactly where to contribute next.",
      status: getStatus(input.projectQuests.length > 0 || input.projectRaids.length > 0),
      primaryMetric: String(input.projectQuests.length + input.projectRaids.length),
      secondaryMetric: `${input.projectCampaigns.length} campaigns`,
      highlights: [
        `${input.projectQuests.length} daily quests`,
        `${input.projectRaids.length} raids`,
        input.projectCampaigns[0]?.title ?? "Campaign pending",
      ],
      href: input.projectQuests[0] ? `/quests/${input.projectQuests[0].id}` : "/quests",
      ctaLabel: "Start mission",
    },
    {
      key: "reward-assurance",
      eyebrow: "Rewards",
      title: "Reward assurance layer",
      description: "Visible rewards and claim state make the project economy easier to trust.",
      status: getStatus(input.projectRewards.length > 0),
      primaryMetric: String(input.projectRewards.length),
      secondaryMetric: `${claimableRewards} claimable`,
      highlights: [
        `${claimableRewards} rewards claimable now`,
        input.projectRewards[0]?.rarity ? `${input.projectRewards[0].rarity} lead reward` : "Reward pending",
        input.projectRewards[0]?.rewardType ?? "Funding posture pending",
      ],
      href: input.projectRewards[0] ? `/rewards/${input.projectRewards[0].id}` : "/rewards",
      ctaLabel: "View rewards",
    },
  ];
}

function getProjectRewards(params: {
  projectId: string;
  campaignIds: Set<string>;
  rewards: LiveReward[];
}) {
  return params.rewards.filter(
    (reward) =>
      reward.projectId === params.projectId ||
      (reward.campaignId ? params.campaignIds.has(reward.campaignId) : false)
  );
}

function getProjectRaids(params: {
  projectId: string;
  campaignIds: Set<string>;
  raids: LiveRaid[];
}) {
  return params.raids.filter(
    (raid) =>
      raid.projectId === params.projectId ||
      (raid.campaignId ? params.campaignIds.has(raid.campaignId) : false)
  );
}

export function buildProjectShowcase(input: {
  project: LiveProject;
  campaigns: LiveCampaign[];
  quests: LiveQuest[];
  rewards: LiveReward[];
  raids: LiveRaid[];
  projectSwapTokens?: ProjectSwapTokenRegistryEntry[];
  tokenPrice?: ProjectTokenPriceSnapshot | null;
  contractScanEnrichment?: Partial<ProjectShowcaseContractScanEnrichment> | null;
}): ProjectShowcaseModel {
  const { project } = input;
  const projectCampaigns = input.campaigns.filter((campaign) => campaign.projectId === project.id);
  const campaignIds = new Set(projectCampaigns.map((campaign) => campaign.id));
  const projectQuests = input.quests.filter((quest) => quest.projectId === project.id);
  const projectRewards = getProjectRewards({
    projectId: project.id,
    campaignIds,
    rewards: input.rewards,
  });
  const projectRaids = getProjectRaids({
    projectId: project.id,
    campaignIds,
    raids: input.raids,
  });
  const featuredCampaign = projectCampaigns.find((campaign) => campaign.featured) ?? projectCampaigns[0] ?? null;
  const heroImageUrl =
    clean(project.bannerUrl) ?? clean(featuredCampaign?.bannerUrl) ?? clean(featuredCampaign?.thumbnailUrl);
  const tokenContractAddress = clean(project.tokenContractAddress);
  const knownSwapToken = tokenContractAddress
    ? getSwapTokenByAddress(tokenContractAddress, {
        projectTokens: input.projectSwapTokens,
      })
    : null;
  const tokenExplorerUrl = buildExplorerUrl(project.chain, tokenContractAddress);
  const contractScan = buildProjectContractScan({
    project,
    tokenContractAddress,
    knownSwapToken,
    explorerUrl: tokenExplorerUrl,
    tokenPrice: input.tokenPrice,
    enrichment: input.contractScanEnrichment,
  });
  const swapHref = knownSwapToken
    ? `/defi/swap?buy=${encodeURIComponent(knownSwapToken.symbol)}&project=${encodeURIComponent(project.id)}`
    : tokenContractAddress
      ? `/defi/swap?project=${encodeURIComponent(project.id)}&projectToken=${encodeURIComponent(tokenContractAddress)}`
      : `/defi/swap?project=${encodeURIComponent(project.id)}`;
  const hasSocialLink =
    hasValue(project.xUrl) || hasValue(project.telegramUrl) || hasValue(project.discordUrl);
  const checks: ProjectShowcaseCheck[] = [
    {
      label: "Public identity",
      detail: hasValue(project.logo) && hasValue(project.bannerUrl)
        ? "Logo and banner are present."
        : "Add a logo and banner for a premium first read.",
      status: getStatus(hasValue(project.logo) && hasValue(project.bannerUrl)),
    },
    {
      label: "Story depth",
      detail: hasValue(project.longDescription)
        ? "Long-form narrative can power the showcase."
        : "Add a long-form narrative in the portal.",
      status: getStatus(hasValue(project.longDescription)),
    },
    {
      label: "Token contract",
      detail: tokenContractAddress
        ? "Contract address is ready for scan and swap routing."
        : "Add a token contract to unlock token modules.",
      status: getStatus(Boolean(tokenContractAddress)),
    },
    {
      label: "Treasury context",
      detail: hasValue(project.primaryWallet)
        ? "Primary wallet is available for safety context."
        : "Add a primary wallet for stronger trust posture.",
      status: getStatus(hasValue(project.primaryWallet)),
    },
    {
      label: "Social graph",
      detail: hasSocialLink
        ? "Community links can route users into live channels."
        : "Add X, Telegram or Discord links.",
      status: getStatus(hasSocialLink),
    },
    {
      label: "Activation layer",
      detail: projectQuests.length > 0
        ? "Daily quests can appear directly on the showcase."
        : "Create at least one live quest for daily activation.",
      status: getStatus(projectQuests.length > 0),
    },
  ];
  const readinessScore = Math.round(
    (checks.reduce((sum, check) => sum + scoreStatus(check.status), 0) / checks.length) * 100
  );
  const missingCheck = checks.find((check) => check.status === "missing");
  const liveTokenPrice = input.tokenPrice?.status === "live" ? input.tokenPrice : null;
  const premiumModules = buildProjectPremiumModules({
    project,
    projectCampaigns,
    projectQuests,
    projectRaids,
    projectRewards,
    tokenContractAddress,
    knownSwapToken,
    swapHref,
    tokenPrice: input.tokenPrice ?? null,
    contractScan,
  });

  return {
    project,
    heroImageUrl,
    headline: project.name,
    story:
      clean(project.longDescription) ??
      clean(project.description) ??
      "This project has not published a full showcase story yet.",
    badges: [
      project.chain ?? "Chain pending",
      project.category ?? "Project",
      project.isFeatured ? "Featured" : "Listed",
      projectCampaigns.length > 0 ? "Live ecosystem" : "Public profile",
    ],
    metrics: [
      ...(liveTokenPrice
        ? [
            {
              label: "Price",
              value: liveTokenPrice.formattedPrice,
              sub: "live DEX snapshot",
            },
            {
              label: "24h",
              value: formatPriceChange(liveTokenPrice.priceChange24hPercent),
              sub: "market movement",
            },
          ]
        : []),
      {
        label: "Members",
        value: formatCompactNumber(project.members),
        sub: "public community footprint",
      },
      {
        label: "Campaigns",
        value: String(projectCampaigns.length),
        sub: "activation lanes",
      },
      {
        label: "Quests",
        value: String(projectQuests.length),
        sub: "daily actions",
      },
      {
        label: "Rewards",
        value: String(projectRewards.length),
        sub: "claim surfaces",
      },
    ],
    modules: [
      {
        key: "story",
        label: "Showcase",
        title: "Project story",
        description: "CoinMarketCap-style profile, project context, links and launch narrative.",
        status: getStatus(hasValue(project.website) && hasValue(project.description)),
        href: `/projects/${project.id}`,
      },
      {
        key: "token",
        label: "Market",
        title: "Token profile",
        description: "Contract, explorer route and token context prepared from portal fields.",
        status: getStatus(Boolean(tokenContractAddress)),
        href: tokenContractAddress ? tokenExplorerUrl ?? `/projects/${project.id}` : `/projects/${project.id}`,
      },
      {
        key: "swap",
        label: "Swap",
        title: "Preset swap route",
        description: "Open the VYNTRO swap UI with this project token as the intended route.",
        status: getStatus(Boolean(tokenContractAddress && knownSwapToken), Boolean(tokenContractAddress && knownSwapToken)),
        href: swapHref,
      },
      {
        key: "security",
        label: "Security",
        title: "AI scan preview",
        description: "Contract, registry, market and treasury signals condensed into a public safety read.",
        status: contractScan.status,
        href: `/projects/${project.id}#security`,
      },
      {
        key: "quests",
        label: "Activation",
        title: "Daily quests",
        description: "Always-on quests and project tasks routed from the existing quest economy.",
        status: getStatus(projectQuests.length > 0),
        href: projectQuests[0] ? `/quests/${projectQuests[0].id}` : `/quests`,
      },
      {
        key: "rewards",
        label: "Rewards",
        title: "Reward assurance",
        description: "Visible reward surfaces connected to campaign and escrow/funding posture.",
        status: getStatus(projectRewards.length > 0),
        href: projectRewards[0] ? `/rewards/${projectRewards[0].id}` : `/rewards`,
      },
    ],
    checks,
    premiumModules,
    contractScan,
    readinessScore,
    nextAction: missingCheck
      ? `${missingCheck.label}: ${missingCheck.detail}`
      : "Showcase is ready for premium public traffic.",
    socialLinks: [
      { label: "Website", href: clean(project.website) ?? "" },
      { label: "X", href: clean(project.xUrl) ?? "" },
      { label: "Telegram", href: clean(project.telegramUrl) ?? "" },
      { label: "Discord", href: clean(project.discordUrl) ?? "" },
      { label: "Docs", href: clean(project.docsUrl) ?? "" },
    ].filter((item) => item.href),
    token: {
      configured: Boolean(tokenContractAddress),
      contractAddress: tokenContractAddress,
      explorerUrl: tokenExplorerUrl,
      knownSwapToken,
      swapHref,
      label: knownSwapToken?.symbol ?? "Project token",
      price: input.tokenPrice ?? null,
    },
  };
}
