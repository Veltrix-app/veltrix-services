import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefiVaultTransactionSummary,
  buildDefiXpEligibilitySnapshot,
} from "./defi-xp-eligibility";

const baseVaultPositions = [
  {
    vault: { slug: "usdc-vault", label: "USDC Vault" },
    status: "no-position",
    underlyingRaw: "0",
    assetSymbol: "USDC",
  },
];

const baseMarkets = [
  {
    slug: "usdc-market",
    title: "USDC market",
    status: "ready",
    asset: "USDC",
    hasSupplyPosition: false,
    hasBorrowPosition: false,
  },
];

test("defi vault transaction summary counts only confirmed on-chain actions", () => {
  const summary = buildDefiVaultTransactionSummary([
    {
      status: "confirmed",
      action: "deposit",
      vault_slug: "usdc-vault",
      asset_symbol: "USDC",
      tx_hash: "0xaaa",
      confirmed_at: "2026-04-20T10:00:00.000Z",
    },
    {
      status: "submitted",
      action: "deposit",
      vault_slug: "eth-vault",
      asset_symbol: "ETH",
      tx_hash: "0xbbb",
      confirmed_at: null,
    },
    {
      status: "confirmed",
      action: "withdraw",
      vault_slug: "usdc-vault",
      asset_symbol: "USDC",
      tx_hash: "0xccc",
      confirmed_at: "2026-04-21T10:00:00.000Z",
    },
  ]);

  assert.equal(summary.confirmedCount, 2);
  assert.equal(summary.confirmedDeposits, 1);
  assert.equal(summary.confirmedWithdrawals, 1);
  assert.deepEqual(summary.uniqueVaults, ["usdc-vault"]);
  assert.deepEqual(summary.assetsTouched, ["USDC"]);
  assert.equal(summary.latestConfirmedAt, "2026-04-21T10:00:00.000Z");
});

test("defi xp snapshot keeps wallet connection as the first gate", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: false,
    vaultPositions: [],
    markets: [],
    transactions: buildDefiVaultTransactionSummary([]),
  });

  assert.equal(snapshot.status, "wallet-needed");
  assert.equal(snapshot.completedXp, 0);
  assert.equal(snapshot.missions[0].slug, "connect-wallet");
  assert.equal(snapshot.missions[0].state, "eligible");
  assert.match(snapshot.nextSafeAction, /connect/i);
});

test("defi xp snapshot recognizes confirmed vault activity and active positions", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: true,
    vaultPositions: [
      {
        ...baseVaultPositions[0],
        status: "position-detected",
        underlyingRaw: "1500000",
      },
    ],
    markets: baseMarkets,
    transactions: buildDefiVaultTransactionSummary([
      {
        status: "confirmed",
        action: "deposit",
        vault_slug: "usdc-vault",
        asset_symbol: "USDC",
        tx_hash: "0xaaa",
        confirmed_at: "2026-04-20T10:00:00.000Z",
      },
    ]),
  });

  assert.equal(snapshot.status, "ready");
  assert.equal(snapshot.completedXp, 1000);
  assert.equal(snapshot.completedMissions, 4);
  assert.equal(snapshot.missions.find((mission) => mission.slug === "first-vault-tx")?.state, "completed");
  assert.equal(snapshot.missions.find((mission) => mission.slug === "active-vault-position")?.state, "completed");
  assert.match(snapshot.nextSafeAction, /XP economy/i);
});

test("defi xp snapshot turns borrow exposure into a safety rail before rewards", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: true,
    vaultPositions: baseVaultPositions,
    markets: [
      {
        ...baseMarkets[0],
        hasBorrowPosition: true,
      },
    ],
    transactions: buildDefiVaultTransactionSummary([]),
  });

  assert.equal(snapshot.status, "risk-watch");
  assert.equal(snapshot.missions.find((mission) => mission.slug === "borrow-safety")?.state, "warning");
  assert.match(snapshot.nextSafeAction, /borrow/i);
});
