import { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";

const allowedProviders = new Set(["visit", "discord", "telegram", "x-follow"]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  if (!allowedProviders.has(provider)) {
    return NextResponse.json({ ok: false, error: "Unknown verification route." }, { status: 404 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const body = await request.text();

  try {
    const response = await fetch(`${publicEnv.portalUrl}/api/verify/${provider}`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        Authorization: authorization,
      },
      body,
      cache: "no-store",
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Verification proxy failed.",
      },
      { status: 502 }
    );
  }
}
