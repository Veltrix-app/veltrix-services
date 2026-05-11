import assert from "node:assert/strict";
import test from "node:test";
import type { LiveNotification } from "@/types/live";
import { buildLiveActivityAmbientEvents } from "./live-activity-ambient";

function notification(overrides: Partial<LiveNotification>): LiveNotification {
  return {
    id: "notification-default",
    title: "Default activity",
    body: "Activity body",
    read: false,
    type: "quest",
    createdAt: "2026-05-11T10:00:00.000Z",
    ...overrides,
  };
}

test("ambient events compact shard reward raid and badge signals", () => {
  const events = buildLiveActivityAmbientEvents({
    preferredRoute: "/community",
    notifications: [
      notification({
        id: "shards",
        type: "reward",
        title: "Shard reward earned",
        body: "+25 shards earned from Daily loop.",
        createdAt: "2026-05-11T10:03:00.000Z",
      }),
      notification({
        id: "raid",
        type: "raid",
        title: "Raid confirmed",
        body: "Launch raid moved into reputation.",
        createdAt: "2026-05-11T10:02:00.000Z",
      }),
      notification({
        id: "badge",
        type: "system",
        title: "Badge unlocked",
        body: "Shard Hunter badge unlocked.",
        createdAt: "2026-05-11T10:01:00.000Z",
      }),
    ],
  });

  assert.deepEqual(
    events.map((event) => [event.id, event.label, event.tone, event.href]),
    [
      ["shards", "+25 shards earned", "lime", "/lootboxes#reward-vault"],
      ["raid", "Raid confirmed", "rose", "/raids"],
      ["badge", "Badge unlocked", "amber", "/notifications"],
    ]
  );
});

test("ambient events dedupe and limit newest signals", () => {
  const events = buildLiveActivityAmbientEvents({
    limit: 2,
    notifications: [
      notification({ id: "same", title: "Older", createdAt: "2026-05-11T10:00:00.000Z" }),
      notification({ id: "new", title: "Newer", createdAt: "2026-05-11T10:02:00.000Z" }),
      notification({ id: "same", title: "Duplicate", createdAt: "2026-05-11T10:03:00.000Z" }),
    ],
  });

  assert.deepEqual(
    events.map((event) => event.id),
    ["same", "new"]
  );
});
