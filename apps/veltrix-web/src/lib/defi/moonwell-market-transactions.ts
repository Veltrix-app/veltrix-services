import {
  MOONWELL_BASE_CORE_MARKETS,
  type MoonwellMarketConfig,
  type MoonwellMarketSlug,
} from "./moonwell-markets";
import {
  MOONWELL_BASE_CHAIN_ID,
  formatVaultTokenAmount,
  isEvmAddress,
  isTransactionHash,
} from "./moonwell-vaults";

export type MoonwellMarketTransactionKind =
  | "supply"
  | "withdraw"
  | "enable-collateral"
  | "borrow"
  | "repay";

export type MoonwellMarketTransactionLifecycleStatus = "submitted" | "confirmed" | "failed";

export type MarketActionAmountParseResult =
  | {
      ok: true;
      raw: string;
    }
  | {
      ok: false;
      error: string;
    };

export type MoonwellMarketTransactionIntent =
  | {
      ok: true;
      kind: MoonwellMarketTransactionKind;
      market: MoonwellMarketConfig;
      amountRaw: string;
      amountLabel: string;
      needsApproval: boolean;
      approvalLabel: string | null;
      actionLabel: string;
      riskLabel: string;
    }
  | {
      ok: false;
      kind: MoonwellMarketTransactionKind;
      market: MoonwellMarketConfig;
      amountRaw: string;
      amountLabel: string;
      needsApproval: false;
      approvalLabel: null;
      actionLabel: string;
      riskLabel: string;
      error: string;
    };

export type MoonwellMarketTransactionLogResult =
  | {
      ok: true;
      record: {
        walletAddress: string;
        marketSlug: MoonwellMarketSlug;
        mTokenAddress: `0x${string}`;
        chainId: typeof MOONWELL_BASE_CHAIN_ID;
        kind: MoonwellMarketTransactionKind;
        status: MoonwellMarketTransactionLifecycleStatus;
        amountRaw: string;
        assetSymbol: string;
        txHash: `0x${string}`;
        errorMessage: string | null;
      };
    }
  | {
      ok: false;
      error: string;
    };

const MARKET_ACTION_LABELS: Record<MoonwellMarketTransactionKind, string> = {
  supply: "Supply",
  withdraw: "Withdraw",
  "enable-collateral": "Enable collateral",
  borrow: "Borrow",
  repay: "Repay",
};

export function getMoonwellMarketBySlug(slug: string) {
  return MOONWELL_BASE_CORE_MARKETS.find((market) => market.slug === slug) ?? null;
}

export function parseMarketActionAmount(
  value: string,
  decimals: number
): MarketActionAmountParseResult {
  const trimmed = value.trim();
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 0;

  if (!trimmed) {
    return { ok: false, error: "Enter an amount first." };
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: "Use a positive decimal amount." };
  }

  const [wholePart, fractionPart = ""] = trimmed.split(".");

  if (fractionPart.length > safeDecimals) {
    return {
      ok: false,
      error: `This token supports ${safeDecimals} decimal places.`,
    };
  }

  const raw =
    BigInt(wholePart || "0") * (BigInt(10) ** BigInt(safeDecimals)) +
    BigInt((fractionPart || "").padEnd(safeDecimals, "0") || "0");

  if (raw <= BigInt(0)) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  return { ok: true, raw: raw.toString() };
}

export function buildMoonwellMarketTransactionIntent(input: {
  kind: MoonwellMarketTransactionKind;
  market: MoonwellMarketConfig;
  amountRaw: string;
  assetSymbol: string;
  assetDecimals: number;
  allowanceRaw: string;
  walletAssetBalanceRaw: string;
  suppliedUnderlyingRaw: string;
  borrowedUnderlyingRaw: string;
  collateralEnabled: boolean;
  marketLiquidityRaw: string;
  riskAccepted: boolean;
  shortfallRaw: string;
}): MoonwellMarketTransactionIntent {
  const amountLabel =
    input.kind === "enable-collateral"
      ? input.market.assetSymbol
      : formatVaultTokenAmount(input.amountRaw, input.assetDecimals, input.assetSymbol);
  const actionLabel =
    input.kind === "enable-collateral"
      ? `Enable ${input.market.assetSymbol} collateral`
      : `${MARKET_ACTION_LABELS[input.kind]} ${amountLabel}`;
  const riskLabel =
    input.kind === "borrow"
      ? "Borrowing is over-collateralized and can be liquidated."
      : input.market.riskLabel;
  const baseIntent = {
    kind: input.kind,
    market: input.market,
    amountRaw: input.amountRaw,
    amountLabel,
    needsApproval: false as const,
    approvalLabel: null,
    actionLabel,
    riskLabel,
  };

  let amount: bigint;
  let supplied: bigint;
  let borrowed: bigint;
  let balance: bigint;
  let allowance: bigint;
  let liquidity: bigint;
  let shortfall: bigint;

  try {
    amount = BigInt(input.amountRaw || "0");
    supplied = BigInt(input.suppliedUnderlyingRaw || "0");
    borrowed = BigInt(input.borrowedUnderlyingRaw || "0");
    balance = BigInt(input.walletAssetBalanceRaw || "0");
    allowance = BigInt(input.allowanceRaw || "0");
    liquidity = BigInt(input.marketLiquidityRaw || "0");
    shortfall = BigInt(input.shortfallRaw || "0");
  } catch {
    return {
      ...baseIntent,
      ok: false,
      error: "Invalid market amount.",
    };
  }

  if (input.kind === "enable-collateral") {
    if (supplied <= BigInt(0)) {
      return {
        ...baseIntent,
        ok: false,
        error: "Supply this market before enabling collateral.",
      };
    }

    if (input.collateralEnabled) {
      return {
        ...baseIntent,
        ok: false,
        error: "Collateral is already enabled for this market.",
      };
    }

    return {
      ...baseIntent,
      ok: true,
    };
  }

  if (amount <= BigInt(0)) {
    return {
      ...baseIntent,
      ok: false,
      error: "Amount must be greater than zero.",
    };
  }

  if ((input.kind === "supply" || input.kind === "repay") && amount > balance) {
    return {
      ...baseIntent,
      ok: false,
      error: "Amount is higher than your wallet token balance.",
    };
  }

  if (input.kind === "supply" || input.kind === "repay") {
    const needsApproval = allowance < amount;
    const approvedIntent = {
      ...baseIntent,
      ok: true as const,
      needsApproval,
      approvalLabel: needsApproval ? `Approve ${amountLabel}` : null,
    };

    if (input.kind === "repay" && borrowed <= BigInt(0)) {
      return {
        ...baseIntent,
        ok: false,
        error: "No borrow balance is detected for this market.",
      };
    }

    if (input.kind === "repay" && amount > borrowed) {
      return {
        ...baseIntent,
        ok: false,
        error: "Amount is higher than your borrowed balance.",
      };
    }

    return approvedIntent;
  }

  if (input.kind === "withdraw") {
    if (amount > supplied) {
      return {
        ...baseIntent,
        ok: false,
        error: "Amount is higher than your supplied balance.",
      };
    }

    return {
      ...baseIntent,
      ok: true,
    };
  }

  if (!input.collateralEnabled) {
    return {
      ...baseIntent,
      ok: false,
      error: "Enable supplied collateral before borrowing.",
    };
  }

  if (shortfall > BigInt(0)) {
    return {
      ...baseIntent,
      ok: false,
      error: "This account has shortfall. Repay or add collateral before borrowing.",
    };
  }

  if (!input.riskAccepted) {
    return {
      ...baseIntent,
      ok: false,
      error: "Confirm the borrow risk gate before signing.",
    };
  }

  if (amount > liquidity) {
    return {
      ...baseIntent,
      ok: false,
      error: "Amount is higher than available market liquidity.",
    };
  }

  return {
    ...baseIntent,
    ok: true,
  };
}

export function buildMoonwellMarketTransactionLog(input: {
  wallet: string | null | undefined;
  market: MoonwellMarketConfig;
  kind: MoonwellMarketTransactionKind;
  status: MoonwellMarketTransactionLifecycleStatus;
  amountRaw: string;
  assetSymbol: string;
  txHash: string | null | undefined;
  errorMessage?: string | null;
}): MoonwellMarketTransactionLogResult {
  if (!isEvmAddress(input.wallet)) {
    return { ok: false, error: "Valid wallet is required." };
  }

  if (!isTransactionHash(input.txHash)) {
    return { ok: false, error: "Valid transaction hash is required." };
  }

  try {
    const amount = BigInt(input.amountRaw);
    if (input.kind === "enable-collateral") {
      if (amount < BigInt(0)) {
        return { ok: false, error: "Amount cannot be negative." };
      }
    } else if (amount <= BigInt(0)) {
      return { ok: false, error: "Amount must be greater than zero." };
    }
  } catch {
    return { ok: false, error: "Valid amount is required." };
  }

  return {
    ok: true,
    record: {
      walletAddress: input.wallet.trim(),
      marketSlug: input.market.slug,
      mTokenAddress: input.market.mTokenAddress,
      chainId: MOONWELL_BASE_CHAIN_ID,
      kind: input.kind,
      status: input.status,
      amountRaw: input.amountRaw,
      assetSymbol: input.assetSymbol,
      txHash: input.txHash.trim() as `0x${string}`,
      errorMessage: input.errorMessage?.trim() || null,
    },
  };
}
