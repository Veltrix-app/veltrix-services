import { Router, type Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import {
  createTradingCompetition,
  getTradingCompetition,
  getTradingCompetitionLeaderboard,
  joinTradingCompetition,
  listTradingCompetitions,
} from "../core/trading/repository.js";
import { settleTradingCompetition } from "../core/trading/settlement.js";
import { runTradingLiveTrackingJobs } from "../core/trading/live-tracking.js";
import { runTradingSnapshotJobs } from "../core/trading/snapshots.js";

export const tradingRouter = Router();

const pairSchema = z.object({
  chain: z.string().min(1).optional(),
  baseSymbol: z.string().min(1),
  quoteSymbol: z.string().min(1).optional(),
  baseTokenAddress: z.string().min(1),
  quoteTokenAddress: z.string().min(1).nullable().optional(),
  poolAddress: z.string().min(1).nullable().optional(),
  routerAddress: z.string().min(1).nullable().optional(),
  minTradeUsd: z.coerce.number().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const rewardSchema = z.object({
  rewardAsset: z.string().min(1),
  rewardAmount: z.coerce.number().min(0),
  rankFrom: z.coerce.number().int().positive().nullable().optional(),
  rankTo: z.coerce.number().int().positive().nullable().optional(),
  rewardType: z.enum(["rank", "raffle", "participation", "xp"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createCompetitionSchema = z.object({
  projectId: z.string().uuid(),
  campaignId: z.string().uuid().nullable().optional(),
  createdByAuthUserId: z.string().uuid().nullable().optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "scheduled", "live", "paused", "settling", "settled", "cancelled"]).optional(),
  trackingMode: z.enum(["snapshot", "live"]).optional(),
  scoringMode: z.enum(["volume", "roi", "hybrid"]).optional(),
  chain: z.string().min(1).optional(),
  quoteSymbol: z.string().min(1).optional(),
  registrationStartsAt: z.string().datetime().nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  freezeAt: z.string().datetime().nullable().optional(),
  snapshotCadence: z.enum(["start_end", "hourly", "daily"]).optional(),
  budgetCapCents: z.coerce.number().int().min(0).optional(),
  rules: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  pairs: z.array(pairSchema).min(1),
  rewards: z.array(rewardSchema).optional(),
});

const joinSchema = z.object({
  authUserId: z.string().uuid(),
});

const settleSchema = z.object({
  triggeredByAuthUserId: z.string().uuid().nullable().optional(),
});

const jobSchema = z.object({
  mode: z.enum(["snapshot", "live", "all"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

function hasValidWebhookSecret(secretHeader: string | undefined) {
  if (!env.COMMUNITY_BOT_WEBHOOK_SECRET) {
    return true;
  }

  return secretHeader === env.COMMUNITY_BOT_WEBHOOK_SECRET;
}

function guard(reqSecret: string | undefined, res: Response) {
  if (hasValidWebhookSecret(reqSecret)) {
    return true;
  }

  res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  return false;
}

tradingRouter.get("/competitions", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const mode = typeof req.query.mode === "string" ? req.query.mode : undefined;
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const result = await listTradingCompetitions({
      projectId,
      status:
        status === "draft" ||
        status === "scheduled" ||
        status === "live" ||
        status === "paused" ||
        status === "settling" ||
        status === "settled" ||
        status === "cancelled"
          ? status
          : undefined,
      trackingMode: mode === "snapshot" || mode === "live" ? mode : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competitions could not be loaded.",
    });
  }
});

tradingRouter.post("/competitions", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  const parsed = createCompetitionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Trading Arena payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await createTradingCompetition(parsed.data);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition could not be created.",
    });
  }
});

tradingRouter.get("/competitions/:competitionId", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  try {
    const result = await getTradingCompetition({ competitionId: req.params.competitionId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition was not found.",
    });
  }
});

tradingRouter.post("/competitions/:competitionId/join", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Trading Arena join payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await joinTradingCompetition({
      competitionId: req.params.competitionId,
      authUserId: parsed.data.authUserId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition join failed.",
    });
  }
});

tradingRouter.get("/competitions/:competitionId/leaderboard", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const result = await getTradingCompetitionLeaderboard({
      competitionId: req.params.competitionId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition leaderboard failed.",
    });
  }
});

tradingRouter.post("/competitions/:competitionId/settle", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  const parsed = settleSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Trading Arena settlement payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await settleTradingCompetition({
      competitionId: req.params.competitionId,
      triggeredByAuthUserId: parsed.data.triggeredByAuthUserId ?? null,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition settlement failed.",
    });
  }
});

tradingRouter.post("/jobs/run", async (req, res) => {
  if (!guard(req.header("x-community-bot-secret") ?? undefined, res)) return;

  const parsed = jobSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Trading Arena job payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const mode = parsed.data.mode ?? "all";
    const snapshot = mode === "snapshot" || mode === "all" ? await runTradingSnapshotJobs(parsed.data) : null;
    const live = mode === "live" || mode === "all" ? await runTradingLiveTrackingJobs(parsed.data) : null;
    return res.status(200).json({ ok: true, snapshot, live });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading Arena job failed.",
    });
  }
});
