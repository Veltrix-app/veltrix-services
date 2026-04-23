import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedBillingUser } from "@/lib/billing/account-auth";
import { loadProjectBenchmarkOverview } from "@/lib/analytics/customer-overview";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "projectId is required.",
        },
        { status: 400 }
      );
    }

    const user = await resolveAuthenticatedBillingUser(request);
    const summary = await loadProjectBenchmarkOverview({
      projectId,
      authUserId: user.user.id,
    });

    return NextResponse.json(
      {
        ok: true,
        summary,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load project benchmark overview.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Project analytics access denied."
          ? 403
          : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
