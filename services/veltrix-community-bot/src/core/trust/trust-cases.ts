import { supabaseAdmin } from "../../lib/supabase.js";
import type { SuspiciousSignal } from "../aesp/trust.js";
import { recordRiskEventsFromSignals } from "./risk-events.js";
import { deriveTrustRiskPatch } from "./risk-score.js";

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

  if (input.signals.length > 0) {
    await recordRiskEventsFromSignals(input);
  }

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

  if (input.signals.length > 0) {
    await applyGlobalTrustRiskPatch({
      authUserId: input.authUserId,
      projectId: input.projectId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      signals: input.signals,
      signalPayload: input.signalPayload,
    });
  }

  return results;
}

async function applyGlobalTrustRiskPatch(input: {
  authUserId: string;
  projectId: string;
  sourceType: TrustCaseSourceType;
  sourceId: string;
  signals: SuspiciousSignal[];
  signalPayload?: Record<string, unknown>;
}) {
  const { data: currentReputation, error: reputationError } = await supabaseAdmin
    .from("user_global_reputation")
    .select(
      "total_xp, active_xp, level, streak, trust_score, sybil_score, contribution_tier, reputation_rank, quests_completed, raids_completed, rewards_claimed, status"
    )
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  if (reputationError) {
    throw reputationError;
  }

  const riskPatch = deriveTrustRiskPatch({
    currentTrustScore: safeNumber(currentReputation?.trust_score, 50),
    currentSybilScore: safeNumber(currentReputation?.sybil_score),
    currentStatus: typeof currentReputation?.status === "string" ? currentReputation.status : "active",
    signals: input.signals,
  });
  const timestamp = new Date().toISOString();
  const totalXp = safeNumber(currentReputation?.total_xp);

  const { error: upsertError } = await supabaseAdmin.from("user_global_reputation").upsert(
    {
      auth_user_id: input.authUserId,
      total_xp: totalXp,
      active_xp: safeNumber(currentReputation?.active_xp, totalXp),
      level: safeNumber(currentReputation?.level, 1),
      streak: safeNumber(currentReputation?.streak),
      trust_score: riskPatch.trustScore,
      sybil_score: riskPatch.sybilScore,
      contribution_tier:
        typeof currentReputation?.contribution_tier === "string"
          ? currentReputation.contribution_tier
          : "explorer",
      reputation_rank: safeNumber(currentReputation?.reputation_rank),
      quests_completed: safeNumber(currentReputation?.quests_completed),
      raids_completed: safeNumber(currentReputation?.raids_completed),
      rewards_claimed: safeNumber(currentReputation?.rewards_claimed),
      status: riskPatch.status,
      updated_at: timestamp,
    },
    { onConflict: "auth_user_id" }
  );

  if (upsertError) {
    throw upsertError;
  }

  const { error: snapshotError } = await supabaseAdmin.from("trust_snapshots").insert({
    auth_user_id: input.authUserId,
    score: riskPatch.trustScore,
    reasons: {
      ...riskPatch.metadata,
      projectId: input.projectId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sybilScore: riskPatch.sybilScore,
      status: riskPatch.status,
      riskLevel: riskPatch.riskLevel,
      recommendedAction: riskPatch.recommendedAction,
      reviewRequired: riskPatch.reviewRequired,
      rewardHoldRequired: riskPatch.rewardHoldRequired,
      hardBlocked: riskPatch.hardBlocked,
      reasonCodes: riskPatch.reasonCodes,
      signalPayload: input.signalPayload ?? {},
      signals: input.signals.map((signal) => ({
        flagType: signal.flagType,
        severity: signal.severity,
        reason: signal.reason,
        metadata: signal.metadata ?? {},
      })),
    },
    updated_at: timestamp,
  });

  if (snapshotError) {
    throw snapshotError;
  }
}

function safeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
