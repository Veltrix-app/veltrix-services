export type DefiPortfolioStatus = "wallet-needed" | "empty" | "active" | "risk-watch" | "read-error";
export type DefiPortfolioTone = "default" | "positive" | "warning" | "info";

export type DefiPortfolioVaultInput = {
  status: string;
  assetSymbol?: string | null;
  underlyingLabel?: string | null;
  vault?: {
    label?: string | null;
    slug?: string | null;
  } | null;
};

export type DefiPortfolioMarketInput = {
  status: string;
  asset?: string | null;
  hasSupplyPosition?: boolean | null;
  hasBorrowPosition?: boolean | null;
  collateralEnabled?: boolean | null;
  userSuppliedLabel?: string | null;
  userBorrowedLabel?: string | null;
  accountShortfallRaw?: string | number | bigint | null;
};

export type DefiPortfolioXpInput = {
  status: string;
  completedXp: number;
  claimedXp: number;
  claimableXp: number;
  nextSafeAction: string;
};

export type DefiPortfolioRow = {
  label: string;
  value: string;
  detail: string;
  tone: DefiPortfolioTone;
};

export type DefiPortfolioHealth = {
  label: string;
  copy: string;
  tone: DefiPortfolioTone;
};

export type DefiPortfolioRead = {
  status: DefiPortfolioStatus;
  headline: string;
  description: string;
  nextSafeAction: string;
  health: DefiPortfolioHealth;
  complianceNotes: string[];
  totals: {
    activeVaults: number;
    suppliedMarkets: number;
    borrowedMarkets: number;
    claimableXp: number;
    claimedXp: number;
    completedXp: number;
  };
  exposureRows: DefiPortfolioRow[];
  vaultRows: DefiPortfolioRow[];
  supplyRows: DefiPortfolioRow[];
  borrowRows: DefiPortfolioRow[];
};

const DEFI_COMPLIANCE_NOTES = [
  "VYNTRO never takes custody; every move is signed from the user's wallet.",
  "Yield is variable and never guaranteed.",
  "Borrowing can be liquidated when collateral value drops or debt pressure rises.",
];

export function buildDefiPortfolioRead(input: {
  walletReady: boolean;
  vaultPositions: DefiPortfolioVaultInput[];
  markets: DefiPortfolioMarketInput[];
  xpSnapshot: DefiPortfolioXpInput;
}): DefiPortfolioRead {
  const activeVaults = input.vaultPositions.filter(
    (position) => position.status === "position-detected"
  );
  const suppliedMarkets = input.markets.filter(
    (market) => market.status === "ready" && Boolean(market.hasSupplyPosition)
  );
  const borrowedMarkets = input.markets.filter(
    (market) => market.status === "ready" && Boolean(market.hasBorrowPosition)
  );
  const readError =
    input.vaultPositions.some((position) => position.status === "read-error") ||
    input.markets.some((market) => market.status === "read-error");
  const shortfallDetected = input.markets.some(
    (market) => toSafeBigInt(market.accountShortfallRaw) > BigInt(0)
  );
  const totals = {
    activeVaults: activeVaults.length,
    suppliedMarkets: suppliedMarkets.length,
    borrowedMarkets: borrowedMarkets.length,
    claimableXp: toSafeNumber(input.xpSnapshot.claimableXp),
    claimedXp: toSafeNumber(input.xpSnapshot.claimedXp),
    completedXp: toSafeNumber(input.xpSnapshot.completedXp),
  };

  const baseRows = {
    vaultRows: activeVaults.map((position) => ({
      label: position.vault?.label || position.assetSymbol || "Vault position",
      value: position.underlyingLabel || `Active ${position.assetSymbol ?? "asset"}`,
      detail: "Detected non-custodial vault position",
      tone: "positive" as const,
    })),
    supplyRows: suppliedMarkets.map((market) => ({
      label: `${market.asset ?? "Asset"} supplied`,
      value: market.userSuppliedLabel || "Supply detected",
      detail: market.collateralEnabled ? "Collateral enabled" : "Collateral not enabled",
      tone: market.collateralEnabled ? ("positive" as const) : ("info" as const),
    })),
    borrowRows: borrowedMarkets.map((market) => ({
      label: `${market.asset ?? "Asset"} borrowed`,
      value: market.userBorrowedLabel || "Borrow detected",
      detail:
        toSafeBigInt(market.accountShortfallRaw) > BigInt(0)
          ? "Shortfall detected"
          : "Monitor credit remaining",
      tone: "warning" as const,
    })),
  };
  const health = buildPortfolioHealth({
    walletReady: input.walletReady,
    readError,
    shortfallDetected,
    borrowedMarkets: borrowedMarkets.length,
    activeVaults: activeVaults.length,
    suppliedMarkets: suppliedMarkets.length,
  });
  const exposureRows = buildExposureRows(baseRows, totals);
  const sharedRead = {
    health,
    complianceNotes: DEFI_COMPLIANCE_NOTES,
    totals,
    exposureRows,
    ...baseRows,
  };

  if (!input.walletReady) {
    return {
      status: "wallet-needed",
      headline: "Connect wallet to read your DeFi portfolio.",
      description: "Vaults, supplied markets, borrowed markets and XP need a verified wallet read.",
      nextSafeAction: "Connect wallet before reading portfolio exposure",
      ...sharedRead,
    };
  }

  if (shortfallDetected || borrowedMarkets.length > 0) {
    return {
      status: "risk-watch",
      headline: shortfallDetected ? "Borrow shortfall needs attention." : "Borrow exposure is open.",
      description:
        "Borrow positions should be resolved before the product recommends new growth or XP actions.",
      nextSafeAction: shortfallDetected
        ? "Repay debt or add collateral before claiming more rewards"
        : "Monitor and repay before adding new exposure",
      ...sharedRead,
    };
  }

  if (readError) {
    return {
      status: "read-error",
      headline: "Some portfolio reads need another pass.",
      description:
        "The dashboard found a read error, so the next move should be refreshing portfolio data.",
      nextSafeAction: "Refresh portfolio reads before taking a DeFi action",
      ...sharedRead,
    };
  }

  if (totals.claimableXp > 0) {
    return {
      status: "active",
      headline: "Claimable DeFi XP is waiting.",
      description:
        "Your portfolio has completed actions that can now be claimed into the central XP economy.",
      nextSafeAction: `Claim ${totals.claimableXp} XP before adding new DeFi actions`,
      ...sharedRead,
    };
  }

  if (activeVaults.length > 0 || suppliedMarkets.length > 0) {
    return {
      status: "active",
      headline: "Portfolio exposure is active and readable.",
      description:
        "Vault and lending positions are visible, with no borrow risk currently taking priority.",
      nextSafeAction: input.xpSnapshot.nextSafeAction || "Review portfolio before adding exposure",
      ...sharedRead,
    };
  }

  return {
    status: "empty",
    headline: "No DeFi position detected yet.",
    description:
      "Start with a simple vault or supply read before moving toward advanced borrow/lending.",
    nextSafeAction: "Start with the USDC vault or review the USDC lending market",
    ...sharedRead,
  };
}

function buildPortfolioHealth(input: {
  walletReady: boolean;
  readError: boolean;
  shortfallDetected: boolean;
  borrowedMarkets: number;
  activeVaults: number;
  suppliedMarkets: number;
}): DefiPortfolioHealth {
  if (!input.walletReady) {
    return {
      label: "Wallet needed",
      copy: "Connect a wallet before the portfolio can make a safe recommendation.",
      tone: "default",
    };
  }

  if (input.shortfallDetected) {
    return {
      label: "Liquidation watch",
      copy: "A borrow shortfall is visible. Repay debt or add collateral before chasing XP.",
      tone: "warning",
    };
  }

  if (input.borrowedMarkets > 0) {
    return {
      label: "Borrow open",
      copy: "Borrow exposure exists. Keep repayment and collateral health ahead of new missions.",
      tone: "warning",
    };
  }

  if (input.readError) {
    return {
      label: "Read check",
      copy: "One or more portfolio reads failed, so refresh before taking the next DeFi action.",
      tone: "warning",
    };
  }

  if (input.activeVaults > 0 || input.suppliedMarkets > 0) {
    return {
      label: "Clear",
      copy: "Supply and vault exposure are readable with no borrow risk currently taking priority.",
      tone: "positive",
    };
  }

  return {
    label: "No exposure",
    copy: "No DeFi position is detected yet. Start small and keep the first action simple.",
    tone: "info",
  };
}

function buildExposureRows(
  rows: {
    vaultRows: DefiPortfolioRow[];
    supplyRows: DefiPortfolioRow[];
    borrowRows: DefiPortfolioRow[];
  },
  totals: DefiPortfolioRead["totals"]
) {
  return [
    {
      label: "Vault balance",
      value: summarizeValues(rows.vaultRows, "0 vaults"),
      detail: `${totals.activeVaults} active vault positions`,
      tone: totals.activeVaults > 0 ? ("positive" as const) : ("default" as const),
    },
    {
      label: "Supplied",
      value: summarizeValues(rows.supplyRows, "0 markets"),
      detail: `${totals.suppliedMarkets} supplied markets`,
      tone: totals.suppliedMarkets > 0 ? ("positive" as const) : ("default" as const),
    },
    {
      label: "Borrowed",
      value: summarizeValues(rows.borrowRows, "0 markets"),
      detail: `${totals.borrowedMarkets} borrowed markets`,
      tone: totals.borrowedMarkets > 0 ? ("warning" as const) : ("positive" as const),
    },
    {
      label: "Claimable XP",
      value: `${totals.claimableXp} XP`,
      detail: `${totals.claimedXp} claimed / ${totals.completedXp} completed`,
      tone: totals.claimableXp > 0 ? ("positive" as const) : ("info" as const),
    },
  ];
}

function summarizeValues(rows: DefiPortfolioRow[], fallback: string) {
  if (rows.length === 0) {
    return fallback;
  }

  const values = rows.map((row) => row.value).filter(Boolean);
  if (values.length <= 2) {
    return values.join(" + ");
  }

  return `${values.slice(0, 2).join(" + ")} +${values.length - 2}`;
}

function toSafeNumber(value: unknown) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
}

function toSafeBigInt(value: string | number | bigint | null | undefined) {
  try {
    return BigInt(value ?? 0);
  } catch {
    return BigInt(0);
  }
}
