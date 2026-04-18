import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { stakedXp?: number } | null;
  const stakedXp = Number(body?.stakedXp ?? 0);

  if (!Number.isFinite(stakedXp) || stakedXp <= 0) {
    return NextResponse.json(
      { ok: false, error: "Choose a positive XP amount before staking." },
      { status: 400 }
    );
  }

  try {
    const user = await requireAuthenticatedUser(accessToken);
    const { id: campaignId } = await context.params;
    const result = await callAespService(`/aesp/campaigns/${campaignId}/stakes`, {
      method: "POST",
      body: JSON.stringify({
        authUserId: user.id,
        stakedXp,
      }),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Campaign staking failed.",
      },
      { status: 400 }
    );
  }
}
