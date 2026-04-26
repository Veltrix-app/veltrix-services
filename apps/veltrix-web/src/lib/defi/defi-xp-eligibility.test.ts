import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFI_XP_SOURCE_TYPE,
  buildDefiXpClaimPlan,
  buildDefiMarketTransactionSummary,
  buildDefiXpSourceRef,
  buildDefiVaultTransactionSummary,
  buildDefiXpEligibilitySnapshot,
} from "./defi-xp-eligibility";
import { XP_SOURCE_TYPES, buildXpSourceRef } from "../xp/xp-economy";

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
    collateralEnabled: false,
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
  assert.equal(snapshot.claimableXp, 1000);
  assert.equal(snapshot.claimedXp, 0);
  assert.equal(snapshot.completedMissions, 4);
  assert.equal(snapshot.missions.find((mission) => mission.slug === "first-vault-tx")?.state, "completed");
  assert.equal(
    snapshot.missions.find((mission) => mission.slug === "first-vault-tx")?.claimState,
    "claimable"
  );
  assert.equal(snapshot.missions.find((mission) => mission.slug === "active-vault-position")?.state, "completed");
  assert.match(snapshot.nextSafeAction, /eligible DeFi mission/i);
});

test("defi xp snapshot marks already claimed missions without making them claimable again", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: true,
    claimedSourceRefs: [buildDefiXpSourceRef("connect-wallet")],
    vaultPositions: baseVaultPositions,
    markets: baseMarkets,
    transactions: buildDefiVaultTransactionSummary([]),
  });

  const connectMission = snapshot.missions.find((mission) => mission.slug === "connect-wallet");

  assert.equal(DEFI_XP_SOURCE_TYPE, "defi_mission");
  assert.equal(connectMission?.sourceRef, "defi:connect-wallet");
  assert.equal(DEFI_XP_SOURCE_TYPE, XP_SOURCE_TYPES.defi);
  assert.equal(buildDefiXpSourceRef("connect-wallet"), buildXpSourceRef(XP_SOURCE_TYPES.defi, "connect-wallet"));
  assert.equal(connectMission?.claimState, "claimed");
  assert.equal(snapshot.claimedXp, 100);
  assert.equal(snapshot.claimableXp, 150);
});

test("defi xp claim plan only allows completed unclaimed XP missions", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: true,
    claimedSourceRefs: [buildDefiXpSourceRef("connect-wallet")],
    vaultPositions: baseVaultPositions,
    markets: baseMarkets,
    transactions: buildDefiVaultTransactionSummary([]),
  });

  const marketPlan = buildDefiXpClaimPlan({
    snapshot,
    missionSlug: "market-scout",
  });
  const duplicatePlan = buildDefiXpClaimPlan({
    snapshot,
    missionSlug: "connect-wallet",
  });
  const lockedPlan = buildDefiXpClaimPlan({
    snapshot,
    missionSlug: "first-vault-tx",
  });
  const guardPlan = buildDefiXpClaimPlan({
    snapshot,
    missionSlug: "borrow-safety",
  });

  assert.equal(marketPlan.ok, true);
  assert.equal(marketPlan.ok ? marketPlan.event.sourceType : "", "defi_mission");
  assert.equal(marketPlan.ok ? marketPlan.event.sourceRef : "", "defi:market-scout");
  assert.equal(marketPlan.ok ? marketPlan.event.xpAmount : 150, 150);
  assert.equal(duplicatePlan.ok, false);
  assert.equal(duplicatePlan.ok ? false : duplicatePlan.alreadyClaimed, true);
  assert.equal(lockedPlan.ok, false);
  assert.equal(guardPlan.ok, false);
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

test("defi market transaction summary counts safe lending actions without rewarding borrow volume", () => {
  const summary = buildDefiMarketTransactionSummary([
    {
      status: "confirmed",
      action: "supply",
      market_slug: "usdc-market",
      asset_symbol: "USDC",
      tx_hash: "0xaaa",
      confirmed_at: "2026-04-22T10:00:00.000Z",
    },
    {
      status: "confirmed",
      action: "enable-collateral",
      market_slug: "usdc-market",
      asset_symbol: "USDC",
      tx_hash: "0xbbb",
      confirmed_at: "2026-04-22T11:00:00.000Z",
    },
    {
      status: "confirmed",
      action: "borrow",
      market_slug: "eth-market",
      asset_symbol: "ETH",
      tx_hash: "0xccc",
      confirmed_at: "2026-04-22T12:00:00.000Z",
    },
    {
      status: "submitted",
      action: "repay",
      market_slug: "eth-market",
      asset_symbol: "ETH",
      tx_hash: "0xddd",
      confirmed_at: null,
    },
  ]);

  assert.equal(summary.confirmedCount, 3);
  assert.equal(summary.confirmedSupplies, 1);
  assert.equal(summary.confirmedCollateralEnables, 1);
  assert.equal(summary.confirmedBorrows, 1);
  assert.equal(summary.confirmedRepays, 0);
  assert.deepEqual(summary.uniqueMarkets, ["usdc-market", "eth-market"]);
  assert.equal(summary.latestConfirmedAt, "2026-04-22T12:00:00.000Z");
});

test("defi xp snapshot adds market supply and collateral missions but keeps borrow as a guard", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: true,
    vaultPositions: baseVaultPositions,
    markets: [
      {
        ...baseMarkets[0],
        hasSupplyPosition: true,
        collateralEnabled: true,
      },
    ],
    transactions: buildDefiVaultTransactionSummary([]),
    marketTransactions: buildDefiMarketTransactionSummary([
      {
        status: "confirmed",
        action: "supply",
        market_slug: "usdc-market",
        asset_symbol: "USDC",
        tx_hash: "0xaaa",
        confirmed_at: "2026-04-22T10:00:00.000Z",
      },
      {
        status: "confirmed",
        action: "enable-collateral",
        market_slug: "usdc-market",
        asset_symbol: "USDC",
        tx_hash: "0xbbb",
        confirmed_at: "2026-04-22T11:00:00.000Z",
      },
      {
        status: "confirmed",
        action: "borrow",
        market_slug: "usdc-market",
        asset_symbol: "USDC",
        tx_hash: "0xccc",
        confirmed_at: "2026-04-22T12:00:00.000Z",
      },
    ]),
  });

  const supplyMission = snapshot.missions.find((mission) => mission.slug === "first-market-supply");
  const collateralMission = snapshot.missions.find((mission) => mission.slug === "collateral-ready");
  const borrowSafetyMission = snapshot.missions.find((mission) => mission.slug === "borrow-safety");

  assert.equal(snapshot.status, "ready");
  assert.equal(supplyMission?.state, "completed");
  assert.equal(supplyMission?.claimState, "claimable");
  assert.equal(collateralMission?.state, "completed");
  assert.equal(collateralMission?.claimState, "claimable");
  assert.equal(borrowSafetyMission?.xp, 0);
  assert.equal(snapshot.previewXp, 1850);
});

test("defi xp snapshot rewards repay discipline only after a confirmed repay clears borrow risk", () => {
  const snapshot = buildDefiXpEligibilitySnapshot({
    walletReady: true,
    vaultPositions: baseVaultPositions,
    markets: [
      {
        ...baseMarkets[0],
        hasSupplyPosition: true,
        hasBorrowPosition: false,
        collateralEnabled: true,
      },
    ],
    transactions: buildDefiVaultTransactionSummary([]),
    marketTransactions: buildDefiMarketTransactionSummary([
      {
        status: "confirmed",
        action: "repay",
        market_slug: "usdc-market",
        asset_symbol: "USDC",
        tx_hash: "0xaaa",
        confirmed_at: "2026-04-23T10:00:00.000Z",
      },
    ]),
  });

  const repayMission = snapshot.missions.find((mission) => mission.slug === "repay-discipline");

  assert.equal(repayMission?.state, "completed");
  assert.equal(repayMission?.claimState, "claimable");
  assert.equal(snapshot.status, "ready");
});
