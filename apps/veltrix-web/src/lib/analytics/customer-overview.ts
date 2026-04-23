import { createSupabaseServiceClient } from "@/lib/supabase/server";

const ACCOUNT_BENCHMARK_MINIMUM = 5;
const PROJECT_BENCHMARK_MINIMUM = 5;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type CustomerGrowthBenchmark = {
  available: boolean;
  label:
    | "below_peer_range"
    | "within_peer_range"
    | "above_peer_range"
    | "top_cohort"
    | null;
  labelText: string;
  currentValue: number;
  cohortLabel: string | null;
  cohortSize: number;
  medianValue: number | null;
};

export type CustomerGrowthOverview = {
  customerAccountId: string;
  accountName: string;
  billingPlanId: string | null;
  billingStatus: string;
  activationStage: string;
  workspaceHealthState: string;
  successHealthState: string;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  billableSeatCount: number;
  currentMrr: number;
  isPaidAccount: boolean;
  isRetained30d: boolean;
  isExpansionReady: boolean;
  isChurnRisk: boolean;
  firstTouchSource: string | null;
  latestTouchSource: string | null;
  conversionTouchSource: string | null;
  benchmark: CustomerGrowthBenchmark;
  recommendedMove: string;
};

export type ProjectBenchmarkOverview = {
  projectId: string;
  projectName: string;
  projectStatus: string;
  campaignCount: number;
  activeCampaignCount: number;
  liveQuestCount: number;
  liveRaidCount: number;
  visibleRewardCount: number;
  providerCount: number;
  teamMemberCount: number;
  memberCount: number;
  benchmark: CustomerGrowthBenchmark;
  recommendedMove: string;
};

type AccountMetaRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type AccountSnapshotRow = {
  customer_account_id: string;
  snapshot_date: string;
  billing_plan_id: string | null;
  billing_status: string;
  project_count: number;
  active_campaign_count: number;
  provider_count: number;
  billable_seat_count: number;
  current_mrr: number;
  is_paid_account: boolean;
  is_retained_30d: boolean;
  is_expansion_ready: boolean;
  is_churn_risk: boolean;
  first_touch_source: string | null;
  latest_touch_source: string | null;
  conversion_touch_source: string | null;
};

type AccountEntitlementRow = {
  current_projects: number;
  current_active_campaigns: number;
  current_providers: number;
  current_billable_seats: number;
};

type AccountSubscriptionRow = {
  billing_plan_id: string | null;
  status: string;
};

type EventTouchRow = {
  first_touch_source: string | null;
  latest_touch_source: string | null;
  utm_source: string | null;
  event_type: string;
};

type ProjectMetaRow = {
  id: string;
  name: string;
  customer_account_id: string | null;
  status: string;
  members: number;
  is_public: boolean;
};

type ProjectSnapshotRow = {
  project_id: string;
  customer_account_id: string | null;
  project_status: string;
  campaign_count: number;
  active_campaign_count: number;
  live_quest_count: number;
  live_raid_count: number;
  visible_reward_count: number;
  provider_count: number;
  team_member_count: number;
  member_count: number;
};

type CountRow = { id: string };
type IntegrationRow = { provider: string | null };

function sanitizeSourceLabel(value: string | null | undefined) {
  if (!value) {
    return "Direct";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "Direct";
  }

  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function optionalSourceLabel(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return sanitizeSourceLabel(value);
}

function humanizeBenchmarkLabel(label: CustomerGrowthBenchmark["label"]) {
  switch (label) {
    case "below_peer_range":
      return "Below peer range";
    case "within_peer_range":
      return "Within peer range";
    case "above_peer_range":
      return "Above peer range";
    case "top_cohort":
      return "Top cohort";
    default:
      return "Benchmark building";
  }
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) {
    return null;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((sortedValues.length - 1) * ratio))
  );
  return sortedValues[index] ?? null;
}

function resolveAccountAgeBand(createdAt: string | null) {
  if (!createdAt) {
    return "unknown";
  }

  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const ageDays = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (ageDays <= 30) {
    return "0_30_days";
  }

  if (ageDays <= 90) {
    return "31_90_days";
  }

  return "91_plus_days";
}

function humanizeAgeBand(ageBand: string) {
  switch (ageBand) {
    case "0_30_days":
      return "first 30 days";
    case "31_90_days":
      return "days 31 to 90";
    case "91_plus_days":
      return "after day 90";
    default:
      return "mixed age";
  }
}

function calculateWorkspaceGrowthScore(snapshot: {
  project_count: number;
  active_campaign_count: number;
  provider_count: number;
  billable_seat_count: number;
  is_paid_account: boolean;
  is_retained_30d: boolean;
  is_expansion_ready: boolean;
  is_churn_risk: boolean;
}) {
  const baseScore =
    snapshot.project_count * 18 +
    snapshot.active_campaign_count * 26 +
    snapshot.provider_count * 12 +
    snapshot.billable_seat_count * 6 +
    (snapshot.is_paid_account ? 10 : 0) +
    (snapshot.is_retained_30d ? 12 : 0) +
    (snapshot.is_expansion_ready ? 10 : 0) -
    (snapshot.is_churn_risk ? 8 : 0);

  return Math.max(0, Math.round(baseScore));
}

function calculateProjectLaunchScore(snapshot: {
  campaign_count: number;
  active_campaign_count: number;
  live_quest_count: number;
  live_raid_count: number;
  visible_reward_count: number;
  provider_count: number;
  team_member_count: number;
  member_count: number;
}) {
  const baseScore =
    snapshot.campaign_count * 8 +
    snapshot.active_campaign_count * 20 +
    snapshot.live_quest_count * 3 +
    snapshot.live_raid_count * 10 +
    snapshot.visible_reward_count * 2 +
    snapshot.provider_count * 12 +
    snapshot.team_member_count * 4 +
    Math.round(Math.min(snapshot.member_count, 200) / 10);

  return Math.max(0, Math.round(baseScore));
}

function deriveBenchmark(params: {
  currentValue: number;
  cohortLabel: string;
  values: number[];
  minimumCohortSize: number;
}): CustomerGrowthBenchmark {
  const sortedValues = [...params.values].sort((left, right) => left - right);
  const lowerBound = percentile(sortedValues, 0.25);
  const medianValue = percentile(sortedValues, 0.5);
  const upperBound = percentile(sortedValues, 0.75);
  const topBandThreshold = percentile(sortedValues, 0.9);

  if (
    sortedValues.length < params.minimumCohortSize ||
    lowerBound === null ||
    medianValue === null ||
    upperBound === null ||
    topBandThreshold === null
  ) {
    return {
      available: false,
      label: null,
      labelText: humanizeBenchmarkLabel(null),
      currentValue: params.currentValue,
      cohortLabel: params.cohortLabel,
      cohortSize: sortedValues.length,
      medianValue,
    };
  }

  const label: CustomerGrowthBenchmark["label"] =
    params.currentValue >= topBandThreshold
      ? "top_cohort"
      : params.currentValue > upperBound
        ? "above_peer_range"
        : params.currentValue < lowerBound
          ? "below_peer_range"
          : "within_peer_range";

  return {
    available: true,
    label,
    labelText: humanizeBenchmarkLabel(label),
    currentValue: params.currentValue,
    cohortLabel: params.cohortLabel,
    cohortSize: sortedValues.length,
    medianValue,
  };
}

async function loadLatestSnapshotDate(table: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(table)
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || `Failed to load latest snapshot date for ${table}.`);
  }

  return typeof data?.snapshot_date === "string" ? data.snapshot_date : null;
}

async function loadLatestAccountSnapshots() {
  const supabase = createSupabaseServiceClient();
  const latestSnapshotDate = await loadLatestSnapshotDate("customer_account_growth_snapshots");
  if (!latestSnapshotDate) {
    return [];
  }

  const { data, error } = await supabase
    .from("customer_account_growth_snapshots")
    .select(
      "customer_account_id, snapshot_date, billing_plan_id, billing_status, project_count, active_campaign_count, provider_count, billable_seat_count, current_mrr, is_paid_account, is_retained_30d, is_expansion_ready, is_churn_risk, first_touch_source, latest_touch_source, conversion_touch_source"
    )
    .eq("snapshot_date", latestSnapshotDate);

  if (error) {
    throw new Error(error.message || "Failed to load latest account growth snapshots.");
  }

  return (data ?? []) as AccountSnapshotRow[];
}

async function loadLatestProjectSnapshots() {
  const supabase = createSupabaseServiceClient();
  const latestSnapshotDate = await loadLatestSnapshotDate("project_growth_snapshots");
  if (!latestSnapshotDate) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_growth_snapshots")
    .select(
      "project_id, customer_account_id, project_status, campaign_count, active_campaign_count, live_quest_count, live_raid_count, visible_reward_count, provider_count, team_member_count, member_count"
    )
    .eq("snapshot_date", latestSnapshotDate);

  if (error) {
    throw new Error(error.message || "Failed to load latest project growth snapshots.");
  }

  return (data ?? []) as ProjectSnapshotRow[];
}

async function loadAccountTouches(customerAccountId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("growth_analytics_events")
    .select("first_touch_source, latest_touch_source, utm_source, event_type")
    .eq("customer_account_id", customerAccountId)
    .order("occurred_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load account attribution touches.");
  }

  const rows = (data ?? []) as EventTouchRow[];
  const firstTouch =
    rows.find((row) => row.first_touch_source || row.latest_touch_source || row.utm_source) ?? null;
  const latestTouch =
    [...rows]
      .reverse()
      .find((row) => row.latest_touch_source || row.utm_source || row.first_touch_source) ?? null;
  const conversionTouch =
    [...rows]
      .reverse()
      .find(
        (row) =>
          row.event_type === "paid_converted" &&
          (row.latest_touch_source || row.utm_source || row.first_touch_source)
      ) ?? null;

  return {
    firstTouchSource: optionalSourceLabel(
      firstTouch?.first_touch_source ?? firstTouch?.latest_touch_source ?? firstTouch?.utm_source ?? null
    ),
    latestTouchSource: optionalSourceLabel(
      latestTouch?.latest_touch_source ?? latestTouch?.utm_source ?? latestTouch?.first_touch_source ?? null
    ),
    conversionTouchSource: conversionTouch
      ? optionalSourceLabel(
          conversionTouch.latest_touch_source ??
            conversionTouch.utm_source ??
            conversionTouch.first_touch_source ??
            null
        )
      : null,
  };
}

function recommendWorkspaceMove(params: {
  projectCount: number;
  providerCount: number;
  activeCampaignCount: number;
  billableSeatCount: number;
  isExpansionReady: boolean;
}) {
  if (params.projectCount === 0) {
    return "Create the first project so the workspace can move past setup.";
  }

  if (params.providerCount === 0) {
    return "Connect the first provider so this workspace can ship real delivery rails.";
  }

  if (params.activeCampaignCount === 0) {
    return "Publish the first live campaign so the account closes its first launch loop.";
  }

  if (params.billableSeatCount <= 1) {
    return "Invite another operator so the workspace is not bottlenecked on one person.";
  }

  if (params.isExpansionReady) {
    return "This workspace is showing expansion posture. The next move is scaling the launch motion, not rebuilding the basics.";
  }

  return "Keep the workspace moving and use the benchmark band to decide whether this account needs more push or more scale.";
}

function recommendProjectMove(params: {
  providerCount: number;
  activeCampaignCount: number;
  liveQuestCount: number;
  liveRaidCount: number;
}) {
  if (params.providerCount === 0) {
    return "Connect the first provider so this project can move beyond draft delivery.";
  }

  if (params.activeCampaignCount === 0) {
    return "Launch the first active campaign so the project can start collecting live participation.";
  }

  if (params.liveQuestCount === 0) {
    return "Publish the first live quest so the campaign has a concrete member action path.";
  }

  if (params.liveRaidCount === 0) {
    return "Add a live raid so the project has a coordinated push motion, not only passive participation.";
  }

  return "This project already has real launch motion. Use the benchmark band to judge whether it needs more density, more scale or simply more time.";
}

export async function loadCurrentCustomerGrowthOverviewForUser(authUserId: string) {
  const supabase = createSupabaseServiceClient();
  const [{ data: membership, error: membershipError }, latestSnapshots, { data: accounts, error: accountsError }] =
    await Promise.all([
      supabase
        .from("customer_account_memberships")
        .select("customer_account_id")
        .eq("auth_user_id", authUserId)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      loadLatestAccountSnapshots(),
      supabase.from("customer_accounts").select("id, name, created_at"),
    ]);

  if (membershipError) {
    throw new Error(membershipError.message || "Failed to resolve the current workspace account.");
  }
  if (accountsError) {
    throw new Error(accountsError.message || "Failed to load account benchmark context.");
  }

  const customerAccountId = membership?.customer_account_id ?? null;
  if (!customerAccountId) {
    return null;
  }

  const accountMetaById = new Map(((accounts ?? []) as AccountMetaRow[]).map((row) => [row.id, row]));
  const account = accountMetaById.get(customerAccountId);
  if (!account) {
    return null;
  }

  const [subscriptionResponse, entitlementResponse] = await Promise.all([
    supabase
      .from("customer_account_subscriptions")
      .select("billing_plan_id, status")
      .eq("customer_account_id", customerAccountId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("customer_account_entitlements")
      .select("current_projects, current_active_campaigns, current_providers, current_billable_seats")
      .eq("customer_account_id", customerAccountId)
      .maybeSingle(),
  ]);

  if (subscriptionResponse.error) {
    throw new Error(subscriptionResponse.error.message || "Failed to load subscription context.");
  }
  if (entitlementResponse.error) {
    throw new Error(entitlementResponse.error.message || "Failed to load entitlement context.");
  }

  const subscription = subscriptionResponse.data as AccountSubscriptionRow | null;
  const entitlements = entitlementResponse.data as AccountEntitlementRow | null;
  const snapshot = latestSnapshots.find((row) => row.customer_account_id === customerAccountId) ?? null;
  const projectCount = entitlements?.current_projects ?? snapshot?.project_count ?? 0;
  const activeCampaignCount =
    entitlements?.current_active_campaigns ?? snapshot?.active_campaign_count ?? 0;
  const providerCount = entitlements?.current_providers ?? snapshot?.provider_count ?? 0;
  const billableSeatCount =
    entitlements?.current_billable_seats ?? snapshot?.billable_seat_count ?? 0;
  const isPaidAccount = Boolean((subscription?.billing_plan_id ?? snapshot?.billing_plan_id) && (subscription?.billing_plan_id ?? snapshot?.billing_plan_id) !== "free");
  const isRetained30d =
    snapshot?.is_retained_30d ??
    Boolean(account.created_at && Date.now() - new Date(account.created_at).getTime() >= THIRTY_DAYS_MS);
  const isExpansionReady =
    snapshot?.is_expansion_ready ??
    (projectCount >= 2 || activeCampaignCount >= 2 || billableSeatCount >= 4);
  const isChurnRisk =
    snapshot?.is_churn_risk ?? ["past_due", "grace"].includes(subscription?.status ?? "");
  const activationStage =
    activeCampaignCount > 0
      ? "campaign_live"
      : providerCount > 0
        ? "provider_connected"
        : projectCount > 0
          ? "first_project_created"
          : "workspace_created";
  const workspaceHealthState =
    activeCampaignCount > 0 ? "live" : projectCount > 0 || providerCount > 0 ? "activating" : "not_started";
  const successHealthState =
    isChurnRisk
      ? "churn_risk"
      : isExpansionReady
        ? "expansion_ready"
        : activeCampaignCount > 0 || providerCount > 0
          ? "healthy"
          : "watching";

  const cohortKey = `plan:${subscription?.billing_plan_id ?? snapshot?.billing_plan_id ?? "free"}|age:${resolveAccountAgeBand(account.created_at)}`;
  const cohortLabel = `${sanitizeSourceLabel(subscription?.billing_plan_id ?? snapshot?.billing_plan_id ?? "free")} workspaces in ${humanizeAgeBand(resolveAccountAgeBand(account.created_at))}`;
  const values = latestSnapshots
    .filter((row) => {
      const rowAccount = accountMetaById.get(row.customer_account_id);
      const rowKey = `plan:${row.billing_plan_id ?? "free"}|age:${resolveAccountAgeBand(rowAccount?.created_at ?? null)}`;
      return rowKey === cohortKey;
    })
    .map((row) => calculateWorkspaceGrowthScore(row));

  const touches = await loadAccountTouches(customerAccountId);

  return {
    customerAccountId,
    accountName: account.name,
    billingPlanId: subscription?.billing_plan_id ?? snapshot?.billing_plan_id ?? "free",
    billingStatus: subscription?.status ?? snapshot?.billing_status ?? "free",
    activationStage,
    workspaceHealthState,
    successHealthState,
    projectCount,
    activeCampaignCount,
    providerCount,
    billableSeatCount,
    currentMrr: snapshot?.current_mrr ?? 0,
    isPaidAccount,
    isRetained30d,
    isExpansionReady,
    isChurnRisk,
    firstTouchSource: touches.firstTouchSource,
    latestTouchSource: touches.latestTouchSource,
    conversionTouchSource:
      touches.conversionTouchSource ??
      optionalSourceLabel(snapshot?.conversion_touch_source ?? null),
    benchmark: deriveBenchmark({
      currentValue: calculateWorkspaceGrowthScore({
        project_count: projectCount,
        active_campaign_count: activeCampaignCount,
        provider_count: providerCount,
        billable_seat_count: billableSeatCount,
        is_paid_account: isPaidAccount,
        is_retained_30d: isRetained30d,
        is_expansion_ready: isExpansionReady,
        is_churn_risk: isChurnRisk,
      }),
      cohortLabel,
      values,
      minimumCohortSize: ACCOUNT_BENCHMARK_MINIMUM,
    }),
    recommendedMove: recommendWorkspaceMove({
      projectCount,
      providerCount,
      activeCampaignCount,
      billableSeatCount,
      isExpansionReady,
    }),
  } satisfies CustomerGrowthOverview;
}

export async function loadProjectBenchmarkOverview(params: {
  projectId: string;
  authUserId: string;
}) {
  const supabase = createSupabaseServiceClient();
  const [latestAccountSnapshots, latestProjectSnapshots, projectResponse] = await Promise.all([
    loadLatestAccountSnapshots(),
    loadLatestProjectSnapshots(),
    supabase
      .from("projects")
      .select("id, name, customer_account_id, status, members, is_public")
      .eq("id", params.projectId)
      .maybeSingle(),
  ]);

  if (projectResponse.error) {
    throw new Error(projectResponse.error.message || "Failed to load project analytics.");
  }

  const project = projectResponse.data as ProjectMetaRow | null;
  if (!project) {
    return null;
  }

  if (!project.is_public) {
    const { data: reputation, error: reputationError } = await supabase
      .from("user_project_reputation")
      .select("id")
      .eq("auth_user_id", params.authUserId)
      .eq("project_id", project.id)
      .maybeSingle();

    if (reputationError) {
      throw new Error(reputationError.message || "Failed to validate project analytics access.");
    }

    if (!reputation?.id) {
      throw new Error("Project analytics access denied.");
    }
  }

  const snapshot = latestProjectSnapshots.find((row) => row.project_id === project.id) ?? null;

  const [
    campaignsResponse,
    activeCampaignsResponse,
    questsResponse,
    raidsResponse,
    rewardsResponse,
    integrationsResponse,
    teamResponse,
  ] = await Promise.all([
    supabase.from("campaigns").select("id").eq("project_id", project.id),
    supabase.from("campaigns").select("id").eq("project_id", project.id).eq("status", "active"),
    supabase.from("quests").select("id").eq("project_id", project.id).eq("status", "active"),
    supabase.from("raids").select("id").eq("project_id", project.id).eq("status", "active"),
    supabase.from("rewards").select("id").eq("project_id", project.id).eq("visible", true),
    supabase
      .from("project_integrations")
      .select("provider")
      .eq("project_id", project.id)
      .in("status", ["connected", "needs_attention"]),
    supabase
      .from("team_members")
      .select("id")
      .eq("project_id", project.id)
      .in("status", ["active", "invited"]),
  ]);

  const responses = [
    campaignsResponse,
    activeCampaignsResponse,
    questsResponse,
    raidsResponse,
    rewardsResponse,
    integrationsResponse,
    teamResponse,
  ];
  const firstError = responses.find((response) => response.error);
  if (firstError?.error) {
    throw new Error(firstError.error.message || "Failed to load project analytics counts.");
  }

  const campaignCount = ((campaignsResponse.data ?? []) as CountRow[]).length;
  const activeCampaignCount = ((activeCampaignsResponse.data ?? []) as CountRow[]).length;
  const liveQuestCount = ((questsResponse.data ?? []) as CountRow[]).length;
  const liveRaidCount = ((raidsResponse.data ?? []) as CountRow[]).length;
  const visibleRewardCount = ((rewardsResponse.data ?? []) as CountRow[]).length;
  const providerCount = new Set(
    ((integrationsResponse.data ?? []) as IntegrationRow[])
      .map((row) => row.provider)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  ).size;
  const teamMemberCount = ((teamResponse.data ?? []) as CountRow[]).length;
  const accountPlanById = new Map(
    latestAccountSnapshots.map((row) => [row.customer_account_id, row.billing_plan_id ?? "free"])
  );
  const cohortLabel = `${sanitizeSourceLabel(
    project.customer_account_id ? accountPlanById.get(project.customer_account_id) ?? "free" : "free"
  )} projects with ${(project.status ?? "draft").replaceAll("_", " ")} posture`;
  const cohortKey = `plan:${project.customer_account_id ? accountPlanById.get(project.customer_account_id) ?? "free" : "free"}|status:${project.status ?? "draft"}`;
  const values = latestProjectSnapshots
    .filter((row) => {
      const rowPlan = row.customer_account_id
        ? accountPlanById.get(row.customer_account_id) ?? "free"
        : "free";
      return `plan:${rowPlan}|status:${row.project_status}` === cohortKey;
    })
    .map((row) => calculateProjectLaunchScore(row));

  return {
    projectId: project.id,
    projectName: project.name,
    projectStatus: project.status ?? snapshot?.project_status ?? "draft",
    campaignCount,
    activeCampaignCount,
    liveQuestCount,
    liveRaidCount,
    visibleRewardCount,
    providerCount,
    teamMemberCount,
    memberCount: project.members ?? snapshot?.member_count ?? 0,
    benchmark: deriveBenchmark({
      currentValue: calculateProjectLaunchScore({
        campaign_count: campaignCount,
        active_campaign_count: activeCampaignCount,
        live_quest_count: liveQuestCount,
        live_raid_count: liveRaidCount,
        visible_reward_count: visibleRewardCount,
        provider_count: providerCount,
        team_member_count: teamMemberCount,
        member_count: project.members ?? snapshot?.member_count ?? 0,
      }),
      cohortLabel,
      values,
      minimumCohortSize: PROJECT_BENCHMARK_MINIMUM,
    }),
    recommendedMove: recommendProjectMove({
      providerCount,
      activeCampaignCount,
      liveQuestCount,
      liveRaidCount,
    }),
  } satisfies ProjectBenchmarkOverview;
}
