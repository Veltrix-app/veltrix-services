import { isEvmAddress } from "./moonwell-vaults";

export const MOONWELL_BASE_COMPTROLLER_ADDRESS =
  "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C";

const SECONDS_PER_YEAR = 31_536_000;
const RATE_SCALE = 1e18;

export type MoonwellMarketSlug =
  | "usdc-market"
  | "eth-market"
  | "cbeth-market"
  | "cbbtc-market"
  | "eurc-market"
  | "well-market";

export type MoonwellMarketAccent = "lime" | "cyan" | "violet" | "amber";

export type MoonwellMarketConfig = {
  slug: MoonwellMarketSlug;
  title: string;
  assetSymbol: string;
  chain: "Base";
  mTokenAddress: `0x${string}`;
  defaultDecimals: number;
  accent: MoonwellMarketAccent;
  riskLabel: string;
  description: string;
};

export type MoonwellMarketReadStatus = "ready" | "read-error";

export type MoonwellMarketRead = {
  slug: MoonwellMarketSlug;
  title: string;
  asset: string;
  chain: "Base";
  mTokenAddress: `0x${string}`;
  status: MoonwellMarketReadStatus;
  mode: "live-read";
  primaryAction: string;
  signal: string;
  description: string;
  riskLabel: string;
  accent: MoonwellMarketAccent;
  supplyApyLabel: string;
  borrowApyLabel: string;
  liquidityLabel: string;
  totalBorrowsLabel: string;
  totalSupplyLabel: string;
  collateralFactorLabel: string;
  userSuppliedLabel: string;
  userBorrowedLabel: string;
  assetDecimals: number;
  marketLiquidityRaw: string;
  suppliedUnderlyingRaw: string;
  borrowedUnderlyingRaw: string;
  collateralEnabled: boolean;
  accountLiquidityRaw: string;
  accountShortfallRaw: string;
  hasSupplyPosition: boolean;
  hasBorrowPosition: boolean;
  error?: string;
};

export type MoonwellPortfolioReadStatus =
  | "wallet-needed"
  | "empty"
  | "active"
  | "borrow-watch"
  | "read-error";

export type MoonwellPortfolioRead = {
  status: MoonwellPortfolioReadStatus;
  headline: string;
  description: string;
  suppliedMarkets: number;
  borrowedMarkets: number;
  detectedAssets: string[];
  nextSafeAction: string;
};

export const MOONWELL_BASE_CORE_MARKETS: MoonwellMarketConfig[] = [
  {
    slug: "usdc-market",
    title: "USDC market",
    assetSymbol: "USDC",
    chain: "Base",
    mTokenAddress: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
    defaultDecimals: 6,
    accent: "lime",
    riskLabel: "Stablecoin and smart-contract risk",
    description: "Track live USDC supply demand, liquidity and wallet exposure on Base.",
  },
  {
    slug: "eth-market",
    title: "ETH market",
    assetSymbol: "ETH",
    chain: "Base",
    mTokenAddress: "0x628ff693426583D9a7FB391E54366292F509D457",
    defaultDecimals: 18,
    accent: "cyan",
    riskLabel: "ETH price, collateral and smart-contract risk",
    description: "Read the core ETH lending market before exposing higher-risk actions.",
  },
  {
    slug: "cbeth-market",
    title: "cbETH market",
    assetSymbol: "cbETH",
    chain: "Base",
    mTokenAddress: "0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5",
    defaultDecimals: 18,
    accent: "cyan",
    riskLabel: "Liquid staking, market and smart-contract risk",
    description: "Watch the liquid staking collateral route with clear risk separation.",
  },
  {
    slug: "cbbtc-market",
    title: "cbBTC market",
    assetSymbol: "cbBTC",
    chain: "Base",
    mTokenAddress: "0xF877ACaFA28c19b96727966690b2f44d35aD5976",
    defaultDecimals: 8,
    accent: "amber",
    riskLabel: "BTC market, liquidity and smart-contract risk",
    description: "Surface BTC-denominated lending signals for advanced DeFi users.",
  },
  {
    slug: "eurc-market",
    title: "EURC market",
    assetSymbol: "EURC",
    chain: "Base",
    mTokenAddress: "0xb682c840B5F4FC58B20769E691A6fa1305A501a2",
    defaultDecimals: 6,
    accent: "violet",
    riskLabel: "Euro stablecoin, liquidity and smart-contract risk",
    description: "Read the EUR stablecoin rail without adding leverage to the product yet.",
  },
  {
    slug: "well-market",
    title: "WELL market",
    assetSymbol: "WELL",
    chain: "Base",
    mTokenAddress: "0xdC7810B47eAAb250De623F0eE07764afa5F71ED1",
    defaultDecimals: 18,
    accent: "amber",
    riskLabel: "Governance token volatility and smart-contract risk",
    description: "Keep reward-token exposure visible as a read-only signal first.",
  },
];

export function buildMoonwellMarketsReadUrl(wallet: string | null | undefined) {
  if (!isEvmAddress(wallet)) {
    return "/api/defi/moonwell-markets";
  }

  return `/api/defi/moonwell-markets?wallet=${encodeURIComponent(wallet.trim())}`;
}

export function formatMoonwellApyLabel(ratePerSecondRaw: bigint | string | number | null | undefined) {
  const rawRate = Number(ratePerSecondRaw ?? 0);

  if (!Number.isFinite(rawRate) || rawRate <= 0) {
    return "0%";
  }

  const perSecondRate = rawRate / RATE_SCALE;
  const apy = (Math.pow(1 + perSecondRate, SECONDS_PER_YEAR) - 1) * 100;

  if (!Number.isFinite(apy) || apy <= 0) {
    return "0%";
  }

  if (apy < 0.01) {
    return "<0.01%";
  }

  return `${apy.toLocaleString("en-US", {
    maximumFractionDigits: apy >= 100 ? 1 : 2,
    minimumFractionDigits: 0,
  })}%`;
}

export function formatMoonwellRatioLabel(
  mantissaRaw: bigint | string | number | null | undefined
) {
  let raw: bigint;

  try {
    raw = BigInt(mantissaRaw ?? 0);
  } catch {
    raw = BigInt(0);
  }

  if (raw <= BigInt(0)) {
    return "0%";
  }

  const basisPoints = Number((raw * BigInt(10_000)) / BigInt("1000000000000000000"));
  const percentage = basisPoints / 100;

  return `${percentage.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

export function buildMoonwellMarketRead(input: {
  market: MoonwellMarketConfig;
  supplyRatePerSecondRaw: bigint | string | number | null | undefined;
  borrowRatePerSecondRaw: bigint | string | number | null | undefined;
  cashRaw: bigint | string | number | null | undefined;
  totalBorrowsRaw: bigint | string | number | null | undefined;
  totalSupplyRaw: bigint | string | number | null | undefined;
  exchangeRateRaw: bigint | string | number | null | undefined;
  collateralFactorRaw: bigint | string | number | null | undefined;
  suppliedUnderlyingRaw?: bigint | string | number | null | undefined;
  borrowedUnderlyingRaw?: bigint | string | number | null | undefined;
  assetDecimals?: number;
  collateralEnabled?: boolean;
  accountLiquidityRaw?: bigint | string | number | null | undefined;
  accountShortfallRaw?: bigint | string | number | null | undefined;
  readFailed?: boolean;
  error?: string;
}): MoonwellMarketRead {
  const assetDecimals = typeof input.assetDecimals === "number" && Number.isInteger(input.assetDecimals)
    ? input.assetDecimals
    : input.market.defaultDecimals;
  const userSuppliedRaw = input.suppliedUnderlyingRaw ?? 0;
  const userBorrowedRaw = input.borrowedUnderlyingRaw ?? 0;
  const hasSupplyPosition = isPositiveBigInt(userSuppliedRaw);
  const hasBorrowPosition = isPositiveBigInt(userBorrowedRaw);
  const supplyApyLabel = formatMoonwellApyLabel(input.supplyRatePerSecondRaw);
  const borrowApyLabel = formatMoonwellApyLabel(input.borrowRatePerSecondRaw);

  return {
    slug: input.market.slug,
    title: input.market.title,
    asset: input.market.assetSymbol,
    chain: input.market.chain,
    mTokenAddress: input.market.mTokenAddress,
    status: input.readFailed ? "read-error" : "ready",
    mode: "live-read",
    primaryAction: hasBorrowPosition
      ? "Monitor borrow risk"
      : hasSupplyPosition
        ? "Review supplied position"
        : "Review supply route",
    signal: `Supply ${supplyApyLabel} / Borrow ${borrowApyLabel}`,
    description: input.market.description,
    riskLabel: input.market.riskLabel,
    accent: input.market.accent,
    supplyApyLabel,
    borrowApyLabel,
    liquidityLabel: formatMoonwellTokenAmount(input.cashRaw, assetDecimals, input.market.assetSymbol),
    totalBorrowsLabel: formatMoonwellTokenAmount(
      input.totalBorrowsRaw,
      assetDecimals,
      input.market.assetSymbol
    ),
    totalSupplyLabel: formatMoonwellTokenAmount(
      input.totalSupplyRaw,
      assetDecimals,
      `m${input.market.assetSymbol}`
    ),
    collateralFactorLabel: formatMoonwellRatioLabel(input.collateralFactorRaw),
    assetDecimals,
    marketLiquidityRaw: String(input.cashRaw ?? "0"),
    suppliedUnderlyingRaw: String(userSuppliedRaw ?? "0"),
    borrowedUnderlyingRaw: String(userBorrowedRaw ?? "0"),
    collateralEnabled: Boolean(input.collateralEnabled),
    accountLiquidityRaw: String(input.accountLiquidityRaw ?? "0"),
    accountShortfallRaw: String(input.accountShortfallRaw ?? "0"),
    userSuppliedLabel: formatMoonwellTokenAmount(
      userSuppliedRaw,
      assetDecimals,
      input.market.assetSymbol
    ),
    userBorrowedLabel: formatMoonwellTokenAmount(
      userBorrowedRaw,
      assetDecimals,
      input.market.assetSymbol
    ),
    hasSupplyPosition,
    hasBorrowPosition,
    error: input.error,
  };
}

export function buildMoonwellPortfolioRead(input: {
  walletReady: boolean;
  markets: MoonwellMarketRead[];
}): MoonwellPortfolioRead {
  if (!input.walletReady) {
    return {
      status: "wallet-needed",
      headline: "Connect wallet to read market posture",
      description: "Markets are live, but personal supply and borrow posture needs a wallet.",
      suppliedMarkets: 0,
      borrowedMarkets: 0,
      detectedAssets: [],
      nextSafeAction: "Connect wallet before market missions",
    };
  }

  if (input.markets.some((market) => market.status === "read-error")) {
    return {
      status: "read-error",
      headline: "Market read needs another attempt",
      description: "One or more Base market reads failed, so we should not recommend a next move yet.",
      suppliedMarkets: 0,
      borrowedMarkets: 0,
      detectedAssets: [],
      nextSafeAction: "Refresh market reads",
    };
  }

  const suppliedMarkets = input.markets.filter((market) => market.hasSupplyPosition);
  const borrowedMarkets = input.markets.filter((market) => market.hasBorrowPosition);
  const detectedAssets = Array.from(
    new Set([...suppliedMarkets, ...borrowedMarkets].map((market) => market.asset))
  );

  if (borrowedMarkets.length > 0) {
    return {
      status: "borrow-watch",
      headline: "Borrow exposure detected",
      description: "A borrow position needs monitoring before new XP routes or deposits are suggested.",
      suppliedMarkets: suppliedMarkets.length,
      borrowedMarkets: borrowedMarkets.length,
      detectedAssets,
      nextSafeAction: "Monitor, repay or reduce borrow exposure first",
    };
  }

  if (suppliedMarkets.length > 0) {
    return {
      status: "active",
      headline: "Supply position detected",
      description: "This wallet already has lending posture that can become XP eligibility later.",
      suppliedMarkets: suppliedMarkets.length,
      borrowedMarkets: 0,
      detectedAssets,
      nextSafeAction: "Review supplied markets before adding new actions",
    };
  }

  return {
    status: "empty",
    headline: "No market position detected yet",
    description: "Start with vaults or review supply markets before we add higher-risk actions.",
    suppliedMarkets: 0,
    borrowedMarkets: 0,
    detectedAssets: [],
    nextSafeAction: "Review USDC market first",
  };
}

function isPositiveBigInt(value: bigint | string | number | null | undefined) {
  try {
    return BigInt(value ?? 0) > BigInt(0);
  } catch {
    return false;
  }
}

function formatMoonwellTokenAmount(
  rawValue: bigint | string | number | null | undefined,
  decimals: number,
  symbol: string
) {
  let raw: bigint;

  try {
    raw = BigInt(rawValue ?? 0);
  } catch {
    raw = BigInt(0);
  }

  const safeDecimals = Number.isInteger(decimals) && decimals > 0 ? decimals : 0;

  if (safeDecimals === 0) {
    return `${formatWholeBigInt(raw)} ${symbol}`;
  }

  const scale = BigInt(10) ** BigInt(safeDecimals);
  const whole = raw / scale;
  const fraction = raw % scale;
  const wholeText = formatWholeBigInt(whole);

  if (fraction === BigInt(0)) {
    return `${wholeText} ${symbol}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(safeDecimals, "0")
    .replace(/0+$/, "");

  return `${wholeText}.${fractionText} ${symbol}`;
}

function formatWholeBigInt(value: bigint) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
