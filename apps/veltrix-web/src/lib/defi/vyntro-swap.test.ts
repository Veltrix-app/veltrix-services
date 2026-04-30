import test from "node:test";
import assert from "node:assert/strict";

import {
  BASE_SWAP_TOKENS,
  VYNTRO_SWAP_CHAIN_ID,
  buildSwapQuoteRequest,
  chooseRecommendedSwapQuote,
  classifySwapQuoteSafety,
  formatSwapTokenAmount,
  getProviderTokenAddress,
  getSwapTokenByAddress,
  getSwapTokenBySymbol,
  normalizeSwapConfig,
  parseSwapAmount,
} from "./vyntro-swap";

test("base swap token list includes the launch assets used by VYNTRO DeFi", () => {
  assert.equal(VYNTRO_SWAP_CHAIN_ID, 8453);
  assert.deepEqual(
    BASE_SWAP_TOKENS.map((token) => token.symbol),
    ["ETH", "USDC", "EURC", "cbBTC", "WELL"]
  );
  assert.equal(getSwapTokenBySymbol("usdc")?.address, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  assert.equal(getSwapTokenByAddress("native")?.symbol, "ETH");
});

test("provider token address normalizes native token conventions", () => {
  const eth = getSwapTokenBySymbol("ETH");
  const usdc = getSwapTokenBySymbol("USDC");

  assert.ok(eth);
  assert.ok(usdc);
  assert.equal(getProviderTokenAddress(eth, "0x"), "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  assert.equal(getProviderTokenAddress(eth, "uniswap"), "0x0000000000000000000000000000000000000000");
  assert.equal(getProviderTokenAddress(usdc, "0x"), usdc.address);
});

test("swap amount parser rejects unsafe input and preserves token decimals", () => {
  assert.deepEqual(parseSwapAmount("12.345678", 6), { ok: true, raw: "12345678" });
  assert.deepEqual(parseSwapAmount("0.000001", 6), { ok: true, raw: "1" });
  assert.equal(parseSwapAmount("", 6).ok, false);
  assert.equal(parseSwapAmount("0", 6).ok, false);
  assert.equal(parseSwapAmount("-1", 6).ok, false);
  assert.equal(parseSwapAmount("1.0000001", 6).ok, false);
  assert.equal(parseSwapAmount("not-a-number", 18).ok, false);
});

test("swap quote request validates wallet, tokens, amount and slippage", () => {
  const request = buildSwapQuoteRequest({
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    sellTokenSymbol: "USDC",
    buyTokenSymbol: "ETH",
    sellAmount: "25.5",
    slippageBps: 50,
  });

  assert.equal(request.ok, true);
  if (request.ok) {
    assert.equal(request.chainId, 8453);
    assert.equal(request.sellAmountRaw, "25500000");
    assert.equal(request.slippageBps, 50);
  }

  assert.equal(
    buildSwapQuoteRequest({
      wallet: "",
      sellTokenSymbol: "USDC",
      buyTokenSymbol: "ETH",
      sellAmount: "1",
      slippageBps: 50,
    }).ok,
    false
  );
  assert.equal(
    buildSwapQuoteRequest({
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      sellTokenSymbol: "USDC",
      buyTokenSymbol: "USDC",
      sellAmount: "1",
      slippageBps: 50,
    }).ok,
    false
  );
  assert.equal(
    buildSwapQuoteRequest({
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      sellTokenSymbol: "USDC",
      buyTokenSymbol: "ETH",
      sellAmount: "1",
      slippageBps: 5000,
    }).ok,
    false
  );
});

test("swap config defaults to fee-off and clamps unsafe fee bps", () => {
  assert.deepEqual(normalizeSwapConfig({ feeBps: "", feeRecipient: "" }), {
    platformFeeBps: 0,
    platformFeeRecipient: null,
    maxSlippageBps: 300,
    dangerPriceImpactBps: 500,
  });
  assert.equal(
    normalizeSwapConfig({
      feeBps: "25",
      feeRecipient: "0x1234567890abcdef1234567890abcdef12345678",
    }).platformFeeBps,
    25
  );
  assert.equal(
    normalizeSwapConfig({
      feeBps: "9999",
      feeRecipient: "0x1234567890abcdef1234567890abcdef12345678",
    }).platformFeeBps,
    0
  );
});

test("quote recommendation picks best safe output and respects safety gates", () => {
  const recommended = chooseRecommendedSwapQuote([
    {
      provider: "0x",
      status: "ok",
      buyAmountRaw: "980000",
      estimatedGas: "120000",
      priceImpactBps: 12,
      transaction: {
        to: "0x1111111111111111111111111111111111111111",
        data: "0xabcdef",
        value: "0",
      },
      routeSummary: "0x route",
      expiresAt: "2026-04-30T12:00:00.000Z",
      allowanceTarget: "0x3333333333333333333333333333333333333333",
    },
    {
      provider: "uniswap",
      status: "ok",
      buyAmountRaw: "1000000",
      estimatedGas: "160000",
      priceImpactBps: 20,
      transaction: {
        to: "0x2222222222222222222222222222222222222222",
        data: "0xabcdef",
        value: "0",
      },
      routeSummary: "Uniswap route",
      expiresAt: "2026-04-30T12:00:00.000Z",
      allowanceTarget: null,
    },
  ]);

  assert.equal(recommended?.provider, "uniswap");
  assert.equal(
    classifySwapQuoteSafety({
      priceImpactBps: 650,
      maxSlippageBps: 50,
      dangerPriceImpactBps: 500,
    }).status,
    "danger"
  );
  assert.equal(formatSwapTokenAmount("1234500", 6, "USDC"), "1.2345 USDC");
});
