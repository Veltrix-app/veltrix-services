import test from "node:test";
import assert from "node:assert/strict";

import {
  MOONWELL_BASE_COMPTROLLER_ADDRESS,
  MOONWELL_BASE_CORE_MARKETS,
  buildMoonwellMarketRead,
  buildMoonwellMarketsReadUrl,
  buildMoonwellPortfolioRead,
  formatMoonwellApyLabel,
} from "./moonwell-markets";

test("moonwell market config uses official Base core market addresses", () => {
  assert.equal(MOONWELL_BASE_COMPTROLLER_ADDRESS, "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C");
  assert.deepEqual(
    MOONWELL_BASE_CORE_MARKETS.map((market) => [market.slug, market.mTokenAddress]),
    [
      ["usdc-market", "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22"],
      ["eth-market", "0x628ff693426583D9a7FB391E54366292F509D457"],
      ["cbeth-market", "0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5"],
      ["cbbtc-market", "0xF877ACaFA28c19b96727966690b2f44d35aD5976"],
      ["eurc-market", "0xb682c840B5F4FC58B20769E691A6fa1305A501a2"],
      ["well-market", "0xdC7810B47eAAb250De623F0eE07764afa5F71ED1"],
    ]
  );
});

test("moonwell market read urls allow public market reads and wallet portfolio reads", () => {
  assert.equal(buildMoonwellMarketsReadUrl(null), "/api/defi/moonwell-markets");
  assert.equal(
    buildMoonwellMarketsReadUrl("0x1234567890abcdef1234567890abcdef12345678"),
    "/api/defi/moonwell-markets?wallet=0x1234567890abcdef1234567890abcdef12345678"
  );
  assert.equal(buildMoonwellMarketsReadUrl("not-a-wallet"), "/api/defi/moonwell-markets");
});

test("moonwell apy labels turn per-second mantissas into readable yearly percentages", () => {
  assert.equal(formatMoonwellApyLabel("0"), "0%");
  assert.equal(formatMoonwellApyLabel("3170979198"), "10.52%");
  assert.equal(formatMoonwellApyLabel("1585489599"), "5.13%");
});

test("raw moonwell market reads become UI safe opportunity rows", () => {
  const market = MOONWELL_BASE_CORE_MARKETS[0];
  const read = buildMoonwellMarketRead({
    market,
    supplyRatePerSecondRaw: "1585489599",
    borrowRatePerSecondRaw: "3170979198",
    cashRaw: "2500000000000",
    totalBorrowsRaw: "500000000000",
    totalSupplyRaw: "3000000000000000000000000",
    exchangeRateRaw: "200000000000000",
    collateralFactorRaw: "800000000000000000",
    suppliedUnderlyingRaw: "1250000",
    borrowedUnderlyingRaw: "0",
  });

  assert.equal(read.status, "ready");
  assert.equal(read.supplyApyLabel, "5.13%");
  assert.equal(read.borrowApyLabel, "10.52%");
  assert.equal(read.liquidityLabel, "2,500,000 USDC");
  assert.equal(read.totalBorrowsLabel, "500,000 USDC");
  assert.equal(read.collateralFactorLabel, "80%");
  assert.equal(read.userSuppliedLabel, "1.25 USDC");
  assert.equal(read.userBorrowedLabel, "0 USDC");
});

test("moonwell portfolio read keeps borrow risk explicit and next actions safe", () => {
  const portfolio = buildMoonwellPortfolioRead({
    walletReady: true,
    markets: [
      buildMoonwellMarketRead({
        market: MOONWELL_BASE_CORE_MARKETS[0],
        supplyRatePerSecondRaw: "1585489599",
        borrowRatePerSecondRaw: "3170979198",
        cashRaw: "2500000000000",
        totalBorrowsRaw: "500000000000",
        totalSupplyRaw: "3000000000000000000000000",
        exchangeRateRaw: "200000000000000",
        collateralFactorRaw: "800000000000000000",
        suppliedUnderlyingRaw: "1250000",
        borrowedUnderlyingRaw: "0",
      }),
      buildMoonwellMarketRead({
        market: MOONWELL_BASE_CORE_MARKETS[1],
        supplyRatePerSecondRaw: "0",
        borrowRatePerSecondRaw: "0",
        cashRaw: "0",
        totalBorrowsRaw: "0",
        totalSupplyRaw: "0",
        exchangeRateRaw: "0",
        collateralFactorRaw: "750000000000000000",
        suppliedUnderlyingRaw: "0",
        borrowedUnderlyingRaw: "50000000000000000",
      }),
    ],
  });

  assert.equal(portfolio.status, "borrow-watch");
  assert.equal(portfolio.suppliedMarkets, 1);
  assert.equal(portfolio.borrowedMarkets, 1);
  assert.match(portfolio.nextSafeAction, /repay|monitor/i);
});
