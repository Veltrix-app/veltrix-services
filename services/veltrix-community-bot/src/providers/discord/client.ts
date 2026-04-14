import { Client, GatewayIntentBits } from "discord.js";
import { env } from "../../config/env.js";

export function createDiscordClient() {
  if (!env.DISCORD_BOT_TOKEN) {
    return null;
  }

  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });
}
