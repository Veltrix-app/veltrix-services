import test from "node:test";
import assert from "node:assert/strict";

import { buildDefiActivityTimeline } from "./defi-activity";
import { buildDefiActionConsoleRead } from "./defi-action-console";
import { buildDefiPortfolioRead } from "./defi-portfolio";

const baseXpSnapshot = {
  status: "ready",
  completedXp: 0,
  claimedXp: 0,
  claimableXp: 0,
  nextSafeAction: "Complete the next eligible DeFi mission",
};

test("defi action console gates DeFi actions behind a connected wallet", () => {
  const portfolio = buildDefiPortfolioRead({
    walletReady: false,
    vaultPositions: [],
    markets: [],
    xpSnapshot: baseXpSnapshot,
  });
  const consoleRead = buildDefiActionConsoleRead({
    walletReady: false,
    portfolio,
    activity: buildDefiActivityTimeline({
      vaultTransactions: [],
      marketTransactions: [],
      swapTransactions: [],
      xpEvents: [],
    }),
  });

  assert.equal(consoleRead.status, "wallet-needed");
  assert.equal(consoleRead.primaryAction.href, "/profile");
  assert.match(consoleRead.headline, /connect wallet/i);
  assert.equal(consoleRead.metrics.find((metric) => metric.label === "Wallet")?.value, "Needed");
});

test("defi action console prioritizes claimable xp and recent proof", () => {
  const portfolio = buildDefiPortfolioRead({
    walletReady: true,
    vaultPositions: [
      {
        status: "position-detected",
        assetSymbol: "USDC",
        underlyingLabel: "25 USDC",
        vault: { label: "USDC Vault", slug: "usdc-vault" },
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
      completedXp: 800,
      claimableXp: 500,
    },
  });
  const consoleRead = buildDefiActionConsoleRead({
    walletReady: true,
    portfolio,
    activity: buildDefiActivityTimeline({
      vaultTransactions: [
        {
          status: "confirmed",
          action: "deposit",
          vault_slug: "usdc-vault",
          market_slug: null,
          asset_symbol: "USDC",
          amount_raw: "25000000",
          tx_hash: "0xabc",
          submitted_at: "2026-05-10T10:00:00.000Z",
          confirmed_at: "2026-05-10T10:01:00.000Z",
          failed_at: null,
          created_at: "2026-05-10T10:00:00.000Z",
          error_message: null,
        },
      ],
      marketTransactions: [],
      swapTransactions: [],
      xpEvents: [],
    }),
  });

  assert.equal(consoleRead.status, "ready");
  assert.equal(consoleRead.primaryAction.href, "/defi/portfolio");
  assert.match(consoleRead.primaryAction.label, /claim/i);
  assert.equal(consoleRead.activity.length, 1);
  assert.equal(consoleRead.metrics.find((metric) => metric.label === "Claimable XP")?.value, "500 XP");
});

test("defi action console keeps borrow exposure on the risk rail", () => {
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
        accountShortfallRaw: "0",
      },
    ],
    xpSnapshot: {
      ...baseXpSnapshot,
      claimableXp: 500,
    },
  });
  const consoleRead = buildDefiActionConsoleRead({
    walletReady: true,
    portfolio,
    activity: buildDefiActivityTimeline({
      vaultTransactions: [],
      marketTransactions: [],
      swapTransactions: [],
      xpEvents: [],
    }),
  });

  assert.equal(consoleRead.status, "risk-watch");
  assert.equal(consoleRead.primaryAction.href, "/defi/borrow-lending");
  assert.match(consoleRead.headline, /borrow exposure/i);
  assert.equal(
    consoleRead.routes.find((route) => route.label === "Borrow / lending")?.state,
    "Watch"
  );
});
