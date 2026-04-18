import { Router } from "express";
import { z } from "zod";
import { confirmDiscordMembership } from "../providers/discord/membership.js";
import { verifyDiscordQuestMembership } from "../providers/discord/verification.js";
import { sendDiscordPush } from "../providers/discord/push.js";
import { confirmTelegramMembership } from "../providers/telegram/membership.js";
import { verifyTelegramQuestMembership } from "../providers/telegram/verification.js";
import { sendTelegramPush } from "../providers/telegram/push.js";
import { emitXpEvent } from "../core/aesp/ledger.js";
import { ingestOnchainEvents } from "../core/aesp/onchain.js";
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
  eyebrow: z.string().min(1).optional(),
  projectName: z.string().min(1).optional(),
  campaignTitle: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  accentColor: z.string().min(1).optional(),
  meta: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).optional(),
  url: z.string().url().optional(),
  buttonLabel: z.string().min(1).optional()
});

const telegramPushSchema = z.object({
  targetChatId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  eyebrow: z.string().min(1).optional(),
  projectName: z.string().min(1).optional(),
  campaignTitle: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  fallbackImageUrl: z.string().url().optional(),
  meta: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).optional(),
  url: z.string().url().optional(),
  buttonLabel: z.string().min(1).optional()
});

const questEventSchema = z.object({
  authUserId: z.string().uuid(),
  questId: z.string().uuid(),
  projectId: z.string().uuid(),
  campaignId: z.string().uuid().optional().nullable(),
  xpAmount: z.number().positive(),
  baseValue: z.number().positive().optional(),
  qualityMultiplier: z.number().positive().optional(),
  trustMultiplier: z.number().positive().optional(),
  actionMultiplier: z.number().positive().optional(),
  sourceRef: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const raidEventSchema = z.object({
  authUserId: z.string().uuid(),
  raidId: z.string().uuid(),
  projectId: z.string().uuid(),
  campaignId: z.string().uuid().optional().nullable(),
  xpAmount: z.number().positive(),
  baseValue: z.number().positive().optional(),
  qualityMultiplier: z.number().positive().optional(),
  trustMultiplier: z.number().positive().optional(),
  actionMultiplier: z.number().positive().optional(),
  sourceRef: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const onchainEventSchema = z.object({
  chain: z.literal("evm"),
  walletAddress: z.string().min(1),
  txHash: z.string().min(1),
  occurredAt: z.string().datetime(),
  eventType: z.enum([
    "buy",
    "hold",
    "transfer_in",
    "transfer_out",
    "stake",
    "unstake",
    "lp_add",
    "lp_remove",
    "contract_call"
  ]),
  contractAddress: z.string().min(1),
  tokenAddress: z.string().min(1).optional().nullable(),
  usdValue: z.number().nonnegative().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  baseValue: z.number().nonnegative().optional().nullable(),
  qualityMultiplier: z.number().positive().optional().nullable(),
  trustMultiplier: z.number().positive().optional().nullable(),
  actionMultiplier: z.number().positive().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable()
});

const onchainIngressSchema = z.object({
  projectId: z.string().uuid(),
  events: z.array(onchainEventSchema).min(1).max(100)
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

webhookRouter.post("/quest-events", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = questEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid quest event payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const payload = parsed.data;
    const result = await emitXpEvent({
      authUserId: payload.authUserId,
      projectId: payload.projectId,
      campaignId: payload.campaignId ?? null,
      sourceType: "quest",
      sourceRef: payload.sourceRef ?? payload.questId,
      baseValue: payload.baseValue ?? payload.xpAmount,
      xpAmount: payload.xpAmount,
      qualityMultiplier: payload.qualityMultiplier,
      trustMultiplier: payload.trustMultiplier,
      actionMultiplier: payload.actionMultiplier,
      effectiveXp: payload.xpAmount,
      metadata: {
        questId: payload.questId,
        ...(payload.metadata ?? {})
      }
    });

    return res.status(200).json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Quest ledger event failed."
    });
  }
});

webhookRouter.post("/raid-events", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = raidEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid raid event payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const payload = parsed.data;
    const result = await emitXpEvent({
      authUserId: payload.authUserId,
      projectId: payload.projectId,
      campaignId: payload.campaignId ?? null,
      sourceType: "raid",
      sourceRef: payload.sourceRef ?? payload.raidId,
      baseValue: payload.baseValue ?? payload.xpAmount,
      xpAmount: payload.xpAmount,
      qualityMultiplier: payload.qualityMultiplier,
      trustMultiplier: payload.trustMultiplier,
      actionMultiplier: payload.actionMultiplier,
      effectiveXp: payload.xpAmount,
      metadata: {
        raidId: payload.raidId,
        ...(payload.metadata ?? {})
      }
    });

    return res.status(200).json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Raid ledger event failed."
    });
  }
});

webhookRouter.post("/onchain-events", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = onchainIngressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid on-chain ingress payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await ingestOnchainEvents(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "On-chain ingress failed."
    });
  }
});
