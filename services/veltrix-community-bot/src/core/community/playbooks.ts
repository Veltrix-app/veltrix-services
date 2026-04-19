import { supabaseAdmin } from "../../lib/supabase.js";
import { getCommunityPlaybookSteps, type CommunityPlaybookKey } from "./model.js";
import { runCommunityAutomation } from "./automations.js";
import { maybeRecordCaptainAutomationAction } from "./captains.js";

type CommunityPlaybookRunResult = {
  ok: true;
  playbookKey: CommunityPlaybookKey;
  status: "success" | "failed";
  summary: string;
  stepResults: Array<{
    automationType: string;
    status: string;
    summary: string;
  }>;
};

async function createPlaybookRun(params: {
  projectId: string;
  playbookKey: CommunityPlaybookKey;
  triggerSource: "manual" | "schedule" | "captain";
  triggeredByAuthUserId?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("community_playbook_runs")
    .insert({
      project_id: params.projectId,
      playbook_key: params.playbookKey,
      status: "running",
      trigger_source: params.triggerSource,
      triggered_by_auth_user_id: params.triggeredByAuthUserId ?? null,
      summary: `Running ${params.playbookKey}.`,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create playbook run.");
  }

  return data.id as string;
}

async function finishPlaybookRun(params: {
  runId: string;
  status: "success" | "failed";
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin
    .from("community_playbook_runs")
    .update({
      status: params.status,
      summary: params.summary,
      metadata: params.metadata ?? {},
      completed_at: new Date().toISOString(),
    })
    .eq("id", params.runId);

  if (error) {
    throw new Error(error.message || "Failed to finish playbook run.");
  }
}

async function updatePlaybookMetadata(projectId: string, playbookKey: CommunityPlaybookKey) {
  const { data: integrations, error: integrationError } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider, project_id")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load playbook metadata context.");
  }

  const primaryIntegration =
    ((integrations ?? []) as Array<{ id: string; provider: string; project_id: string }>).find(
      (integration) => integration.provider === "discord"
    ) ??
    ((integrations ?? []) as Array<{ id: string; provider: string; project_id: string }>)[0] ??
    null;

  if (!primaryIntegration) {
    return;
  }

  const { data: settingsRow, error: settingsError } = await supabaseAdmin
    .from("community_bot_settings")
    .select("integration_id, metadata")
    .eq("integration_id", primaryIntegration.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load playbook metadata row.");
  }

  const metadata =
    settingsRow?.metadata && typeof settingsRow.metadata === "object"
      ? (settingsRow.metadata as Record<string, unknown>)
      : {};
  const currentPlaybooks =
    metadata.playbookConfigs && typeof metadata.playbookConfigs === "object"
      ? (metadata.playbookConfigs as Record<string, Record<string, unknown>>)
      : {};
  const currentConfig =
    currentPlaybooks[playbookKey] && typeof currentPlaybooks[playbookKey] === "object"
      ? currentPlaybooks[playbookKey]
      : {};

  const { error: updateError } = await supabaseAdmin.from("community_bot_settings").upsert(
    {
      integration_id: primaryIntegration.id,
      provider: primaryIntegration.provider,
      project_id: primaryIntegration.project_id,
      metadata: {
        ...metadata,
        playbookConfigs: {
          ...currentPlaybooks,
          [playbookKey]: {
            ...currentConfig,
            lastRunAt: new Date().toISOString(),
          },
        },
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "integration_id" }
  );

  if (updateError) {
    throw new Error(updateError.message || "Failed to update playbook metadata.");
  }
}

export async function runCommunityPlaybook(params: {
  projectId: string;
  playbookKey: CommunityPlaybookKey;
  triggerSource: "manual" | "schedule" | "captain";
  triggeredByAuthUserId?: string | null;
}) {
  const runId = await createPlaybookRun(params);
  const steps = getCommunityPlaybookSteps(params.playbookKey);
  const stepResults: CommunityPlaybookRunResult["stepResults"] = [];

  try {
    for (const automationType of steps) {
      const result = await runCommunityAutomation({
        projectId: params.projectId,
        automationType,
        triggerSource: "playbook",
        triggeredByAuthUserId: params.triggeredByAuthUserId,
      });
      stepResults.push({
        automationType,
        status: result.status,
        summary: result.summary,
      });
    }

    const summary = `${params.playbookKey} completed ${steps.length} step(s).`;
    await finishPlaybookRun({
      runId,
      status: "success",
      summary,
      metadata: { stepResults },
    });
    await updatePlaybookMetadata(params.projectId, params.playbookKey);
    await maybeRecordCaptainAutomationAction({
      projectId: params.projectId,
      authUserId: params.triggeredByAuthUserId,
      automationType: steps[0],
      targetId: params.playbookKey,
      status: "success",
      summary,
      metadata: { playbookKey: params.playbookKey, stepResults },
    });

    return {
      ok: true,
      playbookKey: params.playbookKey,
      status: "success",
      summary,
      stepResults,
    } satisfies CommunityPlaybookRunResult;
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Community playbook failed.";
    await finishPlaybookRun({
      runId,
      status: "failed",
      summary,
      metadata: { stepResults },
    });
    throw error;
  }
}
