import { supabaseAdmin } from "../../lib/supabase.js";

export type SupportEscalationSeverity = "low" | "medium" | "high" | "critical";
export type SupportEscalationStatus =
  | "open"
  | "triaging"
  | "waiting_internal"
  | "waiting_project"
  | "waiting_provider"
  | "blocked"
  | "resolved"
  | "dismissed";
export type SupportEscalationWaitingOn = "internal" | "project" | "provider" | "deploy" | "none";

type SupportEscalationUpsertInput = {
  projectId?: string | null;
  sourceSurface: string;
  sourceType: string;
  sourceId: string;
  dedupeKey: string;
  title: string;
  summary?: string | null;
  severity?: SupportEscalationSeverity;
  status?: Exclude<SupportEscalationStatus, "resolved" | "dismissed">;
  waitingOn?: SupportEscalationWaitingOn;
  ownerAuthUserId?: string | null;
  openedByAuthUserId?: string | null;
  nextActionSummary?: string | null;
  metadata?: Record<string, unknown>;
};

export function buildSupportEscalationDedupeKey(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(":");
}

export async function upsertSupportEscalation(input: SupportEscalationUpsertInput) {
  const now = new Date().toISOString();

  const { data: existingEscalation, error: existingEscalationError } = await supabaseAdmin
    .from("support_escalations")
    .select("id")
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (existingEscalationError) {
    throw existingEscalationError;
  }

  const payload = {
    project_id: input.projectId ?? null,
    source_surface: input.sourceSurface,
    source_type: input.sourceType,
    source_id: input.sourceId,
    dedupe_key: input.dedupeKey,
    title: input.title,
    summary: input.summary ?? null,
    severity: input.severity ?? "medium",
    status: input.status ?? "open",
    waiting_on: input.waitingOn ?? "internal",
    owner_auth_user_id: input.ownerAuthUserId ?? null,
    opened_by_auth_user_id: input.openedByAuthUserId ?? null,
    next_action_summary: input.nextActionSummary ?? null,
    metadata: input.metadata ?? {},
    resolution_notes: null,
    resolved_at: null,
    dismissed_at: null,
    updated_at: now,
  };

  if (existingEscalation?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("support_escalations")
      .update(payload)
      .eq("id", existingEscalation.id);

    if (updateError) {
      throw updateError;
    }

    return existingEscalation.id as string;
  }

  const { data: insertedEscalation, error: insertError } = await supabaseAdmin
    .from("support_escalations")
    .insert({
      ...payload,
      opened_at: now,
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return insertedEscalation.id as string;
}

export async function resolveSupportEscalationByDedupeKey(input: {
  dedupeKey: string;
  resolutionNotes?: string | null;
  resolvedByAuthUserId?: string | null;
}) {
  const { data: escalation, error: escalationError } = await supabaseAdmin
    .from("support_escalations")
    .select("id")
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (escalationError) {
    throw escalationError;
  }

  if (!escalation?.id) {
    return null;
  }

  const resolvedAt = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("support_escalations")
    .update({
      status: "resolved",
      waiting_on: "none",
      resolved_by_auth_user_id: input.resolvedByAuthUserId ?? null,
      resolution_notes: input.resolutionNotes ?? null,
      resolved_at: resolvedAt,
      updated_at: resolvedAt,
    })
    .eq("id", escalation.id);

  if (updateError) {
    throw updateError;
  }

  return escalation.id as string;
}
