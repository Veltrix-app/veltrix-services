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
    description: "Deposit directly from the connected wallet after the vault route is checked.",
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

export function buildDefiMissionOverview(): DefiMissionOverview {
  return {
    productName: "Veltrix DeFi Missions",
    heroTitle: "Earn XP for verified DeFi actions",
    heroDescription:
      "A calm savings-style mission surface where users can discover vaults, move funds with their own wallet and later earn XP for verified on-chain activity.",
    primaryCta: "Start with USDC",
    secondaryCta: "View risk notes",
    disclosure:
      "Underlying vault infrastructure: Moonwell ERC-4626 vaults. Veltrix does not custody funds, promise yield, or manage deposits.",
    vaults,
    productRails: [
      {
        label: "Phase 1",
        value: "Live read",
        description: "Read vault shares, withdrawable value and wallet posture directly from Base.",
      },
      {
        label: "Phase 2",
        value: "Move funds",
        description: "Add non-custodial deposit and withdraw flows with wallet approval checks.",
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
