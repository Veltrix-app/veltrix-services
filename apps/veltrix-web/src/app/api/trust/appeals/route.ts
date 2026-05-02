import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRIVATE_CONTEXT_KEYS = new Set([
  "ipHash",
  "sessionHash",
  "userAgentHash",
  "socialAccountHash",
  "relatedWalletAddresses",
  "rawIdentifiers",
  "rawEdges",
]);

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

function safePublicContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) => !PRIVATE_CONTEXT_KEYS.has(key))
  );
}

export async function POST(request: NextRequest) {
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

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const reviewCaseId = safeString(body?.reviewCaseId) || null;
    const message = safeString(body?.message);
    let projectId = safeString(body?.projectId) || null;
    let walletAddress = safeString(body?.walletAddress) || null;

    if (message.length < 12 || message.length > 2000) {
      return NextResponse.json(
        { ok: false, error: "Appeal message must be between 12 and 2000 characters." },
        { status: 400 }
      );
    }

    if (reviewCaseId) {
      const { data: reviewCase, error: reviewCaseError } = await serviceSupabase
        .from("trust_review_cases")
        .select("id, auth_user_id, project_id, wallet_address, status")
        .eq("id", reviewCaseId)
        .maybeSingle();

      if (reviewCaseError) {
        return NextResponse.json({ ok: false, error: reviewCaseError.message }, { status: 500 });
      }

      if (!reviewCase?.id || reviewCase.auth_user_id !== user.id) {
        return NextResponse.json(
          { ok: false, error: "Review case was not found for this account." },
          { status: 404 }
        );
      }

      if (!["open", "in_review", "waiting_on_user"].includes(safeString(reviewCase.status))) {
        return NextResponse.json(
          { ok: false, error: "This review case is no longer open for appeal." },
          { status: 409 }
        );
      }

      projectId = safeString(reviewCase.project_id) || projectId;
      walletAddress = safeString(reviewCase.wallet_address) || walletAddress;
    }

    const { data: appeal, error: appealError } = await serviceSupabase
      .from("trust_appeals")
      .insert({
        review_case_id: reviewCaseId,
        project_id: projectId,
        auth_user_id: user.id,
        wallet_address: walletAddress ? walletAddress.toLowerCase() : null,
        message,
        public_context: safePublicContext(body?.publicContext),
      })
      .select("id, review_case_id, project_id, status, submitted_at")
      .single();

    if (appealError) {
      return NextResponse.json({ ok: false, error: appealError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, appeal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trust appeal could not be submitted.",
      },
      { status: 500 }
    );
  }
}
