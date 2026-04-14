import { Router } from "express";
import { z } from "zod";
import { confirmDiscordMembership } from "../providers/discord/membership.js";
import { confirmTelegramMembership } from "../providers/telegram/membership.js";
import { env } from "../config/env.js";

export const webhookRouter = Router();

const discordPayloadSchema = z.object({
  authUserId: z.string().uuid(),
  questId: z.string().uuid(),
  guildId: z.string().min(1),
  discordUserId: z.string().min(1)
});

const telegramPayloadSchema = z.object({
  authUserId: z.string().uuid(),
  questId: z.string().uuid(),
  chatId: z.string().min(1),
  telegramUserId: z.string().min(1)
});

function hasValidWebhookSecret(secretHeader: string | undefined) {
  if (!env.COMMUNITY_BOT_WEBHOOK_SECRET) {
    return true;
  }

  return secretHeader === env.COMMUNITY_BOT_WEBHOOK_SECRET;
}

webhookRouter.post("/discord", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = discordPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Discord webhook payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await confirmDiscordMembership(parsed.data);
    return res.status(202).json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Discord confirmation failed."
    });
  }
});

webhookRouter.post("/telegram", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = telegramPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Telegram webhook payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await confirmTelegramMembership(parsed.data);
    return res.status(202).json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Telegram confirmation failed."
    });
  }
});
