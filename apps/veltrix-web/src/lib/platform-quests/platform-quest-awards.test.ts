import assert from "node:assert/strict";
import test from "node:test";
import { buildPlatformQuestShardAwardRequest } from "./platform-quest-awards";

test("platform quest award request maps eligibility to shard ledger input", () => {
  const request = buildPlatformQuestShardAwardRequest({
    authUserId: "user-1",
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    eligibility: { ok: true, shardAmount: 40, windowKey: "2026-W19" },
  });

  assert.deepEqual(request, {
    authUserId: "user-1",
    amount: 40,
    sourceType: "platform_quest",
    sourceRef: "platform_quest:weekly-activity-streak:2026-W19",
    action: "claim",
    reason: "Platform quest reward: weekly-activity-streak",
    metadata: {
      source: "vyntro_platform_quest",
      slug: "weekly-activity-streak",
      windowKey: "2026-W19",
    },
  });
});

test("platform quest award request returns null for blocked eligibility", () => {
  const request = buildPlatformQuestShardAwardRequest({
    authUserId: "user-1",
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    eligibility: {
      ok: false,
      reason: "not-eligible",
      message: "This platform shard reward is not eligible yet.",
    },
  });

  assert.equal(request, null);
});
