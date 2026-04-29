import express from "express";
import { aespRouter } from "./http/aesp.js";
import { env } from "./config/env.js";
import { communityJourneysRouter } from "./http/community-journeys.js";
import { communityOpsRouter } from "./http/community-ops.js";
import { healthRouter } from "./http/health.js";
import { jobsRouter } from "./http/jobs.js";
import { tradingRouter } from "./http/trading.js";
import { webhookRouter } from "./http/webhooks.js";
import { createDiscordClient } from "./providers/discord/client.js";
import {
  registerDiscordCommandHandlers,
  syncDiscordGuildCommands,
} from "./providers/discord/commands.js";
import { createTelegramBot, launchTelegramBot } from "./providers/telegram/bot.js";
import { startXRaidSourcePoller } from "./jobs/schedule-x-raid-poller.js";

async function bootstrap() {
  const app = express();
  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/jobs", jobsRouter);
  app.use("/community", communityOpsRouter);
  app.use("/community/journeys", communityJourneysRouter);
  app.use("/webhooks", webhookRouter);
  app.use("/aesp", aespRouter);
  app.use("/trading", tradingRouter);

  const discordClient = createDiscordClient();
  if (discordClient && env.DISCORD_BOT_TOKEN) {
    registerDiscordCommandHandlers(discordClient);

    discordClient.once("ready", () => {
      console.log(`[discord] ready as ${discordClient.user?.tag ?? "unknown bot"}`);
      void syncDiscordGuildCommands(discordClient)
        .then((result) => {
          console.log(
            `[discord] synced commands for ${result.guildsProcessed} guild(s); enabled=${result.guildsEnabled} cleared=${result.guildsCleared}`
          );
        })
        .catch((error) => {
          console.error("[discord] failed to sync guild commands", error);
        });
    });

    void discordClient.login(env.DISCORD_BOT_TOKEN).catch((error) => {
      console.error("[discord] failed to connect", error);
    });
  } else {
    console.log("[discord] skipped because DISCORD_BOT_TOKEN is not configured");
  }

  const telegramBot = createTelegramBot();
  if (telegramBot) {
    void launchTelegramBot()
      .then(async (bot) => {
        const me = await bot?.telegram.getMe();
        console.log(`[telegram] ready as @${me?.username ?? "unknown_bot"}`);
      })
      .catch((error) => {
        console.error("[telegram] failed to connect", error);
      });
  } else {
    console.log("[telegram] skipped because TELEGRAM_BOT_TOKEN is not configured");
  }

  startXRaidSourcePoller();

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "vyntro-community-bot",
      providers: {
        discord: Boolean(env.DISCORD_BOT_TOKEN),
        telegram: Boolean(env.TELEGRAM_BOT_TOKEN)
      }
    });
  });

  app.listen(env.PORT, () => {
    console.log(`vyntro-community-bot listening on :${env.PORT}`);
  });
}

void bootstrap();
