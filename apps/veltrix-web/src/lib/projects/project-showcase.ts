import {
  getSwapTokenByAddress,
  type SwapToken,
} from "../defi/vyntro-swap";
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

export type ProjectShowcaseModel = {
  project: LiveProject;
  heroImageUrl: string | null;
  headline: string;
  story: string;
  badges: string[];
  metrics: ProjectShowcaseMetric[];
  modules: ProjectShowcaseModule[];
  checks: ProjectShowcaseCheck[];
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
  const knownSwapToken = tokenContractAddress ? getSwapTokenByAddress(tokenContractAddress) : null;
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
        href: tokenContractAddress ? buildExplorerUrl(project.chain, tokenContractAddress) ?? `/projects/${project.id}` : `/projects/${project.id}`,
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
        description: "A visible safety read that can later attach explorer source and contract findings.",
        status: getStatus(Boolean(tokenContractAddress || project.nftContractAddress || project.primaryWallet)),
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
      explorerUrl: buildExplorerUrl(project.chain, tokenContractAddress),
      knownSwapToken,
      swapHref,
      label: knownSwapToken?.symbol ?? "Project token",
    },
  };
}
