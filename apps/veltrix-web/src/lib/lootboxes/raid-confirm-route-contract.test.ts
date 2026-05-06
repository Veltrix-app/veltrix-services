import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const routePath = join(
  process.cwd(),
  "apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts"
);

test("raid confirmation does not select the missing user_progress id column", () => {
  const source = readFileSync(routePath, "utf8");

  assert.doesNotMatch(source, /select\("id,\s*joined_communities/i);
  assert.match(
    source,
    /select\("joined_communities,\s*confirmed_raids,\s*claimed_rewards,\s*opened_lootbox_ids,\s*unlocked_reward_ids,\s*quest_statuses"\)/i
  );
});
