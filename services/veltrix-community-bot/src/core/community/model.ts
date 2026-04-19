export const COMMUNITY_AUTOMATION_TYPES = [
  "rank_sync",
  "leaderboard_pulse",
  "mission_digest",
  "raid_reminder",
  "newcomer_pulse",
  "reactivation_pulse",
  "activation_board",
] as const;

export const COMMUNITY_PLAYBOOK_KEYS = [
  "launch_week",
  "raid_week",
  "comeback_week",
  "campaign_push",
] as const;

export const COMMUNITY_CAPTAIN_PERMISSIONS = [
  "rank_sync",
  "leaderboard_post",
  "raid_alert",
  "mission_digest",
  "newcomer_wave",
  "reactivation_wave",
  "activation_board",
] as const;

export type CommunityAutomationType = (typeof COMMUNITY_AUTOMATION_TYPES)[number];
export type CommunityPlaybookKey = (typeof COMMUNITY_PLAYBOOK_KEYS)[number];
export type CommunityCaptainPermission = (typeof COMMUNITY_CAPTAIN_PERMISSIONS)[number];
export type CommunityAutomationCadence = "manual" | "daily" | "weekly";
export type CommunityAutomationStatus = "active" | "paused";

const CAPTAIN_PERMISSION_SET = new Set<string>(COMMUNITY_CAPTAIN_PERMISSIONS);

export function normalizeCaptainPermissionList(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as CommunityCaptainPermission[];
  }

  const seen = new Set<CommunityCaptainPermission>();
  for (const value of input) {
    if (typeof value !== "string") {
      continue;
    }

    if (!CAPTAIN_PERMISSION_SET.has(value)) {
      continue;
    }

    seen.add(value as CommunityCaptainPermission);
  }

  return Array.from(seen);
}

export function computeNextCommunityAutomationRunAt(input: {
  cadence: CommunityAutomationCadence;
  fromIso?: string | null;
}) {
  if (input.cadence === "manual") {
    return null;
  }

  const fromDate = input.fromIso ? new Date(input.fromIso) : new Date();
  const nextDate = new Date(fromDate);
  nextDate.setUTCSeconds(0, 0);

  if (input.cadence === "daily") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  } else {
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);
  }

  return nextDate.toISOString();
}

export function isCommunityAutomationDue(input: {
  status: CommunityAutomationStatus;
  nextRunAt?: string | null;
  nowIso?: string;
}) {
  if (input.status !== "active") {
    return false;
  }

  if (!input.nextRunAt) {
    return false;
  }

  const now = new Date(input.nowIso ?? new Date().toISOString()).getTime();
  const nextRun = new Date(input.nextRunAt).getTime();

  if (Number.isNaN(now) || Number.isNaN(nextRun)) {
    return false;
  }

  return nextRun <= now;
}

export function getCommunityPlaybookSteps(playbookKey: CommunityPlaybookKey) {
  if (playbookKey === "launch_week") {
    return [
      "activation_board",
      "mission_digest",
      "leaderboard_pulse",
    ] as CommunityAutomationType[];
  }

  if (playbookKey === "raid_week") {
    return [
      "raid_reminder",
      "leaderboard_pulse",
    ] as CommunityAutomationType[];
  }

  if (playbookKey === "comeback_week") {
    return [
      "reactivation_pulse",
      "mission_digest",
      "leaderboard_pulse",
    ] as CommunityAutomationType[];
  }

  return [
    "activation_board",
    "mission_digest",
  ] as CommunityAutomationType[];
}
