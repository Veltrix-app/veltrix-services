import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeRows(rows: unknown[] | null | undefined) {
  return (rows ?? []).map((row) => safeObject(row));
}

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const projectId = safeString(request.nextUrl.searchParams.get("projectId"));
    let signalQuery = serviceSupabase
      .from("trust_signal_summaries")
      .select(
        "id, project_id, wallet_address, event_type, risk_category, severity, recommended_action, reason, visible_evidence, status, created_at"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    let reviewQuery = serviceSupabase
      .from("trust_review_cases")
      .select(
        "id, project_id, wallet_address, case_type, priority, status, reason, public_summary, opened_at, resolved_at, created_at, updated_at"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);
    let appealQuery = serviceSupabase
      .from("trust_appeals")
      .select(
        "id, review_case_id, project_id, wallet_address, status, message, public_context, submitted_at, resolved_at, created_at"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (projectId) {
      signalQuery = signalQuery.eq("project_id", projectId);
      reviewQuery = reviewQuery.eq("project_id", projectId);
      appealQuery = appealQuery.eq("project_id", projectId);
    }

    const [signalsRead, reviewsRead, appealsRead] = await Promise.all([
      signalQuery,
      reviewQuery,
      appealQuery,
    ]);

    const firstError = signalsRead.error ?? reviewsRead.error ?? appealsRead.error;
    if (firstError) {
      return NextResponse.json({ ok: false, error: firstError.message }, { status: 500 });
    }

    const reviewCases = normalizeRows(reviewsRead.data);
    const appeals = normalizeRows(appealsRead.data);
    const openReviewCount = reviewCases.filter((row) =>
      ["open", "in_review", "waiting_on_user"].includes(safeString(row.status))
    ).length;
    const activeAppealCount = appeals.filter((row) =>
      ["submitted", "in_review"].includes(safeString(row.status))
    ).length;

    return NextResponse.json({
      ok: true,
      trust: {
        projectId: projectId || null,
        signalSummaries: normalizeRows(signalsRead.data),
        reviewCases,
        appeals,
        posture: {
          openReviewCount,
          activeAppealCount,
          nextSafeAction:
            openReviewCount > 0
              ? "Wait for review or add concise appeal context."
              : "Continue normal participation.",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trust summary could not be loaded.",
      },
      { status: 500 }
    );
  }
}
