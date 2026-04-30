import {
  getProviderTokenAddress,
  isEvmAddress,
  type NormalizedSwapQuote,
  type SwapConfig,
  type SwapQuoteRequest,
} from "./vyntro-swap";

type SuccessfulSwapQuoteRequest = Extract<SwapQuoteRequest, { ok: true }>;

export type SwapProviderRequestContext = {
  request: SuccessfulSwapQuoteRequest;
  config: SwapConfig;
};

export const UNISWAP_TRADING_API_BASE_URL = "https://trading-api.gateway.uniswap.org/v1";
export const UNISWAP_PROXY_APPROVAL_ADDRESS =
  "0x02e5be68d2060ebb00c8d16e4dc2f3a0d3c4fdb9" as const;

type FetchLike = (
  input: string | URL,
  init?: RequestInit
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

function asRecord(value: unknown) {
  return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: unknown) {
  const text = asString(value);
  return text || null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function createErrorQuote(provider: NormalizedSwapQuote["provider"], error: string): NormalizedSwapQuote {
  return {
    provider,
    status: "error",
    buyAmountRaw: "0",
    estimatedGas: null,
    priceImpactBps: null,
    transaction: null,
    routeSummary: `${provider} unavailable`,
    expiresAt: null,
    allowanceTarget: null,
    error,
  };
}

export function buildZeroXQuoteUrl(input: SwapProviderRequestContext) {
  const url = new URL("https://api.0x.org/swap/allowance-holder/quote");

  url.searchParams.set("chainId", String(input.request.chainId));
  url.searchParams.set("sellToken", getProviderTokenAddress(input.request.sellToken, "0x"));
  url.searchParams.set("buyToken", getProviderTokenAddress(input.request.buyToken, "0x"));
  url.searchParams.set("sellAmount", input.request.sellAmountRaw);
  url.searchParams.set("taker", input.request.wallet);
  url.searchParams.set("slippageBps", String(input.request.slippageBps));

  if (input.config.platformFeeBps > 0 && input.config.platformFeeRecipient) {
    url.searchParams.set("swapFeeBps", String(input.config.platformFeeBps));
    url.searchParams.set("swapFeeRecipient", input.config.platformFeeRecipient);
    url.searchParams.set("swapFeeToken", getProviderTokenAddress(input.request.buyToken, "0x"));
  }

  return url;
}

export function buildUniswapQuoteBody(input: SwapProviderRequestContext) {
  return {
    type: "EXACT_INPUT",
    tokenInChainId: input.request.chainId,
    tokenOutChainId: input.request.chainId,
    tokenIn: getProviderTokenAddress(input.request.sellToken, "uniswap"),
    tokenOut: getProviderTokenAddress(input.request.buyToken, "uniswap"),
    amount: input.request.sellAmountRaw,
    swapper: input.request.wallet,
    slippageTolerance: input.request.slippageBps / 100,
    protocols: ["V4", "V3", "V2"],
  };
}

export function buildUniswapSwapBody(quotePayload: unknown) {
  return {
    quote: asRecord(quotePayload).quote ?? quotePayload,
    simulateTransaction: true,
  };
}

function getProviderErrorPayload(payload: unknown) {
  const value = asRecord(payload);
  const detail =
    asString(value.detail) ||
    asString(value.message) ||
    asString(value.error) ||
    asString(asRecord(value.error).message);

  return detail ? `: ${detail}` : "";
}

export function normalizeZeroXQuote(payload: unknown): NormalizedSwapQuote {
  const value = asRecord(payload);
  const transaction = asRecord(value.transaction);
  const issues = asRecord(value.issues);
  const allowance = asRecord(issues.allowance);
  const to = asString(transaction.to);
  const data = asString(transaction.data);
  const valueToSend = asString(transaction.value) || "0";
  const buyAmountRaw = asString(value.buyAmount);

  if (!isEvmAddress(to) || !data.startsWith("0x") || !buyAmountRaw) {
    return createErrorQuote("0x", "0x did not return a complete transaction.");
  }

  const route = asRecord(value.route);
  const fills = Array.isArray(route.fills) ? (route.fills as unknown[]) : [];
  const routeSummary =
    fills
      .map((fill) => asString(asRecord(fill).source))
      .filter(Boolean)
      .join(" / ") || "0x best route";
  const allowanceTarget = asString(allowance.spender);

  return {
    provider: "0x",
    status: "ok",
    buyAmountRaw,
    estimatedGas: asOptionalString(value.gas),
    priceImpactBps: asNumber(value.priceImpactBps),
    transaction: {
      to,
      data: data as `0x${string}`,
      value: valueToSend,
    },
    routeSummary,
    expiresAt: new Date(Date.now() + 45_000).toISOString(),
    allowanceTarget: isEvmAddress(allowanceTarget) ? allowanceTarget : null,
    raw: payload,
  };
}

export function normalizeUniswapQuote(payload: unknown): NormalizedSwapQuote {
  const value = asRecord(payload);
  const quotePayload = asRecord(value.quotePayload ?? value.quoteResponse ?? value);
  const swapPayload = asRecord(value.swapPayload ?? value.swapResponse ?? value);
  const quote = asRecord(quotePayload.quote ?? value.quote);
  const tx = asRecord(swapPayload.swap ?? value.transaction ?? value.swap ?? quote.transaction ?? quote.tx);
  const output = asRecord(quote.output);
  const to = asString(tx.to);
  const data = asString(tx.data);
  const buyAmountRaw =
    asString(output.amount) ||
    asString(quote.amountOut) ||
    asString(quote.outputAmount) ||
    asString(value.amountOut);

  if (!isEvmAddress(to) || !data.startsWith("0x") || !buyAmountRaw) {
    return createErrorQuote("uniswap", "Uniswap did not return a complete transaction.");
  }

  const approval = asRecord(value.approval ?? quote.approval);
  const approvalTarget = asString(approval.spender ?? approval.to);

  return {
    provider: "uniswap",
    status: "ok",
    buyAmountRaw,
    estimatedGas:
      asOptionalString(tx.gasLimit) ||
      asOptionalString(value.gasFee) ||
      asOptionalString(swapPayload.gasFee) ||
      asOptionalString(quote.gasUseEstimate) ||
      asOptionalString(value.gas),
    priceImpactBps: asNumber(quote.priceImpactBps ?? value.priceImpactBps),
    transaction: {
      to,
      data: data as `0x${string}`,
      value: asString(tx.value) || "0",
    },
    routeSummary: asString(quote.routeString) || asString(value.routeString) || "Uniswap route",
    expiresAt: new Date(Date.now() + 45_000).toISOString(),
    allowanceTarget: isEvmAddress(approvalTarget) ? approvalTarget : UNISWAP_PROXY_APPROVAL_ADDRESS,
    raw: payload,
  };
}

export async function fetchZeroXQuote(input: SwapProviderRequestContext & {
  apiKey: string;
  fetcher?: FetchLike;
}) {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher(buildZeroXQuoteUrl(input), {
    headers: {
      "0x-api-key": input.apiKey,
      "0x-version": "v2",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return createErrorQuote(
      "0x",
      `0x request failed with ${response.status}${getProviderErrorPayload(await response.json().catch(() => null))}.`
    );
  }

  return normalizeZeroXQuote(await response.json());
}

export async function fetchUniswapQuote(input: SwapProviderRequestContext & {
  apiKey: string;
  fetcher?: FetchLike;
}) {
  const fetcher = input.fetcher ?? fetch;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": input.apiKey,
    "x-permit2-disabled": "true",
  };
  const quoteResponse = await fetcher(`${UNISWAP_TRADING_API_BASE_URL}/quote`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildUniswapQuoteBody(input)),
    cache: "no-store",
  });

  if (!quoteResponse.ok) {
    return createErrorQuote(
      "uniswap",
      `Uniswap quote failed with ${quoteResponse.status}${getProviderErrorPayload(await quoteResponse.json().catch(() => null))}.`
    );
  }

  const quotePayload = await quoteResponse.json();
  const swapResponse = await fetcher(`${UNISWAP_TRADING_API_BASE_URL}/swap`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildUniswapSwapBody(quotePayload)),
    cache: "no-store",
  });

  if (!swapResponse.ok) {
    return createErrorQuote(
      "uniswap",
      `Uniswap swap failed with ${swapResponse.status}${getProviderErrorPayload(await swapResponse.json().catch(() => null))}.`
    );
  }

  return normalizeUniswapQuote({
    quotePayload,
    swapPayload: await swapResponse.json(),
  });
}
