import { z } from "zod";
import { getDiscordClient } from "./client.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { confirmDiscordMembership } from "./membership.js";

const integrationConfigSchema = z
  .object({
    guildId: z.string().min(1).optional(),
    serverId: z.string().min(1).optional()
  })
  .passthrough();

const questVerificationConfigSchema = z
  .object({
    guildId: z.string().min(1).optional(),
    serverId: z.string().min(1).optional(),
    inviteUrl: z.string().min(1).optional(),
    eventType: z.string().min(1).optional()
  })
  .passthrough();

function resolveGuildId(
  integrationConfig: Record<string, unknown> | null | undefined,
  verificationConfig: Record<string, unknown> | null | undefined
) {
  const parsedIntegration = integrationConfigSchema.safeParse(integrationConfig ?? {});
  const parsedVerification = questVerificationConfigSchema.safeParse(verificationConfig ?? {});

  return (
    parsedIntegration.data?.guildId ??
    parsedIntegration.data?.serverId ??
    parsedVerification.data?.guildId ??
    parsedVerification.data?.serverId ??
    ""
  ).trim();
}

export async function verifyDiscordQuestMembership(params: {
  authUserId: string;
  questId: string;
}) {
  const discordClient = getDiscordClient();

  if (!discordClient) {
    throw new Error("Discord bot is not configured.");
  }

  if (!discordClient.isReady()) {
    throw new Error("Discord bot is not connected yet.");
  }

  const { data: quest, error: questError } = await supabaseAdmin
    .from("quests")
    .select("id, title, project_id, verification_provider, completion_mode, verification_config")
    .eq("id", params.questId)
    .single();

  if (questError || !quest) {
    throw new Error("Quest not found.");
  }

  if (quest.verification_provider !== "discord" || quest.completion_mode !== "integration_auto") {
    throw new Error("Quest is not configured for Discord integration verification.");
  }

  const [{ data: connectedAccount, error: connectedAccountError }, { data: projectIntegration, error: integrationError }] =
    await Promise.all([
      supabaseAdmin
        .from("user_connected_accounts")
        .select("provider_user_id, username, status")
        .eq("auth_user_id", params.authUserId)
        .eq("provider", "discord")
        .eq("status", "connected")
        .maybeSingle(),
      supabaseAdmin
        .from("project_integrations")
        .select("status, config")
        .eq("project_id", quest.project_id)
        .eq("provider", "discord")
        .maybeSingle()
    ]);

  if (connectedAccountError) {
    throw new Error(connectedAccountError.message || "Failed to load connected Discord account.");
  }

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load Discord integration.");
  }

  if (!connectedAccount?.provider_user_id) {
    throw new Error("User has no linked Discord account.");
  }

  if (!projectIntegration || projectIntegration.status !== "connected") {
    throw new Error("Project has no active Discord integration.");
  }

  const guildId = resolveGuildId(
    projectIntegration.config as Record<string, unknown> | null | undefined,
    quest.verification_config as Record<string, unknown> | null | undefined
  );

  if (!guildId) {
    throw new Error("Discord integration is missing guildId/serverId configuration.");
  }

  const guild = await discordClient.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    throw new Error("Discord guild could not be reached by the community bot.");
  }

  const member = await guild.members.fetch(connectedAccount.provider_user_id).catch(() => null);

  if (!member) {
    return {
      ok: true,
      status: "pending" as const,
      questId: quest.id,
      guildId,
      discordUserId: connectedAccount.provider_user_id,
      message: "User is not a member of the configured Discord guild yet."
    };
  }

  const confirmResult = await confirmDiscordMembership({
    authUserId: params.authUserId,
    questId: quest.id,
    guildId,
    discordUserId: connectedAccount.provider_user_id
  });

  return {
    ok: true,
    status: "approved" as const,
    questId: quest.id,
    guildId,
    discordUserId: connectedAccount.provider_user_id,
    confirmation: confirmResult
  };
}
