import type { LiveNotification } from "@/types/live";

export type LiveActivityAmbientTone = "cyan" | "amber" | "rose" | "lime" | "slate";

export type LiveActivityAmbientEvent = {
  id: string;
  label: string;
  detail: string;
  tone: LiveActivityAmbientTone;
  href: string;
  createdAt: string;
};

export function buildLiveActivityAmbientEvents(input: {
  notifications: LiveNotification[];
  preferredRoute?: string | null;
  limit?: number;
}): LiveActivityAmbientEvent[] {
  const seen = new Set<string>();
  const preferredRoute = input.preferredRoute?.trim() || "/community";
  const limit = Math.max(1, Math.floor(input.limit ?? 6));

  return [...input.notifications]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .filter((notification) => {
      if (seen.has(notification.id)) {
        return false;
      }

      seen.add(notification.id);
      return true;
    })
    .slice(0, limit)
    .map((notification) => {
      const label = buildAmbientLabel(notification);
      const tone = getAmbientTone(notification, label);

      return {
        id: notification.id,
        label,
        detail: notification.body || notification.title,
        tone,
        href: getAmbientHref(notification.type, preferredRoute),
        createdAt: notification.createdAt,
      };
    });
}

function buildAmbientLabel(notification: LiveNotification) {
  const text = `${notification.title} ${notification.body}`;
  const shardMatch = text.match(/([+]?[\d,.]+)\s*shards?/i);

  if (shardMatch?.[1]) {
    const amount = shardMatch[1].startsWith("+") ? shardMatch[1] : `+${shardMatch[1]}`;
    return `${amount} shards earned`;
  }

  if (/badge/i.test(text) && /unlock/i.test(text)) {
    return "Badge unlocked";
  }

  if (notification.type === "raid" || /raid/i.test(text)) {
    return /confirmed/i.test(text) ? "Raid confirmed" : "Raid activity";
  }

  if (notification.type === "quest") {
    return /complete|approved|cleared/i.test(text) ? "Quest completed" : "Quest updated";
  }

  if (notification.type === "reward") {
    return /claim|vault/i.test(text) ? "Reward claim routed" : "Reward updated";
  }

  return notification.title;
}

function getAmbientTone(notification: LiveNotification, label: string): LiveActivityAmbientTone {
  if (/shards earned/i.test(label)) return "lime";
  if (/badge unlocked/i.test(label)) return "amber";
  if (notification.type === "raid") return "rose";
  if (notification.type === "quest") return "cyan";
  if (notification.type === "reward") return "amber";
  if (notification.type === "community") return "lime";
  return "slate";
}

function getAmbientHref(type: string, preferredRoute: string) {
  if (type === "quest") return "/quests";
  if (type === "reward") return "/lootboxes#reward-vault";
  if (type === "raid") return "/raids";
  if (type === "community") return preferredRoute;
  return "/notifications";
}
