import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationPath = join(
  process.cwd(),
  "database/migrations/vyntro_featured_shard_pools_phase2a.sql"
);

test("featured shard pool migration creates the pool table and atomic grant rpc", () => {
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /create table if not exists public\.featured_shard_pools/i);
  assert.match(source, /remaining_shards integer not null/i);
  assert.match(source, /create or replace function public\.grant_shards_with_featured_pool/i);
  assert.match(source, /for update/i);
  assert.match(source, /source_dedupe_key/i);
  assert.match(source, /revoke all on function public\.grant_shards_with_featured_pool/i);
  assert.match(source, /grant execute on function public\.grant_shards_with_featured_pool[\s\S]+to service_role/i);
});
