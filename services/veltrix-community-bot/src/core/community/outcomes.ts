import { supabaseAdmin } from "../../lib/supabase.js";

export type CommunityJourneyOutcomeSummary = {
  key: "onboarding" | "comeback" | "active";
  startedCount: number;
  completedCount: number;
  activeCount: number;
  recentCompletedCount: number;
  completionRate: number;
};

export type ProjectCommunityOutcomeSummary = {
  projectId: string;
  onboarding: CommunityJourneyOutcomeSummary;
  comeback: CommunityJourneyOutcomeSummary;
  active: CommunityJourneyOutcomeSummary;
  captain: {
    activeAssignments: number;
    actionableQueueCount: number;
    blockedQueueCount: number;
    escalatedQueueCount: number;
    recentSuccessCount: number;
    recentFailureCount: number;
  };
  automation: {
    recentRunCount: number;
    recentSuccessCount: number;
    recentFailureCount: number;
  };
};

function roundPercentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function buildJourneySummary(input: {
  key: CommunityJourneyOutcomeSummary["key"];
  journeys: Array<{ journey_type: string | null; status: string | null; completed_at: string | null }>;
  snapshots: Array<{ journey_type: string | null; status: string | null }>;
  recentCompletionEvents: Array<{ event_payload: Record<string, unknown> | null; member_journey_id: string | null }>;
}) {
  const matchingJourneys = input.journeys.filter((row) => row.journey_type === input.key);
  const startedCount = matchingJourneys.length;
  const completedCount = matchingJourneys.filter(
    (row) => row.status === "completed" || Boolean(row.completed_at)
  ).length;
  const activeCount = input.snapshots.filter(
    (row) => row.journey_type === input.key && row.status === "active"
  ).length;
  const recentCompletedCount = input.recentCompletionEvents.filter((row) => {
    if (!row.event_payload || typeof row.event_payload !== "object") {
      return false;
    }

    const journeyType = row.event_payload.journeyType;
    return journeyType === input.key;
  }).length;

  return {
    key: input.key,
    startedCount,
    completedCount,
    activeCount,
    recentCompletedCount,
    completionRate: roundPercentage(completedCount, startedCount),
  } satisfies CommunityJourneyOutcomeSummary;
}

export async function loadProjectCommunityOutcomeSummary(
  projectId: string
): Promise<ProjectCommunityOutcomeSummary> {
  const recentWindowIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: journeyRows, error: journeysError },
    { data: snapshotRows, error: snapshotError },
    { data: recentEvents, error: eventsError },
    { count: assignmentCount, error: assignmentsError },
    { count: actionableQueueCount, error: actionableQueueError },
    { count: blockedQueueCount, error: blockedQueueError },
    { count: escalatedQueueCount, error: escalatedQueueError },
    { data: captainActions, error: captainActionsError },
    { data: automationRuns, error: automationRunsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("community_member_journeys")
      .select("journey_type, status, completed_at")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("community_member_status_snapshots")
      .select("journey_type, status")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("community_member_journey_events")
      .select("member_journey_id, event_payload")
      .eq("project_id", projectId)
      .eq("event_type", "milestone_unlocked")
      .gte("created_at", recentWindowIso),
    supabaseAdmin
      .from("community_captain_assignments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "active"),
    supabaseAdmin
      .from("community_captain_action_queue")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("status", ["queued", "in_progress", "blocked"]),
    supabaseAdmin
      .from("community_captain_action_queue")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "blocked"),
    supabaseAdmin
      .from("community_captain_action_queue")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("escalation_state", "escalated")
      .in("status", ["queued", "in_progress", "blocked"]),
    supabaseAdmin
      .from("community_captain_actions")
      .select("status")
      .eq("project_id", projectId)
      .gte("created_at", recentWindowIso)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("community_automation_runs")
      .select("status")
      .eq("project_id", projectId)
      .gte("created_at", recentWindowIso)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (journeysError) throw new Error(journeysError.message || "Failed to load community journeys.");
  if (snapshotError) throw new Error(snapshotError.message || "Failed to load journey snapshots.");
  if (eventsError) throw new Error(eventsError.message || "Failed to load journey events.");
  if (assignmentsError) throw new Error(assignmentsError.message || "Failed to load captain assignments.");
  if (actionableQueueError) throw new Error(actionableQueueError.message || "Failed to load captain queue counts.");
  if (blockedQueueError) throw new Error(blockedQueueError.message || "Failed to load blocked queue counts.");
  if (escalatedQueueError) throw new Error(escalatedQueueError.message || "Failed to load escalated queue counts.");
  if (captainActionsError) throw new Error(captainActionsError.message || "Failed to load captain actions.");
  if (automationRunsError) throw new Error(automationRunsError.message || "Failed to load automation runs.");

  const journeys = (journeyRows ?? []) as Array<{
    journey_type: string | null;
    status: string | null;
    completed_at: string | null;
  }>;
  const snapshots = (snapshotRows ?? []) as Array<{
    journey_type: string | null;
    status: string | null;
  }>;
  const events = (recentEvents ?? []) as Array<{
    member_journey_id: string | null;
    event_payload: Record<string, unknown> | null;
  }>;

  const onboarding = buildJourneySummary({
    key: "onboarding",
    journeys,
    snapshots,
    recentCompletionEvents: events,
  });
  const comeback = buildJourneySummary({
    key: "comeback",
    journeys,
    snapshots,
    recentCompletionEvents: events,
  });
  const active = buildJourneySummary({
    key: "active",
    journeys,
    snapshots,
    recentCompletionEvents: events,
  });

  const captainStatuses = (captainActions ?? []) as Array<{ status: string | null }>;
  const automationStatuses = (automationRuns ?? []) as Array<{ status: string | null }>;

  return {
    projectId,
    onboarding,
    comeback,
    active,
    captain: {
      activeAssignments: Number(assignmentCount ?? 0),
      actionableQueueCount: Number(actionableQueueCount ?? 0),
      blockedQueueCount: Number(blockedQueueCount ?? 0),
      escalatedQueueCount: Number(escalatedQueueCount ?? 0),
      recentSuccessCount: captainStatuses.filter((row) => row.status === "success").length,
      recentFailureCount: captainStatuses.filter((row) => row.status === "failed").length,
    },
    automation: {
      recentRunCount: automationStatuses.length,
      recentSuccessCount: automationStatuses.filter((row) => row.status === "success").length,
      recentFailureCount: automationStatuses.filter((row) => row.status === "failed").length,
    },
  };
}
