import { Telegraf } from "telegraf";
import { env } from "../../config/env.js";

let telegramBot: Telegraf | null = null;

export function createTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return null;
  }

  if (telegramBot) {
    return telegramBot;
  }

  telegramBot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  return telegramBot;
}

export function getTelegramBot() {
  return telegramBot;
}
