import { supabaseAdmin } from "../../lib/supabase.js";

export type OnchainCaseType =
  | "ingress_rejected"
  | "ingress_retry_failed"
  | "enrichment_failed"
  | "provider_sync_failure"
  | "unmatched_project_asset"
  | "unlinked_wallet_activity"
  | "suspicious_onchain_pattern"
  | "manual_onchain_review";

export type OnchainCaseSeverity = "low" | "medium" | "high" | "critical";
export type OnchainCaseStatus =
  | "open"
  | "triaging"
  | "needs_project_input"
  | "blocked"
  | "retry_queued"
  | "resolved"
  | "dismissed";
export type OnchainCaseSourceType =
  | "onchain_ingress"
  | "onchain_event"
  | "provider_sync"
  | "wallet_link"
  | "tracked_asset"
  | "manual"
  | "project_escalation";
export type OnchainCaseEscalationState =
  | "none"
  | "awaiting_internal"
  | "awaiting_project"
  | "escalated";
export type OnchainCaseEventType =
  | "case_opened"
  | "case_refreshed"
  | "annotated"
  | "retry_queued"
  | "retry_completed"
  | "retry_failed"
  | "project_input_requested"
  | "asset_rescan_queued"
  | "enrichment_rerun_queued"
  | "escalated"
  | "resolved"
  | "dismissed"
  | "permission_updated";

type OnchainCaseUpsertInput = {
  projectId: string;
  authUserId?: string | null;
  walletAddress?: string | null;
  assetId?: string | null;
  caseType: OnchainCaseType;
  severity?: OnchainCaseSeverity;
  status?: Exclude<OnchainCaseStatus, "resolved" | "dismissed">;
  sourceType: OnchainCaseSourceType;
  sourceId: string;
  dedupeKey: string;
  summary: string;
  evidenceSummary?: string | null;
  rawPayload?: Record<string, unknown>;
  escalationState?: OnchainCaseEscalationState;
  metadata?: Record<string, unknown>;
  eventSummary?: string;
};

type InsertOnchainCaseEventInput = {
  onchainCaseId: string;
  projectId: string;
  eventType: OnchainCaseEventType;
  summary: string;
  visibilityScope?: "internal" | "project" | "both";
  actorAuthUserId?: string | null;
  actorRole?: string | null;
  eventPayload?: Record<string, unknown>;
};

export function buildOnchainCaseDedupeKey(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim().toLowerCase() : ""))
    .filter(Boolean)
    .join(":");
}

export async function insertOnchainCaseEvent(input: InsertOnchainCaseEventInput) {
  const { error } = await supabaseAdmin.from("onchain_case_events").insert({
    onchain_case_id: input.onchainCaseId,
    project_id: input.projectId,
    event_type: input.eventType,
    visibility_scope: input.visibilityScope ?? "both",
    actor_auth_user_id: input.actorAuthUserId ?? null,
    actor_role: input.actorRole ?? null,
    summary: input.summary,
    event_payload: input.eventPayload ?? {},
  });

  if (error) {
    throw error;
  }
}

export async function upsertOnchainCase(input: OnchainCaseUpsertInput) {
  const now = new Date().toISOString();
  const { data: existingCase, error: existingCaseError } = await supabaseAdmin
    .from("onchain_cases")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (existingCaseError) {
    throw existingCaseError;
  }

  const casePayload = {
    project_id: input.projectId,
    auth_user_id: input.authUserId ?? null,
    wallet_address: input.walletAddress ?? null,
    asset_id: input.assetId ?? null,
    case_type: input.caseType,
    severity: input.severity ?? "medium",
    status: input.status ?? "open",
    source_type: input.sourceType,
    source_id: input.sourceId,
    dedupe_key: input.dedupeKey,
    summary: input.summary,
    evidence_summary: input.evidenceSummary ?? null,
    raw_payload: input.rawPayload ?? {},
    escalation_state: input.escalationState ?? "none",
    metadata: input.metadata ?? {},
    resolution_notes: null,
    resolved_at: null,
    dismissed_at: null,
    updated_at: now,
  };

  let onchainCaseId = existingCase?.id ?? null;

  if (onchainCaseId) {
    const { error: updateError } = await supabaseAdmin
      .from("onchain_cases")
      .update(casePayload)
      .eq("id", onchainCaseId);

    if (updateError) {
      throw updateError;
    }

    await insertOnchainCaseEvent({
      onchainCaseId,
      projectId: input.projectId,
      eventType: "case_refreshed",
      summary: input.eventSummary ?? input.summary,
      eventPayload: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        caseType: input.caseType,
      },
    });
  } else {
    const { data: insertedCase, error: insertError } = await supabaseAdmin
      .from("onchain_cases")
      .insert({
        ...casePayload,
        opened_at: now,
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    onchainCaseId = insertedCase.id as string;
    await insertOnchainCaseEvent({
      onchainCaseId,
      projectId: input.projectId,
      eventType: "case_opened",
      summary: input.eventSummary ?? input.summary,
      eventPayload: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        caseType: input.caseType,
      },
    });
  }

  return onchainCaseId;
}

export async function resolveOnchainCaseByDedupeKey(input: {
  projectId: string;
  dedupeKey: string;
  summary: string;
  notes?: string | null;
  actorAuthUserId?: string | null;
  actorRole?: string | null;
}) {
  const { data: onchainCase, error: onchainCaseError } = await supabaseAdmin
    .from("onchain_cases")
    .select("id, status")
    .eq("project_id", input.projectId)
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (onchainCaseError) {
    throw onchainCaseError;
  }

  if (!onchainCase?.id) {
    return null;
  }

  if (onchainCase.status !== "resolved") {
    const resolvedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("onchain_cases")
      .update({
        status: "resolved",
        escalation_state: "none",
        resolution_notes: input.notes ?? null,
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq("id", onchainCase.id);

    if (updateError) {
      throw updateError;
    }
  }

  await insertOnchainCaseEvent({
    onchainCaseId: onchainCase.id as string,
    projectId: input.projectId,
    eventType: "resolved",
    summary: input.summary,
    actorAuthUserId: input.actorAuthUserId ?? null,
    actorRole: input.actorRole ?? null,
    eventPayload: {
      notes: input.notes ?? null,
    },
  });

  return onchainCase.id as string;
}
