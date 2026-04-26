import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { isUserXpAwardSourceType } from "@/lib/xp/xp-awards";
import {
  applyUserXpAward,
  normalizeUserXpAwardMetadata,
} from "@/lib/xp/xp-award-server";

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

    const award = await applyUserXpAward({
      serviceSupabase,
      authUserId: user.id,
      sourceType: body.sourceType,
      sourceId,
      baseXp,
      projectId: typeof body?.projectId === "string" ? body.projectId : null,
      campaignId: typeof body?.campaignId === "string" ? body.campaignId : null,
      metadata: normalizeUserXpAwardMetadata(body.metadata),
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
