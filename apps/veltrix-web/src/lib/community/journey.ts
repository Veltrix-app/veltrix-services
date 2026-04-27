import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { LiveCommunityJourneyAction, LiveCommunityJourneySnapshot } from "@/types/live";
import {
  buildJourneyMissionLane,
  buildJourneyPreferredRoute,
  buildJourneyReadinessLabel,
  buildJourneyRecognition,
} from "@/lib/community/journey-read-model";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ServiceSupabase = ReturnType<typeof getServiceSupabaseClient>;

type ConnectedAccountRow = {
  provider: "discord" | "telegram" | "x";
  status: string;
};

type ProjectReputationRow = {
  project_id: string;
  xp: number | null;
  level: number | null;
  streak: number | null;
  trust_score: number | null;
  contribution_tier: string | null;
  rank: number | null;
};

type UserProgressRow = {
  joined_communities: string[] | null;
  quest_statuses: Record<string, string> | null;
};

type JourneyRow = {
  id: string;
  project_id: string;
  auth_user_id: string;
  journey_type: "onboarding" | "active" | "comeback";
  status: "active" | "paused" | "completed" | "archived";
  current_step_key: string | null;
  last_step_key: string | null;
  started_at: string;
  completed_at: string | null;
  last_event_at: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

type StatusSnapshotRow = {
  id: string;
  project_id: string;
  auth_user_id: string;
  member_journey_id: string;
  journey_type: "onboarding" | "active" | "comeback";
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
  updated_at: string;
};

type QuestRow = {
  id: string;
  title: string;
  verification_provider: string | null;
  completion_mode: string | null;
  xp: number | null;
};

type RaidRow = {
  id: string;
  title: string;
};

type RewardDistributionRow = {
  id: string;
  campaign_id: string;
  reward_asset: string | null;
  reward_amount: number | null;
  status: string;
};

type CampaignRow = {
  id: string;
  project_id: string;
};

type ProjectRow = {
  id: string;
  name: string;
  chain: string | null;
};

type GlobalReputationRow = {
  level: number | null;
  streak: number | null;
  contribution_tier: string | null;
  trust_score: number | null;
};

type ProfileRow = {
  username: string | null;
  title: string | null;
};

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function getSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for community journeys.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function resolveCommunityJourneyRequest(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new Error("Missing bearer token.");
  }

  const supabase = getSupabaseClient(accessToken);
  const serviceSupabase = getServiceSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new Error("Invalid session.");
  }

  return { user, serviceSupabase };
}

function normalizeMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function selectPrimaryProjectId(input: {
  explicitProjectId?: string | null;
  snapshots: StatusSnapshotRow[];
  journeys: JourneyRow[];
  projectReputation: ProjectReputationRow[];
  joinedProjects: string[];
}) {
  const explicit = (input.explicitProjectId ?? "").trim();
  if (explicit) {
    return explicit;
  }

  const activeSnapshot = [...input.snapshots].sort((left, right) => {
    const leftStamp = Date.parse(left.updated_at || left.last_event_at || "") || 0;
    const rightStamp = Date.parse(right.updated_at || right.last_event_at || "") || 0;
    return rightStamp - leftStamp;
  })[0];
  if (activeSnapshot?.project_id) {
    return activeSnapshot.project_id;
  }

  const activeJourney = [...input.journeys].sort((left, right) => {
    const leftStamp = Date.parse(left.updated_at || left.last_event_at || "") || 0;
    const rightStamp = Date.parse(right.updated_at || right.last_event_at || "") || 0;
    return rightStamp - leftStamp;
  })[0];
  if (activeJourney?.project_id) {
    return activeJourney.project_id;
  }

  if (input.projectReputation[0]?.project_id) {
    return input.projectReputation[0].project_id;
  }

  return input.joinedProjects[0] ?? "";
}

function inferJourneyLane(input: {
  snapshot: StatusSnapshotRow | null;
  journey: JourneyRow | null;
  connectedProviderCount: number;
  walletVerified: boolean;
  joinedProject: boolean;
  unreadSignals: number;
  openQuestCount: number;
}) {
  const snapshotType = input.snapshot?.journey_type;
  const journeyType = input.journey?.journey_type;
  if (snapshotType === "comeback" || journeyType === "comeback") {
    return "comeback" as const;
  }
  if (
    snapshotType === "onboarding" ||
    journeyType === "onboarding" ||
    input.connectedProviderCount < 2 ||
    !input.walletVerified ||
    !input.joinedProject
  ) {
    return "onboarding" as const;
  }
  if (input.unreadSignals > 0 || input.openQuestCount > 0) {
    return "active" as const;
  }
  return "active" as const;
}

function buildJourneyActions(input: {
  projectId: string;
  projectName: string;
  lane: "onboarding" | "active" | "comeback";
  connectedProviders: Set<string>;
  walletVerified: boolean;
  joinedProject: boolean;
  unreadSignals: number;
  openQuests: QuestRow[];
  liveRaids: RaidRow[];
  claimableDistributions: RewardDistributionRow[];
  completedStepKeys: Set<string>;
}): LiveCommunityJourneyAction[] {
  const actions: LiveCommunityJourneyAction[] = [];
  const firstQuest = input.openQuests[0] ?? null;
  const firstRaid = input.liveRaids[0] ?? null;
  const firstDistribution = input.claimableDistributions[0] ?? null;

  if (input.lane === "onboarding") {
    actions.push(
      {
        key: "providers_ready",
        label: "Link your provider rail",
        description: "Arm Discord, Telegram or X so provider-gated missions can resolve against your live identity loadout.",
        route: "/profile",
        ctaLabel: "Open loadout",
        tone: input.connectedProviders.size >= 2 ? "positive" : "warning",
        completed: input.connectedProviders.size >= 2 || input.completedStepKeys.has("providers_ready"),
        locked: false,
      },
      {
        key: "wallet_verified",
        label: "Verify your wallet",
        description: "Wallet verification unlocks the deeper trust and campaign rails tied to this community.",
        route: "/profile",
        ctaLabel: "Verify wallet",
        tone: input.walletVerified ? "positive" : "warning",
        completed: input.walletVerified || input.completedStepKeys.has("wallet_verified"),
        locked: false,
      },
      {
        key: "community_joined",
        label: `Join ${input.projectName}`,
        description: "Step into the project world so the Community Home can prioritize the right mission lane for you.",
        route: `/communities/${input.projectId}`,
        ctaLabel: "Open community",
        tone: input.joinedProject ? "positive" : "default",
        completed: input.joinedProject || input.completedStepKeys.has("community_joined"),
        locked: false,
      },
      {
        key: "first_mission",
        label: "Complete your first mission",
        description: firstQuest
          ? `Your first live unlock is ready through ${firstQuest.title}.`
          : "A first mission completion is the fastest way to move from onboarding into the active rail.",
        route: firstQuest ? `/quests/${firstQuest.id}` : "/quests",
        ctaLabel: firstQuest ? "Open first mission" : "Open missions",
        tone: firstQuest ? "default" : "warning",
        completed: input.completedStepKeys.has("first_mission"),
        locked: !input.joinedProject,
      }
    );
  } else if (input.lane === "comeback") {
    actions.push(
      {
        key: "comeback_signal",
        label: "Catch up on live signals",
        description: "Read the newest raid, reward and mission signals before you jump back into pressure.",
        route: "/notifications",
        ctaLabel: "Open signal feed",
        tone: input.unreadSignals > 0 ? "warning" : "default",
        completed: input.completedStepKeys.has("comeback_signal"),
        locked: false,
      },
      {
        key: "mission_return",
        label: "Re-enter through a live mission",
        description: firstQuest
          ? `${firstQuest.title} is the fastest route back into an active contribution lane.`
          : "A single live mission completion reactivates your current community rail.",
        route: firstQuest ? `/quests/${firstQuest.id}` : "/quests",
        ctaLabel: firstQuest ? "Open comeback mission" : "Open missions",
        tone: firstQuest ? "default" : "warning",
        completed: input.completedStepKeys.has("mission_return"),
        locked: false,
      },
      {
        key: "raid_return",
        label: "Answer a live raid",
        description: firstRaid
          ? `${firstRaid.title} is live now if you want a faster return into visible pressure.`
          : "If a raid is live, it is a strong fast-track back into community relevance.",
        route: firstRaid ? `/raids/${firstRaid.id}` : "/raids",
        ctaLabel: firstRaid ? "Open raid" : "Check raids",
        tone: firstRaid ? "positive" : "default",
        completed: input.completedStepKeys.has("raid_return"),
        locked: false,
      }
    );
  } else {
    actions.push(
      {
        key: "keep_streak_alive",
        label: "Keep your community streak alive",
        description: firstQuest
          ? `${firstQuest.title} keeps your active lane moving and protects your current recognition state.`
          : "Stay in motion so your community standing does not cool down.",
        route: firstQuest ? `/quests/${firstQuest.id}` : "/quests",
        ctaLabel: firstQuest ? "Open next mission" : "Open missions",
        tone: "default",
        completed: input.completedStepKeys.has("keep_streak_alive"),
        locked: false,
      },
      {
        key: "claim_unlock",
        label: "Claim your community unlock",
        description: firstDistribution
          ? `${firstDistribution.reward_asset ?? "Reward"} is already claimable from the current campaign pool.`
          : "Check if any new reward or campaign pool unlock is ready to claim.",
        route: "/rewards",
        ctaLabel: "Open rewards",
        tone: firstDistribution ? "positive" : "default",
        completed: input.completedStepKeys.has("claim_unlock"),
        locked: false,
      }
    );
  }

  return actions;
}

async function loadJourneyBaseData(input: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  projectId?: string | null;
}) {
  const [
    snapshotsResult,
    journeysResult,
    projectReputationResult,
    userProgressResult,
    connectedAccountsResult,
    walletLinkResult,
    globalReputationResult,
    profileResult,
    unreadSignalsResult,
  ] = await Promise.all([
    input.serviceSupabase
      .from("community_member_status_snapshots")
      .select("*")
      .eq("auth_user_id", input.authUserId)
      .order("updated_at", { ascending: false }),
    input.serviceSupabase
      .from("community_member_journeys")
      .select("*")
      .eq("auth_user_id", input.authUserId)
      .order("updated_at", { ascending: false }),
    input.serviceSupabase
      .from("user_project_reputation")
      .select("project_id, xp, level, streak, trust_score, contribution_tier, rank")
      .eq("auth_user_id", input.authUserId)
      .order("xp", { ascending: false }),
    input.serviceSupabase
      .from("user_progress")
      .select("joined_communities, quest_statuses")
      .eq("auth_user_id", input.authUserId)
      .maybeSingle(),
    input.serviceSupabase
      .from("user_connected_accounts")
      .select("provider, status")
      .eq("auth_user_id", input.authUserId)
      .eq("status", "connected"),
    input.serviceSupabase
      .from("wallet_links")
      .select("wallet_address")
      .eq("auth_user_id", input.authUserId)
      .eq("verified", true)
      .limit(1)
      .maybeSingle(),
    input.serviceSupabase
      .from("user_global_reputation")
      .select("level, streak, contribution_tier, trust_score")
      .eq("auth_user_id", input.authUserId)
      .maybeSingle(),
    input.serviceSupabase
      .from("user_profiles")
      .select("username, title")
      .eq("auth_user_id", input.authUserId)
      .maybeSingle(),
    input.serviceSupabase
      .from("app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", input.authUserId)
      .eq("read", false),
  ]);

  const snapshots = (snapshotsResult.data ?? []) as StatusSnapshotRow[];
  const journeys = (journeysResult.data ?? []) as JourneyRow[];
  const projectReputation = (projectReputationResult.data ?? []) as ProjectReputationRow[];
  const joinedProjects = Array.isArray((userProgressResult.data as UserProgressRow | null)?.joined_communities)
    ? (((userProgressResult.data as UserProgressRow | null)?.joined_communities ?? []) as string[])
    : [];
  const connectedProviders = new Set(
    ((connectedAccountsResult.data ?? []) as ConnectedAccountRow[]).map((row) => row.provider)
  );
  const primaryProjectId = selectPrimaryProjectId({
    explicitProjectId: input.projectId,
    snapshots,
    journeys,
    projectReputation,
    joinedProjects,
  });

  return {
    primaryProjectId,
    snapshots,
    journeys,
    projectReputation,
    joinedProjects,
    connectedProviders,
    walletVerified: Boolean(walletLinkResult.data?.wallet_address),
    globalReputation: (globalReputationResult.data as GlobalReputationRow | null) ?? null,
    profile: (profileResult.data as ProfileRow | null) ?? null,
    unreadSignals: Number(unreadSignalsResult.count ?? 0),
  };
}

export async function buildCommunityJourneySnapshot(input: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  projectId?: string | null;
}): Promise<LiveCommunityJourneySnapshot> {
  const base = await loadJourneyBaseData(input);

  if (!base.primaryProjectId) {
    return {
      projectId: "",
      projectName: "No community selected",
      projectChain: null,
      lane: "onboarding",
      status: "active",
      currentStepKey: "",
      lastEventType: "",
      lastEventAt: "",
      completedStepsCount: 0,
      nudgesSentCount: 0,
      milestonesUnlockedCount: 0,
      streakDays: base.globalReputation?.streak ?? 0,
      linkedProvidersCount: base.connectedProviders.size,
      walletVerified: base.walletVerified,
      joinedProjectsCount: base.joinedProjects.length,
      unreadSignals: base.unreadSignals,
      openMissionCount: 0,
      claimableRewards: 0,
      level: base.globalReputation?.level ?? 1,
      trustScore: base.globalReputation?.trust_score ?? 50,
      preferredRoute: "/projects",
      readinessLabel: "Community rail standing by",
      recognitionLabel: base.profile?.title ?? "Explorer",
      recognition: {
        label: base.profile?.title ?? "Explorer",
        posture: "arming",
        streakLabel:
          (base.globalReputation?.streak ?? 0) > 0
            ? `${base.globalReputation?.streak ?? 0}-day streak`
            : "Streak not armed",
        milestoneLabel: "First milestone still ahead",
        contributionLabel: "Pick a community to start your rail.",
        nextUnlockLabel: "Join your first project world to unlock a live community journey.",
        trustLabel:
          (base.globalReputation?.trust_score ?? 50) >= 60
            ? "Trusted and climbing"
            : "Trust still building",
      },
      contributionStatus: "Pick a community to start your rail.",
      nextUnlockLabel: "Join your first project world to unlock a live community journey.",
      headline: "Pick a community rail",
      supportingCopy: "As soon as you join a project world, VYNTRO can shape your onboarding, comeback and live contribution lane.",
      nextBestAction: {
        key: "open_worlds",
        label: "Browse live communities",
        description: "Pick a project world so the Community Home can personalize your next best action.",
        route: "/projects",
        ctaLabel: "Open worlds",
        tone: "default",
        completed: false,
        locked: false,
      },
      actions: [
        {
          key: "open_worlds",
          label: "Browse live communities",
          description: "Pick a project world so the Community Home can personalize your next best action.",
          route: "/projects",
          ctaLabel: "Open worlds",
          tone: "default",
          completed: false,
          locked: false,
        },
      ],
      missionLane: [],
    };
  }

  const projectId = base.primaryProjectId;
  const [
    projectResult,
    questResult,
    raidResult,
    campaignResult,
    journeyEventsResult,
  ] = await Promise.all([
    input.serviceSupabase
      .from("projects")
      .select("id, name, chain")
      .eq("id", projectId)
      .maybeSingle(),
    input.serviceSupabase
      .from("quests")
      .select("id, title, verification_provider, completion_mode, xp")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(12),
    input.serviceSupabase
      .from("raids")
      .select("id, title")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6),
    input.serviceSupabase
      .from("campaigns")
      .select("id, project_id")
      .eq("project_id", projectId)
      .eq("status", "active"),
    input.serviceSupabase
      .from("community_member_journey_events")
      .select("step_key, milestone_key, event_type")
      .eq("project_id", projectId)
      .eq("auth_user_id", input.authUserId)
      .eq("event_type", "step_completed")
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const campaigns = (campaignResult.data ?? []) as CampaignRow[];
  const campaignIds = campaigns.map((campaign) => campaign.id);
  const rewardDistributionRows =
    campaignIds.length > 0
      ? ((await input.serviceSupabase
          .from("reward_distributions")
          .select("id, campaign_id, reward_asset, reward_amount, status")
          .eq("auth_user_id", input.authUserId)
          .in("campaign_id", campaignIds)
          .eq("status", "claimable")
          .order("updated_at", { ascending: false }))?.data ?? []) as RewardDistributionRow[]
      : [];

  const project = (projectResult.data as ProjectRow | null) ?? null;
  const openQuests = (questResult.data ?? []) as QuestRow[];
  const liveRaids = (raidResult.data ?? []) as RaidRow[];
  const completedStepKeys = new Set(
    (((journeyEventsResult.data ?? []) as Array<{ step_key: string | null }>)
      .map((row) => row.step_key)
      .filter((value): value is string => Boolean(value)))
  );
  const projectReputation =
    base.projectReputation.find((item) => item.project_id === projectId) ?? null;
  const snapshot =
    base.snapshots.find((item) => item.project_id === projectId) ?? null;
  const journey =
    base.journeys.find((item) => item.project_id === projectId) ?? null;
  const joinedProject = base.joinedProjects.includes(projectId);
  const lane = inferJourneyLane({
    snapshot,
    journey,
    connectedProviderCount: base.connectedProviders.size,
    walletVerified: base.walletVerified,
    joinedProject,
    unreadSignals: base.unreadSignals,
    openQuestCount: openQuests.length,
  });

  const actions = buildJourneyActions({
    projectId,
    projectName: project?.name ?? "Community",
    lane,
    connectedProviders: base.connectedProviders,
    walletVerified: base.walletVerified,
    joinedProject,
    unreadSignals: base.unreadSignals,
    openQuests,
    liveRaids,
    claimableDistributions: rewardDistributionRows,
    completedStepKeys,
  });
  const nextBestAction = actions.find((action) => !action.completed && !action.locked) ?? actions[0] ?? null;
  const level = projectReputation?.level ?? base.globalReputation?.level ?? 1;
  const trustScore = projectReputation?.trust_score ?? base.globalReputation?.trust_score ?? 50;

  const recognitionLabel =
    projectReputation?.contribution_tier ??
    base.globalReputation?.contribution_tier ??
    base.profile?.title ??
    "Explorer";
  const contributionStatus =
    lane === "onboarding"
      ? "Your loadout is still arming for this community."
      : lane === "comeback"
        ? "This rail is trying to pull you back into visible pressure."
        : "You are live inside the current community lane.";
  const nextUnlockLabel =
    lane === "onboarding"
      ? !base.walletVerified
        ? "Verify your wallet to unlock deeper trust and campaign rails."
        : base.connectedProviders.size < 2
          ? `Link ${2 - base.connectedProviders.size} more provider${2 - base.connectedProviders.size === 1 ? "" : "s"} for full readiness.`
          : "Complete your first mission to graduate into the active lane."
      : lane === "comeback"
        ? "Complete one live mission or raid to fully reactivate your standing."
        : rewardDistributionRows.length > 0
        ? "A claimable unlock is waiting in your reward vault."
          : "Keep your streak alive to protect your current recognition.";
  const headline =
    lane === "onboarding"
      ? `Finish your ${project?.name ?? "community"} loadout`
      : lane === "comeback"
        ? `Welcome back to ${project?.name ?? "the live rail"}`
        : `${project?.name ?? "Community"} lane is live`;
  const supportingCopy =
    lane === "onboarding"
      ? "VYNTRO will keep shaping your next actions until your identity, wallet and first mission are all armed."
      : lane === "comeback"
        ? "The comeback rail is designed to get you back into visible pressure fast, without dumping you into the full mission backlog."
      : "Your Community Home is now focused on momentum, recognition and the next unlock that keeps this project hot.";
  const readinessLabel = buildJourneyReadinessLabel({
    lane,
    walletVerified: base.walletVerified,
    linkedProvidersCount: base.connectedProviders.size,
    joinedProjectsCount: base.joinedProjects.length,
    unreadSignals: base.unreadSignals,
    openMissionCount: openQuests.length,
    claimableRewards: rewardDistributionRows.length,
  });
  const missionLane = buildJourneyMissionLane({
    lane,
    actions,
    projectName: project?.name ?? "Community",
    unreadSignals: base.unreadSignals,
    openMissionCount: openQuests.length,
    claimableRewards: rewardDistributionRows.length,
    walletVerified: base.walletVerified,
    linkedProvidersCount: base.connectedProviders.size,
    joinedProjectsCount: base.joinedProjects.length,
  });
  const recognition = buildJourneyRecognition({
    lane,
    recognitionLabel,
    streakDays:
      snapshot?.streak_days ?? projectReputation?.streak ?? base.globalReputation?.streak ?? 0,
    milestonesUnlockedCount: snapshot?.milestones_unlocked_count ?? 0,
    nextUnlockLabel,
    contributionStatus,
    trustScore,
  });
  const preferredRoute = buildJourneyPreferredRoute({
    lane,
    nextBestAction,
  });

  return {
    projectId,
    projectName: project?.name ?? "Community",
    projectChain: project?.chain ?? null,
    lane,
    status: snapshot?.status ?? journey?.status ?? "active",
    currentStepKey: snapshot?.current_step_key ?? journey?.current_step_key ?? "",
    lastEventType: snapshot?.last_event_type ?? "",
    lastEventAt: snapshot?.last_event_at ?? journey?.last_event_at ?? "",
    completedStepsCount: snapshot?.completed_steps_count ?? completedStepKeys.size,
    nudgesSentCount: snapshot?.nudges_sent_count ?? 0,
    milestonesUnlockedCount: snapshot?.milestones_unlocked_count ?? 0,
    streakDays: snapshot?.streak_days ?? projectReputation?.streak ?? base.globalReputation?.streak ?? 0,
    linkedProvidersCount: base.connectedProviders.size,
    walletVerified: base.walletVerified,
    joinedProjectsCount: base.joinedProjects.length,
    unreadSignals: base.unreadSignals,
    openMissionCount: openQuests.length,
    claimableRewards: rewardDistributionRows.length,
    level,
    trustScore,
    preferredRoute,
    readinessLabel,
    recognitionLabel,
    recognition,
    contributionStatus,
    nextUnlockLabel,
    headline,
    supportingCopy,
    nextBestAction,
    actions,
    missionLane,
  };
}

export async function advanceCommunityJourney(input: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  projectId?: string | null;
  actionKey: string;
  lane?: "onboarding" | "active" | "comeback";
}) {
  const snapshot = await buildCommunityJourneySnapshot({
    serviceSupabase: input.serviceSupabase,
    authUserId: input.authUserId,
    projectId: input.projectId,
  });

  if (!snapshot.projectId) {
    return { ok: false, error: "No community project is active for this journey." };
  }

  const journeyType = input.lane ?? snapshot.lane;
  const nowIso = new Date().toISOString();
  const { data: existingJourney, error: journeyError } = await input.serviceSupabase
    .from("community_member_journeys")
    .select("*")
    .eq("project_id", snapshot.projectId)
    .eq("auth_user_id", input.authUserId)
    .eq("journey_type", journeyType)
    .maybeSingle();

  if (journeyError) {
    throw new Error(journeyError.message || "Could not load member journey.");
  }

  let journey = existingJourney as JourneyRow | null;
  if (!journey) {
    const { data: insertedJourney, error: insertJourneyError } = await input.serviceSupabase
      .from("community_member_journeys")
      .insert({
        project_id: snapshot.projectId,
        auth_user_id: input.authUserId,
        journey_type: journeyType,
        status: "active",
        current_step_key: input.actionKey,
        last_step_key: input.actionKey,
        started_at: nowIso,
        last_event_at: nowIso,
        metadata: {
          source: "webapp",
        },
      })
      .select("*")
      .single();

    if (insertJourneyError) {
      throw new Error(insertJourneyError.message || "Could not create member journey.");
    }

    journey = insertedJourney as JourneyRow;
  }

  const { data: duplicateEvent, error: duplicateEventError } = await input.serviceSupabase
    .from("community_member_journey_events")
    .select("id")
    .eq("project_id", snapshot.projectId)
    .eq("auth_user_id", input.authUserId)
    .eq("member_journey_id", journey.id)
    .eq("event_type", "step_completed")
    .eq("step_key", input.actionKey)
    .maybeSingle();

  if (duplicateEventError) {
    throw new Error(duplicateEventError.message || "Could not check journey step history.");
  }

  if (!duplicateEvent?.id) {
    const { error: insertEventError } = await input.serviceSupabase
      .from("community_member_journey_events")
      .insert({
        project_id: snapshot.projectId,
        auth_user_id: input.authUserId,
        member_journey_id: journey.id,
        event_type: "step_completed",
        step_key: input.actionKey,
        event_payload: {
          source: "webapp",
          lane: journeyType,
        },
      });

    if (insertEventError) {
      throw new Error(insertEventError.message || "Could not write journey event.");
    }
  }

  const refreshedSnapshot = await buildCommunityJourneySnapshot({
    serviceSupabase: input.serviceSupabase,
    authUserId: input.authUserId,
    projectId: snapshot.projectId,
  });
  const completedStepCount = refreshedSnapshot.completedStepsCount + (duplicateEvent?.id ? 0 : 1);
  const completedStepKeys = new Set(
    refreshedSnapshot.actions.filter((action) => action.completed).map((action) => action.key)
  );
  completedStepKeys.add(input.actionKey);

  const onboardingComplete =
    refreshedSnapshot.walletVerified &&
    refreshedSnapshot.linkedProvidersCount >= 2 &&
    (completedStepKeys.has("community_joined") || refreshedSnapshot.joinedProjectsCount > 0) &&
    completedStepKeys.has("first_mission");
  const comebackComplete =
    completedStepKeys.has("mission_return") ||
    completedStepKeys.has("raid_return") ||
    completedStepKeys.has("claim_unlock");
  const shouldComplete =
    (journeyType === "onboarding" && onboardingComplete) ||
    (journeyType === "comeback" && comebackComplete);

  const { error: updateJourneyError } = await input.serviceSupabase
    .from("community_member_journeys")
    .update({
      current_step_key: shouldComplete ? null : input.actionKey,
      last_step_key: input.actionKey,
      last_event_at: nowIso,
      status: shouldComplete ? "completed" : "active",
      completed_at: shouldComplete ? nowIso : null,
      updated_at: nowIso,
      metadata: {
        ...normalizeMetadata(journey.metadata),
        lastActionKey: input.actionKey,
        lastAdvancedFrom: "webapp",
      },
    })
    .eq("id", journey.id)
    .eq("project_id", snapshot.projectId)
    .eq("auth_user_id", input.authUserId);

  if (updateJourneyError) {
    throw new Error(updateJourneyError.message || "Could not update member journey.");
  }

  const { error: upsertSnapshotError } = await input.serviceSupabase
    .from("community_member_status_snapshots")
    .upsert(
      {
        project_id: snapshot.projectId,
        auth_user_id: input.authUserId,
        member_journey_id: journey.id,
        journey_type: journeyType,
        status: shouldComplete ? "completed" : "active",
        current_step_key: shouldComplete ? null : input.actionKey,
        last_event_type: "step_completed",
        last_event_at: nowIso,
        completed_steps_count: completedStepCount,
        nudges_sent_count: refreshedSnapshot.nudgesSentCount,
        milestones_unlocked_count:
          refreshedSnapshot.milestonesUnlockedCount + (shouldComplete ? 1 : 0),
        streak_days: refreshedSnapshot.streakDays,
        next_nudge_at: shouldComplete ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: nowIso,
        metadata: {
          lastActionKey: input.actionKey,
          nextUnlockLabel: refreshedSnapshot.nextUnlockLabel,
        },
      },
      { onConflict: "project_id,auth_user_id" }
    );

  if (upsertSnapshotError) {
    throw new Error(upsertSnapshotError.message || "Could not update member status snapshot.");
  }

  const finalSnapshot = await buildCommunityJourneySnapshot({
    serviceSupabase: input.serviceSupabase,
    authUserId: input.authUserId,
    projectId: snapshot.projectId,
  });

  return {
    ok: true,
    advanced: !duplicateEvent?.id,
    lane: journeyType,
    snapshot: finalSnapshot,
  };
}
