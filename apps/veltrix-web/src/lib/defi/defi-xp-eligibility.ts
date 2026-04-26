export type DefiVaultTransactionStatus = "submitted" | "confirmed" | "failed";
export type DefiVaultTransactionAction = "deposit" | "withdraw";

export type DefiVaultTransactionRow = {
  status: DefiVaultTransactionStatus | string | null;
  action: DefiVaultTransactionAction | string | null;
  vault_slug: string | null;
  asset_symbol: string | null;
  tx_hash: string | null;
  confirmed_at: string | null;
};

export type DefiVaultTransactionSummary = {
  confirmedCount: number;
  confirmedDeposits: number;
  confirmedWithdrawals: number;
  uniqueVaults: string[];
  assetsTouched: string[];
  latestConfirmedAt: string | null;
};

export type DefiXpMissionSlug =
  | "connect-wallet"
  | "market-scout"
  | "first-vault-tx"
  | "active-vault-position"
  | "borrow-safety";

export type DefiXpMissionState = "locked" | "eligible" | "active" | "completed" | "warning";

export type DefiXpMission = {
  slug: DefiXpMissionSlug;
  title: string;
  description: string;
  xp: number;
  state: DefiXpMissionState;
  progressLabel: string;
  actionLabel: string;
};

export type DefiXpEligibilityStatus = "wallet-needed" | "ready" | "risk-watch";

export type DefiXpEligibilitySnapshot = {
  status: DefiXpEligibilityStatus;
  headline: string;
  description: string;
  completedXp: number;
  previewXp: number;
  completedMissions: number;
  totalMissions: number;
  nextSafeAction: string;
  missions: DefiXpMission[];
};

export type DefiXpVaultPositionInput = {
  status: string;
  underlyingRaw?: string | number | bigint | null;
  assetSymbol?: string | null;
  vault?: {
    slug?: string | null;
    label?: string | null;
  } | null;
};

export type DefiXpMarketInput = {
  status: string;
  hasSupplyPosition?: boolean | null;
  hasBorrowPosition?: boolean | null;
  asset?: string | null;
  slug?: string | null;
  title?: string | null;
};

export function buildDefiVaultTransactionSummary(
  rows: DefiVaultTransactionRow[]
): DefiVaultTransactionSummary {
  const confirmedRows = rows.filter((row) => row.status === "confirmed");
  const uniqueVaults = Array.from(
    new Set(
      confirmedRows
        .map((row) => row.vault_slug?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
  const assetsTouched = Array.from(
    new Set(
      confirmedRows
        .map((row) => row.asset_symbol?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
  const latestConfirmedAt =
    confirmedRows
      .map((row) => row.confirmed_at)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;

  return {
    confirmedCount: confirmedRows.length,
    confirmedDeposits: confirmedRows.filter((row) => row.action === "deposit").length,
    confirmedWithdrawals: confirmedRows.filter((row) => row.action === "withdraw").length,
    uniqueVaults,
    assetsTouched,
    latestConfirmedAt,
  };
}

export function buildDefiXpEligibilitySnapshot(input: {
  walletReady: boolean;
  vaultPositions: DefiXpVaultPositionInput[];
  markets: DefiXpMarketInput[];
  transactions: DefiVaultTransactionSummary;
}): DefiXpEligibilitySnapshot {
  const activeVaultPositions = input.vaultPositions.filter(
    (position) => position.status === "position-detected" && isPositiveRaw(position.underlyingRaw)
  );
  const readyMarkets = input.markets.filter((market) => market.status === "ready");
  const suppliedMarkets = readyMarkets.filter((market) => Boolean(market.hasSupplyPosition));
  const borrowedMarkets = readyMarkets.filter((market) => Boolean(market.hasBorrowPosition));
  const hasConfirmedVaultAction = input.transactions.confirmedCount > 0;
  const hasWallet = input.walletReady;
  const hasBorrowRisk = borrowedMarkets.length > 0;

  const missions: DefiXpMission[] = [
    {
      slug: "connect-wallet",
      title: "Connect verified wallet",
      description: "Use one wallet spine for vault reads, market reads and future XP issuance.",
      xp: 100,
      state: hasWallet ? "completed" : "eligible",
      progressLabel: hasWallet ? "Wallet connected" : "Required first",
      actionLabel: hasWallet ? "Ready" : "Connect wallet",
    },
    {
      slug: "market-scout",
      title: "Read live Base markets",
      description: "Load market rates, liquidity and collateral posture before asking users to act.",
      xp: 150,
      state: !hasWallet ? "locked" : readyMarkets.length > 0 ? "completed" : "active",
      progressLabel: `${readyMarkets.length}/${Math.max(input.markets.length, 1)} markets live`,
      actionLabel: readyMarkets.length > 0 ? "Market read live" : "Refresh market read",
    },
    {
      slug: "first-vault-tx",
      title: "Complete first vault transaction",
      description: "Deposit or withdraw through the non-custodial vault flow and confirm on-chain.",
      xp: 250,
      state: !hasWallet ? "locked" : hasConfirmedVaultAction ? "completed" : "eligible",
      progressLabel: `${input.transactions.confirmedCount} confirmed tx`,
      actionLabel: hasConfirmedVaultAction ? "Tracked" : "Make first vault move",
    },
    {
      slug: "active-vault-position",
      title: "Hold an active vault position",
      description: "Keep a detected vault position so duration and streak rules can be layered later.",
      xp: 500,
      state: !hasWallet
        ? "locked"
        : activeVaultPositions.length > 0
          ? "completed"
          : hasConfirmedVaultAction
            ? "active"
            : "eligible",
      progressLabel: `${activeVaultPositions.length} active vaults`,
      actionLabel: activeVaultPositions.length > 0 ? "Position detected" : "Open or refresh vault",
    },
    {
      slug: "borrow-safety",
      title: "Keep borrow risk clear",
      description: "Borrow exposure pauses new XP recommendations until health and repay UX are obvious.",
      xp: 0,
      state: !hasWallet ? "locked" : hasBorrowRisk ? "warning" : "completed",
      progressLabel: hasBorrowRisk
        ? `${borrowedMarkets.length} borrow markets`
        : `${suppliedMarkets.length} supply markets / 0 borrows`,
      actionLabel: hasBorrowRisk ? "Review borrow risk" : "Safety clear",
    },
  ];

  const xpMissions = missions.filter((mission) => mission.xp > 0);
  const completedMissions = xpMissions.filter((mission) => mission.state === "completed").length;
  const completedXp = xpMissions
    .filter((mission) => mission.state === "completed")
    .reduce((total, mission) => total + mission.xp, 0);
  const previewXp = xpMissions.reduce((total, mission) => total + mission.xp, 0);

  if (!hasWallet) {
    return {
      status: "wallet-needed",
      headline: "Connect wallet to unlock DeFi XP",
      description: "XP eligibility starts with the verified wallet that signs vault actions.",
      completedXp,
      previewXp,
      completedMissions,
      totalMissions: xpMissions.length,
      nextSafeAction: "Connect wallet before starting DeFi XP missions",
      missions,
    };
  }

  if (hasBorrowRisk) {
    return {
      status: "risk-watch",
      headline: "Borrow risk before rewards",
      description: "This wallet has borrow exposure, so XP recommendations should stay conservative.",
      completedXp,
      previewXp,
      completedMissions,
      totalMissions: xpMissions.length,
      nextSafeAction: "Review, repay or reduce borrow exposure before adding new XP incentives",
      missions,
    };
  }

  return {
    status: "ready",
    headline: "DeFi XP rail is ready",
    description: "Vault activity and live position reads can now feed the next XP economy phase.",
    completedXp,
    previewXp,
    completedMissions,
    totalMissions: xpMissions.length,
    nextSafeAction:
      completedXp >= previewXp
        ? "Define final XP economy rules and anti-abuse thresholds"
        : "Complete the next eligible DeFi mission",
    missions,
  };
}

function isPositiveRaw(value: string | number | bigint | null | undefined) {
  try {
    return BigInt(value ?? 0) > BigInt(0);
  } catch {
    return false;
  }
}
