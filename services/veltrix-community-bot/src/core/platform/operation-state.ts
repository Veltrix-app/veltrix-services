export type PlatformIncidentSeverity = "info" | "warning" | "critical";
export type PlatformIncidentStatus = "open" | "watching" | "resolved" | "dismissed";
export type PlatformObjectType =
  | "campaign"
  | "quest"
  | "raid"
  | "reward"
  | "claim"
  | "automation"
  | "community_run"
  | "provider_sync";
export type PlatformAuditAction =
  | "created"
  | "updated"
  | "published"
  | "paused"
  | "resumed"
  | "retried"
  | "resolved"
  | "dismissed"
  | "archived"
  | "tested";

export function normalizeIncidentSeverity(input: string | null | undefined): PlatformIncidentSeverity {
  if (input === "info" || input === "critical") {
    return input;
  }

  return "warning";
}

export function normalizeIncidentStatus(input: string | null | undefined): PlatformIncidentStatus {
  if (input === "watching" || input === "resolved" || input === "dismissed") {
    return input;
  }

  return "open";
}
