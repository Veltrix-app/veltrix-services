import { NextRequest, NextResponse } from "next/server";
import {
  advanceCommunityJourney,
  resolveCommunityJourneyRequest,
} from "@/lib/community/journey";

export async function POST(request: NextRequest) {
  try {
    const { user, serviceSupabase } = await resolveCommunityJourneyRequest(request);
    const body = (await request.json().catch(() => null)) as
      | {
          actionKey?: string;
          projectId?: string;
          lane?: "onboarding" | "active" | "comeback";
        }
      | null;

    const actionKey = body?.actionKey?.trim() ?? "";
    if (!actionKey) {
      return NextResponse.json(
        { ok: false, error: "Missing action key." },
        { status: 400 }
      );
    }

    const result = await advanceCommunityJourney({
      serviceSupabase,
      authUserId: user.id,
      projectId: body?.projectId?.trim() ?? "",
      actionKey,
      lane: body?.lane,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      advanced: result.advanced,
      lane: result.lane,
      snapshot: result.snapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Community journey advance failed.";
    const status = message === "Missing bearer token." ? 401 : message === "Invalid session." ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
