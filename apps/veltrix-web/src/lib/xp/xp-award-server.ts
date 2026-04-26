import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { buildXpProgressionRead, buildXpSourceRef } from "./xp-economy";
import {
  buildUserXpAwardPlan,
  type UserXpAwardSourceType,
  type XpReputationSnapshot,
} from "./xp-awards";

export type ServiceSupabase = ReturnType<typeof createSupabaseServiceClient>;

export type AppliedUserXpAward =
  | {
      ok: true;
      alreadyClaimed: boolean;
      eventId: string | null;
      sourceRef: string;
      xpAwarded: number;
      totalXp: number | null;
      activeXp: number | null;
      level: number | null;
      contributionTier: string | null;
    }
  | {
      ok: false;
      error: string;
      reason: "duplicate" | "sybil-risk" | "invalid-source" | "invalid-xp" | "daily-cap";
      sourceRef?: string;
    };

export function normalizeUserXpAwardMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export async function applyUserXpAward(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  sourceType: UserXpAwardSourceType;
  sourceId: string;
  baseXp: number;
  projectId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AppliedUserXpAward> {
  const [claimsRead, reputation] = await Promise.all([
    loadAwardClaims({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
      sourceType: params.sourceType,
    }),
    loadReputation({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
    }),
  ]);
  const awardPlan = buildUserXpAwardPlan({
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    baseXp: params.baseXp,
    reputation,
    claimedSourceRefs: claimsRead.claimedSourceRefs,
    recentSourceXp: claimsRead.recentSourceXp,
    metadata: params.metadata,
  });

  if (!awardPlan.ok) {
    if (awardPlan.reason === "duplicate") {
      return {
        ok: true,
        alreadyClaimed: true,
        eventId: null,
        sourceRef: buildXpSourceRef(params.sourceType, params.sourceId),
        xpAwarded: 0,
        totalXp: null,
        activeXp: null,
        level: null,
        contributionTier: null,
      };
    }

    return {
      ok: false,
      error: awardPlan.message,
      reason: awardPlan.reason,
      sourceRef: buildXpSourceRef(params.sourceType, params.sourceId),
    };
  }

  const timestamp = new Date().toISOString();
  const { data: event, error: eventError } = await params.serviceSupabase
    .from("xp_events")
    .insert({
      auth_user_id: params.authUserId,
      project_id: isUuid(params.projectId) ? params.projectId : null,
      campaign_id: isUuid(params.campaignId) ? params.campaignId : null,
      ...awardPlan.event,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select("id")
    .single();

  if (eventError) {
    if (eventError.code === "23505") {
      return {
        ok: true,
        alreadyClaimed: true,
        eventId: null,
        sourceRef: awardPlan.sourceRef,
        xpAwarded: 0,
        totalXp: null,
        activeXp: null,
        level: null,
        contributionTier: null,
      };
    }

    throw new Error(eventError.message);
  }

  try {
    await writeReputationPatch({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
      reputation: awardPlan.reputation,
      timestamp,
    });
  } catch (error) {
    if (event?.id) {
      await params.serviceSupabase.from("xp_events").delete().eq("id", event.id);
    }

    throw error;
  }

  const progression = buildXpProgressionRead(awardPlan.reputation.total_xp);

  return {
    ok: true,
    alreadyClaimed: false,
    eventId: event?.id ?? null,
    sourceRef: awardPlan.sourceRef,
    xpAwarded: awardPlan.xpAwarded,
    totalXp: awardPlan.reputation.total_xp,
    activeXp: awardPlan.reputation.active_xp,
    level: progression.level,
    contributionTier: progression.contributionTier,
  };
}

function safeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function getUtcDayStartIso(now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart.toISOString();
}

async function loadAwardClaims(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  sourceType: string;
}) {
  const { data, error } = await params.serviceSupabase
    .from("xp_events")
    .select("source_ref, effective_xp, created_at")
    .eq("auth_user_id", params.authUserId)
    .eq("source_type", params.sourceType)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  const dayStartIso = getUtcDayStartIso();
  const claims = (data ?? []).map((row) => ({
    sourceRef: typeof row.source_ref === "string" ? row.source_ref : "",
    xp: safeNumber(row.effective_xp),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
  }));

  return {
    claimedSourceRefs: claims.map((claim) => claim.sourceRef).filter(Boolean),
    recentSourceXp: claims
      .filter((claim) => claim.createdAt >= dayStartIso)
      .reduce((total, claim) => total + claim.xp, 0),
  };
}

async function loadReputation(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}): Promise<XpReputationSnapshot | null> {
  const { data, error } = await params.serviceSupabase
    .from("user_global_reputation")
    .select(
      "total_xp, active_xp, level, streak, trust_score, sybil_score, contribution_tier, quests_completed, raids_completed, rewards_claimed, status"
    )
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function writeReputationPatch(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  reputation: Exclude<ReturnType<typeof buildUserXpAwardPlan>, { ok: false }>["reputation"];
  timestamp: string;
}) {
  const { error: upsertError } = await params.serviceSupabase
    .from("user_global_reputation")
    .upsert(
      {
        auth_user_id: params.authUserId,
        total_xp: params.reputation.total_xp,
        active_xp: params.reputation.active_xp,
        level: params.reputation.level,
        streak: params.reputation.streak,
        trust_score: params.reputation.trust_score,
        sybil_score: params.reputation.sybil_score,
        contribution_tier: params.reputation.contribution_tier,
        quests_completed: params.reputation.quests_completed,
        raids_completed: params.reputation.raids_completed,
        rewards_claimed: params.reputation.rewards_claimed,
        status: params.reputation.status,
        updated_at: params.timestamp,
      },
      { onConflict: "auth_user_id" }
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: profileError } = await params.serviceSupabase
    .from("user_profiles")
    .update({
      xp: params.reputation.total_xp,
      level: params.reputation.level,
      streak: params.reputation.streak,
      status: params.reputation.status,
    })
    .eq("auth_user_id", params.authUserId);

  if (profileError) {
    throw new Error(profileError.message);
  }
}
