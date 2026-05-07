import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxShardSpendRpcArgs,
  isMissingLootboxSpendGuardRpcError,
  normalizeLootboxShardSpendRpcResult,
} from "./lootbox-shard-spend-guard";

test("buildLootboxShardSpendRpcArgs creates an idempotent positive lootbox spend request", () => {
  assert.deepEqual(
    buildLootboxShardSpendRpcArgs({
      authUserId: "9a05f6b4-85e5-4b12-8948-2eb2918d5c7e",
      openId: "open-123",
      tierId: "epic",
      tierLabel: "Epic Lootbox",
      priceShards: 2000,
    }),
    {
      p_auth_user_id: "9a05f6b4-85e5-4b12-8948-2eb2918d5c7e",
      p_amount: 2000,
      p_source_type: "lootbox_open",
      p_source_ref: "open-123",
      p_action: "spend",
      p_reason: "Epic Lootbox opened",
      p_metadata: {
        tierId: "epic",
        priceShards: 2000,
      },
    }
  );
});

test("buildLootboxShardSpendRpcArgs rejects invalid lootbox spend amounts", () => {
  assert.throws(
    () =>
      buildLootboxShardSpendRpcArgs({
        authUserId: "9a05f6b4-85e5-4b12-8948-2eb2918d5c7e",
        openId: "open-123",
        tierId: "common",
        tierLabel: "Common Lootbox",
        priceShards: 0,
      }),
    /positive/i
  );
});

test("normalizeLootboxShardSpendRpcResult preserves the guarded ledger id and balance", () => {
  assert.deepEqual(
    normalizeLootboxShardSpendRpcResult({
      ok: true,
      ledger_id: "ledger-123",
      balance_after: 725,
      error: null,
    }),
    {
      ok: true,
      ledgerId: "ledger-123",
      balanceAfter: 725,
      error: null,
    }
  );
});

test("normalizeLootboxShardSpendRpcResult blocks insufficient shard balance as a conflict", () => {
  assert.deepEqual(
    normalizeLootboxShardSpendRpcResult({
      ok: false,
      ledger_id: null,
      balance_after: 125,
      error: "Insufficient shard balance.",
    }),
    {
      ok: false,
      status: 409,
      ledgerId: null,
      balanceAfter: 125,
      error: "Insufficient shard balance.",
    }
  );
});

test("isMissingLootboxSpendGuardRpcError recognizes undeployed RPC errors", () => {
  assert.equal(isMissingLootboxSpendGuardRpcError({ code: "42883", message: "" }), true);
  assert.equal(
    isMissingLootboxSpendGuardRpcError({
      code: "PGRST202",
      message: "Could not find the function public.spend_shards_if_balance_available",
    }),
    true
  );
  assert.equal(isMissingLootboxSpendGuardRpcError({ code: "23505", message: "duplicate" }), false);
});
