import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { getPlatformQuestBySlug } from "@/lib/platform-quests/platform-quest-catalog";
import { grantPlatformQuestShards } from "@/lib/platform-quests/platform-quest-awards";
import {
  buildPlatformQuestEligibility,
  type PlatformQuestEligibilityEvents,
} from "@/lib/platform-quests/platform-quest-eligibility";

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

function startOfUtcDay(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfUtcWeek(now: Date) {
  const dayStart = startOfUtcDay(now);
  const day = dayStart.getUTCDay() || 7;
  dayStart.setUTCDate(dayStart.getUTCDate() - day + 1);
  return dayStart;
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
) {
  const { count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function loadPlatformQuestEvents(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  now: Date;
}): Promise<PlatformQuestEligibilityEvents> {
  const today = startOfUtcDay(params.now).toISOString();
  const week = startOfUtcWeek(params.now).toISOString();

  const [
    confirmedSwapCount,
    approvedQuestsToday,
    approvedQuestsThisWeek,
    raidsToday,
    raidsThisWeek,
    swapsToday,
    swapsThisWeek,
    lootboxesToday,
    lootboxesThisWeek,
    activatedInvitesThisWeek,
    openedLootboxCount,
  ] = await Promise.all([
    countRows(
      params.serviceSupabase
        .from("defi_swap_intents")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "confirmed")
    ),
    countRows(
      params.serviceSupabase
        .from("quest_submissions")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "approved")
        .gte("created_at", today)
    ),
    countRows(
      params.serviceSupabase
        .from("quest_submissions")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "approved")
        .gte("created_at", week)
    ),
    countRows(
      params.serviceSupabase
        .from("raid_completions")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .gte("created_at", today)
    ),
    countRows(
      params.serviceSupabase
        .from("raid_completions")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .gte("created_at", week)
    ),
    countRows(
      params.serviceSupabase
        .from("defi_swap_intents")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "confirmed")
        .gte("created_at", today)
    ),
    countRows(
      params.serviceSupabase
        .from("defi_swap_intents")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "confirmed")
        .gte("created_at", week)
    ),
    countRows(
      params.serviceSupabase
        .from("lootbox_opens")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "granted")
        .gte("created_at", today)
    ),
    countRows(
      params.serviceSupabase
        .from("lootbox_opens")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "granted")
        .gte("created_at", week)
    ),
    countRows(
      params.serviceSupabase
        .from("app_notifications")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("type", "invite_activated")
        .gte("created_at", week)
    ),
    countRows(
      params.serviceSupabase
        .from("lootbox_opens")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", params.authUserId)
        .eq("status", "granted")
    ),
  ]);

  return {
    confirmedSwapCount,
    realActionsToday: approvedQuestsToday + raidsToday + swapsToday + lootboxesToday,
    realActionsThisWeek: approvedQuestsThisWeek + raidsThisWeek + swapsThisWeek + lootboxesThisWeek,
    activatedInvitesThisWeek,
    openedLootboxCount,
  };
}

async function loadClaimedPlatformQuestSourceRefs(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}) {
  const { data, error } = await params.serviceSupabase
    .from("shard_ledger")
    .select("source_ref")
    .eq("auth_user_id", params.authUserId)
    .eq("source_type", "platform_quest");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => (typeof row.source_ref === "string" ? row.source_ref : null))
    .filter((sourceRef): sourceRef is string => Boolean(sourceRef));
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
    const quest = getPlatformQuestBySlug(typeof body?.slug === "string" ? body.slug.trim() : "");
    if (!quest) {
      return NextResponse.json({ ok: false, error: "Unknown platform quest." }, { status: 400 });
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

    const [reputation, events, claimedSourceRefs] = await Promise.all([
      serviceSupabase
        .from("user_global_reputation")
        .select("status, sybil_score")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      loadPlatformQuestEvents({
        serviceSupabase,
        authUserId: user.id,
        now: new Date(),
      }),
      loadClaimedPlatformQuestSourceRefs({
        serviceSupabase,
        authUserId: user.id,
      }),
    ]);

    if (reputation.error) {
      throw new Error(reputation.error.message);
    }

    const eligibility = buildPlatformQuestEligibility({
      slug: quest.slug,
      trustStatus: reputation.data?.status ?? "active",
      sybilScore: Number(reputation.data?.sybil_score ?? 0),
      events,
      claimedSourceRefs,
    });

    if (!eligibility.ok) {
      return NextResponse.json(
        { ok: false, reason: eligibility.reason, error: eligibility.message, events },
        { status: 409 }
      );
    }

    const shardAward = await grantPlatformQuestShards({
      serviceSupabase,
      authUserId: user.id,
      slug: quest.slug,
      eligibility,
    });

    if (!shardAward.ok) {
      return NextResponse.json(
        { ok: false, reason: shardAward.reason, error: shardAward.error, events },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      slug: quest.slug,
      windowKey: eligibility.windowKey,
      shardAward,
      events,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Platform quest claim failed.",
      },
      { status: 500 }
    );
  }
}
