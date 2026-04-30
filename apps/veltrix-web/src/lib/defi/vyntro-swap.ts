import { isAddress } from "ethers";

export const VYNTRO_SWAP_CHAIN_ID = 8453;
export const VYNTRO_SWAP_CHAIN_NAME = "Base";
export const VYNTRO_SWAP_NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const VYNTRO_SWAP_UNISWAP_NATIVE_TOKEN_ADDRESS =
  "0x0000000000000000000000000000000000000000";

export type SwapProvider = "0x" | "uniswap";

export type SwapToken = {
  symbol: string;
  label: string;
  address: `0x${string}` | "native";
  decimals: number;
  chainId: typeof VYNTRO_SWAP_CHAIN_ID;
  accent: "cyan" | "lime" | "amber" | "violet" | "blue";
};

export type SwapAmountParseResult =
  | {
      ok: true;
      raw: string;
    }
  | {
      ok: false;
      error: string;
    };

export type SwapConfig = {
  platformFeeBps: number;
  platformFeeRecipient: string | null;
  maxSlippageBps: number;
  dangerPriceImpactBps: number;
};

export type SwapQuoteRequest =
  | {
      ok: true;
      chainId: typeof VYNTRO_SWAP_CHAIN_ID;
      wallet: `0x${string}`;
      sellToken: SwapToken;
      buyToken: SwapToken;
      sellAmountRaw: string;
      slippageBps: number;
    }
  | {
      ok: false;
      error: string;
    };

export type SwapTransactionPayload = {
  to: `0x${string}`;
  data: `0x${string}`;
  value: string;
};

export type NormalizedSwapQuote = {
  provider: SwapProvider;
  status: "ok" | "error";
  buyAmountRaw: string;
  estimatedGas: string | null;
  priceImpactBps: number | null;
  transaction: SwapTransactionPayload | null;
  routeSummary: string;
  expiresAt: string | null;
  allowanceTarget: `0x${string}` | null;
  error?: string;
  raw?: unknown;
};

export type SwapQuoteSafety =
  | {
      status: "ok";
      message: string;
    }
  | {
      status: "warning";
      message: string;
    }
  | {
      status: "danger";
      message: string;
    };

export const BASE_SWAP_TOKENS: SwapToken[] = [
  {
    symbol: "ETH",
    label: "Ether",
    address: "native",
    decimals: 18,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    accent: "cyan",
  },
  {
    symbol: "USDC",
    label: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    accent: "lime",
  },
  {
    symbol: "EURC",
    label: "Euro Coin",
    address: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42",
    decimals: 6,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    accent: "violet",
  },
  {
    symbol: "cbBTC",
    label: "Coinbase Wrapped BTC",
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    accent: "amber",
  },
  {
    symbol: "WELL",
    label: "Moonwell",
    address: "0xA88594D404727625A9437C3f886C7643872296AE",
    decimals: 18,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    accent: "blue",
  },
];

export function isEvmAddress(value: string | null | undefined): value is `0x${string}` {
  return typeof value === "string" && isAddress(value);
}

export function normalizeAddress(value: string) {
  return value.trim().toLowerCase() as `0x${string}`;
}

export function getSwapTokenBySymbol(symbol: string | null | undefined) {
  return (
    BASE_SWAP_TOKENS.find(
      (token) => token.symbol.toLowerCase() === (symbol ?? "").trim().toLowerCase()
    ) ?? null
  );
}

export function getSwapTokenByAddress(address: string | null | undefined) {
  const normalized = (address ?? "").trim().toLowerCase();

  if (normalized === "native" || normalized === VYNTRO_SWAP_NATIVE_TOKEN_ADDRESS) {
    return getSwapTokenBySymbol("ETH");
  }

  return (
    BASE_SWAP_TOKENS.find(
      (token) => token.address !== "native" && token.address.toLowerCase() === normalized
    ) ?? null
  );
}

export function getProviderTokenAddress(
  token: SwapToken,
  provider: SwapProvider
): string {
  if (token.address !== "native") {
    return token.address;
  }

  return provider === "uniswap"
    ? VYNTRO_SWAP_UNISWAP_NATIVE_TOKEN_ADDRESS
    : VYNTRO_SWAP_NATIVE_TOKEN_ADDRESS;
}

export function parseSwapAmount(value: string, decimals: number): SwapAmountParseResult {
  const trimmed = value.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid positive amount." };
  }

  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 0;
  const [whole, fraction = ""] = trimmed.split(".");

  if (fraction.length > safeDecimals) {
    return { ok: false, error: `This token supports ${safeDecimals} decimals.` };
  }

  const raw = BigInt(`${whole}${fraction.padEnd(safeDecimals, "0")}`).toString();

  if (BigInt(raw) <= BigInt(0)) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  return { ok: true, raw };
}

export function formatSwapTokenAmount(
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
    return `${raw.toString()} ${symbol}`;
  }

  const scale = BigInt(10) ** BigInt(safeDecimals);
  const whole = raw / scale;
  const fraction = raw % scale;

  if (fraction === BigInt(0)) {
    return `${whole.toString()} ${symbol}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(safeDecimals, "0")
    .replace(/0+$/, "");

  return `${whole.toString()}.${fractionText} ${symbol}`;
}

function parseBoundedInteger(
  value: string | null | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

export function normalizeSwapConfig(input: {
  feeBps?: string | null;
  feeRecipient?: string | null;
  maxSlippageBps?: string | null;
  dangerPriceImpactBps?: string | null;
}): SwapConfig {
  const feeBps = Number.parseInt(input.feeBps ?? "0", 10);
  const feeRecipient = input.feeRecipient?.trim() ?? "";
  const safeFeeBps =
    Number.isInteger(feeBps) && feeBps >= 0 && feeBps <= 100 && isEvmAddress(feeRecipient)
      ? feeBps
      : 0;

  return {
    platformFeeBps: safeFeeBps,
    platformFeeRecipient: isEvmAddress(feeRecipient) ? normalizeAddress(feeRecipient) : null,
    maxSlippageBps: parseBoundedInteger(input.maxSlippageBps, 300, 1, 300),
    dangerPriceImpactBps: parseBoundedInteger(input.dangerPriceImpactBps, 500, 100, 1500),
  };
}

export function buildSwapQuoteRequest(input: {
  wallet?: string | null;
  sellTokenSymbol: string;
  buyTokenSymbol: string;
  sellAmount: string;
  slippageBps: number;
}): SwapQuoteRequest {
  if (!isEvmAddress(input.wallet)) {
    return { ok: false, error: "Connect a verified wallet first." };
  }

  const sellToken = getSwapTokenBySymbol(input.sellTokenSymbol);
  const buyToken = getSwapTokenBySymbol(input.buyTokenSymbol);

  if (!sellToken || !buyToken) {
    return { ok: false, error: "Unsupported token pair." };
  }

  if (sellToken.symbol === buyToken.symbol) {
    return { ok: false, error: "Choose two different tokens." };
  }

  if (!Number.isInteger(input.slippageBps) || input.slippageBps < 1 || input.slippageBps > 300) {
    return { ok: false, error: "Slippage must be between 0.01% and 3%." };
  }

  const parsed = parseSwapAmount(input.sellAmount, sellToken.decimals);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    wallet: normalizeAddress(input.wallet),
    sellToken,
    buyToken,
    sellAmountRaw: parsed.raw,
    slippageBps: input.slippageBps,
  };
}

export function classifySwapQuoteSafety(input: {
  priceImpactBps: number | null;
  maxSlippageBps: number;
  dangerPriceImpactBps: number;
}): SwapQuoteSafety {
  if (input.priceImpactBps !== null && input.priceImpactBps >= input.dangerPriceImpactBps) {
    return {
      status: "danger",
      message: "Price impact is high. Refresh or use a smaller amount.",
    };
  }

  if (input.maxSlippageBps > 100) {
    return {
      status: "warning",
      message: "Slippage is above 1%. Review carefully before signing.",
    };
  }

  return {
    status: "ok",
    message: "Route is inside the configured safety range.",
  };
}

function toComparableBigInt(value: string | null | undefined) {
  try {
    return BigInt(value ?? 0);
  } catch {
    return BigInt(0);
  }
}

export function chooseRecommendedSwapQuote(quotes: NormalizedSwapQuote[]) {
  return (
    quotes
      .filter((quote) => quote.status === "ok" && quote.transaction)
      .sort((left, right) => {
        const outputDelta =
          toComparableBigInt(right.buyAmountRaw) - toComparableBigInt(left.buyAmountRaw);

        if (outputDelta > BigInt(0)) return 1;
        if (outputDelta < BigInt(0)) return -1;

        return Number(toComparableBigInt(left.estimatedGas) - toComparableBigInt(right.estimatedGas));
      })[0] ?? null
  );
}

export function getQuoteExpiryLabel(expiresAt: string | null | undefined) {
  if (!expiresAt) return "Refresh before signing";

  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
  return seconds > 0 ? `Expires in ${seconds}s` : "Quote expired";
}
