import { z } from "zod";
import { getTelegramBot } from "./bot.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { confirmTelegramMembership } from "./membership.js";

const integrationConfigSchema = z
  .object({
    chatId: z.union([z.string().min(1), z.number()]).optional(),
    groupId: z.union([z.string().min(1), z.number()]).optional()
  })
  .passthrough();

const questVerificationConfigSchema = z
  .object({
    chatId: z.union([z.string().min(1), z.number()]).optional(),
    groupId: z.union([z.string().min(1), z.number()]).optional(),
    groupUrl: z.string().min(1).optional(),
    eventType: z.string().min(1).optional()
  })
  .passthrough();

function normalizeId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return "";
}

function resolveChatId(
  integrationConfig: Record<string, unknown> | null | undefined,
  verificationConfig: Record<string, unknown> | null | undefined
) {
  const parsedIntegration = integrationConfigSchema.safeParse(integrationConfig ?? {});
  const parsedVerification = questVerificationConfigSchema.safeParse(verificationConfig ?? {});

  return (
    normalizeId(parsedIntegration.data?.chatId) ||
    normalizeId(parsedIntegration.data?.groupId) ||
    normalizeId(parsedVerification.data?.chatId) ||
    normalizeId(parsedVerification.data?.groupId)
  );
}

function isMemberStatus(status: string) {
  return status === "creator" || status === "administrator" || status === "member";
}

export async function verifyTelegramQuestMembership(params: {
  authUserId: string;
  questId: string;
}) {
  const telegramBot = getTelegramBot();

  if (!telegramBot) {
    throw new Error("Telegram bot is not configured.");
  }

  const { data: quest, error: questError } = await supabaseAdmin
    .from("quests")
    .select("id, title, project_id, verification_provider, completion_mode, verification_config")
    .eq("id", params.questId)
    .single();

  if (questError || !quest) {
    throw new Error("Quest not found.");
  }

  if (quest.verification_provider !== "telegram" || quest.completion_mode !== "integration_auto") {
    throw new Error("Quest is not configured for Telegram integration verification.");
  }

  const [{ data: connectedAccount, error: connectedAccountError }, { data: projectIntegration, error: integrationError }] =
    await Promise.all([
      supabaseAdmin
        .from("user_connected_accounts")
        .select("provider_user_id, username, status")
        .eq("auth_user_id", params.authUserId)
        .eq("provider", "telegram")
        .eq("status", "connected")
        .maybeSingle(),
      supabaseAdmin
        .from("project_integrations")
        .select("status, config")
        .eq("project_id", quest.project_id)
        .eq("provider", "telegram")
        .maybeSingle()
    ]);

  if (connectedAccountError) {
    throw new Error(connectedAccountError.message || "Failed to load connected Telegram account.");
  }

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load Telegram integration.");
  }

  if (!connectedAccount?.provider_user_id) {
    throw new Error("User has no linked Telegram account.");
  }

  if (!projectIntegration || projectIntegration.status !== "connected") {
    throw new Error("Project has no active Telegram integration.");
  }

  const chatId = resolveChatId(
    projectIntegration.config as Record<string, unknown> | null | undefined,
    quest.verification_config as Record<string, unknown> | null | undefined
  );

  if (!chatId) {
    throw new Error("Telegram integration is missing chatId/groupId configuration.");
  }

  const chatMember = await telegramBot.telegram
    .getChatMember(chatId, connectedAccount.provider_user_id)
    .catch(() => null);

  if (!chatMember || !isMemberStatus(chatMember.status)) {
    return {
      ok: true,
      status: "pending" as const,
      questId: quest.id,
      chatId,
      telegramUserId: connectedAccount.provider_user_id,
      message: "User is not a member of the configured Telegram group yet."
    };
  }

  const confirmResult = await confirmTelegramMembership({
    authUserId: params.authUserId,
    questId: quest.id,
    chatId,
    telegramUserId: connectedAccount.provider_user_id
  });

  return {
    ok: true,
    status: "approved" as const,
    questId: quest.id,
    chatId,
    telegramUserId: connectedAccount.provider_user_id,
    confirmation: confirmResult
  };
}
