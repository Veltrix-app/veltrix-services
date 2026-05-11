import type { LiveNotification } from "@/types/live";

export type LiveActivityCategory = "quest" | "reward" | "raid" | "community" | "system";
export type LiveActivityTone = "cyan" | "amber" | "rose" | "lime" | "slate";

export type LiveActivityFeedItem = {
  id: string;
  category: LiveActivityCategory;
  tone: LiveActivityTone;
  title: string;
  body: string;
  href: string;
  badgeLabel: string;
  actorLabel: string;
  whenLabel: string;
  createdAt: string;
  unread: boolean;
};

export type LiveActivityFeed = {
  items: LiveActivityFeedItem[];
  featuredItem: LiveActivityFeedItem | null;
  summary: {
    total: number;
    unread: number;
    quests: number;
    rewards: number;
    raids: number;
    community: number;
  };
  nextAction: {
    label: string;
    href: string;
  };
};

export function buildLiveActivityFeed(input: {
  notifications: LiveNotification[];
  preferredRoute?: string | null;
  now?: Date;
}): LiveActivityFeed {
  const now = input.now ?? new Date();
  const preferredRoute = input.preferredRoute?.trim() || "/community";
  const items = [...input.notifications]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((notification) => {
      const category = normalizeActivityCategory(notification.type);

      return {
        id: notification.id,
        category,
        tone: getActivityTone(category),
        title: notification.title,
        body: notification.body,
        href: getActivityHref(category, preferredRoute),
        badgeLabel: getActivityBadgeLabel(category),
        actorLabel: getActivityActorLabel(category),
        whenLabel: formatActivityAge(notification.createdAt, now),
        createdAt: notification.createdAt,
        unread: !notification.read,
      };
    });

  const unread = items.filter((item) => item.unread).length;
  const quests = items.filter((item) => item.category === "quest").length;
  const rewards = items.filter((item) => item.category === "reward").length;
  const raids = items.filter((item) => item.category === "raid").length;
  const community = items.filter((item) => item.category === "community").length;

  return {
    items,
    featuredItem: items.find((item) => item.unread) ?? items[0] ?? null,
    summary: {
      total: items.length,
      unread,
      quests,
      rewards,
      raids,
      community,
    },
    nextAction: buildActivityNextAction({ items, preferredRoute }),
  };
}

function normalizeActivityCategory(type: string): LiveActivityCategory {
  if (type === "quest") return "quest";
  if (type === "reward") return "reward";
  if (type === "raid") return "raid";
  if (type === "community") return "community";
  return "system";
}

function getActivityHref(category: LiveActivityCategory, preferredRoute: string) {
  if (category === "quest") return "/quests";
  if (category === "reward") return "/lootboxes#reward-vault";
  if (category === "raid") return "/raids";
  if (category === "community") return preferredRoute;
  return "/notifications";
}

function getActivityTone(category: LiveActivityCategory): LiveActivityTone {
  if (category === "quest") return "cyan";
  if (category === "reward") return "amber";
  if (category === "raid") return "rose";
  if (category === "community") return "lime";
  return "slate";
}

function getActivityBadgeLabel(category: LiveActivityCategory) {
  if (category === "quest") return "Quest";
  if (category === "reward") return "Reward";
  if (category === "raid") return "Raid";
  if (category === "community") return "Community";
  return "System";
}

function getActivityActorLabel(category: LiveActivityCategory) {
  if (category === "quest") return "Mission rail";
  if (category === "reward") return "Vault rail";
  if (category === "raid") return "Raid rail";
  if (category === "community") return "Community rail";
  return "VYNTRO";
}

function buildActivityNextAction(input: {
  items: LiveActivityFeedItem[];
  preferredRoute: string;
}) {
  const featured = input.items.find((item) => item.unread) ?? input.items[0] ?? null;

  if (featured) {
    return {
      label: `Open ${featured.badgeLabel.toLowerCase()}`,
      href: featured.href,
    };
  }

  return {
    label: "Create activity",
    href: input.preferredRoute,
  };
}

function formatActivityAge(createdAt: string, now: Date) {
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return "just now";

  const diffMs = Math.max(0, now.getTime() - createdMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}
