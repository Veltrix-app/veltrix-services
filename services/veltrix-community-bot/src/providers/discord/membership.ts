import { supabaseAdmin } from "../../lib/supabase.js";
import { sendVerificationConfirm } from "../../core/callbacks/confirm-client.js";

export async function confirmDiscordMembership(params: {
  authUserId: string;
  questId: string;
  guildId: string;
  discordUserId: string;
}) {
  const { error } = await supabaseAdmin.from("verification_events").insert({
    auth_user_id: params.authUserId,
    quest_id: params.questId,
    provider: "discord",
    event_type: "discord_membership_confirmed",
    external_ref: params.guildId,
    metadata: {
      discordUserId: params.discordUserId
    }
  });

  if (error) {
    throw new Error(`Failed to store Discord verification event: ${error.message}`);
  }

  return sendVerificationConfirm({
    authUserId: params.authUserId,
    questId: params.questId,
    provider: "discord",
    eventType: "discord_membership_confirmed",
    externalRef: params.guildId,
    metadata: {
      discordUserId: params.discordUserId
    }
  });
}
