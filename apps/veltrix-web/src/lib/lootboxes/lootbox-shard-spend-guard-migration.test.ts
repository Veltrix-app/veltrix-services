import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationPath = join(
  process.cwd(),
  "database/migrations/vyntro_lootbox_atomic_shard_spend_phase2f.sql"
);

test("lootbox shard spend guard migration adds an idempotent atomic spend rpc", () => {
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /create or replace function public\.spend_shards_if_balance_available/i);
  assert.match(source, /pg_advisory_xact_lock/i);
  assert.match(source, /source_dedupe_key/i);
  assert.match(source, /Insufficient shard balance/i);
  assert.match(source, /insert into public\.shard_ledger/i);
  assert.match(source, /amount,\s*source_type,\s*source_ref,\s*source_dedupe_key/i);
  assert.match(source, /return query select true/i);
  assert.match(source, /revoke all on function public\.spend_shards_if_balance_available/i);
  assert.match(source, /grant execute on function public\.spend_shards_if_balance_available[\s\S]+to service_role/i);
});
