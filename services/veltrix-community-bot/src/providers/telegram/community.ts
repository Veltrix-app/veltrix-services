import { supabaseAdmin } from "../../lib/supabase.js";

export type TelegramCommunityContext = {
  integrationId: string;
  projectId: string;
  projectName: string;
  chatId: string;
  settings: {
    commandsEnabled: boolean;
    missionCommandsEnabled: boolean;
    captainCommandsEnabled: boolean;
    commandDeepLinksEnabled: boolean;
    captainsEnabled: boolean;
    leaderboardEnabled: boolean;
    raidOpsEnabled: boolean;
  };
};

export type TelegramIdentitySnapshot = {
  authUserId: string;
  telegramUserId: string;
  telegramUsername: string;
  profileUsername: string;
  globalXp: number;
  globalLevel: number;
  globalTrust: number;
  projectXp: number;
  projectLevel: number;
  projectTrust: number;
  projectQuestsCompleted: number;
  projectRaidsCompleted: number;
  walletVerified: boolean;
};

export type TelegramLeaderboardEntry = {
  authUserId: string;
  telegramUserId: string;
  displayName: string;
  xp: number;
  level: number;
  trust: number;
  questsCompleted: number;
  raidsCompleted: number;
};

export type TelegramMissionBoard = {
  campaigns: Array<{ id: string; title: string }>;
  quests: Array<{ id: string; title: string; xp: number | null }>;
  rewards: Array<{ id: string; title: string; cost: number | null }>;
};

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function readTelegramChatId(config: Record<string, unknown> | null | undefined) {
  const chatId = typeof config?.chatId === "string" ? config.chatId.trim() : "";
  const groupId = typeof config?.groupId === "string" ? config.groupId.trim() : "";
  const pushTarget =
    config?.pushSettings &&
    typeof config.pushSettings === "object" &&
    typeof (config.pushSettings as Record<string, unknown>).targetChatId === "string"
      ? String((config.pushSettings as Record<string, unknown>).targetChatId).trim()
      : "";

  return chatId || groupId || pushTarget || "";
}

export async function loadTelegramIntegrationContextByChatId(chatId: string) {
  const { data: integrations, error: integrationError } = await supabaseAdmin
    .from("project_integrations")
    .select("id, project_id, status, config")
    .eq("provider", "telegram")
    .in("status", ["connected", "needs_attention"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load Telegram integrations.");
  }

  const matchedIntegration = ((integrations ?? []) as Array<{
    id: string;
    project_id: string;
    config: Record<string, unknown> | null;
  }>).find((integration) => readTelegramChatId(integration.config) === chatId.trim());

  if (!matchedIntegration) {
    return null;
  }

  const [{ data: project, error: projectError }, { data: settingsRow, error: settingsError }] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, name")
        .eq("id", matchedIntegration.project_id)
        .maybeSingle(),
      supabaseAdmin
        .from("community_bot_settings")
        .select("integration_id, commands_enabled, leaderboard_enabled, raid_ops_enabled, metadata")
        .eq("integration_id", matchedIntegration.id)
        .maybeSingle(),
    ]);

  if (projectError) {
    throw new Error(projectError.message || "Failed to load Telegram project context.");
  }

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load Telegram community settings.");
  }

  return {
    integrationId: matchedIntegration.id,
    projectId: matchedIntegration.project_id,
    projectName: project?.name ?? "VYNTRO",
    chatId: chatId.trim(),
    settings: {
      commandsEnabled: settingsRow?.commands_enabled === true,
      missionCommandsEnabled:
        settingsRow?.metadata && typeof settingsRow.metadata === "object"
          ? (settingsRow.metadata as Record<string, unknown>).missionCommandsEnabled !== false
          : true,
      captainCommandsEnabled:
        settingsRow?.metadata && typeof settingsRow.metadata === "object"
          ? (settingsRow.metadata as Record<string, unknown>).captainCommandsEnabled !== false
          : true,
      commandDeepLinksEnabled:
        settingsRow?.metadata && typeof settingsRow.metadata === "object"
          ? (settingsRow.metadata as Record<string, unknown>).commandDeepLinksEnabled !== false
          : true,
      captainsEnabled:
        settingsRow?.metadata && typeof settingsRow.metadata === "object"
          ? (settingsRow.metadata as Record<string, unknown>).captainsEnabled === true
          : false,
      leaderboardEnabled: settingsRow?.leaderboard_enabled !== false,
      raidOpsEnabled: settingsRow?.raid_ops_enabled === true,
    },
  } satisfies TelegramCommunityContext;
}

export async function loadTelegramIntegrationContexts() {
  const { data: integrations, error: integrationError } = await supabaseAdmin
    .from("project_integrations")
    .select("id, project_id, status, config")
    .eq("provider", "telegram")
    .in("status", ["connected", "needs_attention"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load Telegram integrations.");
  }

  const typedIntegrations = (integrations ?? []) as Array<{
    id: string;
    project_id: string;
    config: Record<string, unknown> | null;
  }>;
  const integrationIds = typedIntegrations.map((integration) => integration.id);
  const projectIds = Array.from(
    new Set(typedIntegrations.map((integration) => integration.project_id).filter(Boolean))
  );

  const [{ data: projects, error: projectError }, { data: settingsRows, error: settingsError }] =
    await Promise.all([
      projectIds.length > 0
        ? supabaseAdmin.from("projects").select("id, name").in("id", projectIds)
        : Promise.resolve({ data: [], error: null }),
      integrationIds.length > 0
        ? supabaseAdmin
            .from("community_bot_settings")
            .select(
              "integration_id, commands_enabled, leaderboard_enabled, raid_ops_enabled, metadata"
            )
            .in("integration_id", integrationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (projectError) {
    throw new Error(projectError.message || "Failed to load Telegram project contexts.");
  }

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load Telegram community settings.");
  }

  const projectNameById = new Map<string, string>();
  for (const project of (projects ?? []) as Array<{ id: string; name: string | null }>) {
    projectNameById.set(project.id, project.name ?? "VYNTRO");
  }

  const settingsByIntegrationId = new Map<
    string,
    {
      commands_enabled: boolean | null;
      leaderboard_enabled: boolean | null;
      raid_ops_enabled: boolean | null;
      metadata: Record<string, unknown> | null;
    }
  >();
  for (const settings of (settingsRows ?? []) as Array<{
    integration_id: string;
    commands_enabled: boolean | null;
    leaderboard_enabled: boolean | null;
    raid_ops_enabled: boolean | null;
    metadata: Record<string, unknown> | null;
  }>) {
    settingsByIntegrationId.set(settings.integration_id, settings);
  }

  return typedIntegrations
    .map((integration) => {
      const chatId = readTelegramChatId(integration.config);
      if (!chatId) {
        return null;
      }

      const settingsRow = settingsByIntegrationId.get(integration.id);
      const metadata =
        settingsRow?.metadata && typeof settingsRow.metadata === "object"
          ? settingsRow.metadata
          : null;

      return {
        integrationId: integration.id,
        projectId: integration.project_id,
        projectName: projectNameById.get(integration.project_id) ?? "VYNTRO",
        chatId,
        settings: {
          commandsEnabled: settingsRow?.commands_enabled === true,
          missionCommandsEnabled:
            metadata ? metadata.missionCommandsEnabled !== false : true,
          captainCommandsEnabled:
            metadata ? metadata.captainCommandsEnabled !== false : true,
          commandDeepLinksEnabled:
            metadata ? metadata.commandDeepLinksEnabled !== false : true,
          captainsEnabled: metadata ? metadata.captainsEnabled === true : false,
          leaderboardEnabled: settingsRow?.leaderboard_enabled !== false,
          raidOpsEnabled: settingsRow?.raid_ops_enabled === true,
        },
      } satisfies TelegramCommunityContext;
    })
    .filter((context): context is TelegramCommunityContext => Boolean(context));
}

export async function loadTelegramIdentitySnapshot(
  telegramUserId: string,
  projectId: string
): Promise<TelegramIdentitySnapshot | null> {
  const { data: connectedAccount, error: accountError } = await supabaseAdmin
    .from("user_connected_accounts")
    .select("auth_user_id, provider_user_id, username")
    .eq("provider", "telegram")
    .eq("status", "connected")
    .eq("provider_user_id", telegramUserId)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message || "Failed to load Telegram account link.");
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
      .select("total_xp, level, trust_score")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_project_reputation")
      .select("xp, level, trust_score, quests_completed, raids_completed")
      .eq("auth_user_id", authUserId)
      .eq("project_id", projectId)
      .maybeSingle(),
    supabaseAdmin.from("wallet_links").select("id").eq("auth_user_id", authUserId).limit(1),
  ]);

  if (profileError) {
    throw new Error(profileError.message || "Failed to load Telegram profile context.");
  }
  if (globalError) {
    throw new Error(globalError.message || "Failed to load Telegram global reputation.");
  }
  if (projectError) {
    throw new Error(projectError.message || "Failed to load Telegram project reputation.");
  }
  if (walletError) {
    throw new Error(walletError.message || "Failed to load Telegram wallet state.");
  }

  return {
    authUserId,
    telegramUserId,
    telegramUsername: connectedAccount.username ?? "Linked Telegram",
    profileUsername: profile?.username ?? "Member",
    globalXp: Number(globalReputation?.total_xp ?? 0),
    globalLevel: Number(globalReputation?.level ?? 1),
    globalTrust: Number(globalReputation?.trust_score ?? 50),
    projectXp: Number(projectReputation?.xp ?? 0),
    projectLevel: Number(projectReputation?.level ?? 1),
    projectTrust: Number(projectReputation?.trust_score ?? 50),
    projectQuestsCompleted: Number(projectReputation?.quests_completed ?? 0),
    projectRaidsCompleted: Number(projectReputation?.raids_completed ?? 0),
    walletVerified: Array.isArray(walletLinks) && walletLinks.length > 0,
  };
}

function getLeaderboardCutoff(period: "weekly" | "monthly" | "all_time") {
  if (period === "all_time") {
    return null;
  }

  const days = period === "monthly" ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function loadTelegramAccountMaps(authUserIds: string[]) {
  const usernamesByAuthUserId = new Map<string, string>();
  const telegramUserIdByAuthUserId = new Map<string, string>();

  for (const chunk of chunkArray(authUserIds, 150)) {
    const [{ data: accounts, error: accountsError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        supabaseAdmin
          .from("user_connected_accounts")
          .select("auth_user_id, provider_user_id, username")
          .eq("provider", "telegram")
          .eq("status", "connected")
          .in("auth_user_id", chunk),
        supabaseAdmin
          .from("user_profiles")
          .select("auth_user_id, username")
          .in("auth_user_id", chunk),
      ]);

    if (accountsError) {
      throw new Error(accountsError.message || "Failed to load Telegram account map.");
    }
    if (profilesError) {
      throw new Error(profilesError.message || "Failed to load profile username map.");
    }

    for (const account of (accounts ?? []) as Array<{
      auth_user_id: string;
      provider_user_id: string;
      username: string | null;
    }>) {
      if (!telegramUserIdByAuthUserId.has(account.auth_user_id)) {
        telegramUserIdByAuthUserId.set(account.auth_user_id, account.provider_user_id);
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

  return { usernamesByAuthUserId, telegramUserIdByAuthUserId };
}

export async function loadTelegramLeaderboard(params: {
  projectId: string;
  period: "weekly" | "monthly" | "all_time";
  limit: number;
}) {
  const limit = Math.max(1, Math.min(15, Math.floor(params.limit)));

  if (params.period === "all_time") {
    const { data, error } = await supabaseAdmin
      .from("user_project_reputation")
      .select("auth_user_id, xp, level, trust_score, quests_completed, raids_completed")
      .eq("project_id", params.projectId)
      .order("xp", { ascending: false })
      .limit(limit * 4);

    if (error) {
      throw new Error(error.message || "Failed to load Telegram leaderboard.");
    }

    const rows = (data ?? []) as Array<{
      auth_user_id: string;
      xp: number | null;
      level: number | null;
      trust_score: number | null;
      quests_completed: number | null;
      raids_completed: number | null;
    }>;
    const { usernamesByAuthUserId, telegramUserIdByAuthUserId } = await loadTelegramAccountMaps(
      rows.map((row) => row.auth_user_id)
    );

    return rows
      .filter((row) => telegramUserIdByAuthUserId.has(row.auth_user_id))
      .map((row) => ({
        authUserId: row.auth_user_id,
        telegramUserId: telegramUserIdByAuthUserId.get(row.auth_user_id) ?? "",
        displayName:
          usernamesByAuthUserId.get(row.auth_user_id) ??
          `Member ${row.auth_user_id.slice(0, 6)}`,
        xp: Number(row.xp ?? 0),
        level: Number(row.level ?? 1),
        trust: Number(row.trust_score ?? 50),
        questsCompleted: Number(row.quests_completed ?? 0),
        raidsCompleted: Number(row.raids_completed ?? 0),
      } satisfies TelegramLeaderboardEntry))
      .slice(0, limit);
  }

  const cutoff = getLeaderboardCutoff(params.period);
  const { data: xpEvents, error: xpEventsError } = await supabaseAdmin
    .from("xp_events")
    .select("auth_user_id, effective_xp, created_at")
    .eq("project_id", params.projectId)
    .gte("created_at", cutoff ?? new Date(0).toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);

  if (xpEventsError) {
    throw new Error(xpEventsError.message || "Failed to load Telegram time-window leaderboard.");
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
    return [] as TelegramLeaderboardEntry[];
  }

  const { usernamesByAuthUserId, telegramUserIdByAuthUserId } = await loadTelegramAccountMaps(
    sortedAuthUserIds
  );
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
    const { data: rows, error } = await supabaseAdmin
      .from("user_project_reputation")
      .select("auth_user_id, level, trust_score, quests_completed, raids_completed")
      .eq("project_id", params.projectId)
      .in("auth_user_id", chunk);

    if (error) {
      throw new Error(error.message || "Failed to load Telegram leaderboard reputations.");
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
    .filter((authUserId) => telegramUserIdByAuthUserId.has(authUserId))
    .map((authUserId) => {
      const reputation = reputationRowsByAuthUserId.get(authUserId);
      return {
        authUserId,
        telegramUserId: telegramUserIdByAuthUserId.get(authUserId) ?? "",
        displayName:
          usernamesByAuthUserId.get(authUserId) ?? `Member ${authUserId.slice(0, 6)}`,
        xp: xpByAuthUserId.get(authUserId) ?? 0,
        level: reputation?.level ?? 1,
        trust: reputation?.trust ?? 50,
        questsCompleted: reputation?.questsCompleted ?? 0,
        raidsCompleted: reputation?.raidsCompleted ?? 0,
      } satisfies TelegramLeaderboardEntry;
    })
    .slice(0, limit);
}

export async function loadTelegramMissionBoard(projectId: string) {
  const [{ data: campaigns, error: campaignsError }, { data: quests, error: questsError }, { data: rewards, error: rewardsError }] =
    await Promise.all([
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

  if (campaignsError) throw new Error(campaignsError.message || "Failed to load Telegram campaigns.");
  if (questsError) throw new Error(questsError.message || "Failed to load Telegram quests.");
  if (rewardsError) throw new Error(rewardsError.message || "Failed to load Telegram rewards.");

  return {
    campaigns: (campaigns ?? []) as Array<{ id: string; title: string }>,
    quests: (quests ?? []) as Array<{ id: string; title: string; xp: number | null }>,
    rewards: (rewards ?? []) as Array<{ id: string; title: string; cost: number | null }>,
  };
}

export async function loadTelegramRaidBoard(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("raids")
    .select("id, title, reward_xp, short_description")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    throw new Error(error.message || "Failed to load Telegram raids.");
  }

  return (data ?? []) as Array<{
    id: string;
    title: string;
    reward_xp: number | null;
    short_description: string | null;
  }>;
}
