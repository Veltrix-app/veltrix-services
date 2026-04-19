import { loadDueCommunityAutomations, runCommunityAutomation } from "../core/community/automations.js";

export async function runCommunityAutomationsJob(options: {
  projectId?: string;
  limit?: number;
} = {}) {
  const dueAutomations = await loadDueCommunityAutomations(options);
  const limitedAutomations = dueAutomations.slice(0, Math.max(1, Math.min(options.limit ?? 50, 200)));
  const results: Array<Record<string, unknown>> = [];

  for (const automation of limitedAutomations) {
    try {
      const result = await runCommunityAutomation({
        projectId: automation.project_id,
        automationId: automation.id,
        triggerSource: "schedule",
      });
      results.push(result);
    } catch (error) {
      results.push({
        automationId: automation.id,
        automationType: automation.automation_type,
        status: "failed",
        error: error instanceof Error ? error.message : "Community automation failed.",
      });
    }
  }

  return {
    ok: true,
    automationsProcessed: limitedAutomations.length,
    runsTriggered: results.filter((result) => result.status === "success").length,
    runsFailed: results.filter((result) => result.status === "failed").length,
    results,
  };
}
