import { supabaseAdmin } from "../../lib/supabase.js";
import {
  normalizeIncidentSeverity,
  normalizeIncidentStatus,
  type PlatformAuditAction,
  type PlatformIncidentSeverity,
  type PlatformObjectType,
} from "./operation-state.js";

export async function createPlatformAudit(input: {
  projectId: string;
  objectType: PlatformObjectType;
  objectId: string;
  actionType: PlatformAuditAction;
  actorAuthUserId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("project_operation_audits").insert({
    project_id: input.projectId,
    object_type: input.objectType,
    object_id: input.objectId,
    action_type: input.actionType,
    actor_auth_user_id: input.actorAuthUserId ?? null,
    actor_role: input.actorRole ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }
}

export async function createPlatformIncident(input: {
  projectId: string;
  objectType: PlatformObjectType;
  objectId: string;
  sourceType: "provider" | "job" | "manual_test" | "pipeline" | "runtime";
  severity?: PlatformIncidentSeverity;
  status?: "open" | "watching" | "resolved" | "dismissed";
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("project_operation_incidents").insert({
    project_id: input.projectId,
    object_type: input.objectType,
    object_id: input.objectId,
    source_type: input.sourceType,
    severity: normalizeIncidentSeverity(input.severity),
    status: normalizeIncidentStatus(input.status),
    title: input.title,
    summary: input.summary ?? null,
    metadata: input.metadata ?? {},
    opened_at: now,
    updated_at: now,
  });

  if (error) {
    throw error;
  }
}
