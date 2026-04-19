import { supabaseAdmin } from "../../lib/supabase.js";
import {
  buildCommunityJourneyDeepLinks,
  type CommunityJourneyDeepLinks,
  type CommunityJourneyType,
} from "./automation-links.js";

export type CommunityJourneyPrompt = {
  authUserId: string;
  projectId: string;
  projectName: string;
  projectChain: string | null;
  lane: CommunityJourneyType;
  recognitionLabel: string;
  headline: string;
  supportingCopy: string;
  contributionStatus: string;
  nextUnlockLabel: string;
  unreadSignals: number;
  openMissionCount: number;
  claimableRewards: number;
  linkedProvidersCount: number;
  walletVerified: boolean;
  streakDays: number;
  urls: CommunityJourneyDeepLinks;
};

type JourneyRow = {
  id: string;
  auth_user_id: string;
  journey_type: CommunityJourneyType;
  status: "active" | "paused" | "completed" | "archived";
  current_step_key: string | null;
  last_step_key: string | null;
  started_at: string;
  completed_at: string | null;
  last_event_at: string | null;
  metadata: Record<string, unknown> | null;
};

type SnapshotRow = {
  id: string;
  auth_user_id: string;
  member_journey_id: string;
  journey_type: CommunityJourneyType;
  status: "active" | "paused" | "completed" | "archived";
  current_step_key: string | null;
  last_event_type: string | null;
  last_event_at: string | null;
  completed_steps_count: number | null;
  nudges_sent_count: number | null;
  milestones_unlocked_count: number | null;
  streak_days: number | null;
  next_nudge_at: string | null;
  metadata: Record<string, unknown> | null;
};

type ProjectMemberRollup = {
  authUserId: string;
  connectedProvidersCount: number;
  walletVerified: boolean;
  unreadSignals: number;
  projectXp: number;
  projectLevel: number;
  projectTrust: number;
  projectContributionTier: string;
  streakDays: number;
  joinedProject: boolean;
  claimableRewards: number;
  openMissionCount: number;
};

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function normalizeMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function determineJourneyLane(input: ProjectMemberRollup): CommunityJourneyType {
  if (input.projectXp >= 250 && input.unreadSignals > 0 && input.streakDays <= 1) {
    return "comeback";
  }

  if (!input.walletVerified || input.connectedProvidersCount < 2 || !input.joinedProject) {
    return "onboarding";
  }

  return "active";
}

function buildCommunityJourneyPrompt(input: {
  project: { id: string; name: string; chain: string | null };
  rollup: ProjectMemberRollup;
  lane: CommunityJourneyType;
}): CommunityJourneyPrompt {
  const urls = buildCommunityJourneyDeepLinks(input.project.id, input.lane);
  const recognitionLabel = input.rollup.projectContributionTier || "Explorer";
  const contributionStatus =
    input.lane === "onboarding"
      ? "Your loadout is still arming for this project."
      : input.lane === "comeback"
        ? "This project is trying to pull you back into visible pressure."
        : "You are active inside this community rail.";
  const nextUnlockLabel =
    input.lane === "onboarding"
      ? !input.rollup.walletVerified
        ? "Verify your wallet to unlock deeper trust and campaign rails."
        : input.rollup.connectedProvidersCount < 2
          ? "Link one more provider to fully arm the community loadout."
          : "Finish a first mission to graduate into the active lane."
      : input.lane === "comeback"
        ? "Clear one mission or raid to fully reactivate this project lane."
        : input.rollup.claimableRewards > 0
          ? "A community unlock is ready in the reward vault."
          : "Keep your streak alive to protect your current recognition.";

  return {
    authUserId: input.rollup.authUserId,
    projectId: input.project.id,
    projectName: input.project.name,
    projectChain: input.project.chain,
    lane: input.lane,
    recognitionLabel,
    headline:
      input.lane === "onboarding"
        ? `Finish your ${input.project.name} loadout`
        : input.lane === "comeback"
          ? `Welcome back to ${input.project.name}`
          : `${input.project.name} lane is live`,
    supportingCopy:
      input.lane === "onboarding"
        ? "Veltrix will keep prioritizing identity, wallet and first-mission moves until this rail is armed."
        : input.lane === "comeback"
          ? "The comeback rail focuses only on the fastest moves that pull a returning member back into pressure."
          : "The active rail stays focused on recognition, streak and the next unlock that keeps this project moving.",
    contributionStatus,
    nextUnlockLabel,
    unreadSignals: input.rollup.unreadSignals,
    openMissionCount: input.rollup.openMissionCount,
    claimableRewards: input.rollup.claimableRewards,
    linkedProvidersCount: input.rollup.connectedProvidersCount,
    walletVerified: input.rollup.walletVerified,
    streakDays: input.rollup.streakDays,
    urls,
  };
}

async function loadProjectJourneyRollups(params: {
  projectId: string;
  authUserId?: string | null;
  limit?: number;
}) {
  const [{ data: project, error: projectError }, { data: campaigns, error: campaignsError }, { count: questCount, error: questCountError }, { data: projectReputationRows, error: projectReputationError }, { data: userProgressRows, error: progressError }] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, name, chain")
        .eq("id", params.projectId)
        .maybeSingle(),
      supabaseAdmin
        .from("campaigns")
        .select("id")
        .eq("project_id", params.projectId)
        .eq("status", "active"),
      supabaseAdmin
        .from("quests")
        .select("id", { count: "exact", head: true })
        .eq("project_id", params.projectId)
        .eq("status", "active"),
      supabaseAdmin
        .from("user_project_reputation")
        .select("auth_user_id, xp, level, trust_score, contribution_tier, streak")
        .eq("project_id", params.projectId)
        .order("updated_at", { ascending: false })
        .limit(Math.max(params.limit ?? 150, 150)),
      supabaseAdmin
        .from("user_progress")
        .select("auth_user_id, joined_communities")
        .limit(Math.max((params.limit ?? 150) * 4, 400)),
    ]);

  if (projectError) throw new Error(projectError.message || "Failed to load journey project.");
  if (!project) throw new Error("Project not found for community journey refresh.");
  if (campaignsError) throw new Error(campaignsError.message || "Failed to load project campaigns.");
  if (questCountError) throw new Error(questCountError.message || "Failed to load project quest count.");
  if (projectReputationError) throw new Error(projectReputationError.message || "Failed to load project reputation rows.");
  if (progressError) throw new Error(progressError.message || "Failed to load community progress rows.");

  const joinedProjectAuthUserIds = new Set(
    ((userProgressRows ?? []) as Array<{ auth_user_id: string; joined_communities: string[] | null }>)
      .filter((row) => Array.isArray(row.joined_communities) && row.joined_communities.includes(params.projectId))
      .map((row) => row.auth_user_id)
  );

  const authUserIds = new Set<string>(
    ((projectReputationRows ?? []) as Array<{ auth_user_id: string }>).map((row) => row.auth_user_id)
  );
  for (const authUserId of joinedProjectAuthUserIds) {
    authUserIds.add(authUserId);
  }
  if (params.authUserId) {
    authUserIds.add(params.authUserId);
  }

  const limitedAuthUserIds = Array.from(authUserIds).slice(0, params.limit ?? 150);
  if (limitedAuthUserIds.length === 0) {
    return {
      project: project as { id: string; name: string; chain: string | null },
      campaignIds: ((campaigns ?? []) as Array<{ id: string }>).map((row) => row.id),
      openMissionCount: Number(questCount ?? 0),
      rollups: [] as ProjectMemberRollup[],
      journeysByAuthUserId: new Map<string, JourneyRow[]>(),
      snapshotsByAuthUserId: new Map<string, SnapshotRow>(),
    };
  }

  const connectedProviderCounts = new Map<string, Set<string>>();
  const walletVerifiedAuthUserIds = new Set<string>();
  const unreadSignalsByAuthUserId = new Map<string, number>();
  const claimableRewardsByAuthUserId = new Map<string, number>();
  const globalReputationByAuthUserId = new Map<string, { streak: number | null }>();
  const projectReputationByAuthUserId = new Map<
    string,
    {
      xp: number | null;
      level: number | null;
      trust_score: number | null;
      contribution_tier: string | null;
      streak: number | null;
    }
  >(
    ((projectReputationRows ?? []) as Array<{
      auth_user_id: string;
      xp: number | null;
      level: number | null;
      trust_score: number | null;
      contribution_tier: string | null;
      streak: number | null;
    }>).map((row) => [
      row.auth_user_id,
      {
        xp: row.xp,
        level: row.level,
        trust_score: row.trust_score,
        contribution_tier: row.contribution_tier,
        streak: row.streak,
      },
    ])
  );
  const journeysByAuthUserId = new Map<string, JourneyRow[]>();
  const snapshotsByAuthUserId = new Map<string, SnapshotRow>();
  const campaignIds = ((campaigns ?? []) as Array<{ id: string }>).map((row) => row.id);

  for (const chunk of chunkArray(limitedAuthUserIds, 100)) {
    const requestBundle = [
      supabaseAdmin
        .from("user_connected_accounts")
        .select("auth_user_id, provider")
        .eq("status", "connected")
        .in("provider", ["discord", "telegram", "x"])
        .in("auth_user_id", chunk),
      supabaseAdmin
        .from("wallet_links")
        .select("auth_user_id")
        .eq("verified", true)
        .in("auth_user_id", chunk),
      supabaseAdmin
        .from("app_notifications")
        .select("auth_user_id")
        .eq("read", false)
        .in("auth_user_id", chunk),
      supabaseAdmin
        .from("user_global_reputation")
        .select("auth_user_id, streak")
        .in("auth_user_id", chunk),
      supabaseAdmin
        .from("community_member_journeys")
        .select("id, auth_user_id, journey_type, status, current_step_key, last_step_key, started_at, completed_at, last_event_at, metadata")
        .eq("project_id", params.projectId)
        .in("auth_user_id", chunk),
      supabaseAdmin
        .from("community_member_status_snapshots")
        .select("id, auth_user_id, member_journey_id, journey_type, status, current_step_key, last_event_type, last_event_at, completed_steps_count, nudges_sent_count, milestones_unlocked_count, streak_days, next_nudge_at, metadata")
        .eq("project_id", params.projectId)
        .in("auth_user_id", chunk),
    ] as const;

    const [
      connectedAccounts,
      walletRows,
      unreadNotifications,
      globalReputationRows,
      journeyRows,
      snapshotRows,
    ] = await Promise.all(requestBundle);

    if (connectedAccounts.error) throw new Error(connectedAccounts.error.message || "Failed to load connected accounts.");
    if (walletRows.error) throw new Error(walletRows.error.message || "Failed to load wallet links.");
    if (unreadNotifications.error) throw new Error(unreadNotifications.error.message || "Failed to load unread notifications.");
    if (globalReputationRows.error) throw new Error(globalReputationRows.error.message || "Failed to load global reputation.");
    if (journeyRows.error) throw new Error(journeyRows.error.message || "Failed to load member journeys.");
    if (snapshotRows.error) throw new Error(snapshotRows.error.message || "Failed to load member snapshots.");

    for (const row of (connectedAccounts.data ?? []) as Array<{ auth_user_id: string; provider: string }>) {
      const providers = connectedProviderCounts.get(row.auth_user_id) ?? new Set<string>();
      providers.add(row.provider);
      connectedProviderCounts.set(row.auth_user_id, providers);
    }

    for (const row of (walletRows.data ?? []) as Array<{ auth_user_id: string }>) {
      walletVerifiedAuthUserIds.add(row.auth_user_id);
    }

    for (const row of (unreadNotifications.data ?? []) as Array<{ auth_user_id: string }>) {
      unreadSignalsByAuthUserId.set(
        row.auth_user_id,
        (unreadSignalsByAuthUserId.get(row.auth_user_id) ?? 0) + 1
      );
    }

    for (const row of (globalReputationRows.data ?? []) as Array<{ auth_user_id: string; streak: number | null }>) {
      globalReputationByAuthUserId.set(row.auth_user_id, { streak: row.streak });
    }

    for (const row of (journeyRows.data ?? []) as JourneyRow[]) {
      const existing = journeysByAuthUserId.get(row.auth_user_id) ?? [];
      existing.push(row);
      journeysByAuthUserId.set(row.auth_user_id, existing);
    }

    for (const row of (snapshotRows.data ?? []) as SnapshotRow[]) {
      snapshotsByAuthUserId.set(row.auth_user_id, row);
    }

    if (campaignIds.length > 0) {
      const { data: claimableRows, error: claimableError } = await supabaseAdmin
        .from("reward_distributions")
        .select("auth_user_id")
        .eq("status", "claimable")
        .in("campaign_id", campaignIds)
        .in("auth_user_id", chunk);

      if (claimableError) {
        throw new Error(claimableError.message || "Failed to load claimable reward distributions.");
      }

      for (const row of (claimableRows ?? []) as Array<{ auth_user_id: string }>) {
        claimableRewardsByAuthUserId.set(
          row.auth_user_id,
          (claimableRewardsByAuthUserId.get(row.auth_user_id) ?? 0) + 1
        );
      }
    }
  }

  return {
    project: project as { id: string; name: string; chain: string | null },
    campaignIds,
    openMissionCount: Number(questCount ?? 0),
    rollups: limitedAuthUserIds.map((authUserId) => {
      const projectReputation = projectReputationByAuthUserId.get(authUserId);
      const globalReputation = globalReputationByAuthUserId.get(authUserId);
      return {
        authUserId,
        connectedProvidersCount: (connectedProviderCounts.get(authUserId) ?? new Set<string>()).size,
        walletVerified: walletVerifiedAuthUserIds.has(authUserId),
        unreadSignals: unreadSignalsByAuthUserId.get(authUserId) ?? 0,
        projectXp: Number(projectReputation?.xp ?? 0),
        projectLevel: Number(projectReputation?.level ?? 1),
        projectTrust: Number(projectReputation?.trust_score ?? 50),
        projectContributionTier: projectReputation?.contribution_tier ?? "Explorer",
        streakDays: Number(projectReputation?.streak ?? globalReputation?.streak ?? 0),
        joinedProject: joinedProjectAuthUserIds.has(authUserId),
        claimableRewards: claimableRewardsByAuthUserId.get(authUserId) ?? 0,
        openMissionCount: Number(questCount ?? 0),
      } satisfies ProjectMemberRollup;
    }),
    journeysByAuthUserId,
    snapshotsByAuthUserId,
  };
}

async function ensureJourneyRow(input: {
  projectId: string;
  authUserId: string;
  journeyType: CommunityJourneyType;
  lastEventAt: string;
  currentStepKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseAdmin
    .from("community_member_journeys")
    .upsert(
      {
        project_id: input.projectId,
        auth_user_id: input.authUserId,
        journey_type: input.journeyType,
        status: "active",
        current_step_key: input.currentStepKey ?? null,
        last_step_key: input.currentStepKey ?? null,
        started_at: input.lastEventAt,
        completed_at: null,
        last_event_at: input.lastEventAt,
        updated_at: input.lastEventAt,
        metadata: input.metadata ?? {},
      },
      {
        onConflict: "project_id,auth_user_id,journey_type",
      }
    )
    .select("id, auth_user_id, journey_type, status, current_step_key, last_step_key, started_at, completed_at, last_event_at, metadata")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to upsert community journey.");
  }

  return data as JourneyRow;
}

async function pauseOtherJourneys(projectId: string, authUserId: string, activeJourneyType: CommunityJourneyType) {
  const { error } = await supabaseAdmin
    .from("community_member_journeys")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("auth_user_id", authUserId)
    .neq("journey_type", activeJourneyType)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message || "Failed to pause stale community journeys.");
  }
}

async function refreshSingleMemberJourney(input: {
  project: { id: string; name: string; chain: string | null };
  rollup: ProjectMemberRollup;
  existingJourneys: JourneyRow[];
  existingSnapshot: SnapshotRow | null;
}) {
  const nowIso = new Date().toISOString();
  const lane = determineJourneyLane(input.rollup);
  const relevantJourney =
    input.existingJourneys.find((journey) => journey.journey_type === lane) ?? null;
  const prompt = buildCommunityJourneyPrompt({
    project: input.project,
    rollup: input.rollup,
    lane,
  });
  const journey = await ensureJourneyRow({
    projectId: input.project.id,
    authUserId: input.rollup.authUserId,
    journeyType: lane,
    lastEventAt: relevantJourney?.last_event_at ?? nowIso,
    currentStepKey: relevantJourney?.current_step_key ?? null,
    metadata: {
      ...normalizeMetadata(relevantJourney?.metadata),
      urls: prompt.urls,
      recognitionLabel: prompt.recognitionLabel,
    },
  });
  await pauseOtherJourneys(input.project.id, input.rollup.authUserId, lane);

  const preservedCounts =
    input.existingSnapshot?.journey_type === lane
      ? {
          completedStepsCount: Number(input.existingSnapshot.completed_steps_count ?? 0),
          nudgesSentCount: Number(input.existingSnapshot.nudges_sent_count ?? 0),
          milestonesUnlockedCount: Number(input.existingSnapshot.milestones_unlocked_count ?? 0),
          nextNudgeAt: input.existingSnapshot.next_nudge_at,
          lastEventType: input.existingSnapshot.last_event_type,
          lastEventAt: input.existingSnapshot.last_event_at,
        }
      : {
          completedStepsCount: 0,
          nudgesSentCount: 0,
          milestonesUnlockedCount: 0,
          nextNudgeAt: null,
          lastEventType: null,
          lastEventAt: null,
        };
  const milestonesUnlockedCount =
    lane === "active"
      ? Math.max(
          preservedCounts.milestonesUnlockedCount,
          input.rollup.claimableRewards > 0 ? 2 : 1
        )
      : preservedCounts.milestonesUnlockedCount;

  const { error: snapshotError } = await supabaseAdmin
    .from("community_member_status_snapshots")
    .upsert(
      {
        project_id: input.project.id,
        auth_user_id: input.rollup.authUserId,
        member_journey_id: journey.id,
        journey_type: lane,
        status: "active",
        current_step_key: journey.current_step_key ?? null,
        last_event_type: preservedCounts.lastEventType ?? "refresh",
        last_event_at: preservedCounts.lastEventAt ?? journey.last_event_at ?? nowIso,
        completed_steps_count: preservedCounts.completedStepsCount,
        nudges_sent_count: preservedCounts.nudgesSentCount,
        milestones_unlocked_count: milestonesUnlockedCount,
        streak_days: input.rollup.streakDays,
        next_nudge_at: preservedCounts.nextNudgeAt,
        updated_at: nowIso,
        metadata: {
          recognitionLabel: prompt.recognitionLabel,
          contributionStatus: prompt.contributionStatus,
          nextUnlockLabel: prompt.nextUnlockLabel,
          headline: prompt.headline,
          supportingCopy: prompt.supportingCopy,
          urls: prompt.urls,
          linkedProvidersCount: input.rollup.connectedProvidersCount,
          claimableRewards: input.rollup.claimableRewards,
          unreadSignals: input.rollup.unreadSignals,
          walletVerified: input.rollup.walletVerified,
        },
      },
      {
        onConflict: "project_id,auth_user_id",
      }
    );

  if (snapshotError) {
    throw new Error(snapshotError.message || "Failed to refresh member status snapshot.");
  }

  return prompt;
}

export async function refreshProjectCommunityJourneys(params: {
  projectId: string;
  authUserId?: string | null;
  limit?: number;
}) {
  const bundle = await loadProjectJourneyRollups(params);
  const prompts: CommunityJourneyPrompt[] = [];
  let onboardingCount = 0;
  let comebackCount = 0;
  let activeCount = 0;

  for (const rollup of bundle.rollups) {
    const prompt = await refreshSingleMemberJourney({
      project: bundle.project,
      rollup,
      existingJourneys: bundle.journeysByAuthUserId.get(rollup.authUserId) ?? [],
      existingSnapshot: bundle.snapshotsByAuthUserId.get(rollup.authUserId) ?? null,
    });
    prompts.push(prompt);

    if (prompt.lane === "onboarding") {
      onboardingCount += 1;
    } else if (prompt.lane === "comeback") {
      comebackCount += 1;
    } else {
      activeCount += 1;
    }
  }

  return {
    ok: true,
    projectId: params.projectId,
    refreshedCount: prompts.length,
    onboardingCount,
    comebackCount,
    activeCount,
    prompts,
  };
}

export async function loadCommunityJourneyPrompt(params: {
  projectId: string;
  authUserId: string;
}) {
  const bundle = await loadProjectJourneyRollups({
    projectId: params.projectId,
    authUserId: params.authUserId,
    limit: 1,
  });
  const rollup = bundle.rollups.find((candidate) => candidate.authUserId === params.authUserId);
  if (!rollup) {
    return null;
  }

  const lane = determineJourneyLane(rollup);
  return buildCommunityJourneyPrompt({
    project: bundle.project,
    rollup,
    lane,
  });
}

export async function recordCommunityJourneyNudge(params: {
  projectId: string;
  authUserId: string;
  lane?: CommunityJourneyType;
  automationType?: string | null;
  cooldownHours?: number;
  metadata?: Record<string, unknown>;
}) {
  const refreshed = await refreshProjectCommunityJourneys({
    projectId: params.projectId,
    authUserId: params.authUserId,
    limit: 1,
  });
  const prompt = refreshed.prompts.find((candidate) => candidate.projectId === params.projectId) ?? null;
  if (!prompt) {
    return {
      ok: false,
      sent: false,
      reason: "No member journey prompt could be resolved.",
    };
  }

  const targetLane = params.lane ?? prompt.lane;
  const { data: journey, error: journeyError } = await supabaseAdmin
    .from("community_member_journeys")
    .select("id, auth_user_id, journey_type, status, current_step_key, last_step_key, started_at, completed_at, last_event_at, metadata")
    .eq("project_id", params.projectId)
    .eq("auth_user_id", params.authUserId)
    .eq("journey_type", targetLane)
    .maybeSingle();

  if (journeyError) {
    throw new Error(journeyError.message || "Failed to load journey before nudge.");
  }

  if (!journey) {
    return {
      ok: false,
      sent: false,
      reason: "Journey is not active for this member.",
    };
  }

  const { data: snapshot, error: snapshotError } = await supabaseAdmin
    .from("community_member_status_snapshots")
    .select("id, auth_user_id, member_journey_id, journey_type, status, current_step_key, last_event_type, last_event_at, completed_steps_count, nudges_sent_count, milestones_unlocked_count, streak_days, next_nudge_at, metadata")
    .eq("project_id", params.projectId)
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (snapshotError) {
    throw new Error(snapshotError.message || "Failed to load journey snapshot before nudge.");
  }

  const nextAllowedAt = snapshot?.next_nudge_at ? Date.parse(snapshot.next_nudge_at) : 0;
  if (nextAllowedAt && nextAllowedAt > Date.now()) {
    return {
      ok: true,
      sent: false,
      reason: "Journey nudge is still cooling down.",
      prompt,
    };
  }

  const nowIso = new Date().toISOString();
  const cooldownHours = Math.max(2, Math.min(params.cooldownHours ?? 24, 168));
  const nextNudgeAtIso = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();
  const eventPayload = {
    lane: targetLane,
    automationType: params.automationType ?? null,
    route: targetLane === "onboarding" ? prompt.urls.onboardingUrl : targetLane === "comeback" ? prompt.urls.comebackUrl : prompt.urls.communityUrl,
    ...params.metadata,
  };

  const { error: eventError } = await supabaseAdmin
    .from("community_member_journey_events")
    .insert({
      project_id: params.projectId,
      auth_user_id: params.authUserId,
      member_journey_id: journey.id,
      event_type: "nudge_sent",
      step_key: null,
      milestone_key: null,
      event_payload: eventPayload,
      updated_at: nowIso,
    });

  if (eventError) {
    throw new Error(eventError.message || "Failed to record journey nudge.");
  }

  const { error: journeyUpdateError } = await supabaseAdmin
    .from("community_member_journeys")
    .update({
      last_event_at: nowIso,
      updated_at: nowIso,
      metadata: {
        ...normalizeMetadata(journey.metadata),
        lastNudgeAt: nowIso,
        lastNudgeLane: targetLane,
        lastAutomationType: params.automationType ?? null,
      },
    })
    .eq("id", journey.id)
    .eq("project_id", params.projectId);

  if (journeyUpdateError) {
    throw new Error(journeyUpdateError.message || "Failed to update journey after nudge.");
  }

  const { error: snapshotUpdateError } = await supabaseAdmin
    .from("community_member_status_snapshots")
    .update({
      last_event_type: "nudge_sent",
      last_event_at: nowIso,
      nudges_sent_count: Number(snapshot?.nudges_sent_count ?? 0) + 1,
      next_nudge_at: nextNudgeAtIso,
      updated_at: nowIso,
      metadata: {
        ...normalizeMetadata(snapshot?.metadata),
        lastNudgeAt: nowIso,
        lastNudgeLane: targetLane,
      },
    })
    .eq("project_id", params.projectId)
    .eq("auth_user_id", params.authUserId);

  if (snapshotUpdateError) {
    throw new Error(snapshotUpdateError.message || "Failed to update member snapshot after nudge.");
  }

  return {
    ok: true,
    sent: true,
    prompt,
    deepLink:
      targetLane === "onboarding"
        ? prompt.urls.onboardingUrl
        : targetLane === "comeback"
          ? prompt.urls.comebackUrl
          : prompt.urls.communityUrl,
  };
}
