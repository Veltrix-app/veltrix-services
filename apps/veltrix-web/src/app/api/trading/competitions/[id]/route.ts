import { NextRequest, NextResponse } from "next/server";
import { callAespService } from "@/lib/server/aesp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const result = await callAespService(`/trading/competitions/${id}`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading competition was not found.",
      },
      { status: 404 }
    );
  }
}
