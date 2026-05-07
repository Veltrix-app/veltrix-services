import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationPath = join(
  process.cwd(),
  "database/migrations/vyntro_lootbox_sponsor_packages_phase2l.sql"
);

test("lootbox sponsor package migration adds package and note persistence tables safely", () => {
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /create table if not exists public\.lootbox_sponsor_packages/i);
  assert.match(source, /create table if not exists public\.lootbox_sponsor_package_notes/i);
  assert.match(source, /package_snapshot jsonb not null default '\{\}'::jsonb/i);
  assert.match(source, /owner_auth_user_id uuid references auth\.users\(id\) on delete set null/i);
  assert.match(source, /follow_up_at timestamp with time zone/i);
  assert.match(source, /lootbox_sponsor_packages_status_check/i);
  assert.match(source, /lootbox_sponsor_package_notes_note_type_check/i);
  assert.match(source, /alter table public\.lootbox_sponsor_packages enable row level security/i);
  assert.match(source, /alter table public\.lootbox_sponsor_package_notes enable row level security/i);
  assert.match(source, /public\.has_project_role\(auth\.uid\(\), project_id, array\['owner', 'admin'\]\)/i);
  assert.doesNotMatch(source, /alter table public\.user_inventory/i);
  assert.doesNotMatch(source, /alter table public\.lootbox_opens/i);
});
