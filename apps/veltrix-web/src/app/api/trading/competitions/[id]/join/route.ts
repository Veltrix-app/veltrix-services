import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const user = await requireAuthenticatedUser(accessToken);
    const result = await callAespService(`/trading/competitions/${id}/join`, {
      method: "POST",
      body: JSON.stringify({ authUserId: user.id }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading competition join failed.",
      },
      { status: 400 }
    );
  }
}
