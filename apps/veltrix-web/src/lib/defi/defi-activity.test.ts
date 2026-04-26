import test from "node:test";
import assert from "node:assert/strict";

import { buildDefiActivityTimeline } from "./defi-activity";

test("defi activity timeline merges vault, market and xp proof newest first", () => {
  const activity = buildDefiActivityTimeline({
    vaultTransactions: [
      {
        status: "confirmed",
        action: "deposit",
        vault_slug: "usdc-vault",
        asset_symbol: "USDC",
        amount_raw: "1000000",
        tx_hash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        submitted_at: "2026-04-20T09:59:00.000Z",
        confirmed_at: "2026-04-20T10:00:00.000Z",
        failed_at: null,
        created_at: "2026-04-20T09:58:00.000Z",
        error_message: null,
      },
    ],
    marketTransactions: [
      {
        status: "confirmed",
        action: "supply",
        market_slug: "usdc-market",
        asset_symbol: "USDC",
        amount_raw: "2500000",
        tx_hash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        submitted_at: "2026-04-21T09:59:00.000Z",
        confirmed_at: "2026-04-21T10:00:00.000Z",
        failed_at: null,
        created_at: "2026-04-21T09:58:00.000Z",
        error_message: null,
      },
    ],
    xpEvents: [
      {
        source_type: "defi_mission",
        source_ref: "defi:first-market-supply",
        effective_xp: 300,
        created_at: "2026-04-22T10:00:00.000Z",
        metadata: { missionTitle: "Supply into a lending market" },
      },
    ],
  });

  assert.equal(activity.summary.totalItems, 3);
  assert.equal(activity.summary.confirmedTransactions, 2);
  assert.equal(activity.summary.xpClaims, 1);
  assert.deepEqual(
    activity.items.map((item) => item.id),
    [
      "xp:defi:first-market-supply:2026-04-22T10:00:00.000Z",
      "market:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "vault:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ]
  );
  assert.equal(activity.items[1].href, "https://basescan.org/tx/0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  assert.equal(activity.items[0].title, "Claimed 300 XP");
});

test("defi activity summary separates pending, failed and risk actions", () => {
  const activity = buildDefiActivityTimeline({
    vaultTransactions: [
      {
        status: "failed",
        action: "withdraw",
        vault_slug: "eth-vault",
        asset_symbol: "ETH",
        amount_raw: "5000000000000000",
        tx_hash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        submitted_at: "2026-04-21T09:59:00.000Z",
        confirmed_at: null,
        failed_at: "2026-04-21T10:00:00.000Z",
        created_at: "2026-04-21T09:58:00.000Z",
        error_message: "User rejected",
      },
    ],
    marketTransactions: [
      {
        status: "submitted",
        action: "borrow",
        market_slug: "eth-market",
        asset_symbol: "ETH",
        amount_raw: "1000000000000000",
        tx_hash: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        submitted_at: "2026-04-22T10:00:00.000Z",
        confirmed_at: null,
        failed_at: null,
        created_at: "2026-04-22T09:58:00.000Z",
        error_message: null,
      },
    ],
    xpEvents: [],
  });

  assert.equal(activity.summary.pendingTransactions, 1);
  assert.equal(activity.summary.failedTransactions, 1);
  assert.equal(activity.summary.borrowActions, 1);
  assert.equal(activity.items[0].tone, "warning");
  assert.match(activity.items[1].description, /User rejected/);
});
