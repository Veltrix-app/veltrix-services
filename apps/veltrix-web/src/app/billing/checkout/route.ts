import { NextRequest, NextResponse } from "next/server";
import {
  assertCustomerAccountMembership,
  resolveAuthenticatedBillingUser,
} from "@/lib/billing/account-auth";
import { createSubscriptionCheckoutSession } from "@/lib/billing/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          planId?: string;
          customerAccountId?: string;
          stripeCustomerId?: string;
          customerEmail?: string;
          successPath?: string;
          cancelPath?: string;
        }
      | null;

    if (!body?.planId || !body.customerAccountId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing checkout plan or customer account id.",
        },
        { status: 400 }
      );
    }

    const authenticatedUser = await resolveAuthenticatedBillingUser(request);
    await assertCustomerAccountMembership({
      authUserId: authenticatedUser.user.id,
      customerAccountId: body.customerAccountId,
    });

    const origin = request.nextUrl.origin;
    const successUrl = new URL(body.successPath ?? "/billing/success", origin).toString();
    const cancelUrl = new URL(body.cancelPath ?? "/billing/canceled", origin).toString();

    const session = await createSubscriptionCheckoutSession({
      planId: body.planId,
      customerAccountId: body.customerAccountId,
      stripeCustomerId: body.stripeCustomerId,
      customerEmail: body.customerEmail ?? authenticatedUser.email ?? undefined,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Checkout session creation failed.",
      },
      {
        status:
          error instanceof Error &&
          (error.message === "Missing bearer token." ||
            error.message === "Invalid session." ||
            error.message === "Account access denied.")
            ? 401
            : 500,
      }
    );
  }
}
