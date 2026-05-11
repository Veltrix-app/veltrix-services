import assert from "node:assert/strict";
import test from "node:test";
import type { LiveNotification } from "@/types/live";
import { buildLiveActivityFeed } from "./live-activity-feed";

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

test("buildLiveActivityFeed sorts activity newest first and features unread activity", () => {
  const feed = buildLiveActivityFeed({
    now: new Date("2026-05-11T11:00:00.000Z"),
    preferredRoute: "/community/onboarding",
    notifications: [
      notification({ id: "old-read", read: true, title: "Old read", createdAt: "2026-05-10T10:00:00.000Z" }),
      notification({ id: "new-read", read: true, title: "New read", createdAt: "2026-05-11T10:50:00.000Z" }),
      notification({ id: "unread", read: false, title: "Unread quest", createdAt: "2026-05-11T10:20:00.000Z" }),
    ],
  });

  assert.deepEqual(feed.items.map((item) => item.id), ["new-read", "unread", "old-read"]);
  assert.equal(feed.featuredItem?.id, "unread");
  assert.equal(feed.items[0]?.whenLabel, "10m ago");
  assert.equal(feed.summary.total, 3);
  assert.equal(feed.summary.unread, 1);
});

test("buildLiveActivityFeed routes categories to the right product surface", () => {
  const feed = buildLiveActivityFeed({
    preferredRoute: "/community/comeback",
    notifications: [
      notification({ id: "quest", type: "quest" }),
      notification({ id: "reward", type: "reward" }),
      notification({ id: "raid", type: "raid" }),
      notification({ id: "community", type: "community" }),
      notification({ id: "system", type: "system" }),
    ],
  });

  assert.deepEqual(
    feed.items.map((item) => [item.id, item.href, item.tone]),
    [
      ["quest", "/quests", "cyan"],
      ["reward", "/lootboxes#reward-vault", "amber"],
      ["raid", "/raids", "rose"],
      ["community", "/community/comeback", "lime"],
      ["system", "/notifications", "slate"],
    ]
  );
  assert.equal(feed.summary.quests, 1);
  assert.equal(feed.summary.rewards, 1);
  assert.equal(feed.summary.raids, 1);
  assert.equal(feed.summary.community, 1);
});

test("buildLiveActivityFeed sends quiet feeds back to the preferred route", () => {
  const feed = buildLiveActivityFeed({
    preferredRoute: "/quests",
    notifications: [],
  });

  assert.equal(feed.featuredItem, null);
  assert.equal(feed.nextAction.label, "Create activity");
  assert.equal(feed.nextAction.href, "/quests");
});
