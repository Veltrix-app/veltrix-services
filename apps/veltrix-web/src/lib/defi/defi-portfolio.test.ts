import test from "node:test";
import assert from "node:assert/strict";

import { buildDefiPortfolioRead } from "./defi-portfolio";

const baseXpSnapshot = {
  status: "ready",
  completedXp: 0,
  claimedXp: 0,
  claimableXp: 0,
  nextSafeAction: "Complete the next eligible DeFi mission",
};

test("defi portfolio starts with wallet connection as the first safe action", () => {
  const portfolio = buildDefiPortfolioRead({
    walletReady: false,
    vaultPositions: [],
    markets: [],
    xpSnapshot: baseXpSnapshot,
  });

  assert.equal(portfolio.status, "wallet-needed");
  assert.equal(portfolio.totals.claimableXp, 0);
  assert.match(portfolio.nextSafeAction, /connect wallet/i);
});

test("defi portfolio summarizes vaults supplied markets and claimable xp", () => {
  const portfolio = buildDefiPortfolioRead({
    walletReady: true,
    vaultPositions: [
      {
        status: "position-detected",
        assetSymbol: "USDC",
        underlyingLabel: "25 USDC",
        vault: { label: "USDC Vault", slug: "usdc-vault" },
      },
      {
        status: "no-position",
        assetSymbol: "ETH",
        underlyingLabel: "0 ETH",
        vault: { label: "ETH Vault", slug: "eth-vault" },
      },
    ],
    markets: [
      {
        status: "ready",
        asset: "USDC",
        hasSupplyPosition: true,
        hasBorrowPosition: false,
        collateralEnabled: true,
        userSuppliedLabel: "12 USDC",
        userBorrowedLabel: "0 USDC",
        accountShortfallRaw: "0",
      },
    ],
    xpSnapshot: {
      ...baseXpSnapshot,
      completedXp: 850,
      claimedXp: 300,
      claimableXp: 550,
    },
  });

  assert.equal(portfolio.status, "active");
  assert.equal(portfolio.health.label, "Clear");
  assert.equal(portfolio.exposureRows.find((row) => row.label === "Vault balance")?.value, "25 USDC");
  assert.equal(portfolio.exposureRows.find((row) => row.label === "Supplied")?.value, "12 USDC");
  assert.equal(portfolio.exposureRows.find((row) => row.label === "Borrowed")?.value, "0 markets");
  assert.equal(portfolio.complianceNotes.some((note) => /never takes custody/i.test(note)), true);
  assert.equal(portfolio.totals.activeVaults, 1);
  assert.equal(portfolio.totals.suppliedMarkets, 1);
  assert.equal(portfolio.totals.borrowedMarkets, 0);
  assert.equal(portfolio.totals.claimableXp, 550);
  assert.match(portfolio.nextSafeAction, /claim/i);
  assert.deepEqual(
    portfolio.vaultRows.map((row) => row.label),
    ["USDC Vault"]
  );
});

test("defi portfolio prioritizes borrow risk and shortfall over rewards", () => {
  const portfolio = buildDefiPortfolioRead({
    walletReady: true,
    vaultPositions: [],
    markets: [
      {
        status: "ready",
        asset: "ETH",
        hasSupplyPosition: true,
        hasBorrowPosition: true,
        collateralEnabled: true,
        userSuppliedLabel: "1 ETH",
        userBorrowedLabel: "500 USDC",
        accountShortfallRaw: "20000000000000000000",
      },
    ],
    xpSnapshot: {
      ...baseXpSnapshot,
      claimableXp: 300,
    },
  });

  assert.equal(portfolio.status, "risk-watch");
  assert.equal(portfolio.health.label, "Liquidation watch");
  assert.equal(portfolio.totals.borrowedMarkets, 1);
  assert.match(portfolio.nextSafeAction, /repay|collateral/i);
  assert.equal(portfolio.borrowRows[0].tone, "warning");
});

test("defi portfolio keeps read errors visible before recommending growth", () => {
  const portfolio = buildDefiPortfolioRead({
    walletReady: true,
    vaultPositions: [
      {
        status: "read-error",
        assetSymbol: "USDC",
        underlyingLabel: "0 USDC",
        vault: { label: "USDC Vault", slug: "usdc-vault" },
      },
    ],
    markets: [],
    xpSnapshot: baseXpSnapshot,
  });

  assert.equal(portfolio.status, "read-error");
  assert.match(portfolio.nextSafeAction, /refresh/i);
});
