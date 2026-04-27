import { supabaseAdmin } from "../../lib/supabase.js";
import { loadProjectCommunityOutcomeSummary } from "./outcomes.js";
import {
  COMMUNITY_PLAYBOOK_KEYS,
  type CommunityAutomationType,
  type CommunityCaptainPermission,
  type CommunityPlaybookKey,
} from "./model.js";
import {
  buildCaptainSeatKey,
  captainSeatMatchesScope,
  getCaptainScopeForAutomation,
  loadProjectCaptainConfig,
  type CaptainSeatScope,
} from "./captains.js";

type CommunityAutomationRow = {
  id: string;
  automation_type: CommunityAutomationType;
  status: string;
  cadence: "manual" | "daily" | "weekly";
  next_run_at: string | null;
  last_run_at: string | null;
  last_result: string | null;
  description: string | null;
  title: string | null;
};

type CaptainAssignmentRow = {
  id: string;
  auth_user_id: string;
  role_type: string | null;
};

type ExistingQueueRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  source_type: string;
};

type DesiredCaptainQueueItem = {
  idempotencyKey: string;
  captainAssignmentId: string | null;
  authUserId: string | null;
  title: string;
  summary: string;
  dueAt: string | null;
  priority: "urgent" | "high" | "normal" | "low";
  source: "automation" | "playbook";
  actionLabel: string;
  requiredPermission: CommunityCaptainPermission;
  requiredSeatScope: CaptainSeatScope;
  automationId?: string;
  automationType?: CommunityAutomationType;
  playbookKey?: CommunityPlaybookKey;
};

const PLAYBOOK_PERMISSION_MAP: Record<CommunityPlaybookKey, CommunityCaptainPermission> = {
  launch_week: "activation_board",
  raid_week: "raid_alert",
  comeback_week: "reactivation_wave",
  campaign_push: "activation_board",
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

const DUE_WINDOW_MS = 72 * 60 * 60 * 1000;

function normalizeMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function buildQueueSummaryLabel(permission: CommunityCaptainPermission) {
  if (permission === "rank_sync") return "Run rank sync";
  if (permission === "leaderboard_post") return "Post leaderboard";
  if (permission === "raid_alert") return "Run raid wave";
  if (permission === "mission_digest") return "Post mission digest";
  if (permission === "newcomer_wave") return "Run newcomer wave";
  if (permission === "reactivation_wave") return "Run comeback wave";
  return "Post activation board";
}

function buildCaptainAssignmentResolver(input: {
  assignments: CaptainAssignmentRow[];
  permissionMap: Record<string, CommunityCaptainPermission[]>;
  seatScopeMap: Record<string, CaptainSeatScope>;
}) {
  return (permission: CommunityCaptainPermission, requiredSeatScope: CaptainSeatScope) => {
    const exactMatch =
      input.assignments.find((assignment) => {
        const role = assignment.role_type ?? "community_captain";
        const seatKey = buildCaptainSeatKey(assignment.auth_user_id, role);

        return (
          (input.permissionMap[seatKey] ?? []).includes(permission) &&
          captainSeatMatchesScope(
            input.seatScopeMap[seatKey] ?? "project_and_community",
            requiredSeatScope
          )
        );
      }
        
      ) ?? null;

    if (exactMatch) {
      return exactMatch;
    }

    return null;
  };
}

function shouldQueueAutomation(row: CommunityAutomationRow) {
  if (row.status !== "active") {
    return false;
  }

  if (row.cadence === "manual") {
    return true;
  }

  if (!row.next_run_at) {
    return false;
  }

  const nextRunAt = Date.parse(row.next_run_at);
  if (Number.isNaN(nextRunAt)) {
    return false;
  }

  return nextRunAt <= Date.now() + DUE_WINDOW_MS;
}

function getAutomationPriority(input: {
  row: CommunityAutomationRow;
  outcomes: Awaited<ReturnType<typeof loadProjectCommunityOutcomeSummary>>;
}) {
  if (input.row.automation_type === "newcomer_pulse") {
    if (input.outcomes.onboarding.activeCount >= 12) return "urgent" as const;
    if (input.outcomes.onboarding.activeCount > 0) return "high" as const;
  }

  if (input.row.automation_type === "reactivation_pulse") {
    if (input.outcomes.comeback.activeCount >= 8) return "urgent" as const;
    if (input.outcomes.comeback.activeCount > 0) return "high" as const;
  }

  if (input.row.automation_type === "activation_board") {
    return input.outcomes.captain.actionableQueueCount > 6 ? "high" : "normal";
  }

  if (input.row.last_result === "failed") {
    return "high";
  }

  return "normal";
}

function buildAutomationQueueItem(input: {
  row: CommunityAutomationRow;
  outcomes: Awaited<ReturnType<typeof loadProjectCommunityOutcomeSummary>>;
  resolveCaptainAssignment: ReturnType<typeof buildCaptainAssignmentResolver>;
}) {
  const requiredPermission = AUTOMATION_PERMISSION_MAP[input.row.automation_type];
  const requiredSeatScope = getCaptainScopeForAutomation(input.row.automation_type);
  const assignment = input.resolveCaptainAssignment(requiredPermission, requiredSeatScope);
  const priority = getAutomationPriority({
    row: input.row,
    outcomes: input.outcomes,
  });

  return {
    idempotencyKey: `automation:${input.row.id}`,
    captainAssignmentId: assignment?.id ?? null,
    authUserId: assignment?.auth_user_id ?? null,
    title: input.row.title?.trim() || buildQueueSummaryLabel(requiredPermission),
    summary:
      input.row.description?.trim() ||
      `Keep the ${input.row.automation_type.replaceAll("_", " ")} rail moving for this project.`,
    dueAt: input.row.next_run_at,
    priority,
    source: "automation",
    actionLabel: buildQueueSummaryLabel(requiredPermission),
    requiredPermission,
    requiredSeatScope,
    automationId: input.row.id,
    automationType: input.row.automation_type,
  } satisfies DesiredCaptainQueueItem;
}

async function loadPlaybookConfigs(projectId: string) {
  const { data: integrations, error: integrationError } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load playbook integration context.");
  }

  const integrationId =
    ((integrations ?? []) as Array<{ id: string; provider: string }>).find(
      (integration) => integration.provider === "discord"
    )?.id ??
    ((integrations ?? []) as Array<{ id: string; provider: string }>)[0]?.id ??
    "";

  if (!integrationId) {
    return [] as Array<{
      key: CommunityPlaybookKey;
      enabled: boolean;
      providerScope: string;
      lastRunAt: string | null;
    }>;
  }

  const { data: settingsRow, error: settingsError } = await supabaseAdmin
    .from("community_bot_settings")
    .select("metadata")
    .eq("integration_id", integrationId)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load playbook settings metadata.");
  }

  const metadata = normalizeMetadata(settingsRow?.metadata);
  const playbookConfigs = normalizeMetadata(metadata.playbookConfigs);

  return COMMUNITY_PLAYBOOK_KEYS.map((playbookKey) => {
    const config = normalizeMetadata(playbookConfigs[playbookKey]);
    return {
      key: playbookKey,
      enabled: config.enabled === true,
      providerScope:
        typeof config.providerScope === "string" ? config.providerScope : "both",
      lastRunAt:
        typeof config.lastRunAt === "string" ? config.lastRunAt : null,
    };
  }).filter((config) => config.enabled);
}

function buildPlaybookQueueItem(input: {
  playbook: Awaited<ReturnType<typeof loadPlaybookConfigs>>[number];
  resolveCaptainAssignment: ReturnType<typeof buildCaptainAssignmentResolver>;
  outcomes: Awaited<ReturnType<typeof loadProjectCommunityOutcomeSummary>>;
}) {
  const requiredPermission = PLAYBOOK_PERMISSION_MAP[input.playbook.key];
  const requiredSeatScope: CaptainSeatScope =
    input.playbook.key === "raid_week" ? "community_only" : "project_and_community";
  const assignment = input.resolveCaptainAssignment(requiredPermission, requiredSeatScope);
  const priority =
    input.playbook.key === "comeback_week" && input.outcomes.comeback.activeCount > 0
      ? "high"
      : input.playbook.key === "launch_week" && input.outcomes.onboarding.activeCount > 0
        ? "high"
        : "normal";

  return {
    idempotencyKey: `playbook:${input.playbook.key}`,
    captainAssignmentId: assignment?.id ?? null,
    authUserId: assignment?.auth_user_id ?? null,
    title: input.playbook.key.replaceAll("_", " "),
    summary: `Keep the ${input.playbook.key.replaceAll("_", " ")} playbook ready for manual execution.`,
    dueAt: input.playbook.lastRunAt ?? null,
    priority,
    source: "playbook",
    actionLabel: "Run playbook",
    requiredPermission,
    requiredSeatScope,
    playbookKey: input.playbook.key,
  } satisfies DesiredCaptainQueueItem;
}

async function loadActiveCaptainAssignments(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("community_captain_assignments")
    .select("id, auth_user_id, role_type")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load active captain assignments.");
  }

  return (data ?? []) as CaptainAssignmentRow[];
}

async function loadDesiredCaptainQueueItems(projectId: string) {
  const [outcomes, captainConfig, assignmentRows, automationRows, playbooks] = await Promise.all([
    loadProjectCommunityOutcomeSummary(projectId),
    loadProjectCaptainConfig(projectId),
    loadActiveCaptainAssignments(projectId),
    supabaseAdmin
      .from("community_automations")
      .select("id, automation_type, status, cadence, next_run_at, last_run_at, last_result, title, description")
      .eq("project_id", projectId),
    loadPlaybookConfigs(projectId),
  ]);

  const automationData = automationRows.data as CommunityAutomationRow[] | null;
  if (automationRows.error) {
    throw new Error(automationRows.error.message || "Failed to load community automations.");
  }

  const resolveCaptainAssignment = buildCaptainAssignmentResolver({
    assignments: assignmentRows,
    permissionMap: captainConfig.permissionMap,
    seatScopeMap: captainConfig.seatScopeMap,
  });

  const desiredItems: DesiredCaptainQueueItem[] = [];
  for (const automationRow of automationData ?? []) {
    if (!shouldQueueAutomation(automationRow)) {
      continue;
    }

    desiredItems.push(
      buildAutomationQueueItem({
        row: automationRow,
        outcomes,
        resolveCaptainAssignment,
      })
    );
  }

  for (const playbook of playbooks) {
    desiredItems.push(
      buildPlaybookQueueItem({
        playbook,
        resolveCaptainAssignment,
        outcomes,
      })
    );
  }

  return { desiredItems, outcomes };
}

async function loadExistingGeneratedQueueRows(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("community_captain_action_queue")
    .select("id, status, metadata, source_type")
    .eq("project_id", projectId)
    .eq("source_type", "automation_generated")
    .in("status", ["queued", "in_progress", "blocked"]);

  if (error) {
    throw new Error(error.message || "Failed to load generated captain queue rows.");
  }

  return (data ?? []) as ExistingQueueRow[];
}

export async function refreshProjectCommunityCaptainQueue(projectId: string) {
  const [{ desiredItems, outcomes }, existingRows] = await Promise.all([
    loadDesiredCaptainQueueItems(projectId),
    loadExistingGeneratedQueueRows(projectId),
  ]);

  const existingByKey = new Map<string, ExistingQueueRow>();
  for (const row of existingRows) {
    const metadata = normalizeMetadata(row.metadata);
    const idempotencyKey =
      typeof metadata.idempotencyKey === "string" ? metadata.idempotencyKey : "";
    if (idempotencyKey) {
      existingByKey.set(idempotencyKey, row);
    }
  }

  let insertedCount = 0;
  let updatedCount = 0;
  let canceledCount = 0;

  for (const item of desiredItems) {
    const existing = existingByKey.get(item.idempotencyKey);
    const payload = {
      project_id: projectId,
      captain_assignment_id: item.captainAssignmentId,
      auth_user_id: item.authUserId,
      source_type: "automation_generated" as const,
      status: existing?.status === "in_progress" ? "in_progress" : existing?.status === "blocked" ? "blocked" : "queued",
      escalation_state:
        item.priority === "urgent" ? "watching" : existing?.status === "blocked" ? "watching" : "none",
      title: item.title,
      summary: item.summary,
      due_at: item.dueAt,
      updated_at: new Date().toISOString(),
      metadata: {
        idempotencyKey: item.idempotencyKey,
        source: item.source,
        priority: item.priority,
        actionLabel: item.actionLabel,
        requiredPermission: item.requiredPermission,
        requiredSeatScope: item.requiredSeatScope,
        automationId: item.automationId ?? null,
        automationType: item.automationType ?? null,
        playbookKey: item.playbookKey ?? null,
      },
    };

    if (!existing) {
      const { error } = await supabaseAdmin.from("community_captain_action_queue").insert(payload);
      if (error) {
        throw new Error(error.message || "Failed to insert captain queue row.");
      }
      insertedCount += 1;
      continue;
    }

    const { error } = await supabaseAdmin
      .from("community_captain_action_queue")
      .update(payload)
      .eq("id", existing.id)
      .eq("project_id", projectId);

    if (error) {
      throw new Error(error.message || "Failed to update captain queue row.");
    }
    updatedCount += 1;
  }

  const desiredKeys = new Set(desiredItems.map((item) => item.idempotencyKey));
  for (const row of existingRows) {
    const metadata = normalizeMetadata(row.metadata);
    const idempotencyKey =
      typeof metadata.idempotencyKey === "string" ? metadata.idempotencyKey : "";
    if (!idempotencyKey || desiredKeys.has(idempotencyKey)) {
      continue;
    }

    const { error } = await supabaseAdmin
      .from("community_captain_action_queue")
      .update({
        status: "canceled",
        escalation_state: "resolved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("project_id", projectId);

    if (error) {
      throw new Error(error.message || "Failed to cancel stale captain queue row.");
    }
    canceledCount += 1;
  }

  return {
    ok: true,
    projectId,
    desiredItemCount: desiredItems.length,
    insertedCount,
    updatedCount,
    canceledCount,
    onboardingActiveCount: outcomes.onboarding.activeCount,
    comebackActiveCount: outcomes.comeback.activeCount,
  };
}
