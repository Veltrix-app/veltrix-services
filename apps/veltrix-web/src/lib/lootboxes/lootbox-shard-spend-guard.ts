export type LootboxShardSpendRpcArgs = {
  p_auth_user_id: string;
  p_amount: number;
  p_source_type: "lootbox_open";
  p_source_ref: string;
  p_action: "spend";
  p_reason: string;
  p_metadata: {
    tierId: string;
    priceShards: number;
  };
};

type LootboxShardSpendRpcRow = {
  ok?: boolean | null;
  ledger_id?: string | null;
  balance_after?: number | string | null;
  error?: string | null;
};

export type LootboxShardSpendResult =
  | {
      ok: true;
      ledgerId: string | null;
      balanceAfter: number;
      error: null;
    }
  | {
      ok: false;
      status: number;
      ledgerId: null;
      balanceAfter: number;
      error: string;
    };

export function buildLootboxShardSpendRpcArgs(params: {
  authUserId: string;
  openId: string;
  tierId: string;
  tierLabel: string;
  priceShards: number;
}): LootboxShardSpendRpcArgs {
  const priceShards = Math.floor(params.priceShards);
  if (priceShards <= 0) {
    throw new Error("Lootbox shard spend amount must be positive.");
  }

  return {
    p_auth_user_id: params.authUserId,
    p_amount: priceShards,
    p_source_type: "lootbox_open",
    p_source_ref: params.openId,
    p_action: "spend",
    p_reason: `${params.tierLabel} opened`,
    p_metadata: {
      tierId: params.tierId,
      priceShards,
    },
  };
}

export function normalizeLootboxShardSpendRpcResult(
  value: LootboxShardSpendRpcRow | LootboxShardSpendRpcRow[] | null
): LootboxShardSpendResult {
  const row = Array.isArray(value) ? value[0] : value;
  const balanceAfter = toNumber(row?.balance_after);

  if (row?.ok === true) {
    return {
      ok: true,
      ledgerId: typeof row.ledger_id === "string" ? row.ledger_id : null,
      balanceAfter,
      error: null,
    };
  }

  const error = readText(row?.error) ?? "Lootbox shard spend was rejected.";
  return {
    ok: false,
    status: /insufficient shard balance/i.test(error) ? 409 : 500,
    ledgerId: null,
    balanceAfter,
    error,
  };
}

export function isMissingLootboxSpendGuardRpcError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "42883" ||
    error.code === "PGRST202" ||
    /spend_shards_if_balance_available/i.test(error.message ?? "")
  );
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
