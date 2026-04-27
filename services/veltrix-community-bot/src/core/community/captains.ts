import { supabaseAdmin } from "../../lib/supabase.js";
import {
  type CommunityAutomationType,
  type CommunityCaptainPermission,
  normalizeCaptainPermissionList,
} from "./model.js";

type CaptainAssignment = {
  authUserId: string;
  role: string;
  label: string;
};

export type CaptainSeatScope = "project_only" | "community_only" | "project_and_community";

type CaptainConfig = {
  assignments: CaptainAssignment[];
  permissionMap: Record<string, CommunityCaptainPermission[]>;
  seatScopeMap: Record<string, CaptainSeatScope>;
};

const AUTOMATION_PERMISSION_MAP: Record<CommunityAutomationType, CommunityCaptainPermission> = {
  rank_sync: "rank_sync",
  leaderboard_pulse: "leaderboard_post",
  mission_digest: "mission_digest",
  raid_reminder: "raid_alert",
  newcomer_pulse: "newcomer_wave",
  reactivation_pulse: "reactivation_wave",
  activation_board: "activation_board",
  tweet_to_raid: "raid_alert",
};

const AUTOMATION_SCOPE_MAP: Record<CommunityAutomationType, CaptainSeatScope> = {
  rank_sync: "community_only",
  leaderboard_pulse: "community_only",
  mission_digest: "community_only",
  raid_reminder: "community_only",
  newcomer_pulse: "project_and_community",
  reactivation_pulse: "project_and_community",
  activation_board: "project_and_community",
  tweet_to_raid: "community_only",
};

export function buildCaptainSeatKey(authUserId: string, role: string) {
  return `${authUserId}:${role}`;
}

function sanitizeCaptainAssignments(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as CaptainAssignment[];
  }

  return input
    .map((candidate) => {
      const row =
        candidate && typeof candidate === "object"
          ? (candidate as Record<string, unknown>)
          : {};
      const authUserId =
        typeof row.authUserId === "string" ? row.authUserId.trim() : "";
      const role = typeof row.role === "string" ? row.role.trim() : "community_captain";
      const label = typeof row.label === "string" ? row.label.trim() : "";

      return {
        authUserId,
        role,
        label,
      };
    })
    .filter((row) => row.authUserId.length > 0);
}

function sanitizeCaptainPermissionMap(input: unknown) {
  if (!input || typeof input !== "object") {
    return {} as Record<string, CommunityCaptainPermission[]>;
  }

  const result: Record<string, CommunityCaptainPermission[]> = {};
  for (const [seatKey, permissions] of Object.entries(input as Record<string, unknown>)) {
    if (!seatKey.trim()) {
      continue;
    }

    result[seatKey] = normalizeCaptainPermissionList(permissions);
  }

  return result;
}

export function normalizeCaptainSeatScope(value: unknown): CaptainSeatScope {
  if (
    value === "project_only" ||
    value === "community_only" ||
    value === "project_and_community"
  ) {
    return value;
  }

  return "project_and_community";
}

function sanitizeCaptainSeatScopeMap(input: unknown, assignments: CaptainAssignment[]) {
  if (!input || typeof input !== "object") {
    return {} as Record<string, CaptainSeatScope>;
  }

  const result: Record<string, CaptainSeatScope> = {};
  for (const [seatKey, scope] of Object.entries(input as Record<string, unknown>)) {
    if (!seatKey.trim()) {
      continue;
    }

    if (seatKey.includes(":")) {
      result[seatKey] = normalizeCaptainSeatScope(scope);
      continue;
    }

    const matchingAssignments = assignments.filter((assignment) => assignment.authUserId === seatKey);
    if (matchingAssignments.length === 0) {
      result[seatKey] = normalizeCaptainSeatScope(scope);
      continue;
    }

    for (const assignment of matchingAssignments) {
      result[buildCaptainSeatKey(assignment.authUserId, assignment.role)] =
        normalizeCaptainSeatScope(scope);
    }
  }

  return result;
}

function normalizeCaptainPermissionMapForAssignments(
  permissionMap: Record<string, CommunityCaptainPermission[]>,
  assignments: CaptainAssignment[]
) {
  const normalizedPermissionMap: Record<string, CommunityCaptainPermission[]> = {};

  for (const [seatKey, permissions] of Object.entries(permissionMap)) {
    if (seatKey.includes(":")) {
      normalizedPermissionMap[seatKey] = permissions;
      continue;
    }

    const matchingAssignments = assignments.filter((assignment) => assignment.authUserId === seatKey);
    if (matchingAssignments.length === 0) {
      normalizedPermissionMap[seatKey] = permissions;
      continue;
    }

    for (const assignment of matchingAssignments) {
      normalizedPermissionMap[buildCaptainSeatKey(assignment.authUserId, assignment.role)] = permissions;
    }
  }

  return normalizedPermissionMap;
}

export function normalizeCaptainConfigMetadata(metadata: Record<string, unknown> | null | undefined) {
  const safeMetadata = metadata && typeof metadata === "object" ? metadata : {};
  const assignments = sanitizeCaptainAssignments(safeMetadata.captainAssignments);
  const permissionMap = normalizeCaptainPermissionMapForAssignments(
    sanitizeCaptainPermissionMap(safeMetadata.captainPermissionMap),
    assignments
  );
  const seatScopeMap = sanitizeCaptainSeatScopeMap(safeMetadata.captainSeatScopeMap, assignments);

  return {
    assignments,
    permissionMap,
    seatScopeMap,
  } satisfies CaptainConfig;
}

async function loadPrimaryCommunitySettingsRow(projectId: string) {
  const { data: integrations, error: integrationError } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load captain integration context.");
  }

  const normalizedIntegrations = (integrations ?? []) as Array<{
    id: string;
    provider: string;
  }>;
  const primaryIntegration =
    normalizedIntegrations.find((integration) => integration.provider === "discord") ??
    normalizedIntegrations[0] ??
    null;

  if (!primaryIntegration) {
    return null;
  }

  const { data: settingsRow, error: settingsError } = await supabaseAdmin
    .from("community_bot_settings")
    .select("integration_id, metadata")
    .eq("integration_id", primaryIntegration.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load captain settings.");
  }

  return settingsRow as { integration_id: string; metadata: Record<string, unknown> | null } | null;
}

export async function loadProjectCaptainConfig(projectId: string): Promise<CaptainConfig> {
  const settingsRow = await loadPrimaryCommunitySettingsRow(projectId);
  return normalizeCaptainConfigMetadata(
    settingsRow?.metadata && typeof settingsRow.metadata === "object"
      ? settingsRow.metadata
      : {}
  );
}

export function getCaptainPermissionForAutomation(automationType: CommunityAutomationType) {
  return AUTOMATION_PERMISSION_MAP[automationType];
}

export function getCaptainScopeForAutomation(automationType: CommunityAutomationType) {
  return AUTOMATION_SCOPE_MAP[automationType];
}

export function captainSeatMatchesScope(
  seatScope: CaptainSeatScope,
  requiredScope: CaptainSeatScope
) {
  if (seatScope === "project_and_community") {
    return true;
  }

  return seatScope === requiredScope;
}

export async function loadCaptainByAuthUserId(projectId: string, authUserId: string) {
  const config = await loadProjectCaptainConfig(projectId);
  const matchingAssignments = config.assignments.filter((item) => item.authUserId === authUserId);
  const assignment = matchingAssignments[0] ?? null;

  if (!assignment) {
    return null;
  }

  return {
    ...assignment,
    permissions: Array.from(
      new Set(
        matchingAssignments.flatMap(
          (item) => config.permissionMap[buildCaptainSeatKey(item.authUserId, item.role)] ?? []
        )
      )
    ),
    seatScopes: matchingAssignments.map((item) => ({
      role: item.role,
      seatKey: buildCaptainSeatKey(item.authUserId, item.role),
      scope:
        config.seatScopeMap[buildCaptainSeatKey(item.authUserId, item.role)] ??
        "project_and_community",
      permissions:
        config.permissionMap[buildCaptainSeatKey(item.authUserId, item.role)] ?? [],
    })),
  };
}

export async function loadCaptainByProviderIdentity(params: {
  projectId: string;
  provider: "discord" | "telegram" | "x";
  providerUserId: string;
}) {
  const { data: account, error } = await supabaseAdmin
    .from("user_connected_accounts")
    .select("auth_user_id")
    .eq("provider", params.provider)
    .eq("status", "connected")
    .eq("provider_user_id", params.providerUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to resolve captain identity.");
  }

  if (!account?.auth_user_id) {
    return null;
  }

  return loadCaptainByAuthUserId(params.projectId, account.auth_user_id);
}

export function captainHasPermission(
  captain:
    | {
        permissions: CommunityCaptainPermission[];
        seatScopes?: Array<{
          scope: CaptainSeatScope;
          permissions: CommunityCaptainPermission[];
        }>;
      }
    | null,
  permission: CommunityCaptainPermission,
  requiredScope: CaptainSeatScope = "project_and_community"
) {
  if (!captain) {
    return false;
  }

  if (!captain.seatScopes || captain.seatScopes.length === 0) {
    return captain.permissions.includes(permission);
  }

  return captain.seatScopes.some(
    (seat) =>
      seat.permissions.includes(permission) &&
      captainSeatMatchesScope(seat.scope, requiredScope)
  );
}

export async function maybeRecordCaptainAutomationAction(params: {
  projectId: string;
  authUserId?: string | null;
  automationType: CommunityAutomationType;
  targetId?: string | null;
  status: "success" | "failed" | "skipped";
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  if (!params.authUserId) {
    return null;
  }

  const captain = await loadCaptainByAuthUserId(params.projectId, params.authUserId);
  const requiredPermission = getCaptainPermissionForAutomation(params.automationType);
  const requiredScope = getCaptainScopeForAutomation(params.automationType);

  if (!captainHasPermission(captain, requiredPermission, requiredScope)) {
    return null;
  }

  const actingSeat =
    captain?.seatScopes?.find(
      (seat) =>
        seat.permissions.includes(requiredPermission) &&
        captainSeatMatchesScope(seat.scope, requiredScope)
    ) ?? null;

  const { error } = await supabaseAdmin.from("community_captain_actions").insert({
    project_id: params.projectId,
    auth_user_id: params.authUserId,
    captain_role: actingSeat?.role ?? captain?.role ?? null,
    action_type: requiredPermission,
    target_type: "automation",
    target_id: params.targetId ?? params.automationType,
    status: params.status,
    summary: params.summary,
    metadata: {
      ...(params.metadata ?? {}),
      requiredSeatScope: requiredScope,
      seatKey: actingSeat?.seatKey ?? null,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to record captain action.");
  }

  return captain;
}
