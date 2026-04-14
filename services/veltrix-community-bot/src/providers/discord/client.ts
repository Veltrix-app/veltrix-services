import { Client, GatewayIntentBits } from "discord.js";
import { env } from "../../config/env.js";

let discordClient: Client | null = null;

export function createDiscordClient() {
  if (!env.DISCORD_BOT_TOKEN) {
    return null;
  }

  if (discordClient) {
    return discordClient;
  }

  discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  return discordClient;
}

export function getDiscordClient() {
  return discordClient;
}
