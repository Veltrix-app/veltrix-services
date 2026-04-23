import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedBillingUser } from "@/lib/billing/account-auth";
import { loadSuccessAccountSummaryForUser } from "@/lib/success/account-activation";
import { emitAccountActivationNudges } from "@/lib/success/nudges";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedBillingUser(request);
    const summary = await loadSuccessAccountSummaryForUser(user.user.id);
    await emitAccountActivationNudges(summary);

    return NextResponse.json(
      { ok: true, summary },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load account activation.";
    const status = message === "Missing bearer token." || message === "Invalid session." ? 401 : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
