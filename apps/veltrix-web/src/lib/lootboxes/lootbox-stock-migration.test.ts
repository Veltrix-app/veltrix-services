import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationPath = join(
  process.cwd(),
  "database/migrations/vyntro_lootbox_stock_reservation_phase2b.sql"
);

test("lootbox stock reservation migration adds atomic reserve and restore rpcs", () => {
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /create or replace function public\.reserve_lootbox_pool_item_stock/i);
  assert.match(source, /update public\.lootbox_pool_items[\s\S]+stock = stock - 1/i);
  assert.match(source, /where id = p_pool_item_id[\s\S]+stock > 0/i);
  assert.match(source, /create or replace function public\.restore_lootbox_pool_item_stock/i);
  assert.match(source, /stock = stock \+ 1/i);
  assert.match(source, /revoke all on function public\.reserve_lootbox_pool_item_stock/i);
  assert.match(source, /grant execute on function public\.reserve_lootbox_pool_item_stock[\s\S]+to service_role/i);
});
