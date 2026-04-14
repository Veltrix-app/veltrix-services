import { Telegraf } from "telegraf";
import { env } from "../../config/env.js";

export function createTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return null;
  }

  return new Telegraf(env.TELEGRAM_BOT_TOKEN);
}
