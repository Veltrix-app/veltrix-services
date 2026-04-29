import { NextRequest, NextResponse } from "next/server";
import { callAespService } from "@/lib/server/aesp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const params = request.nextUrl.searchParams.toString();

  try {
    const result = await callAespService(
      `/trading/competitions/${id}/leaderboard${params ? `?${params}` : ""}`
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading leaderboard could not be loaded.",
      },
      { status: 400 }
    );
  }
}
