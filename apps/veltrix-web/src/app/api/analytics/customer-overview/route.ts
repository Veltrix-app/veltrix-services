import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedBillingUser } from "@/lib/billing/account-auth";
import { loadCurrentCustomerGrowthOverviewForUser } from "@/lib/analytics/customer-overview";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedBillingUser(request);
    const summary = await loadCurrentCustomerGrowthOverviewForUser(user.user.id);

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
      error instanceof Error ? error.message : "Failed to load customer growth overview.";
    const status = message === "Missing bearer token." || message === "Invalid session." ? 401 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
