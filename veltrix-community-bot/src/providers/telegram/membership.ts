import { supabaseAdmin } from "../../lib/supabase.js";
import { sendVerificationConfirm } from "../../core/callbacks/confirm-client.js";

export async function confirmTelegramMembership(params: {
  authUserId: string;
  questId: string;
  chatId: string;
  telegramUserId: string;
}) {
  const { error } = await supabaseAdmin.from("verification_events").insert({
    auth_user_id: params.authUserId,
    quest_id: params.questId,
    provider: "telegram",
    event_type: "telegram_membership_confirmed",
    external_ref: params.chatId,
    metadata: {
      telegramUserId: params.telegramUserId
    }
  });

  if (error) {
    throw new Error(`Failed to store Telegram verification event: ${error.message}`);
  }

  return sendVerificationConfirm({
    authUserId: params.authUserId,
    questId: params.questId,
    provider: "telegram",
    eventType: "telegram_membership_confirmed",
    externalRef: params.chatId,
    metadata: {
      telegramUserId: params.telegramUserId
    }
  });
}
