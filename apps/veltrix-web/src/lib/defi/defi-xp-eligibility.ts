import { XP_SOURCE_TYPES, buildXpSourceRef } from "../xp/xp-economy";

export type DefiVaultTransactionStatus = "submitted" | "confirmed" | "failed";
export type DefiVaultTransactionAction = "deposit" | "withdraw";
export type DefiMarketTransactionAction =
  | "supply"
  | "withdraw"
  | "enable-collateral"
  | "borrow"
  | "repay";

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

export type DefiMarketTransactionRow = {
  status: DefiVaultTransactionStatus | string | null;
  action: DefiMarketTransactionAction | string | null;
  market_slug: string | null;
  asset_symbol: string | null;
  tx_hash: string | null;
  confirmed_at: string | null;
};

export type DefiMarketTransactionSummary = {
  confirmedCount: number;
  confirmedSupplies: number;
  confirmedWithdrawals: number;
  confirmedCollateralEnables: number;
  confirmedBorrows: number;
  confirmedRepays: number;
  uniqueMarkets: string[];
  assetsTouched: string[];
  latestConfirmedAt: string | null;
};

export type DefiXpMissionSlug =
  | "connect-wallet"
  | "market-scout"
  | "first-vault-tx"
  | "active-vault-position"
  | "first-market-supply"
  | "collateral-ready"
  | "repay-discipline"
  | "borrow-safety";

export type DefiXpMissionState = "locked" | "eligible" | "active" | "completed" | "warning";
export type DefiXpClaimState = "locked" | "claimable" | "claimed";

export const DEFI_XP_SOURCE_TYPE = XP_SOURCE_TYPES.defi;

export type DefiXpMission = {
  slug: DefiXpMissionSlug;
  title: string;
  description: string;
  xp: number;
  state: DefiXpMissionState;
  claimState: DefiXpClaimState;
  sourceType: typeof DEFI_XP_SOURCE_TYPE;
  sourceRef: string;
  progressLabel: string;
  actionLabel: string;
};

export type DefiXpEligibilityStatus = "wallet-needed" | "ready" | "risk-watch";

export type DefiXpEligibilitySnapshot = {
  status: DefiXpEligibilityStatus;
  headline: string;
  description: string;
  completedXp: number;
  claimedXp: number;
  claimableXp: number;
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
  collateralEnabled?: boolean | null;
  asset?: string | null;
  slug?: string | null;
  title?: string | null;
};

export type DefiXpClaimPlan =
  | {
      ok: true;
      mission: DefiXpMission;
      event: {
        sourceType: typeof DEFI_XP_SOURCE_TYPE;
        sourceRef: string;
        xpAmount: number;
      };
    }
  | {
      ok: false;
      alreadyClaimed: boolean;
      error: string;
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

export function buildDefiMarketTransactionSummary(
  rows: DefiMarketTransactionRow[]
): DefiMarketTransactionSummary {
  const confirmedRows = rows.filter((row) => row.status === "confirmed");
  const uniqueMarkets = Array.from(
    new Set(
      confirmedRows
        .map((row) => row.market_slug?.trim())
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
    confirmedSupplies: confirmedRows.filter((row) => row.action === "supply").length,
    confirmedWithdrawals: confirmedRows.filter((row) => row.action === "withdraw").length,
    confirmedCollateralEnables: confirmedRows.filter(
      (row) => row.action === "enable-collateral"
    ).length,
    confirmedBorrows: confirmedRows.filter((row) => row.action === "borrow").length,
    confirmedRepays: confirmedRows.filter((row) => row.action === "repay").length,
    uniqueMarkets,
    assetsTouched,
    latestConfirmedAt,
  };
}

export function buildDefiXpSourceRef(slug: DefiXpMissionSlug) {
  return buildXpSourceRef(DEFI_XP_SOURCE_TYPE, slug);
}

export function buildDefiXpEligibilitySnapshot(input: {
  walletReady: boolean;
  claimedSourceRefs?: string[];
  vaultPositions: DefiXpVaultPositionInput[];
  markets: DefiXpMarketInput[];
  transactions: DefiVaultTransactionSummary;
  marketTransactions?: DefiMarketTransactionSummary;
}): DefiXpEligibilitySnapshot {
  const marketTransactions =
    input.marketTransactions ?? buildDefiMarketTransactionSummary([]);
  const activeVaultPositions = input.vaultPositions.filter(
    (position) => position.status === "position-detected" && isPositiveRaw(position.underlyingRaw)
  );
  const readyMarkets = input.markets.filter((market) => market.status === "ready");
  const suppliedMarkets = readyMarkets.filter((market) => Boolean(market.hasSupplyPosition));
  const borrowedMarkets = readyMarkets.filter((market) => Boolean(market.hasBorrowPosition));
  const collateralMarkets = readyMarkets.filter((market) => Boolean(market.collateralEnabled));
  const hasConfirmedVaultAction = input.transactions.confirmedCount > 0;
  const hasConfirmedMarketSupply = marketTransactions.confirmedSupplies > 0;
  const hasCollateralEnabled =
    marketTransactions.confirmedCollateralEnables > 0 || collateralMarkets.length > 0;
  const hasConfirmedRepay = marketTransactions.confirmedRepays > 0;
  const hasWallet = input.walletReady;
  const hasBorrowRisk = borrowedMarkets.length > 0;
  const claimedSourceRefs = new Set(input.claimedSourceRefs ?? []);

  const baseMissions: Array<Omit<DefiXpMission, "claimState" | "sourceType" | "sourceRef">> = [
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
      slug: "first-market-supply",
      title: "Supply into a lending market",
      description: "Complete a confirmed market supply action before any borrowing rail is suggested.",
      xp: 300,
      state: !hasWallet ? "locked" : hasConfirmedMarketSupply ? "completed" : "eligible",
      progressLabel: `${marketTransactions.confirmedSupplies} confirmed supply tx`,
      actionLabel: hasConfirmedMarketSupply ? "Supply tracked" : "Supply first market",
    },
    {
      slug: "collateral-ready",
      title: "Enable collateral consciously",
      description: "Make collateral an explicit signed step, separate from deposits and lending reads.",
      xp: 250,
      state: !hasWallet
        ? "locked"
        : hasCollateralEnabled
          ? "completed"
          : suppliedMarkets.length > 0 || hasConfirmedMarketSupply
            ? "eligible"
            : "locked",
      progressLabel: hasCollateralEnabled
        ? `${collateralMarkets.length || marketTransactions.confirmedCollateralEnables} collateral routes`
        : `${suppliedMarkets.length} supplied markets`,
      actionLabel: hasCollateralEnabled ? "Collateral ready" : "Enable after supply",
    },
    {
      slug: "repay-discipline",
      title: "Repay discipline",
      description: "Reward closing or reducing borrow exposure, not opening bigger debt.",
      xp: 300,
      state: !hasWallet
        ? "locked"
        : hasConfirmedRepay && !hasBorrowRisk
          ? "completed"
          : hasBorrowRisk
            ? "eligible"
            : "locked",
      progressLabel: `${marketTransactions.confirmedRepays} confirmed repay tx`,
      actionLabel: hasConfirmedRepay && !hasBorrowRisk ? "Repay tracked" : "Repay active debt",
    },
    {
      slug: "borrow-safety",
      title: "Keep borrow risk clear",
      description: "Borrow exposure pauses new XP recommendations until health and repay UX are obvious.",
      xp: 0,
      state: !hasWallet ? "locked" : hasBorrowRisk ? "warning" : "completed",
      progressLabel: hasBorrowRisk
        ? `${borrowedMarkets.length} borrow markets`
        : `${suppliedMarkets.length} supply markets / ${marketTransactions.confirmedBorrows} borrow tx`,
      actionLabel: hasBorrowRisk ? "Review borrow risk" : "Safety clear",
    },
  ];
  const missions: DefiXpMission[] = baseMissions.map((mission) => {
    const sourceRef = buildDefiXpSourceRef(mission.slug);
    const claimState =
      mission.xp <= 0 || mission.state !== "completed"
        ? "locked"
        : claimedSourceRefs.has(sourceRef)
          ? "claimed"
          : "claimable";

    return {
      ...mission,
      claimState,
      sourceType: DEFI_XP_SOURCE_TYPE,
      sourceRef,
    };
  });

  const xpMissions = missions.filter((mission) => mission.xp > 0);
  const completedMissions = xpMissions.filter((mission) => mission.state === "completed").length;
  const completedXp = xpMissions
    .filter((mission) => mission.state === "completed")
    .reduce((total, mission) => total + mission.xp, 0);
  const claimedXp = xpMissions
    .filter((mission) => mission.claimState === "claimed")
    .reduce((total, mission) => total + mission.xp, 0);
  const claimableXp = xpMissions
    .filter((mission) => mission.claimState === "claimable")
    .reduce((total, mission) => total + mission.xp, 0);
  const previewXp = xpMissions.reduce((total, mission) => total + mission.xp, 0);

  if (!hasWallet) {
    return {
      status: "wallet-needed",
      headline: "Connect wallet to unlock DeFi XP",
      description: "XP eligibility starts with the verified wallet that signs vault actions.",
      completedXp,
      claimedXp,
      claimableXp,
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
      claimedXp,
      claimableXp,
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
    claimedXp,
    claimableXp,
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

export function buildDefiXpClaimPlan(input: {
  snapshot: DefiXpEligibilitySnapshot;
  missionSlug: DefiXpMissionSlug;
}): DefiXpClaimPlan {
  const mission = input.snapshot.missions.find((item) => item.slug === input.missionSlug);

  if (!mission) {
    return {
      ok: false,
      alreadyClaimed: false,
      error: "Unknown DeFi XP mission.",
    };
  }

  if (mission.xp <= 0) {
    return {
      ok: false,
      alreadyClaimed: false,
      error: "This DeFi rail is a safety guard, not an XP claim.",
    };
  }

  if (mission.claimState === "claimed") {
    return {
      ok: false,
      alreadyClaimed: true,
      error: "This DeFi XP mission is already claimed.",
    };
  }

  if (mission.claimState !== "claimable") {
    return {
      ok: false,
      alreadyClaimed: false,
      error: "This DeFi XP mission is not claimable yet.",
    };
  }

  return {
    ok: true,
    mission,
    event: {
      sourceType: mission.sourceType,
      sourceRef: mission.sourceRef,
      xpAmount: mission.xp,
    },
  };
}

function isPositiveRaw(value: string | number | bigint | null | undefined) {
  try {
    return BigInt(value ?? 0) > BigInt(0);
  } catch {
    return false;
  }
}
