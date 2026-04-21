import { supabaseAdmin } from "../../lib/supabase.js";
import type { SuspiciousSignal } from "../aesp/trust.js";

export type TrustCaseType =
  | "sybil_suspicion"
  | "referral_abuse"
  | "fake_engagement"
  | "wallet_anomaly"
  | "trust_drop"
  | "reward_trust_risk"
  | "manual_review";

export type TrustCaseSourceType =
  | "review_flag"
  | "trust_snapshot"
  | "onchain_signal"
  | "manual"
  | "project_escalation";

function mapSignalToTrustCaseType(signal: SuspiciousSignal): TrustCaseType {
  if (
    [
      "fresh_wallet_activity",
      "no_social_proof",
      "onchain_daily_cap_reached",
      "onchain_event_type_cap_reached",
      "low_value_transfer_spam",
      "low_value_transfer_pattern",
    ].includes(signal.flagType)
  ) {
    return "sybil_suspicion";
  }

  if (
    [
      "net_buy_only_violation",
      "short_hold_duration",
      "watch_hold_duration",
      "short_lp_retention",
      "watch_lp_retention",
      "exit_pattern",
    ].includes(signal.flagType)
  ) {
    return "fake_engagement";
  }

  if (["contract_call_allowlist_violation", "wallet_watch_label"].includes(signal.flagType)) {
    return "wallet_anomaly";
  }

  if (["low_trust_posture", "watch_trust_posture"].includes(signal.flagType)) {
    return "trust_drop";
  }

  return "manual_review";
}

function buildTrustCaseDedupeKey(input: {
  authUserId: string;
  caseType: TrustCaseType;
  signalFlagType: string;
}) {
  return `${input.authUserId}:${input.caseType}:${input.signalFlagType}`;
}

async function insertTrustCaseEvent(input: {
  trustCaseId: string;
  projectId: string;
  eventType:
    | "case_opened"
    | "case_refreshed"
    | "annotated"
    | "escalated"
    | "project_input_requested"
    | "dismissed"
    | "resolved"
    | "trust_override_applied"
    | "reward_override_applied"
    | "permission_updated";
  summary: string;
  visibilityScope?: "internal" | "project" | "both";
  actorAuthUserId?: string | null;
  actorRole?: string | null;
  eventPayload?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("trust_case_events").insert({
    trust_case_id: input.trustCaseId,
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

export async function upsertTrustCasesFromSignals(input: {
  projectId: string;
  authUserId: string;
  walletAddress?: string | null;
  sourceType: TrustCaseSourceType;
  sourceId: string;
  signals: SuspiciousSignal[];
  signalPayload?: Record<string, unknown>;
}) {
  const results: Array<{ id: string; caseType: TrustCaseType; flagType: string }> = [];

  for (const signal of input.signals) {
    const caseType = mapSignalToTrustCaseType(signal);
    const dedupeKey = buildTrustCaseDedupeKey({
      authUserId: input.authUserId,
      caseType,
      signalFlagType: signal.flagType,
    });

    const { data: existingCase, error: existingCaseError } = await supabaseAdmin
      .from("trust_cases")
      .select("id")
      .eq("project_id", input.projectId)
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existingCaseError) {
      throw existingCaseError;
    }

    const casePayload = {
      project_id: input.projectId,
      auth_user_id: input.authUserId,
      wallet_address: input.walletAddress ?? null,
      case_type: caseType,
      severity: signal.severity === "high" ? "high" : signal.severity,
      status: "open",
      source_type: input.sourceType,
      source_id: `${input.sourceId}:${signal.flagType}`,
      dedupe_key: dedupeKey,
      summary: signal.reason,
      evidence_summary: signal.reason,
      raw_signal_payload: {
        signalFlagType: signal.flagType,
        signalSeverity: signal.severity,
        signalReason: signal.reason,
        signalMetadata: signal.metadata ?? {},
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ...(input.signalPayload ?? {}),
      },
      escalation_state: "none",
      metadata: {
        signalFlagType: signal.flagType,
      },
      updated_at: new Date().toISOString(),
      resolved_at: null,
      dismissed_at: null,
    };

    let trustCaseId = existingCase?.id ?? null;

    if (trustCaseId) {
      const { error: updateError } = await supabaseAdmin
        .from("trust_cases")
        .update(casePayload)
        .eq("id", trustCaseId);

      if (updateError) {
        throw updateError;
      }

      await insertTrustCaseEvent({
        trustCaseId,
        projectId: input.projectId,
        eventType: "case_refreshed",
        summary: signal.reason,
        eventPayload: {
          signalFlagType: signal.flagType,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      });
    } else {
      const { data: insertedCase, error: insertError } = await supabaseAdmin
        .from("trust_cases")
        .insert({
          ...casePayload,
          opened_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      trustCaseId = insertedCase.id;
      await insertTrustCaseEvent({
        trustCaseId,
        projectId: input.projectId,
        eventType: "case_opened",
        summary: signal.reason,
        eventPayload: {
          signalFlagType: signal.flagType,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      });
    }

    results.push({
      id: trustCaseId,
      caseType,
      flagType: signal.flagType,
    });
  }

  return results;
}
