import { refreshProjectCommunityCaptainQueue } from "../core/community/captain-queue.js";
import { refreshProjectCommunityJourneys } from "../core/community/journeys.js";
import { loadProjectCommunityOutcomeSummary } from "../core/community/outcomes.js";
import { supabaseAdmin } from "../lib/supabase.js";

async function loadCommunityProjectIds(limit: number) {
  const { data, error } = await supabaseAdmin
    .from("community_bot_settings")
    .select("project_id")
    .not("project_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit * 4);

  if (error) {
    throw new Error(error.message || "Failed to load community project ids.");
  }

  const seen = new Set<string>();
  for (const row of (data ?? []) as Array<{ project_id: string | null }>) {
    if (row.project_id) {
      seen.add(row.project_id);
    }
    if (seen.size >= limit) {
      break;
    }
  }

  return Array.from(seen);
}

export async function runRefreshCommunityStatusSnapshotsJob(options: {
  projectId?: string;
  authUserId?: string;
  limit?: number;
} = {}) {
  const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
  const projectIds = options.projectId ? [options.projectId] : await loadCommunityProjectIds(limit);
  const results: Array<Record<string, unknown>> = [];

  for (const projectId of projectIds.slice(0, limit)) {
    try {
      const journeyRefresh = await refreshProjectCommunityJourneys({
        projectId,
        authUserId: options.authUserId,
        limit,
      });
      const queueRefresh = await refreshProjectCommunityCaptainQueue(projectId);
      const outcomes = await loadProjectCommunityOutcomeSummary(projectId);
      results.push({
        projectId,
        status: "success",
        journeyRefresh,
        queueRefresh,
        outcomes,
      });
    } catch (error) {
      results.push({
        projectId,
        status: "failed",
        error: error instanceof Error ? error.message : "Community snapshot refresh failed.",
      });
    }
  }

  return {
    ok: true,
    projectsProcessed: results.length,
    projectsFailed: results.filter((result) => result.status === "failed").length,
    results,
  };
}

export async function runRefreshCommunityCaptainQueueJob(options: {
  projectId?: string;
  limit?: number;
} = {}) {
  const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
  const projectIds = options.projectId ? [options.projectId] : await loadCommunityProjectIds(limit);
  const results: Array<Record<string, unknown>> = [];

  for (const projectId of projectIds.slice(0, limit)) {
    try {
      const queueRefresh = await refreshProjectCommunityCaptainQueue(projectId);
      results.push({
        projectId,
        status: "success",
        queueRefresh,
      });
    } catch (error) {
      results.push({
        projectId,
        status: "failed",
        error: error instanceof Error ? error.message : "Captain queue refresh failed.",
      });
    }
  }

  return {
    ok: true,
    projectsProcessed: results.length,
    projectsFailed: results.filter((result) => result.status === "failed").length,
    results,
  };
}
