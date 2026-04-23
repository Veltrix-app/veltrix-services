import { NextRequest, NextResponse } from "next/server";
import {
  assertCustomerAccountMembership,
  resolveAuthenticatedBillingUser,
} from "@/lib/billing/account-auth";
import { createCustomerPortalSession } from "@/lib/billing/customer-portal";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          customerAccountId?: string;
          returnPath?: string;
        }
      | null;

    if (!body?.customerAccountId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing customer account id.",
        },
        { status: 400 }
      );
    }

    const authenticatedUser = await resolveAuthenticatedBillingUser(request);
    await assertCustomerAccountMembership({
      authUserId: authenticatedUser.user.id,
      customerAccountId: body.customerAccountId,
    });

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("customer_account_billing_profiles")
      .select("stripe_customer_id")
      .eq("customer_account_id", body.customerAccountId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data?.stripe_customer_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "This account does not have a Stripe customer yet.",
        },
        { status: 400 }
      );
    }

    const returnUrl = new URL(body.returnPath ?? "/getting-started", request.nextUrl.origin).toString();
    const session = await createCustomerPortalSession({
      stripeCustomerId: data.stripe_customer_id,
      returnUrl,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Customer portal session creation failed.",
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
