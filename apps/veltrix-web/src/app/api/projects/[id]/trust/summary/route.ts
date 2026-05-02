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

function safeNumber(value: unknown, fallback: number) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function normalizeRows(rows: unknown[] | null | undefined) {
  return (rows ?? []).map((row) => (row && typeof row === "object" ? row : {}));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const { id: projectId } = await context.params;
  if (!projectId) {
    return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
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

    const { data: canRead, error: roleError } = await userSupabase.rpc("has_project_role", {
      check_auth_user_id: user.id,
      check_project_id: projectId,
      allowed_roles: ["owner", "admin", "reviewer"],
    });

    if (roleError || canRead !== true) {
      return NextResponse.json(
        { ok: false, error: "Only project owners, admins or reviewers can read trust summaries." },
        { status: 403 }
      );
    }

    const participantAuthUserId = safeString(request.nextUrl.searchParams.get("authUserId"));
    const limit = Math.min(Math.max(safeNumber(request.nextUrl.searchParams.get("limit"), 50), 1), 100);
    let signalQuery = serviceSupabase
      .from("trust_signal_summaries")
      .select(
        "id, auth_user_id, wallet_address, event_type, risk_category, severity, recommended_action, reason, visible_evidence, status, created_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);
    let reviewQuery = serviceSupabase
      .from("trust_review_cases")
      .select(
        "id, auth_user_id, wallet_address, case_type, priority, status, reason, public_summary, opened_at, resolved_at, created_at, updated_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);
    let appealQuery = serviceSupabase
      .from("trust_appeals")
      .select(
        "id, review_case_id, auth_user_id, wallet_address, status, message, public_context, submitted_at, resolved_at, created_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (participantAuthUserId) {
      signalQuery = signalQuery.eq("auth_user_id", participantAuthUserId);
      reviewQuery = reviewQuery.eq("auth_user_id", participantAuthUserId);
      appealQuery = appealQuery.eq("auth_user_id", participantAuthUserId);
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

    return NextResponse.json({
      ok: true,
      projectId,
      participantAuthUserId: participantAuthUserId || null,
      trust: {
        signalSummaries: normalizeRows(signalsRead.data),
        reviewCases: normalizeRows(reviewsRead.data),
        appeals: normalizeRows(appealsRead.data),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Project trust summaries could not be loaded.",
      },
      { status: 500 }
    );
  }
}
