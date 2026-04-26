import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { buildXpProgressionRead, buildXpSourceRef } from "@/lib/xp/xp-economy";
import {
  buildUserXpAwardPlan,
  isUserXpAwardSourceType,
  type XpReputationSnapshot,
} from "@/lib/xp/xp-awards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ServiceSupabase = ReturnType<typeof createSupabaseServiceClient>;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function safeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
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

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          sourceType?: unknown;
          sourceId?: unknown;
          baseXp?: unknown;
          projectId?: unknown;
          campaignId?: unknown;
          metadata?: unknown;
        }
      | null;

    if (!isUserXpAwardSourceType(body?.sourceType)) {
      return NextResponse.json({ ok: false, error: "Unsupported XP source type." }, { status: 400 });
    }

    const sourceId = typeof body?.sourceId === "string" ? body.sourceId.trim() : "";
    const baseXp = safeNumber(body?.baseXp);
    if (!sourceId || baseXp <= 0) {
      return NextResponse.json({ ok: false, error: "sourceId and positive baseXp are required." }, { status: 400 });
    }

    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const [claimsRead, reputation] = await Promise.all([
      loadAwardClaims({
        serviceSupabase,
        authUserId: user.id,
        sourceType: body.sourceType,
      }),
      loadReputation({
        serviceSupabase,
        authUserId: user.id,
      }),
    ]);
    const awardPlan = buildUserXpAwardPlan({
      sourceType: body.sourceType,
      sourceId,
      baseXp,
      reputation,
      claimedSourceRefs: claimsRead.claimedSourceRefs,
      recentSourceXp: claimsRead.recentSourceXp,
      metadata: normalizeMetadata(body.metadata),
    });

    if (!awardPlan.ok) {
      if (awardPlan.reason === "duplicate") {
        return NextResponse.json({
          ok: true,
          alreadyClaimed: true,
          sourceRef: buildXpSourceRef(body.sourceType, sourceId),
          xpAwarded: 0,
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error: awardPlan.message,
          reason: awardPlan.reason,
        },
        { status: 409 }
      );
    }

    const timestamp = new Date().toISOString();
    const { data: event, error: eventError } = await serviceSupabase
      .from("xp_events")
      .insert({
        auth_user_id: user.id,
        project_id: isUuid(body?.projectId) ? body.projectId : null,
        campaign_id: isUuid(body?.campaignId) ? body.campaignId : null,
        ...awardPlan.event,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select("id")
      .single();

    if (eventError) {
      if (eventError.code === "23505") {
        return NextResponse.json({
          ok: true,
          alreadyClaimed: true,
          sourceRef: awardPlan.sourceRef,
          xpAwarded: 0,
        });
      }

      return NextResponse.json({ ok: false, error: eventError.message }, { status: 500 });
    }

    try {
      await writeReputationPatch({
        serviceSupabase,
        authUserId: user.id,
        reputation: awardPlan.reputation,
        timestamp,
      });
    } catch (error) {
      if (event?.id) {
        await serviceSupabase.from("xp_events").delete().eq("id", event.id);
      }

      throw error;
    }

    const progression = buildXpProgressionRead(awardPlan.reputation.total_xp);

    return NextResponse.json({
      ok: true,
      alreadyClaimed: false,
      eventId: event?.id ?? null,
      sourceRef: awardPlan.sourceRef,
      xpAwarded: awardPlan.xpAwarded,
      totalXp: awardPlan.reputation.total_xp,
      activeXp: awardPlan.reputation.active_xp,
      level: progression.level,
      contributionTier: progression.contributionTier,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "XP award failed.",
      },
      { status: 500 }
    );
  }
}
