import express from "express";
import { env } from "./config/env.js";
import { healthRouter } from "./http/health.js";
import { jobsRouter } from "./http/jobs.js";
import { webhookRouter } from "./http/webhooks.js";
import { createDiscordClient } from "./providers/discord/client.js";
import { createTelegramBot } from "./providers/telegram/bot.js";

async function bootstrap() {
  const app = express();
  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/jobs", jobsRouter);
  app.use("/webhooks", webhookRouter);

  const discordClient = createDiscordClient();
  if (discordClient && env.DISCORD_BOT_TOKEN) {
    discordClient.once("ready", () => {
      console.log(`[discord] ready as ${discordClient.user?.tag ?? "unknown bot"}`);
    });

    void discordClient.login(env.DISCORD_BOT_TOKEN).catch((error) => {
      console.error("[discord] failed to connect", error);
    });
  } else {
    console.log("[discord] skipped because DISCORD_BOT_TOKEN is not configured");
  }

  const telegramBot = createTelegramBot();
  if (telegramBot) {
    telegramBot.telegram.getMe().then((me) => {
      console.log(`[telegram] ready as @${me.username ?? "unknown_bot"}`);
    }).catch((error) => {
      console.error("[telegram] failed to connect", error);
    });
  } else {
    console.log("[telegram] skipped because TELEGRAM_BOT_TOKEN is not configured");
  }

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "veltrix-community-bot",
      providers: {
        discord: Boolean(env.DISCORD_BOT_TOKEN),
        telegram: Boolean(env.TELEGRAM_BOT_TOKEN)
      }
    });
  });

  app.listen(env.PORT, () => {
    console.log(`veltrix-community-bot listening on :${env.PORT}`);
  });
}

void bootstrap();
