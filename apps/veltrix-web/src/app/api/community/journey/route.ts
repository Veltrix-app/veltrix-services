import { NextRequest, NextResponse } from "next/server";
import {
  buildCommunityJourneySnapshot,
  resolveCommunityJourneyRequest,
} from "@/lib/community/journey";

export async function GET(request: NextRequest) {
  try {
    const { user, serviceSupabase } = await resolveCommunityJourneyRequest(request);
    const projectId = request.nextUrl.searchParams.get("projectId");
    const snapshot = await buildCommunityJourneySnapshot({
      serviceSupabase,
      authUserId: user.id,
      projectId,
    });

    return NextResponse.json({
      ok: true,
      snapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Community journey snapshot failed.";
    const status = message === "Missing bearer token." ? 401 : message === "Invalid session." ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
