import { supabaseAdmin } from "../lib/supabase.js";
import { rebuildUserReputationProjection } from "../core/aesp/projections.js";

export async function runActiveXpDecayJob(input?: { limit?: number }) {
  const limit = input?.limit ?? 200;

  const { data, error } = await supabaseAdmin
    .from("xp_events")
    .select("auth_user_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const uniqueAuthUserIds = Array.from(
    new Set((data ?? []).map((row: { auth_user_id: string }) => row.auth_user_id))
  );

  const results = [];
  for (const authUserId of uniqueAuthUserIds) {
    results.push(await rebuildUserReputationProjection(authUserId));
  }

  return {
    ok: true,
    processed: results.length,
    results,
  };
}
