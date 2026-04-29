import { clampGeneratedRaidXp } from "./tweet-to-raid.js";

export type ManualRaidCommandOverrides = {
  xp?: string;
  duration?: string;
  campaign?: string;
  button?: string;
};

export type NormalizedManualRaidOverrides = {
  rewardXp?: number;
  durationMinutes?: number;
  campaignRef?: string;
  buttonLabel?: string;
};

function parseDurationMinutes(value: string) {
  const match = value.trim().toLowerCase().match(/^(\d+)(m|h|d)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2] ?? "m";
  const multiplier = unit === "d" ? 1440 : unit === "h" ? 60 : 1;
  return amount * multiplier;
}

export function parseTelegramNewRaidCommand(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const url = parts.find((part) => /^https?:\/\/(x|twitter)\.com\//i.test(part)) ?? "";
  if (!url) {
    return { ok: false as const, reason: "missing_x_url" as const };
  }

  const overrides: ManualRaidCommandOverrides = {};
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    const value = rest.join("=").trim();
    if (!value) continue;
    if (key === "xp" || key === "duration" || key === "campaign" || key === "button") {
      overrides[key] = value;
    }
  }

  return { ok: true as const, url, overrides };
}

export function normalizeManualRaidOverrides(
  overrides: ManualRaidCommandOverrides
): NormalizedManualRaidOverrides {
  const rewardXp = overrides.xp ? clampGeneratedRaidXp(Number(overrides.xp)) : undefined;
  const rawDuration = overrides.duration ? parseDurationMinutes(overrides.duration) : null;
  const durationMinutes =
    rawDuration === null ? undefined : Math.min(10080, Math.max(15, Math.round(rawDuration)));
  const campaignRef = overrides.campaign?.trim() || undefined;
  const buttonLabel = overrides.button?.trim().slice(0, 32) || undefined;

  return {
    ...(rewardXp ? { rewardXp } : {}),
    ...(durationMinutes ? { durationMinutes } : {}),
    ...(campaignRef ? { campaignRef } : {}),
    ...(buttonLabel ? { buttonLabel } : {}),
  };
}

export function formatManualRaidCommandResult(params: {
  raidUrl: string;
  deliveries: Array<{ provider: string; ok: boolean; error?: string }>;
}) {
  const deliveryLabel =
    params.deliveries.length === 0
      ? "no configured delivery targets"
      : params.deliveries
          .map((delivery) =>
            delivery.ok
              ? `${delivery.provider} ok`
              : `${delivery.provider} failed (${delivery.error ?? "unknown error"})`
          )
          .join(", ");

  return `Live raid created: ${params.raidUrl}\nDelivery: ${deliveryLabel}`;
}

export function formatManualRaidCommandError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Manual live raid creation failed unexpectedly.";

  if (message.includes("Only project captains")) {
    return [
      "I couldn't create that raid yet.",
      "You need to be a Telegram group admin or a VYNTRO captain with raid-alert permission.",
      "If you are already an admin, make sure the bot can read group admin status and try again.",
    ].join("\n");
  }

  return `I couldn't create that raid yet: ${message}`;
}
