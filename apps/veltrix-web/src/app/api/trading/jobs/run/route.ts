import { NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";
import { callAespService } from "@/lib/server/aesp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getConfiguredJobProxySecret() {
  return (
    process.env.TRADING_JOB_PROXY_SECRET ||
    process.env.COMMUNITY_BOT_WEBHOOK_SECRET ||
    ""
  ).trim();
}

function hasValidSharedSecret(request: NextRequest, expectedSecret: string) {
  const receivedSecret =
    request.headers.get("x-trading-job-secret") ||
    request.headers.get("x-community-job-secret") ||
    "";
  const expected = Buffer.from(expectedSecret);
  const received = Buffer.from(receivedSecret.trim());

  if (expected.length === 0 || received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, expected);
}

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_TRADING_JOB_PROXY !== "true") {
    return NextResponse.json(
      { ok: false, error: "Trading Arena jobs must run from the community bot or Render cron." },
      { status: 403 }
    );
  }

  const jobProxySecret = getConfiguredJobProxySecret();
  if (!jobProxySecret) {
    return NextResponse.json(
      { ok: false, error: "Missing trading job proxy secret." },
      { status: 500 }
    );
  }

  if (!hasValidSharedSecret(request, jobProxySecret)) {
    return NextResponse.json(
      { ok: false, error: "Invalid trading job proxy secret." },
      { status: 401 }
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
