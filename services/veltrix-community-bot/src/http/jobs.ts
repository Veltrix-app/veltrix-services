import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { runActiveXpDecayJob } from "../jobs/active-xp-decay.js";
import { runOnchainEnrichmentJob } from "../jobs/enrich-onchain-events.js";
import { refreshStakeStates } from "../jobs/refresh-stake-states.js";
import { retryPendingCommunityVerifications } from "../jobs/retry-community-verifications.js";
import { retryOnchainIngressJob } from "../jobs/retry-onchain-ingress.js";

export const jobsRouter = Router();

const retrySchema = z.object({
  limit: z.number().int().positive().max(200).optional()
});
const maintenanceSchema = z.object({
  limit: z.number().int().positive().max(500).optional()
});

function hasValidJobSecret(secretHeader: string | undefined) {
  if (!env.COMMUNITY_RETRY_JOB_SECRET) {
    return true;
  }

  return secretHeader === env.COMMUNITY_RETRY_JOB_SECRET;
}

jobsRouter.post("/retry-community-verifications", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = retrySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid retry job payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await retryPendingCommunityVerifications(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Retry job failed."
    });
  }
});

jobsRouter.post("/active-xp-decay", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = maintenanceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid active XP decay payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await runActiveXpDecayJob(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Active XP decay job failed."
    });
  }
});

jobsRouter.post("/refresh-stake-states", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = maintenanceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid stake refresh payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await refreshStakeStates(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Stake refresh job failed."
    });
  }
});

jobsRouter.post("/enrich-onchain-events", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = maintenanceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid on-chain enrichment payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await runOnchainEnrichmentJob(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "On-chain enrichment job failed."
    });
  }
});

jobsRouter.post("/retry-onchain-ingress", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = retrySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid on-chain retry payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await retryOnchainIngressJob(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "On-chain retry job failed."
    });
  }
});
