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

type CaptainConfig = {
  assignments: CaptainAssignment[];
  permissionMap: Record<string, CommunityCaptainPermission[]>;
};

const AUTOMATION_PERMISSION_MAP: Record<CommunityAutomationType, CommunityCaptainPermission> = {
  rank_sync: "rank_sync",
  leaderboard_pulse: "leaderboard_post",
  mission_digest: "mission_digest",
  raid_reminder: "raid_alert",
  newcomer_pulse: "newcomer_wave",
  reactivation_pulse: "reactivation_wave",
  activation_board: "activation_board",
};

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
  for (const [authUserId, permissions] of Object.entries(input as Record<string, unknown>)) {
    if (!authUserId.trim()) {
      continue;
    }

    result[authUserId] = normalizeCaptainPermissionList(permissions);
  }

  return result;
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
  const metadata =
    settingsRow?.metadata && typeof settingsRow.metadata === "object"
      ? settingsRow.metadata
      : {};

  return {
    assignments: sanitizeCaptainAssignments(metadata.captainAssignments),
    permissionMap: sanitizeCaptainPermissionMap(metadata.captainPermissionMap),
  };
}

export function getCaptainPermissionForAutomation(automationType: CommunityAutomationType) {
  return AUTOMATION_PERMISSION_MAP[automationType];
}

export async function loadCaptainByAuthUserId(projectId: string, authUserId: string) {
  const config = await loadProjectCaptainConfig(projectId);
  const assignment = config.assignments.find((item) => item.authUserId === authUserId) ?? null;

  if (!assignment) {
    return null;
  }

  return {
    ...assignment,
    permissions: config.permissionMap[authUserId] ?? [],
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
  captain: { permissions: CommunityCaptainPermission[] } | null,
  permission: CommunityCaptainPermission
) {
  return Boolean(captain && captain.permissions.includes(permission));
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

  if (!captainHasPermission(captain, requiredPermission)) {
    return null;
  }

  const { error } = await supabaseAdmin.from("community_captain_actions").insert({
    project_id: params.projectId,
    auth_user_id: params.authUserId,
    captain_role: captain?.role ?? null,
    action_type: requiredPermission,
    target_type: "automation",
    target_id: params.targetId ?? params.automationType,
    status: params.status,
    summary: params.summary,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to record captain action.");
  }

  return captain;
}
