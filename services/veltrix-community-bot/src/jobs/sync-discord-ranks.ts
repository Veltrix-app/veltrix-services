import type { GuildMember } from "discord.js";
import { getDiscordClient } from "../providers/discord/client.js";
import {
  loadDiscordConnectedAccountsForUserIds,
  loadDiscordIntegrationContexts,
  loadWalletVerifiedMap,
  markDiscordRankSyncAt,
  type DiscordIntegrationContext,
  type DiscordRankRule,
} from "../providers/discord/community.js";
import { doesDiscordRankRuleMatch } from "../providers/discord/ranks.js";
import { supabaseAdmin } from "../lib/supabase.js";

type SyncDiscordRanksOptions = {
  projectId?: string;
  integrationId?: string;
};

type SyncDiscordRanksResult = {
  ok: true;
  integrationsProcessed: number;
  membersEvaluated: number;
  rolesAdded: number;
  rolesRemoved: number;
  skippedIntegrations: Array<{
    integrationId: string;
    reason: string;
  }>;
};

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function loadRankSourceMaps(
  authUserIds: string[],
  projectId: string
) {
  const globalXpByAuthUserId = new Map<string, number>();
  const trustByAuthUserId = new Map<string, number>();
  const projectXpByAuthUserId = new Map<string, number>();

  for (const chunk of chunkArray(authUserIds, 150)) {
    const [
      { data: globalRows, error: globalError },
      { data: projectRows, error: projectError },
    ] = await Promise.all([
      supabaseAdmin
        .from("user_global_reputation")
        .select("auth_user_id, total_xp, trust_score")
        .in("auth_user_id", chunk),
      supabaseAdmin
        .from("user_project_reputation")
        .select("auth_user_id, xp")
        .eq("project_id", projectId)
        .in("auth_user_id", chunk),
    ]);

    if (globalError) {
      throw new Error(globalError.message || "Failed to load Discord global rank values.");
    }

    if (projectError) {
      throw new Error(projectError.message || "Failed to load Discord project rank values.");
    }

    for (const row of (globalRows ?? []) as Array<{
      auth_user_id: string;
      total_xp: number | null;
      trust_score: number | null;
    }>) {
      globalXpByAuthUserId.set(row.auth_user_id, Number(row.total_xp ?? 0));
      trustByAuthUserId.set(row.auth_user_id, Number(row.trust_score ?? 50));
    }

    for (const row of (projectRows ?? []) as Array<{
      auth_user_id: string;
      xp: number | null;
    }>) {
      projectXpByAuthUserId.set(row.auth_user_id, Number(row.xp ?? 0));
    }
  }

  const walletVerifiedAuthUserIds = await loadWalletVerifiedMap(authUserIds);

  return {
    globalXpByAuthUserId,
    trustByAuthUserId,
    projectXpByAuthUserId,
    walletVerifiedAuthUserIds,
  };
}

async function syncIntegrationRanks(context: DiscordIntegrationContext) {
  const client = getDiscordClient();
  if (!client || !client.isReady()) {
    throw new Error("Discord bot is not connected yet.");
  }

  const guild = await client.guilds.fetch(context.guildId).catch(() => null);
  if (!guild) {
    throw new Error(`Discord guild ${context.guildId} could not be resolved.`);
  }

  const managedRoleIds = context.rankRules.map((rule) => rule.discordRoleId);
  if (managedRoleIds.length === 0) {
    return {
      membersEvaluated: 0,
      rolesAdded: 0,
      rolesRemoved: 0,
    };
  }

  const members = await guild.members.fetch();
  const humanMembers = Array.from(members.values()).filter((member) => !member.user.bot);
  const memberIds = humanMembers.map((member) => member.user.id);

  if (memberIds.length === 0) {
    return {
      membersEvaluated: 0,
      rolesAdded: 0,
      rolesRemoved: 0,
    };
  }

  const linkedAccounts = [] as Array<{
    auth_user_id: string;
    provider_user_id: string;
    username: string | null;
  }>;

  for (const chunk of chunkArray(memberIds, 150)) {
    const { data, error } = await supabaseAdmin
      .from("user_connected_accounts")
      .select("auth_user_id, provider_user_id, username")
      .eq("provider", "discord")
      .eq("status", "connected")
      .in("provider_user_id", chunk);

    if (error) {
      throw new Error(error.message || "Failed to load Discord linked accounts for rank sync.");
    }

    linkedAccounts.push(
      ...((data ?? []) as Array<{
        auth_user_id: string;
        provider_user_id: string;
        username: string | null;
      }>)
    );
  }

  if (linkedAccounts.length === 0) {
    return {
      membersEvaluated: 0,
      rolesAdded: 0,
      rolesRemoved: 0,
    };
  }

  const linkedAccountsByDiscordUserId = new Map(
    linkedAccounts.map((account) => [account.provider_user_id, account])
  );
  const authUserIds = linkedAccounts.map((account) => account.auth_user_id);
  const {
    globalXpByAuthUserId,
    trustByAuthUserId,
    projectXpByAuthUserId,
    walletVerifiedAuthUserIds,
  } = await loadRankSourceMaps(authUserIds, context.projectId);
  const linkedAccountsByAuthUserId = new Map(
    linkedAccounts.map((account) => [account.auth_user_id, account])
  );

  let membersEvaluated = 0;
  let rolesAdded = 0;
  let rolesRemoved = 0;

  for (const member of humanMembers) {
    const linkedAccount = linkedAccountsByDiscordUserId.get(member.user.id);
    if (!linkedAccount) {
      continue;
    }

    const authUserId = linkedAccount.auth_user_id;
    const snapshot = {
      globalXp: globalXpByAuthUserId.get(authUserId) ?? 0,
      projectXp: projectXpByAuthUserId.get(authUserId) ?? 0,
      trust: trustByAuthUserId.get(authUserId) ?? 50,
      walletVerified: walletVerifiedAuthUserIds.has(authUserId),
    };

    const desiredRoleIds = new Set(
      context.rankRules
        .filter((rule) => doesDiscordRankRuleMatch(snapshot, rule))
        .map((rule) => rule.discordRoleId)
    );
    const currentManagedRoleIds = managedRoleIds.filter((roleId) => member.roles.cache.has(roleId));

    for (const roleId of managedRoleIds) {
      if (!guild.roles.cache.has(roleId)) {
        continue;
      }

      if (desiredRoleIds.has(roleId) && !member.roles.cache.has(roleId)) {
        await member.roles.add(roleId).catch(() => null);
        rolesAdded += 1;
      }

      if (!desiredRoleIds.has(roleId) && currentManagedRoleIds.includes(roleId)) {
        await member.roles.remove(roleId).catch(() => null);
        rolesRemoved += 1;
      }
    }

    membersEvaluated += 1;
  }

  await markDiscordRankSyncAt(context.integrationId);

  return {
    membersEvaluated,
    rolesAdded,
    rolesRemoved,
  };
}

export async function syncDiscordRanks(
  options: SyncDiscordRanksOptions = {}
): Promise<SyncDiscordRanksResult> {
  const contexts = await loadDiscordIntegrationContexts({
    projectId: options.projectId,
    integrationId: options.integrationId,
  });

  const eligibleContexts = contexts.filter(
    (context) => context.settings.rankSyncEnabled && context.rankRules.length > 0
  );
  const skippedIntegrations = contexts
    .filter((context) => !(context.settings.rankSyncEnabled && context.rankRules.length > 0))
    .map((context) => ({
      integrationId: context.integrationId,
      reason: context.settings.rankSyncEnabled
        ? "No rank rules configured."
        : "Rank sync disabled.",
    }));

  let membersEvaluated = 0;
  let rolesAdded = 0;
  let rolesRemoved = 0;

  for (const context of eligibleContexts) {
    try {
      const result = await syncIntegrationRanks(context);
      membersEvaluated += result.membersEvaluated;
      rolesAdded += result.rolesAdded;
      rolesRemoved += result.rolesRemoved;
    } catch (error) {
      skippedIntegrations.push({
        integrationId: context.integrationId,
        reason: error instanceof Error ? error.message : "Discord rank sync failed.",
      });
    }
  }

  return {
    ok: true,
    integrationsProcessed: eligibleContexts.length,
    membersEvaluated,
    rolesAdded,
    rolesRemoved,
    skippedIntegrations,
  };
}
