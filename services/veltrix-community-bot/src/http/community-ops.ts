import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { runCommunityAutomation } from "../core/community/automations.js";
import { runCommunityPlaybook } from "../core/community/playbooks.js";

export const communityOpsRouter = Router();

const automationRunSchema = z.object({
  projectId: z.string().uuid(),
  automationId: z.string().uuid().optional(),
  automationType: z
    .enum([
      "rank_sync",
      "leaderboard_pulse",
      "mission_digest",
      "raid_reminder",
      "newcomer_pulse",
      "reactivation_pulse",
      "activation_board",
    ])
    .optional(),
  authUserId: z.string().uuid().optional(),
});

const playbookRunSchema = z.object({
  projectId: z.string().uuid(),
  playbookKey: z.enum(["launch_week", "raid_week", "comeback_week", "campaign_push"]),
  authUserId: z.string().uuid().optional(),
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

communityOpsRouter.post("/automations/run", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = automationRunSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Community OS automation payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runCommunityAutomation({
      projectId: parsed.data.projectId,
      automationId: parsed.data.automationId,
      automationType: parsed.data.automationType,
      triggerSource: parsed.data.authUserId ? "manual" : "schedule",
      triggeredByAuthUserId: parsed.data.authUserId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community automation execution failed.",
    });
  }
});

communityOpsRouter.post("/playbooks/run", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = playbookRunSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Community OS playbook payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runCommunityPlaybook({
      projectId: parsed.data.projectId,
      playbookKey: parsed.data.playbookKey,
      triggerSource: parsed.data.authUserId ? "manual" : "schedule",
      triggeredByAuthUserId: parsed.data.authUserId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Community playbook execution failed.",
    });
  }
});
