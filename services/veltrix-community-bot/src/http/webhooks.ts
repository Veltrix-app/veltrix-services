import { Router } from "express";
import { z } from "zod";
import { confirmDiscordMembership } from "../providers/discord/membership.js";
import { verifyDiscordQuestMembership } from "../providers/discord/verification.js";
import { sendDiscordPush } from "../providers/discord/push.js";
import { confirmTelegramMembership } from "../providers/telegram/membership.js";
import { verifyTelegramQuestMembership } from "../providers/telegram/verification.js";
import { sendTelegramPush } from "../providers/telegram/push.js";
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

const discordVerificationSchema = z.object({
  authUserId: z.string().uuid(),
  questId: z.string().uuid()
});

const telegramVerificationSchema = z.object({
  authUserId: z.string().uuid(),
  questId: z.string().uuid()
});

const discordPushSchema = z.object({
  targetChannelId: z.string().min(1),
  targetThreadId: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().url().optional(),
  buttonLabel: z.string().min(1).optional()
});

const telegramPushSchema = z.object({
  targetChatId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().url().optional(),
  buttonLabel: z.string().min(1).optional()
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

webhookRouter.post("/discord/verify", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = discordVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Discord verification payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await verifyDiscordQuestMembership(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Discord membership verification failed."
    });
  }
});

webhookRouter.post("/discord/push", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = discordPushSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Discord push payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await sendDiscordPush(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Discord push failed."
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

webhookRouter.post("/telegram/verify", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = telegramVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Telegram verification payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await verifyTelegramQuestMembership(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Telegram membership verification failed."
    });
  }
});

webhookRouter.post("/telegram/push", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = telegramPushSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Telegram push payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await sendTelegramPush(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Telegram push failed."
    });
  }
});
