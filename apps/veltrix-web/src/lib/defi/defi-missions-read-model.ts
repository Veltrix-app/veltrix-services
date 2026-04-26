import type { MoonwellVaultPositionRead } from "./moonwell-vaults";

export type DefiMissionStep = {
  label: string;
  description: string;
  state: "ready" | "next" | "locked";
};

export type DefiVaultMission = {
  slug: string;
  title: string;
  asset: string;
  chain: string;
  intent: string;
  apyLabel: string;
  liquidityLabel: string;
  withdrawalLabel: string;
  riskLabel: string;
  accent: "lime" | "cyan" | "violet" | "amber";
  actionLabel: string;
  subtleProtocolLabel: string;
  steps: DefiMissionStep[];
  rewardPreview: {
    phase: string;
    label: string;
    description: string;
  };
};

export type DefiMissionOverview = {
  productName: string;
  heroTitle: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  disclosure: string;
  vaults: DefiVaultMission[];
  productRails: Array<{
    label: string;
    value: string;
    description: string;
  }>;
};

export type MoonwellMarketOpportunity = {
  slug: string;
  title: string;
  asset: string;
  chain: "Base";
  mode: "read-only";
  primaryAction: string;
  signal: string;
  description: string;
  riskLabel: string;
  accent: "lime" | "cyan" | "violet" | "amber";
};

export type MoonwellPortfolioPosture = {
  status: "wallet-needed" | "loading" | "empty" | "active" | "read-error";
  headline: string;
  description: string;
  activeVaults: number;
  detectedAssets: string[];
  nextSafeAction: string;
};

export type MoonwellMarketExpansion = {
  title: string;
  description: string;
  markets: MoonwellMarketOpportunity[];
  portfolio: MoonwellPortfolioPosture;
  borrowRail: {
    label: string;
    status: "later";
    description: string;
  };
  nextRails: Array<{
    label: string;
    value: string;
    description: string;
  }>;
};

const missionSteps: DefiMissionStep[] = [
  {
    label: "Connect wallet",
    description: "Link the wallet that will complete the verified DeFi action.",
    state: "ready",
  },
  {
    label: "Review vault",
    description: "Read the asset, chain, withdrawal posture and risk note before acting.",
    state: "next",
  },
  {
    label: "Open position",
    description: "Deposit or withdraw directly from the connected wallet after route checks pass.",
    state: "locked",
  },
  {
    label: "Hold position",
    description: "The XP economy will reward verified duration after this first surface ships.",
    state: "locked",
  },
];

const vaults: DefiVaultMission[] = [
  {
    slug: "usdc-vault",
    title: "USDC Vault",
    asset: "USDC",
    chain: "Base",
    intent: "Stablecoin yield mission for users who want the clearest first DeFi action.",
    apyLabel: "Variable",
    liquidityLabel: "High signal",
    withdrawalLabel: "Vault liquidity based",
    riskLabel: "Stablecoin and smart-contract risk",
    accent: "lime",
    actionLabel: "Start USDC mission",
    subtleProtocolLabel: "Underlying: Moonwell ERC-4626",
    steps: missionSteps,
    rewardPreview: {
      phase: "XP economy next",
      label: "Hold-to-earn track",
      description: "After verification lands, this mission becomes a 7/14/30 day XP rail.",
    },
  },
  {
    slug: "eth-vault",
    title: "ETH Vault",
    asset: "ETH",
    chain: "Base",
    intent: "Native asset mission for users who already keep ETH on Base.",
    apyLabel: "Variable",
    liquidityLabel: "ETH route",
    withdrawalLabel: "Vault liquidity based",
    riskLabel: "ETH market and smart-contract risk",
    accent: "cyan",
    actionLabel: "Review ETH mission",
    subtleProtocolLabel: "Underlying: Moonwell ERC-4626",
    steps: missionSteps,
    rewardPreview: {
      phase: "XP economy next",
      label: "Position streak",
      description: "Duration, minimum position and revisit actions can unlock XP tiers.",
    },
  },
  {
    slug: "eurc-vault",
    title: "EURC Vault",
    asset: "EURC",
    chain: "Base",
    intent: "Euro stable mission for users who prefer EUR-denominated exposure.",
    apyLabel: "Variable",
    liquidityLabel: "Emerging route",
    withdrawalLabel: "Vault liquidity based",
    riskLabel: "Stablecoin and liquidity risk",
    accent: "violet",
    actionLabel: "Review EURC mission",
    subtleProtocolLabel: "Underlying: Moonwell ERC-4626",
    steps: missionSteps,
    rewardPreview: {
      phase: "XP economy next",
      label: "Diversification badge",
      description: "Future economy can reward users who complete multi-asset DeFi rails.",
    },
  },
  {
    slug: "cbbtc-vault",
    title: "cbBTC Vault",
    asset: "cbBTC",
    chain: "Base",
    intent: "Bitcoin-denominated mission for higher-conviction DeFi users.",
    apyLabel: "Variable",
    liquidityLabel: "BTC route",
    withdrawalLabel: "Vault liquidity based",
    riskLabel: "BTC market, liquidity and smart-contract risk",
    accent: "amber",
    actionLabel: "Review cbBTC mission",
    subtleProtocolLabel: "Underlying: Moonwell ERC-4626",
    steps: missionSteps,
    rewardPreview: {
      phase: "XP economy next",
      label: "Advanced DeFi tier",
      description: "This can become a higher-requirement mission once verification is active.",
    },
  },
];

const moonwellMarkets: MoonwellMarketOpportunity[] = [
  {
    slug: "usdc-market",
    title: "USDC market",
    asset: "USDC",
    chain: "Base",
    mode: "read-only",
    primaryAction: "Review supply route",
    signal: "Stable first market",
    description: "Track lending-market liquidity, supply demand and future supply missions.",
    riskLabel: "Stablecoin and smart-contract risk",
    accent: "lime",
  },
  {
    slug: "eth-market",
    title: "ETH market",
    asset: "ETH",
    chain: "Base",
    mode: "read-only",
    primaryAction: "Review ETH supply",
    signal: "Core collateral asset",
    description: "Prepare a clean supply posture before any borrow experience is exposed.",
    riskLabel: "Market movement and smart-contract risk",
    accent: "cyan",
  },
  {
    slug: "eurc-market",
    title: "EURC market",
    asset: "EURC",
    chain: "Base",
    mode: "read-only",
    primaryAction: "Review EURC route",
    signal: "Euro stable rail",
    description: "Surface regional stablecoin opportunities without adding leverage yet.",
    riskLabel: "Stablecoin, liquidity and peg risk",
    accent: "violet",
  },
  {
    slug: "well-rewards",
    title: "Rewards posture",
    asset: "WELL",
    chain: "Base",
    mode: "read-only",
    primaryAction: "Watch rewards",
    signal: "Claim center next",
    description: "Lay the read layer for claimable rewards, badges and campaign boosts.",
    riskLabel: "Reward availability can vary",
    accent: "amber",
  },
];

function buildPortfolioPosture(input: {
  walletReady: boolean;
  readStatus: "wallet-missing" | "loading" | "ready" | "error";
  vaultPositions: MoonwellVaultPositionRead[];
}): MoonwellPortfolioPosture {
  if (!input.walletReady || input.readStatus === "wallet-missing") {
    return {
      status: "wallet-needed",
      headline: "Connect wallet to build portfolio posture",
      description: "Vaults, market reads and future rewards need the same verified wallet spine.",
      activeVaults: 0,
      detectedAssets: [],
      nextSafeAction: "Connect a verified wallet",
    };
  }

  if (input.readStatus === "loading") {
    return {
      status: "loading",
      headline: "Reading Base positions",
      description: "We are checking vault positions before recommending the next safe DeFi action.",
      activeVaults: 0,
      detectedAssets: [],
      nextSafeAction: "Wait for the read to finish",
    };
  }

  if (input.readStatus === "error") {
    return {
      status: "read-error",
      headline: "Portfolio read needs another attempt",
      description: "The wallet is connected, but the current Base read failed.",
      activeVaults: 0,
      detectedAssets: [],
      nextSafeAction: "Refresh the vault read",
    };
  }

  const activePositions = input.vaultPositions.filter(
    (position) => position.status === "position-detected"
  );
  const detectedAssets = Array.from(new Set(activePositions.map((position) => position.assetSymbol)));

  if (activePositions.length === 0) {
    return {
      status: "empty",
      headline: "No Moonwell position detected yet",
      description: "Start with a low-complexity vault before moving into markets, rewards or XP.",
      activeVaults: 0,
      detectedAssets: [],
      nextSafeAction: "Review USDC Vault first",
    };
  }

  return {
    status: "active",
    headline: "Moonwell position detected",
    description: "Your wallet already has DeFi posture we can turn into future XP eligibility.",
    activeVaults: activePositions.length,
    detectedAssets,
    nextSafeAction: "Review detected positions before adding market actions",
  };
}

export function buildDefiMissionOverview(): DefiMissionOverview {
  return {
    productName: "VYNTRO DeFi Missions",
    heroTitle: "Earn XP for verified DeFi actions",
    heroDescription:
      "A calm savings-style mission surface where users can discover vaults, move funds with their own wallet and later earn XP for verified on-chain activity.",
    primaryCta: "Start with USDC",
    secondaryCta: "View risk notes",
    disclosure:
      "Underlying vault infrastructure: Moonwell ERC-4626 vaults. VYNTRO does not custody funds, promise yield, or manage deposits; users sign every transaction from their own wallet.",
    vaults,
    productRails: [
      {
        label: "Phase 1",
        value: "Live read",
        description: "Read vault shares, withdrawable value and wallet posture directly from Base.",
      },
      {
        label: "Phase 2",
        value: "Tracked tx",
        description: "Non-custodial deposit and withdraw flows with approval checks and tx logging.",
      },
      {
        label: "Phase 3",
        value: "Reward",
        description: "Add XP, streaks, badges and sponsored DeFi reward budgets.",
      },
    ],
  };
}

export function getPrimaryVaultMission() {
  return vaults[0];
}

export function buildMoonwellMarketExpansion(input: {
  walletReady: boolean;
  readStatus: "wallet-missing" | "loading" | "ready" | "error";
  vaultPositions: MoonwellVaultPositionRead[];
}): MoonwellMarketExpansion {
  return {
    title: "Moonwell market cockpit",
    description:
      "A read-first expansion layer for lending markets, portfolio posture and rewards before we expose higher-risk actions.",
    markets: moonwellMarkets,
    portfolio: buildPortfolioPosture(input),
    borrowRail: {
      label: "Borrow and repay",
      status: "later",
      description:
        "Borrow flows come later, after collateral, liquidation and health-factor UX are strong enough for real users.",
    },
    nextRails: [
      {
        label: "Next",
        value: "Market reads",
        description: "Show supply APY, liquidity and caps before any new transaction flow.",
      },
      {
        label: "Then",
        value: "Rewards",
        description: "Add claimable rewards and campaign boosts once position reads are stable.",
      },
      {
        label: "Later",
        value: "Borrow",
        description: "Only launch borrow after liquidation-risk education is unmistakable.",
      },
    ],
  };
}
