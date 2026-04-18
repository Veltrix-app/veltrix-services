import { supabaseAdmin } from "../lib/supabase.js";

function deriveStakeState(input: {
  lockEndAt?: string | null;
  lastActivityAt?: string | null;
  currentState: string;
}) {
  const now = Date.now();
  const lockEndAt = input.lockEndAt ? new Date(input.lockEndAt).getTime() : null;
  const lastActivityAt = input.lastActivityAt ? new Date(input.lastActivityAt).getTime() : null;

  if (lockEndAt && lockEndAt <= now) {
    return "completed";
  }

  if (!lastActivityAt) {
    return "warning";
  }

  const daysSinceActivity = (now - lastActivityAt) / (24 * 60 * 60 * 1000);

  if (daysSinceActivity >= 14) {
    return "inactive";
  }

  if (daysSinceActivity >= 7) {
    return "warning";
  }

  return input.currentState === "slashed" ? "slashed" : "active";
}

export async function refreshStakeStates(input?: { limit?: number }) {
  const limit = input?.limit ?? 200;
  const { data, error } = await supabaseAdmin
    .from("xp_stakes")
    .select("id, state, lock_end_at, last_activity_at")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  const updates = (data ?? [])
    .map((stake: { id: string; state: string; lock_end_at: string | null; last_activity_at: string | null }) => ({
      id: stake.id,
      nextState: deriveStakeState({
        lockEndAt: stake.lock_end_at,
        lastActivityAt: stake.last_activity_at,
        currentState: stake.state,
      }),
      currentState: stake.state,
    }))
    .filter((stake) => stake.nextState !== stake.currentState);

  for (const update of updates) {
    await supabaseAdmin
      .from("xp_stakes")
      .update({
        state: update.nextState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.id);
  }

  return {
    ok: true,
    processed: (data ?? []).length,
    updated: updates.length,
  };
}
