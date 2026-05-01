import { supabaseAdmin } from "../../lib/supabase.js";
import type { SuspiciousSignal } from "../aesp/trust.js";
import type { TrustCaseSourceType } from "./trust-cases.js";

export type RiskEventCategory =
  | "wallet_graph"
  | "session_velocity"
  | "quest_abuse"
  | "raid_abuse"
  | "reward_abuse"
  | "defi_abuse"
  | "social_abuse"
  | "manual_review";

export type RiskEventRecommendedAction =
  | "allow"
  | "watch"
  | "review_required"
  | "reward_hold"
  | "xp_suspended"
  | "suspend"
  | "ban";

export type RiskEventRow = {
  project_id: string;
  auth_user_id: string;
  wallet_address: string | null;
  event_type: string;
  risk_category: RiskEventCategory;
  severity: "low" | "medium" | "high" | "critical";
  source_type: TrustCaseSourceType;
  source_id: string;
  dedupe_key: string;
  reason: string;
  evidence: Record<string, unknown>;
  score_delta: number;
  recommended_action: RiskEventRecommendedAction;
};

export type RiskEventRollupRow = {
  project_id: string;
  auth_user_id: string;
  risk_level: "clear" | "low" | "medium" | "high" | "critical";
  open_event_count: number;
  high_event_count: number;
  critical_event_count: number;
  latest_recommended_action: RiskEventRecommendedAction;
  metadata: Record<string, unknown>;
};

export function buildRiskEventRowsFromSignals(input: {
  projectId: string;
  authUserId: string;
  walletAddress?: string | null;
  sourceType: TrustCaseSourceType;
  sourceId: string;
  signals: SuspiciousSignal[];
  signalPayload?: Record<string, unknown>;
}): RiskEventRow[] {
  return input.signals.map((signal) => {
    const severity = normalizeSeverity(signal.severity);
    const riskCategory = mapSignalToRiskCategory(signal.flagType);

    return {
      project_id: input.projectId,
      auth_user_id: input.authUserId,
      wallet_address: input.walletAddress ?? null,
      event_type: signal.flagType,
      risk_category: riskCategory,
      severity,
      source_type: input.sourceType,
      source_id: input.sourceId,
      dedupe_key: buildRiskEventDedupeKey({
        projectId: input.projectId,
        authUserId: input.authUserId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        flagType: signal.flagType,
      }),
      reason: signal.reason,
      evidence: {
        signalFlagType: signal.flagType,
        signalSeverity: severity,
        signalReason: signal.reason,
        signalMetadata: signal.metadata ?? {},
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ...(input.signalPayload ?? {}),
      },
      score_delta: getSeverityScoreDelta(severity),
      recommended_action: getRecommendedAction({
        severity,
        riskCategory,
      }),
    };
  });
}

export function buildRiskEventRollupRowFromRows(rows: RiskEventRow[]): RiskEventRollupRow {
  if (rows.length === 0) {
    throw new Error("Cannot build a risk event rollup without rows.");
  }

  const highestSeverity = rows.reduce<RiskEventRow["severity"]>((highest, row) => {
    return getSeverityRank(row.severity) > getSeverityRank(highest) ? row.severity : highest;
  }, "low");
  const highestAction = rows.reduce<RiskEventRecommendedAction>((highest, row) => {
    return getActionRank(row.recommended_action) > getActionRank(highest) ? row.recommended_action : highest;
  }, "allow");

  return {
    project_id: rows[0].project_id,
    auth_user_id: rows[0].auth_user_id,
    risk_level: severityToRiskLevel(highestSeverity),
    open_event_count: rows.length,
    high_event_count: rows.filter((row) => row.severity === "high").length,
    critical_event_count: rows.filter((row) => row.severity === "critical").length,
    latest_recommended_action: highestAction,
    metadata: {
      source: "vyntro_trust_engine_v2",
      eventTypes: Array.from(new Set(rows.map((row) => row.event_type))),
      riskCategories: Array.from(new Set(rows.map((row) => row.risk_category))),
      sourceIds: Array.from(new Set(rows.map((row) => row.source_id))),
    },
  };
}

export async function recordRiskEventsFromSignals(input: {
  projectId: string;
  authUserId: string;
  walletAddress?: string | null;
  sourceType: TrustCaseSourceType;
  sourceId: string;
  signals: SuspiciousSignal[];
  signalPayload?: Record<string, unknown>;
}) {
  const rows = buildRiskEventRowsFromSignals(input);
  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("risk_events")
    .upsert(rows, { onConflict: "dedupe_key" })
    .select("id, dedupe_key");

  if (error) {
    throw error;
  }

  const { error: rollupError } = await supabaseAdmin
    .from("risk_event_rollups")
    .upsert(buildRiskEventRollupRowFromRows(rows), { onConflict: "project_id,auth_user_id" });

  if (rollupError) {
    throw rollupError;
  }

  return data ?? [];
}

function buildRiskEventDedupeKey(input: {
  projectId: string;
  authUserId: string;
  sourceType: string;
  sourceId: string;
  flagType: string;
}) {
  return `${input.projectId}:${input.authUserId}:${input.sourceType}:${input.sourceId}:${input.flagType}`;
}

function mapSignalToRiskCategory(flagType: string): RiskEventCategory {
  if (
    [
      "fresh_wallet_activity",
      "onchain_daily_cap_reached",
      "onchain_event_type_cap_reached",
      "low_value_transfer_spam",
      "low_value_transfer_pattern",
      "wallet_watch_label",
      "contract_call_allowlist_violation",
    ].includes(flagType)
  ) {
    return "wallet_graph";
  }

  if (["reward_trust_risk", "reward_hold", "reward_claim_abuse"].includes(flagType)) {
    return "reward_abuse";
  }

  if (["no_social_proof", "low_trust_posture", "watch_trust_posture"].includes(flagType)) {
    return "social_abuse";
  }

  if (["net_buy_only_violation", "short_hold_duration", "short_lp_retention", "exit_pattern"].includes(flagType)) {
    return "defi_abuse";
  }

  if (flagType.includes("raid")) {
    return "raid_abuse";
  }

  if (flagType.includes("quest")) {
    return "quest_abuse";
  }

  return "manual_review";
}

function getRecommendedAction(input: {
  severity: RiskEventRow["severity"];
  riskCategory: RiskEventCategory;
}): RiskEventRecommendedAction {
  if (input.riskCategory === "reward_abuse" && (input.severity === "high" || input.severity === "critical")) {
    return "reward_hold";
  }

  if (input.severity === "critical") return "xp_suspended";
  if (input.severity === "high") return "review_required";
  if (input.severity === "medium") return "watch";
  return "allow";
}

function getSeverityScoreDelta(severity: RiskEventRow["severity"]) {
  switch (severity) {
    case "critical":
      return 40;
    case "high":
      return 30;
    case "medium":
      return 15;
    case "low":
      return 8;
  }
}

function severityToRiskLevel(severity: RiskEventRow["severity"]): RiskEventRollupRow["risk_level"] {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
  }
}

function getSeverityRank(severity: RiskEventRow["severity"]) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function getActionRank(action: RiskEventRecommendedAction) {
  switch (action) {
    case "ban":
      return 7;
    case "suspend":
      return 6;
    case "xp_suspended":
      return 5;
    case "reward_hold":
      return 4;
    case "review_required":
      return 3;
    case "watch":
      return 2;
    case "allow":
      return 1;
  }
}

function normalizeSeverity(value: string): RiskEventRow["severity"] {
  if (value === "critical" || value === "high" || value === "medium") {
    return value;
  }

  return "low";
}
