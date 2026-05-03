import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDexScreenerTokenPairsUrl,
  formatUsdTokenPrice,
  normalizeDexScreenerTokenPairs,
} from "./vyntro-prices";

test("dexscreener token-pairs url targets Base token contracts", () => {
  assert.equal(
    buildDexScreenerTokenPairsUrl({
      chainId: 8453,
      tokenAddress: "0x1111111111111111111111111111111111111111",
    }),
    "https://api.dexscreener.com/token-pairs/v1/base/0x1111111111111111111111111111111111111111"
  );
});

test("dexscreener token pair normalization chooses the deepest live USD pair", () => {
  const snapshot = normalizeDexScreenerTokenPairs({
    symbol: "VYN",
    tokenAddress: "0x1111111111111111111111111111111111111111",
    pairs: [
      {
        chainId: "base",
        dexId: "uniswap",
        pairAddress: "0xpairlow",
        url: "https://dexscreener.com/base/0xpairlow",
        priceUsd: "0.10",
        liquidity: { usd: 1000 },
        priceChange: { h24: 4.2 },
        fdv: 100000,
      },
      {
        chainId: "base",
        dexId: "aerodrome",
        pairAddress: "0xpairhigh",
        url: "https://dexscreener.com/base/0xpairhigh",
        priceUsd: "0.123456",
        liquidity: { usd: 50000 },
        priceChange: { h24: -3.5 },
        fdv: 250000,
      },
    ],
  });

  assert.equal(snapshot.status, "live");
  assert.equal(snapshot.symbol, "VYN");
  assert.equal(snapshot.priceUsd, 0.123456);
  assert.equal(snapshot.formattedPrice, "$0.123456");
  assert.equal(snapshot.priceChange24hPercent, -3.5);
  assert.equal(snapshot.liquidityUsd, 50000);
  assert.equal(snapshot.dexId, "aerodrome");
  assert.equal(snapshot.pairAddress, "0xpairhigh");
});

test("dexscreener normalization returns unavailable when no priced pair exists", () => {
  const snapshot = normalizeDexScreenerTokenPairs({
    symbol: "VYN",
    tokenAddress: "0x1111111111111111111111111111111111111111",
    pairs: [{ chainId: "base", dexId: "uniswap", priceUsd: "" }],
  });

  assert.equal(snapshot.status, "unavailable");
  assert.equal(snapshot.formattedPrice, "Price pending");
  assert.equal(formatUsdTokenPrice(0.00001234), "$0.00001234");
  assert.equal(formatUsdTokenPrice(12.3456), "$12.35");
});
