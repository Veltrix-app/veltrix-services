import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { isUserXpAwardSourceType, type PublicUserXpAwardSourceType } from "@/lib/xp/xp-awards";
import {
  applyUserXpAward,
  normalizeUserXpAwardMetadata,
} from "@/lib/xp/xp-award-server";
import { XP_SOURCE_TYPES } from "@/lib/xp/xp-economy";
import {
  buildPublicQuestXpAwardPlan,
  buildPublicRaidXpAwardPlan,
  type PublicQuestAwardRow,
  type PublicRaidAwardRow,
  type PublicXpAwardPolicyPlan,
} from "@/lib/xp/public-xp-award-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    const sourceType = body?.sourceType;
    if (!isUserXpAwardSourceType(sourceType)) {
      return NextResponse.json({ ok: false, error: "Unsupported XP source type." }, { status: 400 });
    }

    const sourceId = typeof body?.sourceId === "string" ? body.sourceId.trim() : "";
    const requestedBaseXp = safeNumber(body?.baseXp);
    if (!sourceId) {
      return NextResponse.json({ ok: false, error: "sourceId is required." }, { status: 400 });
    }

    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const metadata = normalizeUserXpAwardMetadata(body?.metadata);
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const publicAward = await resolvePublicAwardPlan({
      serviceSupabase,
      authUserId: user.id,
      sourceType,
      sourceId,
      requestedBaseXp,
      metadata,
    });

    if (!publicAward.ok) {
      return NextResponse.json(
        { ok: false, error: publicAward.error },
        { status: publicAward.status }
      );
    }

    const award = await applyUserXpAward({
      serviceSupabase,
      authUserId: user.id,
      sourceType: publicAward.plan.sourceType,
      sourceId: publicAward.plan.sourceId,
      baseXp: publicAward.plan.baseXp,
      projectId: publicAward.plan.projectId,
      campaignId: publicAward.plan.campaignId,
      metadata: publicAward.plan.metadata,
    });

    if (!award.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: award.error,
          reason: award.reason,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyClaimed: award.alreadyClaimed,
      eventId: award.eventId,
      sourceRef: award.sourceRef,
      xpAwarded: award.xpAwarded,
      totalXp: award.totalXp,
      activeXp: award.activeXp,
      level: award.level,
      contributionTier: award.contributionTier,
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

async function resolvePublicAwardPlan(params: {
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>;
  authUserId: string;
  sourceType: PublicUserXpAwardSourceType;
  sourceId: string;
  requestedBaseXp: number;
  metadata: Record<string, unknown>;
}): Promise<
  | { ok: true; plan: PublicXpAwardPolicyPlan }
  | { ok: false; status: number; error: string }
> {
  if (params.sourceType === XP_SOURCE_TYPES.quest) {
    const { data: quest, error } = await params.serviceSupabase
      .from("quests")
      .select(
        "id, title, project_id, campaign_id, xp, quest_type, proof_required, proof_type, verification_type, verification_provider, completion_mode, verification_config"
      )
      .eq("id", params.sourceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!quest) {
      return { ok: false, status: 404, error: "Quest was not found." };
    }

    const hasApprovedSubmission = await hasApprovedQuestSubmission({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
      questId: params.sourceId,
    });

    if (!hasApprovedSubmission) {
      return {
        ok: false,
        status: 409,
        error: "This quest must be approved before global XP can be claimed.",
      };
    }

    const plan = buildPublicQuestXpAwardPlan(quest as PublicQuestAwardRow, params.metadata);
    if (plan.baseXp <= 0) {
      return { ok: false, status: 409, error: "This quest is not eligible for global XP." };
    }

    return { ok: true, plan };
  }

  if (params.sourceType === XP_SOURCE_TYPES.raid) {
    const { data: raid, error } = await params.serviceSupabase
      .from("raids")
      .select("id, title, project_id, campaign_id, reward_xp, status")
      .eq("id", params.sourceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!raid) {
      return { ok: false, status: 404, error: "Raid was not found." };
    }

    const hasCompletion = await hasRaidCompletion({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
      raidId: params.sourceId,
    });

    if (!hasCompletion) {
      return {
        ok: false,
        status: 409,
        error: "This raid must be confirmed before XP can be claimed.",
      };
    }

    const plan = buildPublicRaidXpAwardPlan(raid as PublicRaidAwardRow, params.metadata);
    if (plan.baseXp <= 0) {
      return { ok: false, status: 409, error: "This raid is not eligible for XP." };
    }

    return { ok: true, plan };
  }

  if (params.requestedBaseXp <= 0) {
    return { ok: false, status: 400, error: "Positive baseXp is required for this XP source." };
  }

  return {
    ok: true,
    plan: {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      baseXp: Math.min(25, Math.max(0, Math.floor(params.requestedBaseXp))),
      projectId: null,
      campaignId: null,
      metadata: {
        ...params.metadata,
        source: "vyntro_public_streak_claim",
        claimGuard: "server_capped",
      },
    },
  };
}

async function hasApprovedQuestSubmission(params: {
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>;
  authUserId: string;
  questId: string;
}) {
  const { data, error } = await params.serviceSupabase
    .from("quest_submissions")
    .select("id")
    .eq("auth_user_id", params.authUserId)
    .eq("quest_id", params.questId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

async function hasRaidCompletion(params: {
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>;
  authUserId: string;
  raidId: string;
}) {
  const { data, error } = await params.serviceSupabase
    .from("raid_completions")
    .select("id")
    .eq("auth_user_id", params.authUserId)
    .eq("raid_id", params.raidId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}
