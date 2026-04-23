import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedBillingUser } from "@/lib/billing/account-auth";
import { loadSuccessMemberState } from "@/lib/success/member-activation";
import { emitMemberActivationNudges } from "@/lib/success/nudges";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedBillingUser(request);
    const memberState = await loadSuccessMemberState(user.user.id);
    await emitMemberActivationNudges(memberState);

    return NextResponse.json(
      { ok: true, memberState },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load member activation.";
    const status = message === "Missing bearer token." || message === "Invalid session." ? 401 : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
