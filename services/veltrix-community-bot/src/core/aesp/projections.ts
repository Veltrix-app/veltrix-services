import { supabaseAdmin } from "../../lib/supabase.js";

const ACTIVE_XP_WINDOW_DAYS = 30;

function computeLevelFromXp(totalXp: number) {
  if (totalXp <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);
}

export async function rebuildUserReputationProjection(authUserId: string) {
  const activeXpCutoff = new Date(
    Date.now() - ACTIVE_XP_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [{ data: xpEvents, error: xpEventsError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabaseAdmin
        .from("xp_events")
        .select("effective_xp, project_id, created_at")
        .eq("auth_user_id", authUserId),
      supabaseAdmin
        .from("user_profiles")
        .select("auth_user_id, username, avatar_url, banner_url, title, faction, bio, wallet, status")
        .eq("auth_user_id", authUserId)
        .maybeSingle(),
    ]);

  if (xpEventsError) {
    throw xpEventsError;
  }

  if (profileError) {
    throw profileError;
  }

  const totalXp = (xpEvents ?? []).reduce(
    (sum: number, row: { effective_xp: number | null }) => sum + Number(row.effective_xp ?? 0),
    0
  );
  const activeXp = (xpEvents ?? []).reduce(
    (sum: number, row: { effective_xp: number | null; created_at: string }) =>
      row.created_at >= activeXpCutoff ? sum + Number(row.effective_xp ?? 0) : sum,
    0
  );
  const level = computeLevelFromXp(totalXp);
  const groupedProjectXp = new Map<string, { totalXp: number; activeXp: number }>();

  for (const row of xpEvents ?? []) {
    if (!row.project_id) {
      continue;
    }

    const current = groupedProjectXp.get(row.project_id) ?? { totalXp: 0, activeXp: 0 };
    current.totalXp += Number(row.effective_xp ?? 0);
    if (row.created_at >= activeXpCutoff) {
      current.activeXp += Number(row.effective_xp ?? 0);
    }
    groupedProjectXp.set(row.project_id, current);
  }

  const timestamp = new Date().toISOString();

  await supabaseAdmin.from("user_global_reputation").upsert(
    {
      auth_user_id: authUserId,
      total_xp: totalXp,
      active_xp: activeXp,
      level,
      status: profile?.status ?? "active",
      updated_at: timestamp,
    },
    {
      onConflict: "auth_user_id",
    }
  );

  await supabaseAdmin
    .from("user_profiles")
    .update({
      xp: totalXp,
      level,
    })
    .eq("auth_user_id", authUserId);

  if (groupedProjectXp.size > 0) {
    const rows = Array.from(groupedProjectXp.entries()).map(([projectId, values]) => ({
      auth_user_id: authUserId,
      project_id: projectId,
      xp: values.totalXp,
      active_xp: values.activeXp,
      level: computeLevelFromXp(values.totalXp),
      updated_at: timestamp,
    }));

    await supabaseAdmin.from("user_project_reputation").upsert(rows, {
      onConflict: "auth_user_id,project_id",
    });
  }

  return {
    authUserId,
    totalXp,
    activeXp,
    level,
    projects: groupedProjectXp.size,
  };
}
