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

export type CommunityOutcomeSnapshotInput = {
  authUserId: string;
  journeyType: "onboarding" | "active" | "comeback";
  status: string | null;
  linkedProvidersCount: number;
  walletVerified: boolean;
  trust: number;
  openFlagCount: number;
  claimableRewards: number;
};

export type CommunityOutcomeCohortSnapshot = {
  cohortKey: "newcomer" | "active" | "reactivation" | "high_trust" | "watchlist";
  memberCount: number;
  readyCount: number;
  blockedCount: number;
  activeCount: number;
  averageTrust: number;
  computedAt: string;
};

export type CommunityOutcomeHealthRollup = {
  signalKey:
    | "participation_posture"
    | "conversion_posture"
    | "retention_posture"
    | "trust_posture"
    | "reward_quality";
  signalValue: string;
  signalTone: "default" | "success" | "warning" | "danger";
  summary: string;
  windowKey: "current";
  computedAt: string;
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

function isSnapshotReady(snapshot: CommunityOutcomeSnapshotInput) {
  return (
    snapshot.linkedProvidersCount >= 2 &&
    snapshot.walletVerified &&
    snapshot.trust >= 60 &&
    snapshot.openFlagCount === 0
  );
}

function isSnapshotBlocked(snapshot: CommunityOutcomeSnapshotInput) {
  return snapshot.openFlagCount > 0 || snapshot.trust < 45;
}

function buildCohortSnapshot(
  cohortKey: CommunityOutcomeCohortSnapshot["cohortKey"],
  members: CommunityOutcomeSnapshotInput[],
  computedAt: string
): CommunityOutcomeCohortSnapshot {
  const totalTrust = members.reduce((sum, member) => sum + member.trust, 0);

  return {
    cohortKey,
    memberCount: members.length,
    readyCount: members.filter(isSnapshotReady).length,
    blockedCount: members.filter(isSnapshotBlocked).length,
    activeCount: members.filter((member) => member.status === "active").length,
    averageTrust: members.length > 0 ? Math.round(totalTrust / members.length) : 0,
    computedAt,
  };
}

export function buildCommunityCohortSnapshots(input: {
  snapshots: CommunityOutcomeSnapshotInput[];
  computedAt: string;
}): CommunityOutcomeCohortSnapshot[] {
  const newcomers = input.snapshots.filter((snapshot) => snapshot.journeyType === "onboarding");
  const active = input.snapshots.filter((snapshot) => snapshot.journeyType === "active");
  const reactivation = input.snapshots.filter((snapshot) => snapshot.journeyType === "comeback");
  const highTrust = input.snapshots.filter(
    (snapshot) =>
      snapshot.journeyType === "active" &&
      snapshot.trust >= 80 &&
      snapshot.openFlagCount === 0
  );
  const watchlist = input.snapshots.filter(isSnapshotBlocked);

  return [
    buildCohortSnapshot("newcomer", newcomers, input.computedAt),
    buildCohortSnapshot("active", active, input.computedAt),
    buildCohortSnapshot("reactivation", reactivation, input.computedAt),
    buildCohortSnapshot("high_trust", highTrust, input.computedAt),
    buildCohortSnapshot("watchlist", watchlist, input.computedAt),
  ];
}

function buildHealthRollup(input: {
  signalKey: CommunityOutcomeHealthRollup["signalKey"];
  signalValue: string;
  signalTone: CommunityOutcomeHealthRollup["signalTone"];
  summary: string;
  computedAt: string;
}): CommunityOutcomeHealthRollup {
  return {
    signalKey: input.signalKey,
    signalValue: input.signalValue,
    signalTone: input.signalTone,
    summary: input.summary,
    windowKey: "current",
    computedAt: input.computedAt,
  };
}

export function buildCommunityHealthRollups(input: {
  computedAt: string;
  cohortSnapshots: CommunityOutcomeCohortSnapshot[];
  journeyOutcomes: {
    onboardingCompletionRate: number;
    comebackCompletionRate: number;
    activationCompletionRate: number;
    retentionCompletionRate: number;
  };
  captain: {
    blockedQueueCount: number;
    escalatedQueueCount: number;
  };
  automation: {
    recentRunCount: number;
    recentFailureCount: number;
  };
  reward: {
    claimableReadyMembers: number;
    totalReadyMembers: number;
  };
}): CommunityOutcomeHealthRollup[] {
  const newcomer = input.cohortSnapshots.find((snapshot) => snapshot.cohortKey === "newcomer");
  const active = input.cohortSnapshots.find((snapshot) => snapshot.cohortKey === "active");
  const reactivation = input.cohortSnapshots.find(
    (snapshot) => snapshot.cohortKey === "reactivation"
  );
  const highTrust = input.cohortSnapshots.find(
    (snapshot) => snapshot.cohortKey === "high_trust"
  );
  const watchlist = input.cohortSnapshots.find((snapshot) => snapshot.cohortKey === "watchlist");

  const activeReadyRate = active ? roundPercentage(active.readyCount, active.memberCount) : 0;
  const newcomerBlockedCount = newcomer?.blockedCount ?? 0;
  const conversionRate = Math.round(
    (input.journeyOutcomes.onboardingCompletionRate +
      input.journeyOutcomes.comebackCompletionRate +
      input.journeyOutcomes.activationCompletionRate) /
      3
  );
  const rewardQualityRate = roundPercentage(
    input.reward.claimableReadyMembers,
    input.reward.totalReadyMembers
  );
  const watchlistShare = roundPercentage(
    watchlist?.memberCount ?? 0,
    (newcomer?.memberCount ?? 0) +
      (active?.memberCount ?? 0) +
      (reactivation?.memberCount ?? 0)
  );

  return [
    buildHealthRollup({
      signalKey: "participation_posture",
      signalValue: `${activeReadyRate}%`,
      signalTone:
        activeReadyRate >= 70 && newcomerBlockedCount === 0 && (watchlist?.memberCount ?? 0) === 0
          ? "success"
          : activeReadyRate >= 50
            ? "warning"
            : "danger",
      summary:
        activeReadyRate >= 70
          ? "The active contributor rail is healthy and can absorb more mission pressure."
          : "Active contributors are visible, but more of them still need full readiness before the next push cycle.",
      computedAt: input.computedAt,
    }),
    buildHealthRollup({
      signalKey: "conversion_posture",
      signalValue: `${conversionRate}%`,
      signalTone: conversionRate >= 65 ? "success" : conversionRate >= 45 ? "warning" : "danger",
      summary:
        conversionRate >= 65
          ? "Starter and comeback funnels are converting cleanly into the active rail."
          : "Starter and comeback rails still need tighter sequencing before they become dependable conversion engines.",
      computedAt: input.computedAt,
    }),
    buildHealthRollup({
      signalKey: "retention_posture",
      signalValue: `${input.journeyOutcomes.retentionCompletionRate}%`,
      signalTone:
        input.journeyOutcomes.retentionCompletionRate >= 60
          ? "success"
          : reactivation && reactivation.memberCount > 0
            ? "warning"
            : "default",
      summary:
        (reactivation?.memberCount ?? 0) > 0
          ? `${reactivation?.memberCount ?? 0} contributors sit in the comeback lane and should be pulled back before momentum softens.`
          : "Retention pressure is stable and the comeback lane is currently light.",
      computedAt: input.computedAt,
    }),
    buildHealthRollup({
      signalKey: "trust_posture",
      signalValue: `${highTrust?.memberCount ?? 0}/${watchlist?.memberCount ?? 0}`,
      signalTone:
        input.captain.blockedQueueCount > 0 ||
        input.captain.escalatedQueueCount > 0 ||
        watchlistShare >= 20
          ? "warning"
          : watchlistShare === 0
            ? "success"
            : "default",
      summary:
        watchlistShare >= 20
          ? "Watchlist pressure is high relative to the active community size and should be reviewed before broader pushes."
          : "Trust posture stays readable, with high-trust contributors outnumbering risky seats.",
      computedAt: input.computedAt,
    }),
    buildHealthRollup({
      signalKey: "reward_quality",
      signalValue: `${rewardQualityRate}%`,
      signalTone:
        rewardQualityRate >= 20 ? "success" : input.automation.recentFailureCount > 0 ? "warning" : "default",
      summary:
        input.reward.claimableReadyMembers > 0
          ? `${input.reward.claimableReadyMembers} ready contributors already have claimable reward pressure available.`
          : "No claimable reward pressure is currently visible for ready contributors.",
      computedAt: input.computedAt,
    }),
  ];
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

export async function refreshProjectCommunityOutcomeReadModels(projectId: string) {
  const computedAt = new Date().toISOString();
  const outcomeSummary = await loadProjectCommunityOutcomeSummary(projectId);

  const [
    { data: snapshotRows, error: snapshotError },
    { data: reputationRows, error: reputationError },
    { data: reviewFlagRows, error: reviewFlagError },
  ] = await Promise.all([
    supabaseAdmin
      .from("community_member_status_snapshots")
      .select("auth_user_id, journey_type, status, metadata")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("user_project_reputation")
      .select("auth_user_id, trust_score")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("review_flags")
      .select("auth_user_id")
      .eq("project_id", projectId)
      .eq("status", "open"),
  ]);

  if (snapshotError) {
    throw new Error(snapshotError.message || "Failed to load member status snapshots.");
  }
  if (reputationError) {
    throw new Error(reputationError.message || "Failed to load project reputation for health rollups.");
  }
  if (reviewFlagError) {
    throw new Error(reviewFlagError.message || "Failed to load review flags for health rollups.");
  }

  const trustByAuthUserId = new Map<string, number>();
  for (const row of (reputationRows ?? []) as Array<{
    auth_user_id: string;
    trust_score: number | null;
  }>) {
    trustByAuthUserId.set(row.auth_user_id, Number(row.trust_score ?? 50));
  }

  const flagCountByAuthUserId = new Map<string, number>();
  for (const row of (reviewFlagRows ?? []) as Array<{ auth_user_id: string | null }>) {
    if (!row.auth_user_id) continue;
    flagCountByAuthUserId.set(
      row.auth_user_id,
      (flagCountByAuthUserId.get(row.auth_user_id) ?? 0) + 1
    );
  }

  const normalizedSnapshots = ((snapshotRows ?? []) as Array<{
    auth_user_id: string;
    journey_type: "onboarding" | "active" | "comeback" | null;
    status: string | null;
    metadata: Record<string, unknown> | null;
  }>)
    .filter(
      (row): row is {
        auth_user_id: string;
        journey_type: "onboarding" | "active" | "comeback";
        status: string | null;
        metadata: Record<string, unknown> | null;
      } =>
        row.auth_user_id.length > 0 &&
        (row.journey_type === "onboarding" ||
          row.journey_type === "active" ||
          row.journey_type === "comeback")
    )
    .map((row) => {
      const metadata =
        row.metadata && typeof row.metadata === "object" ? row.metadata : {};

      return {
        authUserId: row.auth_user_id,
        journeyType: row.journey_type,
        status: row.status,
        linkedProvidersCount: Number(metadata.linkedProvidersCount ?? 0),
        walletVerified: metadata.walletVerified === true,
        trust: trustByAuthUserId.get(row.auth_user_id) ?? 50,
        openFlagCount: flagCountByAuthUserId.get(row.auth_user_id) ?? 0,
        claimableRewards: Number(metadata.claimableRewards ?? 0),
      } satisfies CommunityOutcomeSnapshotInput;
    });

  const cohortSnapshots = buildCommunityCohortSnapshots({
    snapshots: normalizedSnapshots,
    computedAt,
  });

  const readyMembers = normalizedSnapshots.filter(isSnapshotReady);
  const healthRollups = buildCommunityHealthRollups({
    computedAt,
    cohortSnapshots,
    journeyOutcomes: {
      onboardingCompletionRate: outcomeSummary.onboarding.completionRate,
      comebackCompletionRate: outcomeSummary.comeback.completionRate,
      activationCompletionRate: outcomeSummary.active.completionRate,
      retentionCompletionRate: outcomeSummary.active.completionRate,
    },
    captain: {
      blockedQueueCount: outcomeSummary.captain.blockedQueueCount,
      escalatedQueueCount: outcomeSummary.captain.escalatedQueueCount,
    },
    automation: {
      recentRunCount: outcomeSummary.automation.recentRunCount,
      recentFailureCount: outcomeSummary.automation.recentFailureCount,
    },
    reward: {
      claimableReadyMembers: readyMembers.filter((snapshot) => snapshot.claimableRewards > 0).length,
      totalReadyMembers: readyMembers.length,
    },
  });

  const { error: cohortError } = await supabaseAdmin
    .from("community_cohort_snapshots")
    .upsert(
      cohortSnapshots.map((snapshot) => ({
        project_id: projectId,
        cohort_key: snapshot.cohortKey,
        member_count: snapshot.memberCount,
        ready_count: snapshot.readyCount,
        blocked_count: snapshot.blockedCount,
        active_count: snapshot.activeCount,
        average_trust: snapshot.averageTrust,
        metadata: {},
        computed_at: snapshot.computedAt,
        updated_at: snapshot.computedAt,
      })),
      {
        onConflict: "project_id,cohort_key",
      }
    );

  if (cohortError) {
    throw new Error(cohortError.message || "Failed to upsert community cohort snapshots.");
  }

  const { error: healthRollupError } = await supabaseAdmin
    .from("community_health_rollups")
    .upsert(
      healthRollups.map((rollup) => ({
        project_id: projectId,
        signal_key: rollup.signalKey,
        signal_value: rollup.signalValue,
        signal_tone: rollup.signalTone,
        summary: rollup.summary,
        window_key: rollup.windowKey,
        metadata: {},
        computed_at: rollup.computedAt,
        updated_at: rollup.computedAt,
      })),
      {
        onConflict: "project_id,signal_key,window_key",
      }
    );

  if (healthRollupError) {
    throw new Error(healthRollupError.message || "Failed to upsert community health rollups.");
  }

  return {
    projectId,
    cohortSnapshotsWritten: cohortSnapshots.length,
    healthRollupsWritten: healthRollups.length,
  };
}
