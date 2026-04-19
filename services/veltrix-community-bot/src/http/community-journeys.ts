import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { recordCommunityJourneyNudge } from "../core/community/journeys.js";
import {
  runRefreshCommunityCaptainQueueJob,
  runRefreshCommunityStatusSnapshotsJob,
} from "../jobs/refresh-community-status-snapshots.js";

export const communityJourneysRouter = Router();

const refreshSchema = z.object({
  projectId: z.string().uuid().optional(),
  authUserId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(200).optional(),
});

const nudgeSchema = z.object({
  projectId: z.string().uuid(),
  authUserId: z.string().uuid(),
  lane: z.enum(["onboarding", "active", "comeback"]).optional(),
  automationType: z.string().optional(),
  cooldownHours: z.number().int().positive().max(168).optional(),
});

function hasValidJobSecret(secretHeader: string | undefined) {
  const acceptedSecrets = [
    env.COMMUNITY_RETRY_JOB_SECRET,
    env.COMMUNITY_BOT_WEBHOOK_SECRET,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (acceptedSecrets.length === 0) {
    return true;
  }

  return acceptedSecrets.includes(secretHeader ?? "");
}

communityJourneysRouter.post("/refresh", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = refreshSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid community journey refresh payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runRefreshCommunityStatusSnapshotsJob(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community journey refresh failed.",
    });
  }
});

communityJourneysRouter.post("/queue/refresh", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = refreshSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid captain queue refresh payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runRefreshCommunityCaptainQueueJob({
      projectId: parsed.data.projectId,
      limit: parsed.data.limit,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Captain queue refresh failed.",
    });
  }
});

communityJourneysRouter.post("/nudge", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = nudgeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid community journey nudge payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await recordCommunityJourneyNudge(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community journey nudge failed.",
    });
  }
});
