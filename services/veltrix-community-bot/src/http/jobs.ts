import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { runActiveXpDecayJob } from "../jobs/active-xp-decay.js";
import { runCommunityAutomationsJob } from "../jobs/run-community-automations.js";
import { runOnchainEnrichmentJob } from "../jobs/enrich-onchain-events.js";
import { postCommunityLeaderboards } from "../jobs/post-community-leaderboards.js";
import { runRefreshPlatformMetricSnapshotsJob } from "../jobs/refresh-platform-metric-snapshots.js";
import {
  runRefreshCommunityCaptainQueueJob,
  runRefreshCommunityStatusSnapshotsJob,
} from "../jobs/refresh-community-status-snapshots.js";
import { refreshStakeStates } from "../jobs/refresh-stake-states.js";
import { retryPendingCommunityVerifications } from "../jobs/retry-community-verifications.js";
import { retryOnchainIngressJob } from "../jobs/retry-onchain-ingress.js";
import { syncDiscordRanks } from "../jobs/sync-discord-ranks.js";
import { runOnchainProviderSyncJob } from "../jobs/sync-onchain-provider.js";
import { ingestXRaidPost } from "../jobs/ingest-x-raid-post.js";
import { getDiscordClient } from "../providers/discord/client.js";
import { syncDiscordGuildCommands } from "../providers/discord/commands.js";

export const jobsRouter = Router();

const retrySchema = z.object({
  limit: z.number().int().positive().max(200).optional()
});
const maintenanceSchema = z.object({
  limit: z.number().int().positive().max(500).optional()
});
const providerSyncSchema = z.object({
  projectId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(200).optional(),
  maxBlocks: z.number().int().positive().max(100_000).optional()
});
const discordCommunitySchema = z.object({
  projectId: z.string().uuid().optional(),
  integrationId: z.string().uuid().optional(),
  force: z.boolean().optional(),
});
const ingestXRaidPostSchema = z.object({
  projectId: z.string().uuid(),
  sourceId: z.string().uuid().optional(),
  forceMode: z.enum(["review", "auto_live"]).optional(),
  post: z.object({
    id: z.string().min(1),
    authorId: z.string().optional().nullable(),
    username: z.string().min(1),
    text: z.string().min(1),
    url: z.string().url().optional().nullable(),
    mediaUrls: z.array(z.string().url()).optional(),
    createdAt: z.string().datetime().optional().nullable(),
    isReply: z.boolean().optional(),
    isRepost: z.boolean().optional(),
    replyToPostId: z.string().optional().nullable(),
  }),
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

jobsRouter.post("/sync-onchain-provider", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = providerSyncSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid on-chain provider sync payload.",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = await runOnchainProviderSyncJob(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "On-chain provider sync failed."
    });
  }
});

jobsRouter.post("/sync-discord-ranks", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = discordCommunitySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Discord rank sync payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await syncDiscordRanks(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Discord rank sync failed.",
    });
  }
});

jobsRouter.post("/post-community-leaderboards", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = discordCommunitySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid community leaderboard payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await postCommunityLeaderboards(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community leaderboard post failed.",
    });
  }
});

jobsRouter.post("/ingest-x-raid-post", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = ingestXRaidPostSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid X raid ingest payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await ingestXRaidPost(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "X raid ingest failed.",
    });
  }
});

jobsRouter.post("/sync-discord-commands", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = discordCommunitySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Discord command sync payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const client = getDiscordClient();
    if (!client || !client.isReady()) {
      return res.status(503).json({
        ok: false,
        error: "Discord bot is not connected yet.",
      });
    }

    const result = await syncDiscordGuildCommands(client, parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Discord command sync failed.",
    });
  }
});

jobsRouter.post("/run-community-automations", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = providerSyncSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Community OS automation payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runCommunityAutomationsJob({
      projectId: parsed.data.projectId,
      limit: parsed.data.limit,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community automation job failed.",
    });
  }
});

jobsRouter.post("/refresh-community-status-snapshots", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = providerSyncSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid community status refresh payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runRefreshCommunityStatusSnapshotsJob({
      projectId: parsed.data.projectId,
      limit: parsed.data.limit,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community status refresh failed.",
    });
  }
});

jobsRouter.post("/refresh-community-captain-queue", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = providerSyncSchema.safeParse(req.body ?? {});
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

jobsRouter.post("/refresh-platform-metric-snapshots", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = maintenanceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid platform metric snapshot payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runRefreshPlatformMetricSnapshotsJob();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Platform metric snapshot job failed.",
    });
  }
});
