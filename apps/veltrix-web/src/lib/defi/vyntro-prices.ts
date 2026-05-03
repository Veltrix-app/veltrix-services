import { isEvmAddress, normalizeAddress, VYNTRO_SWAP_CHAIN_ID, type SwapToken } from "./vyntro-swap";

export type ProjectTokenPriceStatus = "live" | "unavailable";

export type ProjectTokenPriceSnapshot = {
  status: ProjectTokenPriceStatus;
  symbol: string;
  tokenAddress: string;
  priceUsd: number | null;
  formattedPrice: string;
  priceChange24hPercent: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  dexId: string | null;
  pairAddress: string | null;
  pairUrl: string | null;
  updatedAt: string;
};

type DexScreenerTokenPair = {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  priceUsd?: string | number | null;
  liquidity?: {
    usd?: string | number | null;
  } | null;
  priceChange?: {
    h24?: string | number | null;
  } | null;
  fdv?: string | number | null;
};

type FetchLike = typeof fetch;

function chainSlugFromId(chainId: number) {
  return chainId === VYNTRO_SWAP_CHAIN_ID ? "base" : null;
}

function safeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function emptySnapshot(input: { symbol: string; tokenAddress: string }): ProjectTokenPriceSnapshot {
  return {
    status: "unavailable",
    symbol: input.symbol,
    tokenAddress: input.tokenAddress,
    priceUsd: null,
    formattedPrice: "Price pending",
    priceChange24hPercent: null,
    liquidityUsd: null,
    fdvUsd: null,
    dexId: null,
    pairAddress: null,
    pairUrl: null,
    updatedAt: new Date().toISOString(),
  };
}

export function formatUsdTokenPrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Price pending";

  if (value > 0 && value < 0.01) {
    return `$${value.toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })}`;
  }

  if (value > 0 && value < 1) {
    return `$${value.toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })}`;
  }

  return `$${value.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildDexScreenerTokenPairsUrl(input: {
  chainId: number;
  tokenAddress: string;
}) {
  const chainSlug = chainSlugFromId(input.chainId);

  if (!chainSlug || !isEvmAddress(input.tokenAddress)) {
    throw new Error("Unsupported token price route.");
  }

  return `https://api.dexscreener.com/token-pairs/v1/${chainSlug}/${normalizeAddress(input.tokenAddress)}`;
}

export function normalizeDexScreenerTokenPairs(input: {
  symbol: string;
  tokenAddress: string;
  pairs: DexScreenerTokenPair[] | null | undefined;
}): ProjectTokenPriceSnapshot {
  const pricedPair =
    (input.pairs ?? [])
      .map((pair) => ({
        pair,
        priceUsd: safeNumber(pair.priceUsd),
        liquidityUsd: safeNumber(pair.liquidity?.usd) ?? 0,
        priceChange24hPercent: safeNumber(pair.priceChange?.h24),
        fdvUsd: safeNumber(pair.fdv),
      }))
      .filter((item) => item.priceUsd !== null && item.priceUsd > 0)
      .sort((left, right) => right.liquidityUsd - left.liquidityUsd)[0] ?? null;

  if (!pricedPair) {
    return emptySnapshot({
      symbol: input.symbol,
      tokenAddress: input.tokenAddress,
    });
  }

  return {
    status: "live",
    symbol: input.symbol,
    tokenAddress: input.tokenAddress,
    priceUsd: pricedPair.priceUsd,
    formattedPrice: formatUsdTokenPrice(pricedPair.priceUsd),
    priceChange24hPercent: pricedPair.priceChange24hPercent,
    liquidityUsd: pricedPair.liquidityUsd,
    fdvUsd: pricedPair.fdvUsd,
    dexId: pricedPair.pair.dexId ?? null,
    pairAddress: pricedPair.pair.pairAddress ?? null,
    pairUrl: pricedPair.pair.url ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchProjectTokenPriceSnapshot(input: {
  token: Pick<SwapToken, "symbol" | "address" | "chainId">;
  fetcher?: FetchLike;
}): Promise<ProjectTokenPriceSnapshot> {
  if (input.token.address === "native") {
    return emptySnapshot({
      symbol: input.token.symbol,
      tokenAddress: "native",
    });
  }

  const tokenAddress = normalizeAddress(input.token.address);
  const fetcher = input.fetcher ?? fetch;
  const url = buildDexScreenerTokenPairsUrl({
    chainId: input.token.chainId,
    tokenAddress,
  });

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 30,
      },
    });

    if (!response.ok) {
      return emptySnapshot({
        symbol: input.token.symbol,
        tokenAddress,
      });
    }

    const payload = (await response.json().catch(() => null)) as DexScreenerTokenPair[] | null;

    return normalizeDexScreenerTokenPairs({
      symbol: input.token.symbol,
      tokenAddress,
      pairs: Array.isArray(payload) ? payload : [],
    });
  } catch {
    return emptySnapshot({
      symbol: input.token.symbol,
      tokenAddress,
    });
  }
}
