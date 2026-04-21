import { supabaseAdmin } from "../../lib/supabase.js";

export type DiscordRankSource = "project_xp" | "global_xp" | "trust" | "wallet_verified";
export type DiscordLeaderboardScope = "project" | "global";
export type DiscordLeaderboardPeriod = "weekly" | "monthly" | "all_time";
export type DiscordLeaderboardCadence = "manual" | "daily" | "weekly";

export type DiscordCommunityBotSettings = {
  commandsEnabled: boolean;
  missionCommandsEnabled: boolean;
  captainCommandsEnabled: boolean;
  commandDeepLinksEnabled: boolean;
  captainsEnabled: boolean;
  rankSyncEnabled: boolean;
  rankSource: DiscordRankSource;
  leaderboardEnabled: boolean;
  leaderboardScope: DiscordLeaderboardScope;
  leaderboardPeriod: DiscordLeaderboardPeriod;
  leaderboardTargetChannelId: string;
  leaderboardTopN: number;
  leaderboardCadence: DiscordLeaderboardCadence;
  raidOpsEnabled: boolean;
  lastRankSyncAt: string | null;
  lastLeaderboardPostedAt: string | null;
};

export type DiscordRankRule = {
  id: string;
  sourceType: DiscordRankSource;
  threshold: number;
  discordRoleId: string;
  label: string;
};

export type DiscordIntegrationContext = {
  integrationId: string;
  projectId: string;
  projectName: string;
  guildId: string;
  pushTargetChannelId: string;
  settings: DiscordCommunityBotSettings;
  rankRules: DiscordRankRule[];
};

export type DiscordIdentitySnapshot = {
  authUserId: string;
  discordUserId: string;
  discordUsername: string;
  profileUsername: string;
  globalXp: number;
  globalLevel: number;
  globalTrust: number;
  globalQuestsCompleted: number;
  globalRaidsCompleted: number;
  projectXp: number;
  projectLevel: number;
  projectTrust: number;
  projectQuestsCompleted: number;
  projectRaidsCompleted: number;
  walletVerified: boolean;
};

export type DiscordLeaderboardEntry = {
  authUserId: string;
  discordUserId: string;
  displayName: string;
  xp: number;
  level: number;
  trust: number;
  questsCompleted: number;
  raidsCompleted: number;
};

export type DiscordRaidRailEntry = {
  id: string;
  title: string;
  rewardXp: number;
  shortDescription: string;
};

export type DiscordMissionBoard = {
  campaigns: Array<{ id: string; title: string }>;
  quests: Array<{ id: string; title: string; xp: number }>;
  rewards: Array<{ id: string; title: string; cost: number }>;
};

const DEFAULT_SETTINGS: DiscordCommunityBotSettings = {
  commandsEnabled: true,
  missionCommandsEnabled: true,
  captainCommandsEnabled: true,
  commandDeepLinksEnabled: true,
  captainsEnabled: false,
  rankSyncEnabled: false,
  rankSource: "project_xp",
  leaderboardEnabled: true,
  leaderboardScope: "project",
  leaderboardPeriod: "weekly",
  leaderboardTargetChannelId: "",
  leaderboardTopN: 10,
  leaderboardCadence: "manual",
  raidOpsEnabled: false,
  lastRankSyncAt: null,
  lastLeaderboardPostedAt: null,
};

function sanitizeRankSource(value: unknown): DiscordRankSource {
  return value === "global_xp" || value === "trust" || value === "wallet_verified"
    ? value
    : "project_xp";
}

function sanitizeLeaderboardScope(value: unknown): DiscordLeaderboardScope {
  return value === "global" ? "global" : "project";
}

function sanitizeLeaderboardPeriod(value: unknown): DiscordLeaderboardPeriod {
  return value === "monthly" || value === "all_time" ? value : "weekly";
}

function sanitizeLeaderboardCadence(value: unknown): DiscordLeaderboardCadence {
  return value === "daily" || value === "weekly" ? value : "manual";
}

function readDiscordGuildId(config: Record<string, unknown> | null | undefined) {
  const guildId = typeof config?.guildId === "string" ? config.guildId.trim() : "";
  const serverId = typeof config?.serverId === "string" ? config.serverId.trim() : "";
  return guildId || serverId || "";
}

function readDiscordPushTarget(config: Record<string, unknown> | null | undefined) {
  if (!config?.pushSettings || typeof config.pushSettings !== "object") {
    return "";
  }

  const pushSettings = config.pushSettings as Record<string, unknown>;
  return typeof pushSettings.targetChannelId === "string" ? pushSettings.targetChannelId.trim() : "";
}

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function loadDiscordIntegrationRows() {
  const { data, error } = await supabaseAdmin
    .from("project_integrations")
    .select("id, project_id, status, config")
    .eq("provider", "discord")
    .in("status", ["connected", "needs_attention"]);

  if (error) {
    throw new Error(error.message || "Failed to load Discord integrations.");
  }

  return (data ?? []) as Array<{
    id: string;
    project_id: string;
    status: string;
    config: Record<string, unknown> | null;
  }>;
}

export async function loadDiscordIntegrationContexts(filters?: {
  projectId?: string;
  integrationId?: string;
  guildId?: string;
}) {
  const integrationRows = await loadDiscordIntegrationRows();
  const filteredIntegrations = integrationRows.filter((integration) => {
    const guildId = readDiscordGuildId(integration.config);
    if (!guildId) {
      return false;
    }

    if (filters?.projectId && integration.project_id !== filters.projectId) {
      return false;
    }

    if (filters?.integrationId && integration.id !== filters.integrationId) {
      return false;
    }

    if (filters?.guildId && guildId !== filters.guildId) {
      return false;
    }

    return true;
  });

  if (filteredIntegrations.length === 0) {
    return [] as DiscordIntegrationContext[];
  }

  const integrationIds = filteredIntegrations.map((integration) => integration.id);
  const projectIds = filteredIntegrations.map((integration) => integration.project_id);

  const [
    { data: settingsRows, error: settingsError },
    { data: rankRuleRows, error: rankRulesError },
    { data: projectRows, error: projectError },
  ] = await Promise.all([
    supabaseAdmin
      .from("community_bot_settings")
      .select(
        "integration_id, commands_enabled, rank_sync_enabled, rank_source, leaderboard_enabled, leaderboard_scope, leaderboard_period, leaderboard_target_channel_id, leaderboard_top_n, leaderboard_cadence, raid_ops_enabled, last_rank_sync_at, last_leaderboard_posted_at, metadata"
      )
      .in("integration_id", integrationIds),
    supabaseAdmin
      .from("community_rank_rules")
      .select("id, integration_id, source_type, threshold, discord_role_id, label")
      .in("integration_id", integrationIds),
    supabaseAdmin.from("projects").select("id, name").in("id", projectIds),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load Discord bot settings.");
  }

  if (rankRulesError) {
    throw new Error(rankRulesError.message || "Failed to load Discord rank rules.");
  }

  if (projectError) {
    throw new Error(projectError.message || "Failed to load Discord project contexts.");
  }

  const settingsByIntegrationId = new Map<
    string,
    {
      integration_id: string;
      commands_enabled: boolean | null;
      rank_sync_enabled: boolean | null;
      rank_source: string | null;
      leaderboard_enabled: boolean | null;
      leaderboard_scope: string | null;
      leaderboard_period: string | null;
      leaderboard_target_channel_id: string | null;
      leaderboard_top_n: number | null;
      leaderboard_cadence: string | null;
      raid_ops_enabled: boolean | null;
      last_rank_sync_at: string | null;
      last_leaderboard_posted_at: string | null;
      metadata: Record<string, unknown> | null;
    }
  >(
    ((settingsRows ?? []) as Array<{
      integration_id: string;
      commands_enabled: boolean | null;
      rank_sync_enabled: boolean | null;
      rank_source: string | null;
      leaderboard_enabled: boolean | null;
      leaderboard_scope: string | null;
      leaderboard_period: string | null;
      leaderboard_target_channel_id: string | null;
      leaderboard_top_n: number | null;
      leaderboard_cadence: string | null;
      raid_ops_enabled: boolean | null;
      last_rank_sync_at: string | null;
      last_leaderboard_posted_at: string | null;
      metadata: Record<string, unknown> | null;
    }>).map((row) => [row.integration_id, row])
  );

  const rankRulesByIntegrationId = new Map<string, DiscordRankRule[]>();
  for (const row of (rankRuleRows ?? []) as Array<{
    id: string;
    integration_id: string;
    source_type: string;
    threshold: number | null;
    discord_role_id: string;
    label: string;
  }>) {
    const existing = rankRulesByIntegrationId.get(row.integration_id) ?? [];
    existing.push({
      id: row.id,
      sourceType: sanitizeRankSource(row.source_type),
      threshold: Number(row.threshold ?? 0),
      discordRoleId: row.discord_role_id,
      label: row.label,
    });
    rankRulesByIntegrationId.set(row.integration_id, existing);
  }

  const projectNameById = new Map(
    ((projectRows ?? []) as Array<{ id: string; name: string }>).map((project) => [
      project.id,
      project.name,
    ])
  );

  return filteredIntegrations.map((integration) => {
    const settingsRow = settingsByIntegrationId.get(integration.id);
    const guildId = readDiscordGuildId(integration.config);
    const pushTargetChannelId = readDiscordPushTarget(integration.config);

    return {
      integrationId: integration.id,
      projectId: integration.project_id,
      projectName: projectNameById.get(integration.project_id) ?? "Veltrix",
      guildId,
      pushTargetChannelId,
      settings: settingsRow
        ? {
            commandsEnabled: settingsRow.commands_enabled !== false,
            missionCommandsEnabled:
              settingsRow.metadata && typeof settingsRow.metadata === "object"
                ? (settingsRow.metadata as Record<string, unknown>).missionCommandsEnabled !== false
                : DEFAULT_SETTINGS.missionCommandsEnabled,
            captainCommandsEnabled:
              settingsRow.metadata && typeof settingsRow.metadata === "object"
                ? (settingsRow.metadata as Record<string, unknown>).captainCommandsEnabled !== false
                : DEFAULT_SETTINGS.captainCommandsEnabled,
            commandDeepLinksEnabled:
              settingsRow.metadata && typeof settingsRow.metadata === "object"
                ? (settingsRow.metadata as Record<string, unknown>).commandDeepLinksEnabled !== false
                : DEFAULT_SETTINGS.commandDeepLinksEnabled,
            captainsEnabled:
              settingsRow.metadata && typeof settingsRow.metadata === "object"
                ? (settingsRow.metadata as Record<string, unknown>).captainsEnabled === true
                : DEFAULT_SETTINGS.captainsEnabled,
            rankSyncEnabled: settingsRow.rank_sync_enabled === true,
            rankSource: sanitizeRankSource(settingsRow.rank_source),
            leaderboardEnabled: settingsRow.leaderboard_enabled !== false,
            leaderboardScope: sanitizeLeaderboardScope(settingsRow.leaderboard_scope),
            leaderboardPeriod: sanitizeLeaderboardPeriod(settingsRow.leaderboard_period),
            leaderboardTargetChannelId: settingsRow.leaderboard_target_channel_id ?? "",
            leaderboardTopN:
              Number.isFinite(Number(settingsRow.leaderboard_top_n)) &&
              Number(settingsRow.leaderboard_top_n) > 0
                ? Number(settingsRow.leaderboard_top_n)
                : DEFAULT_SETTINGS.leaderboardTopN,
            leaderboardCadence: sanitizeLeaderboardCadence(settingsRow.leaderboard_cadence),
            raidOpsEnabled: settingsRow.raid_ops_enabled === true,
            lastRankSyncAt: settingsRow.last_rank_sync_at,
            lastLeaderboardPostedAt: settingsRow.last_leaderboard_posted_at,
          }
        : DEFAULT_SETTINGS,
      rankRules: (rankRulesByIntegrationId.get(integration.id) ?? []).sort(
        (left, right) => left.threshold - right.threshold
      ),
    };
  });
}

export async function loadDiscordIntegrationContextByGuildId(guildId: string) {
  const matches = await loadDiscordIntegrationContexts({ guildId });
  return matches[0] ?? null;
}

export async function loadDiscordIdentitySnapshot(
  discordUserId: string,
  projectId: string
): Promise<DiscordIdentitySnapshot | null> {
  const { data: connectedAccount, error: accountError } = await supabaseAdmin
    .from("user_connected_accounts")
    .select("auth_user_id, provider_user_id, username")
    .eq("provider", "discord")
    .eq("status", "connected")
    .eq("provider_user_id", discordUserId)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message || "Failed to load Discord account link.");
  }

  if (!connectedAccount) {
    return null;
  }

  const authUserId = connectedAccount.auth_user_id;

  const [
    { data: profile, error: profileError },
    { data: globalReputation, error: globalError },
    { data: projectReputation, error: projectError },
    { data: walletLinks, error: walletError },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_profiles")
      .select("username")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_global_reputation")
      .select("total_xp, level, trust_score, quests_completed, raids_completed")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_project_reputation")
      .select("xp, level, trust_score, quests_completed, raids_completed")
      .eq("auth_user_id", authUserId)
      .eq("project_id", projectId)
      .maybeSingle(),
    supabaseAdmin
      .from("wallet_links")
      .select("id")
      .eq("auth_user_id", authUserId)
      .limit(1),
  ]);

  if (profileError) {
    throw new Error(profileError.message || "Failed to load Discord profile context.");
  }

  if (globalError) {
    throw new Error(globalError.message || "Failed to load Discord global reputation.");
  }

  if (projectError) {
    throw new Error(projectError.message || "Failed to load Discord project reputation.");
  }

  if (walletError) {
    throw new Error(walletError.message || "Failed to load Discord wallet verification state.");
  }

  return {
    authUserId,
    discordUserId,
    discordUsername: connectedAccount.username ?? "Linked Discord",
    profileUsername: profile?.username ?? "Pilot",
    globalXp: Number(globalReputation?.total_xp ?? 0),
    globalLevel: Number(globalReputation?.level ?? 1),
    globalTrust: Number(globalReputation?.trust_score ?? 50),
    globalQuestsCompleted: Number(globalReputation?.quests_completed ?? 0),
    globalRaidsCompleted: Number(globalReputation?.raids_completed ?? 0),
    projectXp: Number(projectReputation?.xp ?? 0),
    projectLevel: Number(projectReputation?.level ?? 1),
    projectTrust: Number(projectReputation?.trust_score ?? 50),
    projectQuestsCompleted: Number(projectReputation?.quests_completed ?? 0),
    projectRaidsCompleted: Number(projectReputation?.raids_completed ?? 0),
    walletVerified: Array.isArray(walletLinks) && walletLinks.length > 0,
  };
}

export function getLeaderboardCutoff(period: DiscordLeaderboardPeriod) {
  if (period === "all_time") {
    return null;
  }

  const days = period === "monthly" ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function loadDiscordAccountMaps(authUserIds: string[]) {
  const usernamesByAuthUserId = new Map<string, string>();
  const discordUserIdByAuthUserId = new Map<string, string>();

  for (const chunk of chunkArray(authUserIds, 150)) {
    const [{ data: accounts, error: accountsError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        supabaseAdmin
          .from("user_connected_accounts")
          .select("auth_user_id, provider_user_id, username")
          .eq("provider", "discord")
          .eq("status", "connected")
          .in("auth_user_id", chunk),
        supabaseAdmin
          .from("user_profiles")
          .select("auth_user_id, username")
          .in("auth_user_id", chunk),
      ]);

    if (accountsError) {
      throw new Error(accountsError.message || "Failed to load Discord account map.");
    }

    if (profilesError) {
      throw new Error(profilesError.message || "Failed to load profile username map.");
    }

    for (const account of (accounts ?? []) as Array<{
      auth_user_id: string;
      provider_user_id: string;
      username: string | null;
    }>) {
      if (!discordUserIdByAuthUserId.has(account.auth_user_id)) {
        discordUserIdByAuthUserId.set(account.auth_user_id, account.provider_user_id);
      }

      if (account.username && !usernamesByAuthUserId.has(account.auth_user_id)) {
        usernamesByAuthUserId.set(account.auth_user_id, account.username);
      }
    }

    for (const profile of (profiles ?? []) as Array<{
      auth_user_id: string;
      username: string | null;
    }>) {
      if (profile.username && !usernamesByAuthUserId.has(profile.auth_user_id)) {
        usernamesByAuthUserId.set(profile.auth_user_id, profile.username);
      }
    }
  }

  return { usernamesByAuthUserId, discordUserIdByAuthUserId };
}

export async function loadDiscordLeaderboard(
  params: {
    projectId: string;
    scope: DiscordLeaderboardScope;
    period: DiscordLeaderboardPeriod;
    limit: number;
  }
): Promise<DiscordLeaderboardEntry[]> {
  const limit = Math.max(1, Math.min(20, Math.floor(params.limit)));

  if (params.period === "all_time") {
    if (params.scope === "project") {
      const { data, error } = await supabaseAdmin
        .from("user_project_reputation")
        .select("auth_user_id, xp, level, trust_score, quests_completed, raids_completed")
        .eq("project_id", params.projectId)
        .order("xp", { ascending: false })
        .limit(limit * 4);

      if (error) {
        throw new Error(error.message || "Failed to load project leaderboard.");
      }

      const baseRows = (data ?? []) as Array<{
        auth_user_id: string;
        xp: number | null;
        level: number | null;
        trust_score: number | null;
        quests_completed: number | null;
        raids_completed: number | null;
      }>;

      const authUserIds = baseRows.map((row) => row.auth_user_id);
      const { usernamesByAuthUserId, discordUserIdByAuthUserId } =
        await loadDiscordAccountMaps(authUserIds);

      return baseRows
        .filter((row) => discordUserIdByAuthUserId.has(row.auth_user_id))
        .map((row) => ({
          authUserId: row.auth_user_id,
          discordUserId: discordUserIdByAuthUserId.get(row.auth_user_id) ?? "",
          displayName:
            usernamesByAuthUserId.get(row.auth_user_id) ??
            `Pilot ${row.auth_user_id.slice(0, 6)}`,
          xp: Number(row.xp ?? 0),
          level: Number(row.level ?? 1),
          trust: Number(row.trust_score ?? 50),
          questsCompleted: Number(row.quests_completed ?? 0),
          raidsCompleted: Number(row.raids_completed ?? 0),
        }))
        .slice(0, limit);
    }

    const { data, error } = await supabaseAdmin
      .from("user_global_reputation")
      .select("auth_user_id, total_xp, level, trust_score, quests_completed, raids_completed")
      .order("total_xp", { ascending: false })
      .limit(limit * 4);

    if (error) {
      throw new Error(error.message || "Failed to load global leaderboard.");
    }

    const baseRows = (data ?? []) as Array<{
      auth_user_id: string;
      total_xp: number | null;
      level: number | null;
      trust_score: number | null;
      quests_completed: number | null;
      raids_completed: number | null;
    }>;

    const authUserIds = baseRows.map((row) => row.auth_user_id);
    const { usernamesByAuthUserId, discordUserIdByAuthUserId } =
      await loadDiscordAccountMaps(authUserIds);

    return baseRows
      .filter((row) => discordUserIdByAuthUserId.has(row.auth_user_id))
      .map((row) => ({
        authUserId: row.auth_user_id,
        discordUserId: discordUserIdByAuthUserId.get(row.auth_user_id) ?? "",
        displayName:
          usernamesByAuthUserId.get(row.auth_user_id) ??
          `Pilot ${row.auth_user_id.slice(0, 6)}`,
        xp: Number(row.total_xp ?? 0),
        level: Number(row.level ?? 1),
        trust: Number(row.trust_score ?? 50),
        questsCompleted: Number(row.quests_completed ?? 0),
        raidsCompleted: Number(row.raids_completed ?? 0),
      }))
      .slice(0, limit);
  }

  const cutoff = getLeaderboardCutoff(params.period);
  const query = supabaseAdmin
    .from("xp_events")
    .select("auth_user_id, effective_xp, created_at")
    .gte("created_at", cutoff ?? new Date(0).toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);

  if (params.scope === "project") {
    query.eq("project_id", params.projectId);
  }

  const { data: xpEvents, error: xpEventsError } = await query;

  if (xpEventsError) {
    throw new Error(xpEventsError.message || "Failed to load time-window leaderboard.");
  }

  const xpByAuthUserId = new Map<string, number>();
  for (const event of (xpEvents ?? []) as Array<{
    auth_user_id: string;
    effective_xp: number | null;
  }>) {
    xpByAuthUserId.set(
      event.auth_user_id,
      (xpByAuthUserId.get(event.auth_user_id) ?? 0) + Number(event.effective_xp ?? 0)
    );
  }

  const sortedAuthUserIds = Array.from(xpByAuthUserId.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit * 4)
    .map(([authUserId]) => authUserId);

  if (sortedAuthUserIds.length === 0) {
    return [];
  }

  const { usernamesByAuthUserId, discordUserIdByAuthUserId } =
    await loadDiscordAccountMaps(sortedAuthUserIds);

  const reputationTable =
    params.scope === "project" ? "user_project_reputation" : "user_global_reputation";

  const reputationRowsByAuthUserId = new Map<
    string,
    {
      level: number;
      trust: number;
      questsCompleted: number;
      raidsCompleted: number;
    }
  >();

  for (const chunk of chunkArray(sortedAuthUserIds, 150)) {
    const reputationQuery =
      reputationTable === "user_project_reputation"
        ? supabaseAdmin
            .from("user_project_reputation")
            .select("auth_user_id, level, trust_score, quests_completed, raids_completed")
            .eq("project_id", params.projectId)
            .in("auth_user_id", chunk)
        : supabaseAdmin
            .from("user_global_reputation")
            .select("auth_user_id, level, trust_score, quests_completed, raids_completed")
            .in("auth_user_id", chunk);

    const { data: rows, error } = await reputationQuery;
    if (error) {
      throw new Error(error.message || "Failed to load leaderboard reputation rows.");
    }

    for (const row of (rows ?? []) as Array<{
      auth_user_id: string;
      level: number | null;
      trust_score: number | null;
      quests_completed: number | null;
      raids_completed: number | null;
    }>) {
      reputationRowsByAuthUserId.set(row.auth_user_id, {
        level: Number(row.level ?? 1),
        trust: Number(row.trust_score ?? 50),
        questsCompleted: Number(row.quests_completed ?? 0),
        raidsCompleted: Number(row.raids_completed ?? 0),
      });
    }
  }

  return sortedAuthUserIds
    .filter((authUserId) => discordUserIdByAuthUserId.has(authUserId))
    .map((authUserId) => {
      const reputation = reputationRowsByAuthUserId.get(authUserId);
      return {
        authUserId,
        discordUserId: discordUserIdByAuthUserId.get(authUserId) ?? "",
        displayName:
          usernamesByAuthUserId.get(authUserId) ?? `Pilot ${authUserId.slice(0, 6)}`,
        xp: xpByAuthUserId.get(authUserId) ?? 0,
        level: reputation?.level ?? 1,
        trust: reputation?.trust ?? 50,
        questsCompleted: reputation?.questsCompleted ?? 0,
        raidsCompleted: reputation?.raidsCompleted ?? 0,
      };
    })
    .slice(0, limit);
}

export async function loadWalletVerifiedMap(authUserIds: string[]) {
  const verified = new Set<string>();

  for (const chunk of chunkArray(authUserIds, 150)) {
    const { data, error } = await supabaseAdmin
      .from("wallet_links")
      .select("auth_user_id")
      .in("auth_user_id", chunk);

    if (error) {
      throw new Error(error.message || "Failed to load wallet verification map.");
    }

    for (const row of (data ?? []) as Array<{ auth_user_id: string }>) {
      verified.add(row.auth_user_id);
    }
  }

  return verified;
}

export async function loadDiscordConnectedAccountsForUserIds(authUserIds: string[]) {
  const accounts = [] as Array<{
    auth_user_id: string;
    provider_user_id: string;
    username: string | null;
  }>;

  for (const chunk of chunkArray(authUserIds, 150)) {
    const { data, error } = await supabaseAdmin
      .from("user_connected_accounts")
      .select("auth_user_id, provider_user_id, username")
      .eq("provider", "discord")
      .eq("status", "connected")
      .in("auth_user_id", chunk);

    if (error) {
      throw new Error(error.message || "Failed to load Discord connected accounts.");
    }

    accounts.push(
      ...((data ?? []) as Array<{
        auth_user_id: string;
        provider_user_id: string;
        username: string | null;
      }>)
    );
  }

  return accounts;
}

export async function markDiscordRankSyncAt(integrationId: string) {
  const { error } = await supabaseAdmin
    .from("community_bot_settings")
    .update({
      last_rank_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("integration_id", integrationId);

  if (error) {
    throw new Error(error.message || "Failed to update Discord rank sync timestamp.");
  }
}

export async function markDiscordLeaderboardPostedAt(integrationId: string) {
  const { error } = await supabaseAdmin
    .from("community_bot_settings")
    .update({
      last_leaderboard_posted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("integration_id", integrationId);

  if (error) {
    throw new Error(error.message || "Failed to update Discord leaderboard timestamp.");
  }
}

export async function loadDiscordRaidRail(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("raids")
    .select("id, title, reward_xp, short_description")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    throw new Error(error.message || "Failed to load Discord raid rail.");
  }

  return ((data ?? []) as Array<{
    id: string;
    title: string;
    reward_xp: number | null;
    short_description: string | null;
  }>).map((raid) => ({
    id: raid.id,
    title: raid.title,
    rewardXp: Number(raid.reward_xp ?? 0),
    shortDescription: raid.short_description ?? "",
  }));
}

export async function loadDiscordMissionBoard(projectId: string): Promise<DiscordMissionBoard> {
  const [
    { data: campaigns, error: campaignsError },
    { data: quests, error: questsError },
    { data: rewards, error: rewardsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("campaigns")
      .select("id, title")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("featured", { ascending: false })
      .limit(3),
    supabaseAdmin
      .from("quests")
      .select("id, title, xp")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(4),
    supabaseAdmin
      .from("rewards")
      .select("id, title, cost")
      .eq("project_id", projectId)
      .eq("status", "active")
      .eq("visible", true)
      .limit(3),
  ]);

  if (campaignsError) {
    throw new Error(campaignsError.message || "Failed to load Discord campaigns.");
  }

  if (questsError) {
    throw new Error(questsError.message || "Failed to load Discord quests.");
  }

  if (rewardsError) {
    throw new Error(rewardsError.message || "Failed to load Discord rewards.");
  }

  return {
    campaigns: ((campaigns ?? []) as Array<{ id: string; title: string }>).map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
    })),
    quests: ((quests ?? []) as Array<{ id: string; title: string; xp: number | null }>).map(
      (quest) => ({
        id: quest.id,
        title: quest.title,
        xp: Number(quest.xp ?? 0),
      })
    ),
    rewards: ((rewards ?? []) as Array<{ id: string; title: string; cost: number | null }>).map(
      (reward) => ({
        id: reward.id,
        title: reward.title,
        cost: Number(reward.cost ?? 0),
      })
    ),
  };
}
