import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUniswapQuoteBody,
  buildUniswapSwapBody,
  buildZeroXQuoteUrl,
  fetchUniswapQuote,
  normalizeUniswapQuote,
  normalizeZeroXQuote,
  UNISWAP_TRADING_API_BASE_URL,
} from "./swap-providers";
import { buildSwapQuoteRequest, normalizeSwapConfig } from "./vyntro-swap";

const request = buildSwapQuoteRequest({
  wallet: "0x1234567890abcdef1234567890abcdef12345678",
  sellTokenSymbol: "USDC",
  buyTokenSymbol: "ETH",
  sellAmount: "25",
  slippageBps: 50,
});

test("0x quote URL includes Base chain, taker, slippage and optional fee", () => {
  assert.equal(request.ok, true);
  if (!request.ok) return;

  const url = buildZeroXQuoteUrl({
    request,
    config: normalizeSwapConfig({
      feeBps: "20",
      feeRecipient: "0x9999999999999999999999999999999999999999",
    }),
  });

  assert.equal(url.hostname, "api.0x.org");
  assert.equal(url.pathname, "/swap/allowance-holder/quote");
  assert.equal(url.searchParams.get("chainId"), "8453");
  assert.equal(url.searchParams.get("sellAmount"), "25000000");
  assert.equal(url.searchParams.get("swapFeeBps"), "20");
});

test("Uniswap quote body includes chain, amount, swapper and slippage", () => {
  assert.equal(request.ok, true);
  if (!request.ok) return;

  const body = buildUniswapQuoteBody({
    request,
    config: normalizeSwapConfig({}),
  });

  assert.equal(body.tokenInChainId, 8453);
  assert.equal(body.amount, "25000000");
  assert.equal(body.swapper, "0x1234567890abcdef1234567890abcdef12345678");
  assert.equal(body.slippageTolerance, 0.5);
  assert.deepEqual(body.protocols, ["V4", "V3", "V2"]);
});

test("Uniswap swap body reuses the returned quote for calldata generation", () => {
  const quotePayload = {
    quote: {
      output: { amount: "42" },
    },
  };

  const body = buildUniswapSwapBody(quotePayload);

  assert.deepEqual(body.quote, quotePayload.quote);
  assert.equal(body.simulateTransaction, true);
});

test("0x quote normalization returns transaction payload and allowance target for wallet signing", () => {
  const quote = normalizeZeroXQuote({
    buyAmount: "10000000000000000",
    gas: "160000",
    priceImpactBps: "25",
    transaction: {
      to: "0x1111111111111111111111111111111111111111",
      data: "0xabcdef",
      value: "0",
    },
    issues: {
      allowance: {
        spender: "0x3333333333333333333333333333333333333333",
      },
    },
    route: { fills: [{ source: "Uniswap_V3" }] },
  });

  assert.equal(quote.provider, "0x");
  assert.equal(quote.status, "ok");
  assert.equal(quote.transaction?.to, "0x1111111111111111111111111111111111111111");
  assert.equal(quote.allowanceTarget, "0x3333333333333333333333333333333333333333");
  assert.match(quote.routeSummary, /Uniswap_V3/);
});

test("Uniswap quote normalization handles missing transaction as unavailable route", () => {
  const quote = normalizeUniswapQuote({ quote: { output: { amount: "42" } } });

  assert.equal(quote.provider, "uniswap");
  assert.equal(quote.status, "error");
  assert.match(quote.error ?? "", /transaction/i);
});

test("Uniswap quote normalization can return a transaction route", () => {
  const quote = normalizeUniswapQuote({
    quote: {
      output: { amount: "42000000000000000" },
      routeString: "Uniswap V3",
    },
    transaction: {
      to: "0x2222222222222222222222222222222222222222",
      data: "0xabcdef",
      value: "0",
    },
    approval: {
      spender: "0x4444444444444444444444444444444444444444",
    },
  });

  assert.equal(quote.status, "ok");
  assert.equal(quote.transaction?.to, "0x2222222222222222222222222222222222222222");
  assert.equal(quote.allowanceTarget, "0x4444444444444444444444444444444444444444");
});

test("Uniswap fetch uses official quote and swap endpoints before normalizing", async () => {
  assert.equal(request.ok, true);
  if (!request.ok) return;

  const seenUrls: string[] = [];
  const quotePayload = {
    quote: {
      output: { amount: "42000000000000000" },
      routeString: "Uniswap V3",
    },
  };

  const quote = await fetchUniswapQuote({
    request,
    config: normalizeSwapConfig({}),
    apiKey: "test-key",
    fetcher: async (input, init) => {
      seenUrls.push(String(input));
      assert.equal((init?.headers as Record<string, string>)["x-permit2-disabled"], "true");

      if (String(input).endsWith("/quote")) {
        return {
          ok: true,
          status: 200,
          json: async () => quotePayload,
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          swap: {
            to: "0x2222222222222222222222222222222222222222",
            data: "0xabcdef",
            value: "0",
            gasLimit: "180000",
          },
        }),
      };
    },
  });

  assert.deepEqual(seenUrls, [
    `${UNISWAP_TRADING_API_BASE_URL}/quote`,
    `${UNISWAP_TRADING_API_BASE_URL}/swap`,
  ]);
  assert.equal(quote.status, "ok");
  assert.equal(quote.estimatedGas, "180000");
});
