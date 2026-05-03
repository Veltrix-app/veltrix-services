import test from "node:test";
import assert from "node:assert/strict";

import {
  BASE_SWAP_TOKENS,
  VYNTRO_SWAP_CHAIN_ID,
  buildProjectSwapTokenRegistryFromAssets,
  buildProjectSwapTokens,
  buildSwapQuoteRequest,
  chooseRecommendedSwapQuote,
  classifySwapQuoteSafety,
  formatSwapTokenAmount,
  getAllSwapTokens,
  getProviderTokenAddress,
  getSwapTokenByAddress,
  getSwapTokenBySymbol,
  normalizeSwapConfig,
  parseSwapAmount,
  type ProjectSwapTokenRegistryEntry,
} from "./vyntro-swap";

const projectTokenRegistry: ProjectSwapTokenRegistryEntry[] = [
  {
    projectId: "project-1",
    symbol: "VYN",
    label: "VYNTRO Labs Token",
    address: "0x1111111111111111111111111111111111111111",
    decimals: 18,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    accent: "violet",
    priceId: "dexscreener:base:0x1111111111111111111111111111111111111111",
  },
];

test("base swap token list includes the launch assets used by VYNTRO DeFi", () => {
  assert.equal(VYNTRO_SWAP_CHAIN_ID, 8453);
  assert.deepEqual(
    BASE_SWAP_TOKENS.map((token) => token.symbol),
    ["ETH", "USDC", "EURC", "cbBTC", "WELL"]
  );
  assert.equal(getSwapTokenBySymbol("usdc")?.address, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  assert.equal(getSwapTokenByAddress("native")?.symbol, "ETH");
});

test("project swap token registry adds valid Base project tokens beside launch assets", () => {
  const projectTokens = buildProjectSwapTokens(projectTokenRegistry);

  assert.equal(projectTokens.length, 1);
  assert.equal(projectTokens[0].symbol, "VYN");
  assert.equal(projectTokens[0].source, "project");
  assert.equal(projectTokens[0].projectId, "project-1");
  assert.equal(projectTokens[0].priceId, "dexscreener:base:0x1111111111111111111111111111111111111111");

  assert.equal(
    getSwapTokenByAddress("0x1111111111111111111111111111111111111111", {
      projectTokens: projectTokenRegistry,
    })?.symbol,
    "VYN"
  );
  assert.equal(
    getSwapTokenBySymbol("vyn", {
      projectTokens: projectTokenRegistry,
    })?.address,
    "0x1111111111111111111111111111111111111111"
  );
  assert.deepEqual(
    getAllSwapTokens({ projectTokens: projectTokenRegistry }).map((token) => token.symbol),
    ["ETH", "USDC", "EURC", "cbBTC", "WELL", "VYN"]
  );
});

test("project asset rows can feed the project swap token registry", () => {
  const registry = buildProjectSwapTokenRegistryFromAssets([
    {
      id: "asset-1",
      project_id: "project-1",
      chain: "base",
      contract_address: "0x1111111111111111111111111111111111111111",
      asset_type: "token",
      symbol: "vyn",
      decimals: 18,
      is_active: true,
      metadata: {
        label: "VYNTRO Utility Token",
        accent: "blue",
        swapEnabled: true,
        priceId: "dexscreener:base:0x1111111111111111111111111111111111111111",
      },
      project: {
        id: "project-1",
        name: "VYNTRO Labs",
        status: "active",
        is_public: true,
        token_contract_address: "0x1111111111111111111111111111111111111111",
      },
    },
  ]);

  assert.equal(registry.length, 1);
  assert.equal(registry[0].projectId, "project-1");
  assert.equal(registry[0].symbol, "VYN");
  assert.equal(registry[0].label, "VYNTRO Utility Token");
  assert.equal(registry[0].chainId, VYNTRO_SWAP_CHAIN_ID);
  assert.equal(registry[0].chain, "base");
  assert.equal(registry[0].address, "0x1111111111111111111111111111111111111111");
  assert.equal(registry[0].accent, "blue");
});

test("project asset registry builder rejects inactive, private or non-token rows", () => {
  assert.deepEqual(
    buildProjectSwapTokenRegistryFromAssets([
      {
        id: "asset-inactive",
        project_id: "project-1",
        chain: "base",
        contract_address: "0x1111111111111111111111111111111111111111",
        asset_type: "token",
        symbol: "VYN",
        decimals: 18,
        is_active: false,
        metadata: {},
        project: { id: "project-1", name: "VYNTRO Labs", status: "active", is_public: true },
      },
      {
        id: "asset-nft",
        project_id: "project-1",
        chain: "base",
        contract_address: "0x2222222222222222222222222222222222222222",
        asset_type: "nft",
        symbol: "VYN",
        decimals: 18,
        is_active: true,
        metadata: {},
        project: { id: "project-1", name: "VYNTRO Labs", status: "active", is_public: true },
      },
      {
        id: "asset-private",
        project_id: "project-1",
        chain: "base",
        contract_address: "0x3333333333333333333333333333333333333333",
        asset_type: "token",
        symbol: "VYN",
        decimals: 18,
        is_active: true,
        metadata: {},
        project: { id: "project-1", name: "VYNTRO Labs", status: "active", is_public: false },
      },
      {
        id: "asset-disabled",
        project_id: "project-1",
        chain: "base",
        contract_address: "0x4444444444444444444444444444444444444444",
        asset_type: "token",
        symbol: "VYN",
        decimals: 18,
        is_active: true,
        metadata: { swapEnabled: false },
        project: { id: "project-1", name: "VYNTRO Labs", status: "active", is_public: true },
      },
    ]),
    []
  );
});

test("project swap token registry ignores unsafe project token entries", () => {
  assert.deepEqual(
    buildProjectSwapTokens([
      {
        ...projectTokenRegistry[0],
        address: "not-an-address",
      },
      {
        ...projectTokenRegistry[0],
        address: "0x2222222222222222222222222222222222222222",
        chainId: 1,
      },
      {
        ...projectTokenRegistry[0],
        address: "0x3333333333333333333333333333333333333333",
        decimals: -1,
      },
    ]),
    []
  );
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

test("swap quote request can target a registered project token", () => {
  const request = buildSwapQuoteRequest({
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    sellTokenSymbol: "USDC",
    buyTokenSymbol: "VYN",
    sellAmount: "25.5",
    slippageBps: 50,
    projectTokens: projectTokenRegistry,
  });

  assert.equal(request.ok, true);
  if (request.ok) {
    assert.equal(request.buyToken.symbol, "VYN");
    assert.equal(request.buyToken.source, "project");
    assert.equal(request.buyToken.projectId, "project-1");
  }
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
