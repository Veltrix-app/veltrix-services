import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import {
  getCampaignStakeLeaderboard,
  refreshCampaignStake,
  stakeXpIntoCampaign,
} from "../core/aesp/staking.js";
import { finalizeCampaignRewards } from "../core/aesp/rewards.js";

export const aespRouter = Router();

const createStakeSchema = z.object({
  authUserId: z.string().uuid(),
  stakedXp: z.coerce.number().positive(),
});

const refreshStakeSchema = z.object({
  authUserId: z.string().uuid(),
});

const finalizeRewardsSchema = z
  .object({
    triggeredBy: z.string().uuid().optional(),
  })
  .optional();

function hasValidWebhookSecret(secretHeader: string | undefined) {
  if (!env.COMMUNITY_BOT_WEBHOOK_SECRET) {
    return true;
  }

  return secretHeader === env.COMMUNITY_BOT_WEBHOOK_SECRET;
}

aespRouter.post("/campaigns/:campaignId/stakes", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = createStakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid campaign stake payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await stakeXpIntoCampaign({
      authUserId: parsed.data.authUserId,
      campaignId: req.params.campaignId,
      stakedXp: parsed.data.stakedXp,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Campaign stake failed.",
    });
  }
});

aespRouter.post("/campaigns/:campaignId/stakes/:stakeId/refresh", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = refreshStakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid stake refresh payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await refreshCampaignStake({
      authUserId: parsed.data.authUserId,
      campaignId: req.params.campaignId,
      stakeId: req.params.stakeId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Stake refresh failed.",
    });
  }
});

aespRouter.get("/campaigns/:campaignId/leaderboard", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

  try {
    const result = await getCampaignStakeLeaderboard({
      campaignId: req.params.campaignId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Campaign leaderboard failed.",
    });
  }
});

aespRouter.post("/rewards/:campaignId/finalize", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = finalizeRewardsSchema.safeParse(req.body ?? undefined);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid reward finalization payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await finalizeCampaignRewards({
      campaignId: req.params.campaignId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Reward finalization failed.",
    });
  }
});
