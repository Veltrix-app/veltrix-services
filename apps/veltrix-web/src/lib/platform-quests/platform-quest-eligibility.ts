import { getPlatformQuestBySlug, type PlatformQuestSlug } from "./platform-quest-catalog";

export type PlatformQuestEligibilityEvents = {
  confirmedSwapCount: number;
  realActionsToday: number;
  realActionsThisWeek: number;
  activatedInvitesThisWeek: number;
  openedLootboxCount: number;
};

export type PlatformQuestEligibilityInput = {
  slug: PlatformQuestSlug;
  now?: string;
  trustStatus?: string | null;
  sybilScore?: number | null;
  events: PlatformQuestEligibilityEvents;
  claimedSourceRefs?: string[];
};

export type PlatformQuestEligibilityResult =
  | { ok: true; shardAmount: number; windowKey: string }
  | {
      ok: false;
      reason:
        | "unknown-quest"
        | "not-shard-bearing"
        | "trust-blocked"
        | "not-eligible"
        | "already-claimed";
      message: string;
    };

export function getUtcDayKey(now = new Date().toISOString()) {
  return new Date(now).toISOString().slice(0, 10);
}

export function getUtcWeekKey(now = new Date().toISOString()) {
  const date = new Date(now);
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function buildPlatformQuestShardSource(slug: PlatformQuestSlug, windowKey: string) {
  return {
    sourceType: "platform_quest",
    sourceRef: `platform_quest:${slug}:${windowKey}`,
    action: "claim",
  };
}

export function buildPlatformQuestEligibility(
  input: PlatformQuestEligibilityInput
): PlatformQuestEligibilityResult {
  const quest = getPlatformQuestBySlug(input.slug);
  if (!quest) {
    return { ok: false, reason: "unknown-quest", message: "Unknown platform quest." };
  }

  if (quest.shardRewardAmount <= 0) {
    return {
      ok: false,
      reason: "not-shard-bearing",
      message: "This platform quest does not award shards.",
    };
  }

  if ((input.trustStatus && input.trustStatus !== "active") || Number(input.sybilScore ?? 0) >= 90) {
    return {
      ok: false,
      reason: "trust-blocked",
      message: "This account needs trust review before shard rewards can be claimed.",
    };
  }

  const now = input.now ?? new Date().toISOString();
  const windowKey =
    quest.shardRewardWindow === "daily"
      ? getUtcDayKey(now)
      : quest.shardRewardWindow === "weekly"
        ? getUtcWeekKey(now)
        : "lifetime";
  const sourceRef = buildPlatformQuestShardSource(input.slug, windowKey).sourceRef;

  if ((input.claimedSourceRefs ?? []).includes(sourceRef)) {
    return {
      ok: false,
      reason: "already-claimed",
      message: "This platform shard reward was already claimed.",
    };
  }

  const eligible =
    input.slug === "first-verified-swap"
      ? input.events.confirmedSwapCount > 0
      : input.slug === "daily-real-action"
        ? input.events.realActionsToday > 0
        : input.slug === "weekly-activity-streak"
          ? input.events.realActionsThisWeek >= 3
          : input.slug === "verified-invite"
            ? input.events.activatedInvitesThisWeek > 0
            : input.slug === "first-lootbox-open"
              ? input.events.openedLootboxCount > 0
              : false;

  if (!eligible) {
    return {
      ok: false,
      reason: "not-eligible",
      message: "This platform shard reward is not eligible yet.",
    };
  }

  return { ok: true, shardAmount: quest.shardRewardAmount, windowKey };
}
