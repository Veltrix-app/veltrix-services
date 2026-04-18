import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; stakeId: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const user = await requireAuthenticatedUser(accessToken);
    const { id: campaignId, stakeId } = await context.params;
    const result = await callAespService(`/aesp/campaigns/${campaignId}/stakes/${stakeId}/refresh`, {
      method: "POST",
      body: JSON.stringify({
        authUserId: user.id,
      }),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Stake refresh failed.",
      },
      { status: 400 }
    );
  }
}
