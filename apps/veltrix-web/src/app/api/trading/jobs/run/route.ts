import { NextRequest, NextResponse } from "next/server";
import { callAespService } from "@/lib/server/aesp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_TRADING_JOB_PROXY !== "true") {
    return NextResponse.json(
      { ok: false, error: "Trading Arena jobs must run from the community bot or Render cron." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const result = await callAespService("/trading/jobs/run", {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading Arena job failed.",
      },
      { status: 500 }
    );
  }
}
