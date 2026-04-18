import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    await requireAuthenticatedUser(accessToken);
    const { id: campaignId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const suffix = limit ? `?limit=${encodeURIComponent(limit)}` : "";
    const result = await callAespService(`/aesp/campaigns/${campaignId}/leaderboard${suffix}`, {
      method: "GET",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Campaign leaderboard failed.",
      },
      { status: 400 }
    );
  }
}
