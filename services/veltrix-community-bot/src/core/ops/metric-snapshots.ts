import { supabaseAdmin } from "../../lib/supabase.js";

export type MetricSection =
  | "activation"
  | "readiness"
  | "community"
  | "rewards"
  | "trust"
  | "onchain"
  | "automation"
  | "operations";

export type MetricUnit = "count" | "percent" | "score";
export type MetricHealthState = "healthy" | "watch" | "warning" | "critical";

type PlatformMetricSnapshotInput = {
  metricKey: string;
  metricSection: MetricSection;
  snapshotDate?: string | Date;
  windowStart?: string | Date | null;
  windowEnd?: string | Date | null;
  metricValue: number;
  previousValue?: number | null;
  unit?: MetricUnit;
  healthState?: MetricHealthState;
  metadata?: Record<string, unknown>;
};

type ProjectMetricSnapshotInput = PlatformMetricSnapshotInput & {
  projectId: string;
};

function normalizeDateOnly(value?: string | Date) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function normalizeTimestamp(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function upsertPlatformMetricSnapshot(input: PlatformMetricSnapshotInput) {
  const payload = {
    metric_key: input.metricKey,
    metric_section: input.metricSection,
    metric_scope: "platform",
    snapshot_date: normalizeDateOnly(input.snapshotDate),
    window_start: normalizeTimestamp(input.windowStart),
    window_end: normalizeTimestamp(input.windowEnd),
    metric_value: input.metricValue,
    previous_value: input.previousValue ?? null,
    unit: input.unit ?? "count",
    health_state: input.healthState ?? "healthy",
    metadata: input.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("platform_metric_snapshots")
    .upsert(payload, { onConflict: "metric_key,snapshot_date" });

  if (error) {
    throw error;
  }
}

export async function upsertProjectMetricSnapshot(input: ProjectMetricSnapshotInput) {
  const payload = {
    project_id: input.projectId,
    metric_key: input.metricKey,
    metric_section: input.metricSection,
    metric_scope: "project",
    snapshot_date: normalizeDateOnly(input.snapshotDate),
    window_start: normalizeTimestamp(input.windowStart),
    window_end: normalizeTimestamp(input.windowEnd),
    metric_value: input.metricValue,
    previous_value: input.previousValue ?? null,
    unit: input.unit ?? "count",
    health_state: input.healthState ?? "healthy",
    metadata: input.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("project_metric_snapshots")
    .upsert(payload, { onConflict: "project_id,metric_key,snapshot_date" });

  if (error) {
    throw error;
  }
}
