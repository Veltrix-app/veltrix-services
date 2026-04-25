import { postCommunityLeaderboards } from "../../jobs/post-community-leaderboards.js";
import { syncDiscordRanks } from "../../jobs/sync-discord-ranks.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { sendDiscordPush } from "../../providers/discord/push.js";
import { sendTelegramPush } from "../../providers/telegram/push.js";
import {
  computeNextCommunityAutomationRunAt,
  deriveCommunityAutomationExecutionPosture,
  type CommunityAutomationCadence,
  type CommunityAutomationExecutionPosture,
  type CommunityAutomationType,
  getCommunityAutomationSequence,
  type CommunityAutomationStatus,
  isCommunityAutomationDue,
} from "./model.js";
import { maybeRecordCaptainAutomationAction } from "./captains.js";
import {
  recordCommunityJourneyNudge,
  refreshProjectCommunityJourneys,
} from "./journeys.js";
import { refreshProjectCommunityCaptainQueue } from "./captain-queue.js";
import {
  buildCommunityJourneyDeepLinks,
  resolveCommunityAutomationDeepLink,
} from "./automation-links.js";

type CommunityProvider = "discord" | "telegram";
type ProviderScope = "discord" | "telegram" | "both";

type ProjectCommunityTarget = {
  integrationId: string;
  provider: CommunityProvider;
  targetChannelId?: string;
  targetThreadId?: string;
  targetChatId?: string;
};

type ProjectState = {
  project: {
    id: string;
    name: string;
    slug: string | null;
    banner_url: string | null;
    logo: string | null;
    brand_accent: string | null;
  };
  campaigns: Array<{
    id: string;
    title: string;
    short_description: string | null;
    banner_url: string | null;
    thumbnail_url: string | null;
    featured: boolean | null;
    xp_budget: number | null;
    status: string;
  }>;
  quests: Array<{
    id: string;
    title: string;
    short_description: string | null;
    xp: number | null;
    campaign_id: string | null;
  }>;
  rewards: Array<{
    id: string;
    title: string;
    description: string | null;
    cost: number | null;
    rarity: string | null;
    image_url: string | null;
    campaign_id: string | null;
  }>;
  raids: Array<{
    id: string;
    title: string;
    short_description: string | null;
    reward_xp: number | null;
    banner: string | null;
    campaign_id: string | null;
  }>;
};

type ContributorSegmentSummary = {
  total: number;
  commandReady: number;
  newcomers: number;
  reactivation: number;
  core: number;
  watchlist: number;
  starterNames: string[];
  comebackNames: string[];
};

type ActivationBoardCandidate = {
  campaignId: string;
  title: string;
  featured: boolean;
  questCount: number;
  raidCount: number;
  rewardCount: number;
  newcomerCandidates: number;
  reactivationCandidates: number;
  coreCandidates: number;
  readyContributors: number;
  recommendedLane: "newcomer" | "reactivation" | "core";
  recommendedCopy: string;
};

type CommunityAutomationRow = {
  id: string;
  project_id: string;
  automation_type: string;
  status: string;
  cadence: string;
  provider_scope: string;
  target_provider: string | null;
  config: Record<string, unknown> | null;
  last_run_at: string | null;
  next_run_at: string | null;
  last_result: "success" | "failed" | "skipped" | null;
};

type CommunityAutomationRunResult = {
  ok: true;
  automationId: string | null;
  automationType: CommunityAutomationType;
  status: "success" | "failed" | "skipped";
  triggerSource: "manual" | "schedule" | "playbook" | "captain";
  summary: string;
  deliveries?: number;
  metadata?: Record<string, unknown>;
};

const appUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(/\/+$/, "");
const AUTOMATION_SEQUENCE_RANK: Record<string, number> = {
  always_on: 0,
  launch: 1,
  raid: 2,
  comeback: 3,
  campaign_push: 4,
};

function normalizeProviderScope(value: unknown): ProviderScope {
  return value === "discord" || value === "telegram" ? value : "both";
}

function normalizeCadence(value: unknown): CommunityAutomationCadence {
  return value === "daily" || value === "weekly" ? value : "manual";
}

function normalizeStatus(value: unknown): CommunityAutomationStatus {
  return value === "active" ? "active" : "paused";
}

function getDefaultCommunityArtwork(kind: "campaign" | "quest" | "raid") {
  return `${appUrl}/community-push/defaults/${kind}.png`;
}

function getCommunityAutomationOwnerLabel(automationType: CommunityAutomationType) {
  if (automationType === "rank_sync") return "Keep community ranks aligned";
  if (automationType === "leaderboard_pulse") return "Push leaderboard momentum";
  if (automationType === "mission_digest") return "Broadcast the mission board";
  if (automationType === "raid_reminder") return "Re-ignite live raid pressure";
  if (automationType === "newcomer_pulse") return "Pull newcomers into the first journey";
  if (automationType === "reactivation_pulse") return "Bring dormant contributors back";
  return "Push campaign activation";
}

function getCommunityAutomationOwnerSummary(input: {
  automationType: CommunityAutomationType;
  status: CommunityAutomationStatus;
  cadence: CommunityAutomationCadence;
  executionPosture: CommunityAutomationExecutionPosture;
  nextRunAt: string | null;
  lastResultSummary: string;
}) {
  if (input.executionPosture === "running") {
    return "Execution is currently in flight and will settle back into the workflow once this run finishes.";
  }

  if (input.status !== "active") {
    return "This workflow is paused and will stay parked until the project owner reactivates it.";
  }

  if (input.executionPosture === "blocked") {
    return (
      input.lastResultSummary ||
      "The last attempt failed while this workflow was due. An owner or captain should resolve it before schedule takes another pass."
    );
  }

  if (input.executionPosture === "degraded") {
    return (
      input.lastResultSummary ||
      "The last attempt failed outside the current window. Keep the workflow visible and reactivate it deliberately."
    );
  }

  if (input.executionPosture === "ready") {
    if (input.cadence === "manual") {
      return "This workflow is ready for a manual run whenever the owner or captain wants to push it.";
    }

    return input.nextRunAt
      ? `This workflow is ready and its next scheduled window is ${new Date(input.nextRunAt).toLocaleString()}.`
      : "This workflow is ready for the next scheduled window.";
  }

  return input.nextRunAt
    ? `Watching until ${new Date(input.nextRunAt).toLocaleString()}.`
    : "Watching for the next trigger window.";
}

function buildAutomationPlanningPatch(input: {
  automationType: CommunityAutomationType;
  cadence: CommunityAutomationCadence;
  status: CommunityAutomationStatus;
  nextRunAt: string | null;
  lastResult?: "success" | "failed" | "skipped" | null;
  lastResultSummary?: string;
  running?: boolean;
}) {
  const nowIso = new Date().toISOString();
  const executionPosture = input.running
    ? "running"
    : deriveCommunityAutomationExecutionPosture({
        status: input.status,
        cadence: input.cadence,
        nextRunAt: input.nextRunAt,
        lastResult: input.lastResult ?? null,
        nowIso,
      });

  const patch: Record<string, unknown> = {
    sequencing_key: getCommunityAutomationSequence(input.automationType),
    execution_posture: executionPosture,
    owner_label: getCommunityAutomationOwnerLabel(input.automationType),
    owner_summary: getCommunityAutomationOwnerSummary({
      automationType: input.automationType,
      status: input.status,
      cadence: input.cadence,
      executionPosture,
      nextRunAt: input.nextRunAt,
      lastResultSummary: input.lastResultSummary ?? "",
    }),
    paused_reason: input.status === "paused" ? "Paused by project owner." : null,
    updated_at: nowIso,
  };

  if (input.lastResult === "success") {
    patch.last_success_at = nowIso;
    patch.last_error_code = null;
    patch.last_error_at = null;
  } else if (input.lastResult === "failed") {
    patch.last_error_code = `${input.automationType}_failed`;
    patch.last_error_at = nowIso;
  }

  return patch;
}

async function dispatchJourneyNudgesForLane(params: {
  projectId: string;
  lane: "onboarding" | "active" | "comeback";
  automationType: CommunityAutomationType;
  limit?: number;
}) {
  const refreshed = await refreshProjectCommunityJourneys({
    projectId: params.projectId,
    limit: Math.max((params.limit ?? 18) * 3, 36),
  });
  const candidates = refreshed.prompts
    .filter((candidate) => candidate.lane === params.lane)
    .slice(0, params.limit ?? 18);
  const deepLink = resolveCommunityAutomationDeepLink({
    projectId: params.projectId,
    automationType: params.automationType,
  });
  const cooldownHours =
    params.lane === "comeback" ? 48 : params.lane === "onboarding" ? 36 : 24;

  let sentCount = 0;
  let skippedCount = 0;

  for (const prompt of candidates) {
    const nudge = await recordCommunityJourneyNudge({
      projectId: params.projectId,
      authUserId: prompt.authUserId,
      lane: params.lane,
      automationType: params.automationType,
      cooldownHours,
      metadata: {
        targetUrl: deepLink,
        projectName: prompt.projectName,
        lane: params.lane,
      },
    });

    if (nudge.sent) {
      sentCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  return {
    candidateCount: refreshed.prompts.filter((candidate) => candidate.lane === params.lane).length,
    attemptedCount: candidates.length,
    sentCount,
    skippedCount,
    deepLink,
  };
}

async function loadProjectCommunityTargets(projectId: string, providerScope: ProviderScope) {
  const { data, error } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider, status, config")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"])
    .in("status", ["connected", "needs_attention"]);

  if (error) {
    throw new Error(error.message || "Failed to load project community targets.");
  }

  return ((data ?? []) as Array<{
    id: string;
    provider: CommunityProvider;
    config: Record<string, unknown> | null;
  }>)
    .filter((integration) => providerScope === "both" || integration.provider === providerScope)
    .map((integration): ProjectCommunityTarget | null => {
      const pushSettings =
        integration.config?.pushSettings && typeof integration.config.pushSettings === "object"
          ? (integration.config.pushSettings as Record<string, unknown>)
          : {};

      if (integration.provider === "discord") {
        const targetChannelId =
          typeof pushSettings.targetChannelId === "string"
            ? pushSettings.targetChannelId.trim()
            : "";
        const targetThreadId =
          typeof pushSettings.targetThreadId === "string"
            ? pushSettings.targetThreadId.trim()
            : "";

        return targetChannelId
          ? {
              integrationId: integration.id,
              provider: "discord",
              targetChannelId,
              targetThreadId,
            }
          : null;
      }

      const fallbackChatId =
        typeof integration.config?.chatId === "string" && integration.config.chatId.trim()
          ? integration.config.chatId.trim()
          : typeof integration.config?.groupId === "string"
            ? integration.config.groupId.trim()
            : "";
      const targetChatId =
        typeof pushSettings.targetChatId === "string" && pushSettings.targetChatId.trim()
          ? pushSettings.targetChatId.trim()
          : fallbackChatId;

      return targetChatId
        ? {
            integrationId: integration.id,
            provider: "telegram",
            targetChatId,
          }
        : null;
    })
    .filter((target): target is ProjectCommunityTarget => Boolean(target));
}

async function loadProjectCommunityState(projectId: string): Promise<ProjectState> {
  const [
    { data: project, error: projectError },
    { data: campaigns, error: campaignError },
    { data: quests, error: questError },
    { data: rewards, error: rewardError },
    { data: raids, error: raidError },
  ] = await Promise.all([
    supabaseAdmin
      .from("projects")
      .select("id, name, slug, banner_url, logo, brand_accent")
      .eq("id", projectId)
      .maybeSingle(),
    supabaseAdmin
      .from("campaigns")
      .select(
        "id, title, short_description, banner_url, thumbnail_url, featured, xp_budget, status"
      )
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("quests")
      .select("id, title, short_description, xp, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(10),
    supabaseAdmin
      .from("rewards")
      .select("id, title, description, cost, rarity, image_url, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .eq("visible", true)
      .limit(8),
    supabaseAdmin
      .from("raids")
      .select("id, title, short_description, reward_xp, banner, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (projectError) {
    throw new Error(projectError.message || "Failed to load project state.");
  }
  if (!project) {
    throw new Error("Project not found for Community OS execution.");
  }
  if (campaignError) {
    throw new Error(campaignError.message || "Failed to load campaigns.");
  }
  if (questError) {
    throw new Error(questError.message || "Failed to load quests.");
  }
  if (rewardError) {
    throw new Error(rewardError.message || "Failed to load rewards.");
  }
  if (raidError) {
    throw new Error(raidError.message || "Failed to load raids.");
  }

  return {
    project: project as ProjectState["project"],
    campaigns: (campaigns ?? []) as ProjectState["campaigns"],
    quests: (quests ?? []) as ProjectState["quests"],
    rewards: (rewards ?? []) as ProjectState["rewards"],
    raids: (raids ?? []) as ProjectState["raids"],
  };
}

async function dispatchProjectCommunityMessage(params: {
  projectId: string;
  providerScope: ProviderScope;
  title: string;
  body: string;
  eyebrow?: string;
  projectName: string;
  campaignTitle?: string | null;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null;
  accentColor?: string | null;
  meta?: Array<{ label: string; value: string }>;
  url?: string | null;
  buttonLabel?: string | null;
}) {
  const targets = await loadProjectCommunityTargets(params.projectId, params.providerScope);
  let deliveries = 0;

  for (const target of targets) {
    if (target.provider === "discord" && target.targetChannelId) {
      await sendDiscordPush({
        targetChannelId: target.targetChannelId,
        targetThreadId: target.targetThreadId,
        title: params.title,
        body: params.body,
        eyebrow: params.eyebrow,
        projectName: params.projectName,
        campaignTitle: params.campaignTitle ?? undefined,
        imageUrl: params.imageUrl ?? undefined,
        accentColor: params.accentColor ?? undefined,
        meta: params.meta,
        url: params.url ?? undefined,
        buttonLabel: params.buttonLabel ?? undefined,
      });
      deliveries += 1;
      continue;
    }

    if (target.provider === "telegram" && target.targetChatId) {
      await sendTelegramPush({
        targetChatId: target.targetChatId,
        title: params.title,
        body: params.body,
        eyebrow: params.eyebrow,
        projectName: params.projectName,
        campaignTitle: params.campaignTitle ?? undefined,
        imageUrl: params.imageUrl ?? undefined,
        fallbackImageUrl: params.fallbackImageUrl ?? undefined,
        meta: params.meta,
        url: params.url ?? undefined,
        buttonLabel: params.buttonLabel ?? undefined,
      });
      deliveries += 1;
    }
  }

  return deliveries;
}

async function updateCommunityMetadata(projectId: string, metadataPatch: Record<string, unknown>) {
  const { data: integrations, error: integrationError } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider, project_id")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load community metadata context.");
  }

  const normalizedIntegrations = (integrations ?? []) as Array<{
    id: string;
    provider: CommunityProvider;
    project_id: string;
  }>;
  const primaryIntegration =
    normalizedIntegrations.find((integration) => integration.provider === "discord") ??
    normalizedIntegrations[0] ??
    null;

  if (!primaryIntegration) {
    return null;
  }

  const { data: settingsRow, error: settingsError } = await supabaseAdmin
    .from("community_bot_settings")
    .select("integration_id, metadata")
    .eq("integration_id", primaryIntegration.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load community metadata row.");
  }

  const metadata =
    settingsRow?.metadata && typeof settingsRow.metadata === "object"
      ? (settingsRow.metadata as Record<string, unknown>)
      : {};

  const { error: upsertError } = await supabaseAdmin.from("community_bot_settings").upsert(
    {
      integration_id: primaryIntegration.id,
      provider: primaryIntegration.provider,
      project_id: primaryIntegration.project_id,
      metadata: {
        ...metadata,
        ...metadataPatch,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "integration_id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message || "Failed to update Community OS metadata.");
  }

  return primaryIntegration.id;
}

async function writeCommunityAuditLog(input: {
  projectId: string;
  sourceTable: string;
  sourceId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
    auth_user_id: null,
    project_id: input.projectId,
    source_table: input.sourceTable,
    source_id: input.sourceId,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to write Community OS audit log.");
  }
}

async function loadContributorSegmentSummary(projectId: string): Promise<ContributorSegmentSummary> {
  const [
    { data: reputationRows, error: reputationError },
    { data: reviewFlags, error: reviewFlagsError },
    { data: profileRows, error: profileError },
    { data: accounts, error: accountsError },
    { data: walletRows, error: walletError },
    { data: xpEvents, error: xpEventsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_project_reputation")
      .select("auth_user_id, xp, level, trust_score, quests_completed, raids_completed")
      .eq("project_id", projectId)
      .order("xp", { ascending: false })
      .limit(250),
    supabaseAdmin
      .from("review_flags")
      .select("auth_user_id, status")
      .eq("project_id", projectId)
      .eq("status", "open"),
    supabaseAdmin
      .from("user_profiles")
      .select("auth_user_id, username"),
    supabaseAdmin
      .from("user_connected_accounts")
      .select("auth_user_id, provider")
      .eq("status", "connected")
      .in("provider", ["discord", "telegram", "x"]),
    supabaseAdmin.from("wallet_links").select("auth_user_id"),
    supabaseAdmin
      .from("xp_events")
      .select("auth_user_id, created_at")
      .eq("project_id", projectId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  if (reputationError) throw new Error(reputationError.message);
  if (reviewFlagsError) throw new Error(reviewFlagsError.message);
  if (profileError) throw new Error(profileError.message);
  if (accountsError) throw new Error(accountsError.message);
  if (walletError) throw new Error(walletError.message);
  if (xpEventsError) throw new Error(xpEventsError.message);

  const usernames = new Map(
    ((profileRows ?? []) as Array<{ auth_user_id: string; username: string | null }>)
      .filter((row) => row.username?.trim())
      .map((row) => [row.auth_user_id, row.username?.trim() ?? ""])
  );

  const providersByAuthUserId = new Map<string, Set<string>>();
  for (const account of (accounts ?? []) as Array<{ auth_user_id: string; provider: string }>) {
    const current = providersByAuthUserId.get(account.auth_user_id) ?? new Set<string>();
    current.add(account.provider);
    providersByAuthUserId.set(account.auth_user_id, current);
  }

  const walletSet = new Set(
    ((walletRows ?? []) as Array<{ auth_user_id: string }>).map((row) => row.auth_user_id)
  );
  const openFlagsByAuthUserId = new Map<string, number>();
  for (const flag of (reviewFlags ?? []) as Array<{ auth_user_id: string | null }>) {
    if (!flag.auth_user_id) continue;
    openFlagsByAuthUserId.set(
      flag.auth_user_id,
      (openFlagsByAuthUserId.get(flag.auth_user_id) ?? 0) + 1
    );
  }

  const lastActiveByAuthUserId = new Map<string, string>();
  for (const event of (xpEvents ?? []) as Array<{ auth_user_id: string; created_at: string }>) {
    if (!lastActiveByAuthUserId.has(event.auth_user_id)) {
      lastActiveByAuthUserId.set(event.auth_user_id, event.created_at);
    }
  }

  let commandReady = 0;
  let newcomers = 0;
  let reactivation = 0;
  let core = 0;
  let watchlist = 0;
  const starterNames: string[] = [];
  const comebackNames: string[] = [];

  const rows = (reputationRows ?? []) as Array<{
    auth_user_id: string;
    xp: number | null;
    trust_score: number | null;
    quests_completed: number | null;
    raids_completed: number | null;
  }>;

  for (const row of rows) {
    const authUserId = row.auth_user_id;
    const providers = providersByAuthUserId.get(authUserId) ?? new Set<string>();
    const hasCommandReady = providers.has("discord") || providers.has("telegram");
    const walletVerified = walletSet.has(authUserId);
    const totalActions = Number(row.quests_completed ?? 0) + Number(row.raids_completed ?? 0);
    const trust = Number(row.trust_score ?? 50);
    const openFlags = openFlagsByAuthUserId.get(authUserId) ?? 0;
    const lastActiveAt = lastActiveByAuthUserId.get(authUserId);
    const daysInactive = lastActiveAt
      ? Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const fullStackReady = hasCommandReady && providers.has("x") && walletVerified;
        const displayName = usernames.get(authUserId) ?? `member-${authUserId.slice(0, 6)}`;

    if (hasCommandReady) {
      commandReady += 1;
    }

    if (openFlags > 0 || trust < 45) {
      watchlist += 1;
      continue;
    }

    if (Number(row.xp ?? 0) < 150 || totalActions <= 1) {
      newcomers += 1;
      if (starterNames.length < 3) {
        starterNames.push(displayName);
      }
      continue;
    }

    if (daysInactive !== null && daysInactive >= 14 && Number(row.xp ?? 0) >= 250) {
      reactivation += 1;
      if (comebackNames.length < 3) {
        comebackNames.push(displayName);
      }
      continue;
    }

    if (fullStackReady && trust >= 70 && totalActions >= 4) {
      core += 1;
    }
  }

  return {
    total: rows.length,
    commandReady,
    newcomers,
    reactivation,
    core,
    watchlist,
    starterNames,
    comebackNames,
  };
}

async function loadActivationBoardCandidate(projectId: string): Promise<ActivationBoardCandidate | null> {
  const state = await loadProjectCommunityState(projectId);
  if (state.campaigns.length === 0) {
    return null;
  }

  const segmentSummary = await loadContributorSegmentSummary(projectId);
  const featuredCampaign = state.campaigns[0];
  const questCount = state.quests.filter((quest) => quest.campaign_id === featuredCampaign.id).length;
  const raidCount = state.raids.filter((raid) => raid.campaign_id === featuredCampaign.id).length;
  const rewardCount = state.rewards.filter((reward) => reward.campaign_id === featuredCampaign.id).length;

  const recommendedLane =
    segmentSummary.reactivation > segmentSummary.newcomers &&
    segmentSummary.reactivation >= segmentSummary.core
      ? "reactivation"
      : segmentSummary.core > segmentSummary.newcomers
        ? "core"
        : "newcomer";

  return {
    campaignId: featuredCampaign.id,
    title: featuredCampaign.title,
    featured: featuredCampaign.featured === true,
    questCount,
    raidCount,
    rewardCount,
    newcomerCandidates: segmentSummary.newcomers,
    reactivationCandidates: segmentSummary.reactivation,
    coreCandidates: segmentSummary.core,
    readyContributors: segmentSummary.commandReady,
    recommendedLane,
    recommendedCopy:
      recommendedLane === "reactivation"
        ? "Re-ignite dormant contributors with a comeback wave around this campaign."
        : recommendedLane === "core"
          ? "Lean into your core journey and raise pressure with raids and leaderboard visibility."
          : "Use a newcomer starter push to move fresh contributors into this campaign.",
  };
}

async function createAutomationRun(params: {
  projectId: string;
  automationId: string | null;
  automationType: CommunityAutomationType;
  triggerSource: "manual" | "schedule" | "playbook" | "captain";
  triggeredByAuthUserId?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("community_automation_runs")
    .insert({
      project_id: params.projectId,
      automation_id: params.automationId,
      automation_type: params.automationType,
      status: "running",
      trigger_source: params.triggerSource,
      triggered_by_auth_user_id: params.triggeredByAuthUserId ?? null,
      summary: `Running ${params.automationType}.`,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create automation run.");
  }

  return data.id as string;
}

async function finishAutomationRun(params: {
  runId: string;
  status: "success" | "failed" | "skipped";
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin
    .from("community_automation_runs")
    .update({
      status: params.status,
      summary: params.summary,
      metadata: params.metadata ?? {},
      completed_at: new Date().toISOString(),
    })
    .eq("id", params.runId);

  if (error) {
    throw new Error(error.message || "Failed to finish automation run.");
  }
}

async function updateAutomationRow(
  automationId: string | null,
  input: {
    automationType: CommunityAutomationType;
    cadence: CommunityAutomationCadence;
    status: CommunityAutomationStatus;
    lastResult: "success" | "failed" | "skipped";
    lastResultSummary: string;
  }
) {
  if (!automationId) {
    return;
  }

  const nextRunAt =
    input.status === "active"
      ? computeNextCommunityAutomationRunAt({
          cadence: input.cadence,
          fromIso: new Date().toISOString(),
        })
      : null;

  const { error } = await supabaseAdmin
    .from("community_automations")
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRunAt,
      last_result: input.lastResult,
      last_result_summary: input.lastResultSummary,
      ...buildAutomationPlanningPatch({
        automationType: input.automationType,
        cadence: input.cadence,
        status: input.status,
        nextRunAt,
        lastResult: input.lastResult,
        lastResultSummary: input.lastResultSummary,
      }),
    })
    .eq("id", automationId);

  if (error) {
    throw new Error(error.message || "Failed to update automation row.");
  }
}

async function markAutomationRunning(input: {
  automationId: string | null;
  automationType: CommunityAutomationType;
  cadence: CommunityAutomationCadence;
  status: CommunityAutomationStatus;
  nextRunAt: string | null;
}) {
  if (!input.automationId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("community_automations")
    .update(
      buildAutomationPlanningPatch({
        automationType: input.automationType,
        cadence: input.cadence,
        status: input.status,
        nextRunAt: input.nextRunAt,
        lastResult: null,
        lastResultSummary: "",
        running: true,
      })
    )
    .eq("id", input.automationId);

  if (error) {
    throw new Error(error.message || "Failed to mark automation row as running.");
  }
}

async function loadAutomationRow(params: { projectId: string; automationId?: string; automationType?: CommunityAutomationType }) {
  const query = supabaseAdmin
    .from("community_automations")
    .select(
      "id, project_id, automation_type, status, cadence, provider_scope, target_provider, config, last_run_at, next_run_at, last_result"
    )
    .eq("project_id", params.projectId);

  if (params.automationId) {
    query.eq("id", params.automationId);
  } else if (params.automationType) {
    query.eq("automation_type", params.automationType);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load automation row.");
  }

  return (data ?? null) as CommunityAutomationRow | null;
}

async function runMissionDigest(projectId: string, providerScope: ProviderScope) {
  const state = await loadProjectCommunityState(projectId);
  const deepLink = resolveCommunityAutomationDeepLink({
    projectId,
    automationType: "mission_digest",
  });
  const deliveries = await dispatchProjectCommunityMessage({
    projectId,
    providerScope,
    title: `${state.project.name} mission board`,
    body: [
      "Today's mission path is live inside VYNTRO.",
      state.campaigns.length
        ? `Campaigns: ${state.campaigns.slice(0, 2).map((item) => item.title).join(" | ")}`
        : "Campaigns: none live right now",
      state.quests.length
        ? `Quests: ${state.quests.slice(0, 3).map((item) => item.title).join(" | ")}`
        : "Quests: none live right now",
      state.rewards.length
        ? `Rewards: ${state.rewards.slice(0, 2).map((item) => item.title).join(" | ")}`
        : "Rewards: no live drops yet",
    ].join("\n"),
    eyebrow: "MISSION DIGEST",
    projectName: state.project.name,
    imageUrl: state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("quest"),
    fallbackImageUrl: getDefaultCommunityArtwork("quest"),
    accentColor: state.project.brand_accent,
    meta: [
      { label: "Campaigns", value: String(state.campaigns.length) },
      { label: "Quests", value: String(state.quests.length) },
      { label: "Rewards", value: String(state.rewards.length) },
    ],
    url: deepLink,
    buttonLabel: "Open community home",
  });

  await updateCommunityMetadata(projectId, {
    lastMissionDigestAt: new Date().toISOString(),
    lastAutomationRunAt: new Date().toISOString(),
  });

  await writeCommunityAuditLog({
    projectId,
    sourceTable: "community_automations",
    sourceId: projectId,
    action: "community_mission_digest_posted",
    summary: `Posted mission digest for ${state.project.name}.`,
    metadata: { deliveries, providerScope, deepLink },
  });

  return {
    deliveries,
    summary:
      deliveries > 0
        ? `Mission digest delivered to ${deliveries} target(s).`
        : "Mission digest skipped because no targets were configured.",
    metadata: {
      deepLink,
    },
  };
}

async function runRaidReminder(projectId: string, providerScope: ProviderScope) {
  const state = await loadProjectCommunityState(projectId);
  const deepLink = resolveCommunityAutomationDeepLink({
    projectId,
    automationType: "raid_reminder",
  });
  const raid = state.raids[0] ?? null;
  if (!raid) {
    return {
      deliveries: 0,
      summary: "No live raids were available for a reminder wave.",
    };
  }

  const deliveries = await dispatchProjectCommunityMessage({
    projectId,
    providerScope,
    title: raid.title,
    body:
      raid.short_description?.trim()
        ? `${raid.short_description}\n\nReminder: this raid is still live and needs fresh pressure.`
        : "This raid is still live and needs another wave right now.",
    eyebrow: "RAID REMINDER",
    projectName: state.project.name,
    imageUrl: raid.banner || state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("raid"),
    fallbackImageUrl: getDefaultCommunityArtwork("raid"),
    accentColor: state.project.brand_accent,
    meta: [
      { label: "Project", value: state.project.name },
      { label: "Raid XP", value: `+${raid.reward_xp ?? 0} XP` },
      { label: "Mode", value: "Reminder wave" },
    ],
    url: deepLink,
    buttonLabel: "Open community home",
  });

  await updateCommunityMetadata(projectId, {
    lastRaidAlertAt: new Date().toISOString(),
    lastAutomationRunAt: new Date().toISOString(),
  });

  await writeCommunityAuditLog({
    projectId,
    sourceTable: "community_automations",
    sourceId: raid.id,
    action: "community_raid_reminder_posted",
    summary: `Posted raid reminder for ${raid.title}.`,
    metadata: { deliveries, providerScope, raidId: raid.id, deepLink },
  });

  return {
    deliveries,
    summary:
      deliveries > 0
        ? `Raid reminder delivered to ${deliveries} target(s).`
        : "Raid reminder skipped because no targets were configured.",
    metadata: {
      raidId: raid.id,
      deepLink,
    },
  };
}

async function runNewcomerPulse(projectId: string, providerScope: ProviderScope) {
  const state = await loadProjectCommunityState(projectId);
  const summary = await loadContributorSegmentSummary(projectId);
  const journeyLinks = buildCommunityJourneyDeepLinks(projectId, "onboarding");
  if (summary.newcomers === 0) {
    return {
      deliveries: 0,
      summary: "No newcomer cohort is waiting for a starter pulse.",
    };
  }

  const deliveries = await dispatchProjectCommunityMessage({
    projectId,
    providerScope,
    title: `${state.project.name} starter journey`,
    body: [
      `${summary.newcomers} fresh contributor${summary.newcomers === 1 ? "" : "s"} are waiting for a clean first journey.`,
      summary.starterNames.length > 0
        ? `Starter queue: ${summary.starterNames.join(" | ")}`
        : "Starter queue is live and ready for a guided first mission.",
      "Link accounts, finish provider readiness and clear the first mission wave.",
    ].join("\n"),
    eyebrow: "STARTER PULSE",
    projectName: state.project.name,
    imageUrl: state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("quest"),
    fallbackImageUrl: getDefaultCommunityArtwork("quest"),
    accentColor: state.project.brand_accent,
    meta: [
      { label: "Newcomers", value: String(summary.newcomers) },
      { label: "Command ready", value: String(summary.commandReady) },
      { label: "Watchlist", value: String(summary.watchlist) },
    ],
    url: journeyLinks.onboardingUrl,
    buttonLabel: "Open onboarding path",
  });
  const nudgeSummary =
    deliveries > 0
      ? await dispatchJourneyNudgesForLane({
          projectId,
          lane: "onboarding",
          automationType: "newcomer_pulse",
        })
      : null;

  await updateCommunityMetadata(projectId, {
    lastNewcomerPushAt: new Date().toISOString(),
    lastAutomationRunAt: new Date().toISOString(),
  });

  await writeCommunityAuditLog({
    projectId,
    sourceTable: "community_automations",
    sourceId: projectId,
    action: "community_newcomer_wave_posted",
    summary: `Posted newcomer starter journey for ${state.project.name}.`,
    metadata: {
      deliveries,
      providerScope,
      newcomers: summary.newcomers,
      nudgeSummary,
      deepLink: journeyLinks.onboardingUrl,
    },
  });

  return {
    deliveries,
    summary:
      deliveries > 0
        ? `Newcomer wave delivered to ${deliveries} target(s).`
        : "Newcomer wave skipped because no targets were configured.",
    metadata: {
      newcomerCount: summary.newcomers,
      nudgeSummary,
      deepLink: journeyLinks.onboardingUrl,
    },
  };
}

async function runReactivationPulse(projectId: string, providerScope: ProviderScope) {
  const state = await loadProjectCommunityState(projectId);
  const summary = await loadContributorSegmentSummary(projectId);
  const journeyLinks = buildCommunityJourneyDeepLinks(projectId, "comeback");
  if (summary.reactivation === 0) {
    return {
      deliveries: 0,
      summary: "No dormant contributors are waiting for a comeback wave.",
    };
  }

  const deliveries = await dispatchProjectCommunityMessage({
    projectId,
    providerScope,
    title: `${state.project.name} comeback path`,
    body: [
      `${summary.reactivation} contributor${summary.reactivation === 1 ? "" : "s"} are ready for a comeback wave.`,
      summary.comebackNames.length > 0
        ? `Comeback queue: ${summary.comebackNames.join(" | ")}`
        : "Dormant contributors are ready to be pulled back into live campaign pressure.",
      "Open the current missions, raid board and leaderboard pulse to reactivate this journey.",
    ].join("\n"),
    eyebrow: "COMEBACK WAVE",
    projectName: state.project.name,
    imageUrl: state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("campaign"),
    fallbackImageUrl: getDefaultCommunityArtwork("campaign"),
    accentColor: state.project.brand_accent,
    meta: [
      { label: "Reactivation", value: String(summary.reactivation) },
      { label: "Core", value: String(summary.core) },
      { label: "Watchlist", value: String(summary.watchlist) },
    ],
    url: journeyLinks.comebackUrl,
    buttonLabel: "Open comeback path",
  });
  const nudgeSummary =
    deliveries > 0
      ? await dispatchJourneyNudgesForLane({
          projectId,
          lane: "comeback",
          automationType: "reactivation_pulse",
        })
      : null;

  await updateCommunityMetadata(projectId, {
    lastReactivationPushAt: new Date().toISOString(),
    lastAutomationRunAt: new Date().toISOString(),
  });

  await writeCommunityAuditLog({
    projectId,
    sourceTable: "community_automations",
    sourceId: projectId,
    action: "community_reactivation_wave_posted",
    summary: `Posted comeback wave for ${state.project.name}.`,
    metadata: {
      deliveries,
      providerScope,
      reactivation: summary.reactivation,
      nudgeSummary,
      deepLink: journeyLinks.comebackUrl,
    },
  });

  return {
    deliveries,
    summary:
      deliveries > 0
        ? `Comeback wave delivered to ${deliveries} target(s).`
        : "Comeback wave skipped because no targets were configured.",
    metadata: {
      reactivationCount: summary.reactivation,
      nudgeSummary,
      deepLink: journeyLinks.comebackUrl,
    },
  };
}

async function runActivationBoard(projectId: string, providerScope: ProviderScope) {
  const state = await loadProjectCommunityState(projectId);
  const board = await loadActivationBoardCandidate(projectId);
  const deepLink = resolveCommunityAutomationDeepLink({
    projectId,
    automationType: "activation_board",
  });

  if (!board) {
    return {
      deliveries: 0,
      summary: "No active campaign is available for an activation board.",
    };
  }

  const deliveries = await dispatchProjectCommunityMessage({
    projectId,
    providerScope,
    title: `${board.title} activation board`,
    body: board.recommendedCopy,
    eyebrow: "ACTIVATION BOARD",
    projectName: state.project.name,
    campaignTitle: board.title,
    imageUrl:
      state.campaigns.find((campaign) => campaign.id === board.campaignId)?.banner_url ||
      state.project.banner_url ||
      state.project.logo ||
      getDefaultCommunityArtwork("campaign"),
    fallbackImageUrl: getDefaultCommunityArtwork("campaign"),
    accentColor: state.project.brand_accent,
    meta: [
      { label: "Ready", value: String(board.readyContributors) },
      { label: "Newcomers", value: String(board.newcomerCandidates) },
      { label: "Reactivation", value: String(board.reactivationCandidates) },
      { label: "Lane", value: board.recommendedLane },
    ],
    url: deepLink,
    buttonLabel: "Open community home",
  });

  await updateCommunityMetadata(projectId, {
    lastActivationBoardAt: new Date().toISOString(),
    lastAutomationRunAt: new Date().toISOString(),
  });

  await writeCommunityAuditLog({
    projectId,
    sourceTable: "community_automations",
    sourceId: board.campaignId,
    action: "community_activation_board_posted",
    summary: `Posted activation board for ${board.title}.`,
    metadata: { deliveries, providerScope, board, deepLink },
  });

  return {
    deliveries,
    summary:
      deliveries > 0
        ? `Activation board delivered to ${deliveries} target(s).`
        : "Activation board skipped because no targets were configured.",
    metadata: {
      board,
      deepLink,
    },
  };
}

type AutomationExecutionSummary = {
  deliveries: number;
  summary: string;
  metadata?: Record<string, unknown>;
};

async function executeAutomationType(params: {
  projectId: string;
  automationType: CommunityAutomationType;
  providerScope: ProviderScope;
}): Promise<AutomationExecutionSummary> {
  if (params.automationType === "rank_sync") {
    const result = await syncDiscordRanks({ projectId: params.projectId });
    return {
      deliveries: result.rolesAdded + result.rolesRemoved,
      summary: `Rank sync evaluated ${result.membersEvaluated} member(s); added ${result.rolesAdded} role(s) and removed ${result.rolesRemoved}.`,
      metadata: result as Record<string, unknown>,
    };
  }

  if (params.automationType === "leaderboard_pulse") {
    const result = await postCommunityLeaderboards({
      projectId: params.projectId,
      force: true,
    });
    return {
      deliveries: result.postsDelivered,
      summary: `Leaderboard pulse delivered ${result.postsDelivered} post(s).`,
      metadata: result as Record<string, unknown>,
    };
  }

  if (params.automationType === "mission_digest") {
    return runMissionDigest(params.projectId, params.providerScope);
  }

  if (params.automationType === "raid_reminder") {
    return runRaidReminder(params.projectId, params.providerScope);
  }

  if (params.automationType === "newcomer_pulse") {
    return runNewcomerPulse(params.projectId, params.providerScope);
  }

  if (params.automationType === "reactivation_pulse") {
    return runReactivationPulse(params.projectId, params.providerScope);
  }

  return runActivationBoard(params.projectId, params.providerScope);
}

export async function runCommunityAutomation(params: {
  projectId: string;
  automationId?: string;
  automationType?: CommunityAutomationType;
  triggerSource: "manual" | "schedule" | "playbook" | "captain";
  triggeredByAuthUserId?: string | null;
}) {
  const automationRow = await loadAutomationRow({
    projectId: params.projectId,
    automationId: params.automationId,
    automationType: params.automationType,
  });

  if (!automationRow) {
    throw new Error("Community automation could not be resolved.");
  }

  const automationType = automationRow.automation_type as CommunityAutomationType;
  const cadence = normalizeCadence(automationRow.cadence);
  const status = normalizeStatus(automationRow.status);

  if (params.triggerSource === "schedule" && !isCommunityAutomationDue({
    status,
    nextRunAt: automationRow.next_run_at,
  })) {
    return {
      ok: true,
      automationId: automationRow.id,
      automationType,
      status: "skipped",
      triggerSource: params.triggerSource,
      summary: "Automation was not due.",
    } satisfies CommunityAutomationRunResult;
  }

  if (params.triggerSource === "schedule" && automationRow.last_result === "failed") {
    return {
      ok: true,
      automationId: automationRow.id,
      automationType,
      status: "skipped",
      triggerSource: params.triggerSource,
      summary:
        "Automation is blocked after the last failed attempt and now waits for an owner or captain intervention.",
    } satisfies CommunityAutomationRunResult;
  }

  const providerScope = normalizeProviderScope(
    automationRow.target_provider || automationRow.provider_scope
  );
  const runId = await createAutomationRun({
    projectId: params.projectId,
    automationId: automationRow.id,
    automationType,
    triggerSource: params.triggerSource,
    triggeredByAuthUserId: params.triggeredByAuthUserId,
  });
  await markAutomationRunning({
    automationId: automationRow.id,
    automationType,
    cadence,
    status,
    nextRunAt: automationRow.next_run_at,
  });

  try {
    const result = await executeAutomationType({
      projectId: params.projectId,
      automationType,
      providerScope,
    });
    const summary = result.summary;
    const queueRefresh = await refreshProjectCommunityCaptainQueue(params.projectId).catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : "Captain queue refresh failed.",
    }));

    await finishAutomationRun({
      runId,
      status: "success",
      summary,
      metadata: {
        ...(result.metadata ?? {}),
        deliveries: result.deliveries ?? 0,
        queueRefresh,
      },
    });
    await updateAutomationRow(automationRow.id, {
      automationType,
      cadence,
      status,
      lastResult: "success",
      lastResultSummary: summary,
    });
    await maybeRecordCaptainAutomationAction({
      projectId: params.projectId,
      authUserId: params.triggeredByAuthUserId,
      automationType,
      targetId: automationRow.id,
      status: "success",
      summary,
      metadata: {
        ...(result.metadata ?? {}),
        deliveries: result.deliveries ?? 0,
        queueRefresh,
      },
    });

    return {
      ok: true,
      automationId: automationRow.id,
      automationType,
      status: "success",
      triggerSource: params.triggerSource,
      summary,
      deliveries: result.deliveries ?? 0,
      metadata: {
        ...(result.metadata ?? {}),
        queueRefresh,
      },
    } satisfies CommunityAutomationRunResult;
  } catch (error) {
    const summary =
      error instanceof Error ? error.message : "Community automation execution failed.";
    const queueRefresh = await refreshProjectCommunityCaptainQueue(params.projectId).catch((queueError) => ({
      ok: false,
      error:
        queueError instanceof Error ? queueError.message : "Captain queue refresh failed.",
    }));
    await finishAutomationRun({
      runId,
      status: "failed",
      summary,
      metadata: {
        queueRefresh,
      },
    });
    await updateAutomationRow(automationRow.id, {
      automationType,
      cadence,
      status,
      lastResult: "failed",
      lastResultSummary: summary,
    });
    await maybeRecordCaptainAutomationAction({
      projectId: params.projectId,
      authUserId: params.triggeredByAuthUserId,
      automationType,
      targetId: automationRow.id,
      status: "failed",
      summary,
      metadata: {
        queueRefresh,
      },
    });
    throw error;
  }
}

export async function loadDueCommunityAutomations(params?: {
  projectId?: string;
  limit?: number;
}) {
  const query = supabaseAdmin
    .from("community_automations")
    .select(
      "id, project_id, automation_type, status, cadence, provider_scope, target_provider, config, last_run_at, next_run_at, last_result"
    )
    .eq("status", "active")
    .not("next_run_at", "is", null)
    .order("next_run_at", { ascending: true })
    .limit(Math.max(1, Math.min(params?.limit ?? 50, 200)));

  if (params?.projectId) {
    query.eq("project_id", params.projectId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load due Community OS automations.");
  }

  return ((data ?? []) as CommunityAutomationRow[])
    .filter(
      (row) =>
        row.last_result !== "failed" &&
        isCommunityAutomationDue({
          status: normalizeStatus(row.status),
          nextRunAt: row.next_run_at,
        })
    )
    .sort((left, right) => {
      const sequenceDelta =
        AUTOMATION_SEQUENCE_RANK[
          getCommunityAutomationSequence(left.automation_type as CommunityAutomationType)
        ] -
        AUTOMATION_SEQUENCE_RANK[
          getCommunityAutomationSequence(right.automation_type as CommunityAutomationType)
        ];

      if (sequenceDelta !== 0) {
        return sequenceDelta;
      }

      return (
        new Date(left.next_run_at ?? 0).getTime() - new Date(right.next_run_at ?? 0).getTime()
      );
    });
}
