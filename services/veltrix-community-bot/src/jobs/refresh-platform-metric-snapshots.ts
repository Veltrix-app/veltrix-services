import { supabaseAdmin } from "../lib/supabase.js";
import {
  buildSupportEscalationDedupeKey,
  resolveSupportEscalationByDedupeKey,
  upsertSupportEscalation,
} from "../core/ops/support-escalations.js";
import {
  upsertPlatformMetricSnapshot,
  upsertProjectMetricSnapshot,
  type MetricHealthState,
  type MetricSection,
  type MetricUnit,
} from "../core/ops/metric-snapshots.js";

type ProjectRow = {
  id: string;
  status: string | null;
  onboarding_status: string | null;
};

type ProjectMetricRollup = {
  projectId: string;
  activeMembers: number;
  totalMembers: number;
  linkedReadyMembers: number;
  participationMembers: number;
  activeCampaignCompletionTotal: number;
  activeCampaignCount: number;
  claimTotal: number;
  fulfilledClaimCount: number;
  pendingClaimCount: number;
  openTrustCases: number;
  openPayoutCases: number;
  openOnchainCases: number;
  providerFailures: number;
  activeEscalations: number;
  recentAutomationRuns: number;
  failedAutomationRuns: number;
};

const CLOSED_CASE_STATUSES = new Set(["resolved", "dismissed"]);
const CLOSED_ESCALATION_STATUSES = new Set(["resolved", "dismissed"]);
const ACTIVE_MEMBER_STATUSES = new Set(["active", "completed"]);
const PARTICIPATION_JOURNEY_TYPES = new Set(["active", "comeback"]);
const AUTOMATION_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

type MetricRule = {
  section: MetricSection;
  unit: MetricUnit;
  preferredDirection: "higher_is_better" | "lower_is_better";
  thresholds?: {
    watch?: number;
    warning?: number;
    critical?: number;
  };
};

const METRIC_RULES: Record<string, MetricRule> = {
  active_projects: { section: "activation", unit: "count", preferredDirection: "higher_is_better" },
  launch_ready_projects: { section: "readiness", unit: "count", preferredDirection: "higher_is_better" },
  member_activation_rate: {
    section: "activation",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 60, warning: 45, critical: 30 },
  },
  linked_readiness_rate: {
    section: "readiness",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 75, warning: 60, critical: 45 },
  },
  campaign_completion_rate: {
    section: "community",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 55, warning: 40, critical: 25 },
  },
  reward_claim_conversion_rate: {
    section: "rewards",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 40, warning: 25, critical: 10 },
  },
  open_trust_case_count: {
    section: "trust",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 15, warning: 30, critical: 50 },
  },
  open_payout_case_count: {
    section: "rewards",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 10, warning: 20, critical: 35 },
  },
  open_onchain_case_count: {
    section: "onchain",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 10, warning: 20, critical: 35 },
  },
  automation_health_score: {
    section: "automation",
    unit: "score",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 80, warning: 65, critical: 45 },
  },
  provider_failure_count: {
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 7, critical: 12 },
  },
  queue_backlog_count: {
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 40, warning: 80, critical: 120 },
  },
  support_escalation_count: {
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 6, critical: 10 },
  },
  project_activation_rate: {
    section: "activation",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 60, warning: 45, critical: 30 },
  },
  project_launch_readiness_score: {
    section: "readiness",
    unit: "score",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 80, warning: 65, critical: 45 },
  },
  project_linked_readiness_rate: {
    section: "readiness",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 75, warning: 60, critical: 45 },
  },
  community_participation_rate: {
    section: "community",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 55, warning: 40, critical: 25 },
  },
  project_reward_claim_conversion_rate: {
    section: "rewards",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 40, warning: 25, critical: 10 },
  },
  project_open_trust_case_count: {
    section: "trust",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 5, warning: 10, critical: 18 },
  },
  project_open_payout_case_count: {
    section: "rewards",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 6, critical: 10 },
  },
  project_open_onchain_case_count: {
    section: "onchain",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 6, critical: 10 },
  },
  project_automation_health_score: {
    section: "automation",
    unit: "score",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 80, warning: 65, critical: 45 },
  },
  project_provider_failure_count: {
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 2, warning: 4, critical: 7 },
  },
  project_queue_backlog_count: {
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 12, warning: 25, critical: 40 },
  },
  project_support_escalation_count: {
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 1, warning: 3, critical: 5 },
  },
};

function asRecords(value: unknown) {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function normalizeMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }
  return roundMetric((numerator / denominator) * 100);
}

function evaluateMetricHealthState(metricKey: string, value: number): MetricHealthState {
  const rule = METRIC_RULES[metricKey];
  if (!rule?.thresholds) {
    return "healthy";
  }

  if (rule.preferredDirection === "higher_is_better") {
    if (typeof rule.thresholds.critical === "number" && value <= rule.thresholds.critical) return "critical";
    if (typeof rule.thresholds.warning === "number" && value <= rule.thresholds.warning) return "warning";
    if (typeof rule.thresholds.watch === "number" && value <= rule.thresholds.watch) return "watch";
    return "healthy";
  }

  if (typeof rule.thresholds.critical === "number" && value >= rule.thresholds.critical) return "critical";
  if (typeof rule.thresholds.warning === "number" && value >= rule.thresholds.warning) return "warning";
  if (typeof rule.thresholds.watch === "number" && value >= rule.thresholds.watch) return "watch";
  return "healthy";
}

function getMetricRule(metricKey: string) {
  const rule = METRIC_RULES[metricKey];
  if (!rule) {
    throw new Error(`Missing metric rule for ${metricKey}.`);
  }
  return rule;
}

function createProjectRollup(projectId: string): ProjectMetricRollup {
  return {
    projectId,
    activeMembers: 0,
    totalMembers: 0,
    linkedReadyMembers: 0,
    participationMembers: 0,
    activeCampaignCompletionTotal: 0,
    activeCampaignCount: 0,
    claimTotal: 0,
    fulfilledClaimCount: 0,
    pendingClaimCount: 0,
    openTrustCases: 0,
    openPayoutCases: 0,
    openOnchainCases: 0,
    providerFailures: 0,
    activeEscalations: 0,
    recentAutomationRuns: 0,
    failedAutomationRuns: 0,
  };
}

function getProjectRollup(map: Map<string, ProjectMetricRollup>, projectId: string) {
  const existing = map.get(projectId);
  if (existing) {
    return existing;
  }

  const created = createProjectRollup(projectId);
  map.set(projectId, created);
  return created;
}

async function syncMetricEscalation(input: {
  metricKey: string;
  metricValue: number;
  healthState: MetricHealthState;
  projectId?: string | null;
}) {
  const dedupeKey = buildSupportEscalationDedupeKey([
    "metric_snapshot",
    input.projectId ?? "platform",
    input.metricKey,
  ]);

  if (input.healthState === "critical") {
    await upsertSupportEscalation({
      projectId: input.projectId ?? null,
      sourceSurface: input.projectId ? "project_observability" : "overview",
      sourceType: "metric_snapshot",
      sourceId: input.metricKey,
      dedupeKey,
      title: `${input.metricKey.replace(/_/g, " ")} needs intervention`,
      summary: `Metric ${input.metricKey} is in a critical state at ${input.metricValue}.`,
      severity: "high",
      status: "open",
      waitingOn: input.projectId ? "project" : "internal",
      nextActionSummary: "Review the owning queue and clear the critical pressure source.",
      metadata: {
        metricKey: input.metricKey,
        metricValue: input.metricValue,
        healthState: input.healthState,
      },
    });
    return;
  }

  await resolveSupportEscalationByDedupeKey({
    dedupeKey,
    resolutionNotes: `Metric ${input.metricKey} recovered below the critical threshold.`,
  });
}

async function loadSnapshotInputBundle() {
  const automationLookback = new Date(Date.now() - AUTOMATION_LOOKBACK_MS).toISOString();

  const [
    projects,
    campaigns,
    claims,
    trustCases,
    payoutCases,
    onchainCases,
    incidents,
    escalations,
    communitySnapshots,
    automationRuns,
    automations,
  ] = await Promise.all([
    supabaseAdmin.from("projects").select("id, status, onboarding_status"),
    supabaseAdmin.from("campaigns").select("project_id, status, completion_rate"),
    supabaseAdmin.from("reward_claims").select("project_id, status"),
    supabaseAdmin.from("trust_cases").select("project_id, status"),
    supabaseAdmin.from("payout_cases").select("project_id, status"),
    supabaseAdmin.from("onchain_cases").select("project_id, status"),
    supabaseAdmin.from("project_operation_incidents").select("project_id, status, source_type"),
    supabaseAdmin.from("support_escalations").select("project_id, status"),
    supabaseAdmin
      .from("community_member_status_snapshots")
      .select("project_id, journey_type, status, streak_days, metadata"),
    supabaseAdmin
      .from("community_automation_runs")
      .select("project_id, status, created_at")
      .gte("created_at", automationLookback),
    supabaseAdmin.from("community_automations").select("project_id, status"),
  ]);

  for (const result of [
    projects,
    campaigns,
    claims,
    trustCases,
    payoutCases,
    onchainCases,
    incidents,
    escalations,
    communitySnapshots,
    automationRuns,
    automations,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    projects: (projects.data ?? []) as ProjectRow[],
    campaigns: asRecords(campaigns.data),
    claims: asRecords(claims.data),
    trustCases: asRecords(trustCases.data),
    payoutCases: asRecords(payoutCases.data),
    onchainCases: asRecords(onchainCases.data),
    incidents: asRecords(incidents.data),
    escalations: asRecords(escalations.data),
    communitySnapshots: asRecords(communitySnapshots.data),
    automationRuns: asRecords(automationRuns.data),
    automations: asRecords(automations.data),
  };
}

function computeAutomationHealthScore(input: {
  failedRuns: number;
  totalRuns: number;
  activeAutomations: number;
}) {
  if (input.totalRuns > 0) {
    return roundMetric(((input.totalRuns - input.failedRuns) / input.totalRuns) * 100);
  }

  return input.activeAutomations > 0 ? 80 : 100;
}

export async function runRefreshPlatformMetricSnapshotsJob(options: {
  snapshotDate?: string;
  authUserId?: string;
} = {}) {
  const bundle = await loadSnapshotInputBundle();
  const snapshotDate = options.snapshotDate ?? new Date().toISOString().slice(0, 10);
  const projectRollups = new Map<string, ProjectMetricRollup>();

  for (const project of bundle.projects) {
    getProjectRollup(projectRollups, project.id);
  }

  for (const row of bundle.communitySnapshots) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    const rollup = getProjectRollup(projectRollups, projectId);
    const metadata = normalizeMetadata(row.metadata);
    const linkedProvidersCount = asNumber(metadata.linkedProvidersCount);
    const walletVerified = metadata.walletVerified === true;
    const streakDays = asNumber(row.streak_days ?? 0);
    const isActiveJourney =
      String(row.journey_type ?? "") === "active" && ACTIVE_MEMBER_STATUSES.has(String(row.status ?? ""));

    rollup.totalMembers += 1;
    if (isActiveJourney) {
      rollup.activeMembers += 1;
    }
    if (walletVerified && linkedProvidersCount >= 2) {
      rollup.linkedReadyMembers += 1;
    }
    if (isActiveJourney || streakDays > 0 || PARTICIPATION_JOURNEY_TYPES.has(String(row.journey_type ?? ""))) {
      rollup.participationMembers += 1;
    }
  }

  for (const row of bundle.campaigns) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (String(row.status ?? "") !== "active") continue;
    const rollup = getProjectRollup(projectRollups, projectId);
    rollup.activeCampaignCount += 1;
    rollup.activeCampaignCompletionTotal += asNumber(row.completion_rate);
  }

  for (const row of bundle.claims) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    const rollup = getProjectRollup(projectRollups, projectId);
    const status = String(row.status ?? "");
    rollup.claimTotal += 1;
    if (status === "fulfilled") {
      rollup.fulfilledClaimCount += 1;
    }
    if (status === "pending" || status === "processing") {
      rollup.pendingClaimCount += 1;
    }
  }

  for (const row of bundle.trustCases) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (CLOSED_CASE_STATUSES.has(String(row.status ?? ""))) continue;
    getProjectRollup(projectRollups, projectId).openTrustCases += 1;
  }

  for (const row of bundle.payoutCases) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (CLOSED_CASE_STATUSES.has(String(row.status ?? ""))) continue;
    getProjectRollup(projectRollups, projectId).openPayoutCases += 1;
  }

  for (const row of bundle.onchainCases) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (CLOSED_CASE_STATUSES.has(String(row.status ?? ""))) continue;
    getProjectRollup(projectRollups, projectId).openOnchainCases += 1;
  }

  for (const row of bundle.incidents) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (String(row.status ?? "") !== "open") continue;
    if (String(row.source_type ?? "") === "provider") {
      getProjectRollup(projectRollups, projectId).providerFailures += 1;
    }
  }

  for (const row of bundle.escalations) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (CLOSED_ESCALATION_STATUSES.has(String(row.status ?? ""))) continue;
    getProjectRollup(projectRollups, projectId).activeEscalations += 1;
  }

  for (const row of bundle.automationRuns) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    const rollup = getProjectRollup(projectRollups, projectId);
    rollup.recentAutomationRuns += 1;
    if (String(row.status ?? "") === "failed") {
      rollup.failedAutomationRuns += 1;
    }
  }

  const activeAutomationCounts = new Map<string, number>();
  for (const row of bundle.automations) {
    const projectId = String(row.project_id ?? "");
    if (!projectId) continue;
    if (String(row.status ?? "") !== "active") continue;
    activeAutomationCounts.set(projectId, (activeAutomationCounts.get(projectId) ?? 0) + 1);
  }

  const activeProjects = bundle.projects.filter((project) =>
    ["active", "paused"].includes(project.status ?? "")
  ).length;
  const launchReadyProjects = bundle.projects.filter(
    (project) => project.onboarding_status === "approved"
  ).length;

  const aggregate = Array.from(projectRollups.values()).reduce(
    (acc, rollup) => {
      acc.activeMembers += rollup.activeMembers;
      acc.totalMembers += rollup.totalMembers;
      acc.linkedReadyMembers += rollup.linkedReadyMembers;
      acc.participationMembers += rollup.participationMembers;
      acc.activeCampaignCompletionTotal += rollup.activeCampaignCompletionTotal;
      acc.activeCampaignCount += rollup.activeCampaignCount;
      acc.claimTotal += rollup.claimTotal;
      acc.fulfilledClaimCount += rollup.fulfilledClaimCount;
      acc.pendingClaimCount += rollup.pendingClaimCount;
      acc.openTrustCases += rollup.openTrustCases;
      acc.openPayoutCases += rollup.openPayoutCases;
      acc.openOnchainCases += rollup.openOnchainCases;
      acc.providerFailures += rollup.providerFailures;
      acc.activeEscalations += rollup.activeEscalations;
      acc.recentAutomationRuns += rollup.recentAutomationRuns;
      acc.failedAutomationRuns += rollup.failedAutomationRuns;
      return acc;
    },
    createProjectRollup("platform")
  );

  const totalActiveAutomations = Array.from(activeAutomationCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  const platformMetrics = [
    { key: "active_projects", value: activeProjects },
    { key: "launch_ready_projects", value: launchReadyProjects },
    {
      key: "member_activation_rate",
      value: ratio(aggregate.activeMembers, aggregate.totalMembers),
    },
    {
      key: "linked_readiness_rate",
      value: ratio(aggregate.linkedReadyMembers, aggregate.totalMembers),
    },
    {
      key: "campaign_completion_rate",
      value:
        aggregate.activeCampaignCount > 0
          ? roundMetric(aggregate.activeCampaignCompletionTotal / aggregate.activeCampaignCount)
          : 0,
    },
    {
      key: "reward_claim_conversion_rate",
      value: ratio(aggregate.fulfilledClaimCount, aggregate.claimTotal),
    },
    { key: "open_trust_case_count", value: aggregate.openTrustCases },
    { key: "open_payout_case_count", value: aggregate.openPayoutCases },
    { key: "open_onchain_case_count", value: aggregate.openOnchainCases },
    {
      key: "automation_health_score",
      value: computeAutomationHealthScore({
        failedRuns: aggregate.failedAutomationRuns,
        totalRuns: aggregate.recentAutomationRuns,
        activeAutomations: totalActiveAutomations,
      }),
    },
    { key: "provider_failure_count", value: aggregate.providerFailures },
    {
      key: "queue_backlog_count",
      value:
        aggregate.pendingClaimCount +
        aggregate.openTrustCases +
        aggregate.openPayoutCases +
        aggregate.openOnchainCases,
    },
    { key: "support_escalation_count", value: aggregate.activeEscalations },
  ] as const;

  for (const metric of platformMetrics) {
    const rule = getMetricRule(metric.key);
    const healthState = evaluateMetricHealthState(metric.key, metric.value);
    await upsertPlatformMetricSnapshot({
      metricKey: metric.key,
      metricSection: rule.section,
      snapshotDate,
      metricValue: metric.value,
      unit: rule.unit,
      healthState,
      metadata: {
        generatedBy: "refresh-platform-metric-snapshots",
      },
    });
    await syncMetricEscalation({
      metricKey: metric.key,
      metricValue: metric.value,
      healthState,
    });
  }

  const projectResults: Array<Record<string, unknown>> = [];

  for (const rollup of projectRollups.values()) {
    const activeAutomationCount = activeAutomationCounts.get(rollup.projectId) ?? 0;
    const activationRate = ratio(rollup.activeMembers, rollup.totalMembers);
    const linkedReadinessRate = ratio(rollup.linkedReadyMembers, rollup.totalMembers);
    const participationRate = ratio(rollup.participationMembers, rollup.totalMembers);
    const rewardClaimConversion = ratio(rollup.fulfilledClaimCount, rollup.claimTotal);
    const automationHealthScore = computeAutomationHealthScore({
      failedRuns: rollup.failedAutomationRuns,
      totalRuns: rollup.recentAutomationRuns,
      activeAutomations: activeAutomationCount,
    });
    const queueBacklog =
      rollup.pendingClaimCount +
      rollup.openTrustCases +
      rollup.openPayoutCases +
      rollup.openOnchainCases;
    const launchReadinessScore = roundMetric(
      (linkedReadinessRate +
        automationHealthScore +
        Math.max(0, 100 - rollup.providerFailures * 15) +
        Math.max(0, 100 - (rollup.openTrustCases + rollup.openPayoutCases + rollup.openOnchainCases) * 8)) /
        4
    );

    const projectMetrics = [
      { key: "project_activation_rate", value: activationRate },
      { key: "project_launch_readiness_score", value: launchReadinessScore },
      { key: "project_linked_readiness_rate", value: linkedReadinessRate },
      { key: "community_participation_rate", value: participationRate },
      { key: "project_reward_claim_conversion_rate", value: rewardClaimConversion },
      { key: "project_open_trust_case_count", value: rollup.openTrustCases },
      { key: "project_open_payout_case_count", value: rollup.openPayoutCases },
      { key: "project_open_onchain_case_count", value: rollup.openOnchainCases },
      { key: "project_automation_health_score", value: automationHealthScore },
      { key: "project_provider_failure_count", value: rollup.providerFailures },
      { key: "project_queue_backlog_count", value: queueBacklog },
      { key: "project_support_escalation_count", value: rollup.activeEscalations },
    ] as const;

    const metricStates: Array<Record<string, unknown>> = [];

    for (const metric of projectMetrics) {
      const rule = getMetricRule(metric.key);
      const healthState = evaluateMetricHealthState(metric.key, metric.value);
      await upsertProjectMetricSnapshot({
        projectId: rollup.projectId,
        metricKey: metric.key,
        metricSection: rule.section,
        snapshotDate,
        metricValue: metric.value,
        unit: rule.unit,
        healthState,
        metadata: {
          generatedBy: "refresh-platform-metric-snapshots",
        },
      });
      await syncMetricEscalation({
        metricKey: metric.key,
        metricValue: metric.value,
        healthState,
        projectId: rollup.projectId,
      });
      metricStates.push({
        key: metric.key,
        value: metric.value,
        healthState,
      });
    }

    projectResults.push({
      projectId: rollup.projectId,
      metrics: metricStates,
    });
  }

  return {
    ok: true,
    snapshotDate,
    platformMetricsWritten: platformMetrics.length,
    projectsProcessed: projectResults.length,
    projectResults,
  };
}
