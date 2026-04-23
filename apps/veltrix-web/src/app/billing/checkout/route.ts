import { NextRequest, NextResponse } from "next/server";
import {
  assertCustomerAccountMembership,
  resolveAuthenticatedBillingUser,
} from "@/lib/billing/account-auth";
import { createSubscriptionCheckoutSession } from "@/lib/billing/checkout";
import {
  readGrowthAnalyticsContextFromRequest,
  type GrowthAnalyticsContext,
} from "@/lib/analytics/attribution";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

function sanitizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTouch(touch: GrowthAnalyticsContext["firstTouch"]) {
  if (!touch) {
    return null;
  }

  return {
    source: sanitizeNullableString(touch.source),
    medium: sanitizeNullableString(touch.medium),
    campaign: sanitizeNullableString(touch.campaign),
    term: sanitizeNullableString(touch.term),
    content: sanitizeNullableString(touch.content),
    referrer: sanitizeNullableString(touch.referrer),
    landingPath: sanitizeNullableString(touch.landingPath),
    capturedAt: sanitizeNullableString(touch.capturedAt),
  };
}

async function writeCheckoutStartedEvent(input: {
  authUserId: string;
  customerAccountId: string;
  planId: string;
  analyticsContext: GrowthAnalyticsContext | null;
}) {
  const firstTouch = normalizeTouch(input.analyticsContext?.firstTouch ?? null);
  const latestTouch = normalizeTouch(input.analyticsContext?.latestTouch ?? null);
  const supabase = createSupabaseServiceClient();
  const insertResult = await supabase.from("growth_analytics_events").insert({
    event_type: "checkout_started",
    event_source: "billing",
    auth_user_id: input.authUserId,
    customer_account_id: input.customerAccountId,
    session_id: sanitizeNullableString(input.analyticsContext?.sessionId),
    anonymous_id: sanitizeNullableString(input.analyticsContext?.anonymousId),
    utm_source: latestTouch?.source ?? null,
    utm_medium: latestTouch?.medium ?? null,
    utm_campaign: latestTouch?.campaign ?? null,
    utm_term: latestTouch?.term ?? null,
    utm_content: latestTouch?.content ?? null,
    referrer: latestTouch?.referrer ?? null,
    landing_path: latestTouch?.landingPath ?? null,
    first_touch_source: firstTouch?.source ?? null,
    first_touch_medium: firstTouch?.medium ?? null,
    first_touch_campaign: firstTouch?.campaign ?? null,
    first_touch_term: firstTouch?.term ?? null,
    first_touch_content: firstTouch?.content ?? null,
    first_touch_referrer: firstTouch?.referrer ?? null,
    first_touch_landing_path: firstTouch?.landingPath ?? null,
    first_touch_captured_at: firstTouch?.capturedAt ?? null,
    latest_touch_source: latestTouch?.source ?? null,
    latest_touch_medium: latestTouch?.medium ?? null,
    latest_touch_campaign: latestTouch?.campaign ?? null,
    latest_touch_term: latestTouch?.term ?? null,
    latest_touch_content: latestTouch?.content ?? null,
    latest_touch_referrer: latestTouch?.referrer ?? null,
    latest_touch_landing_path: latestTouch?.landingPath ?? null,
    latest_touch_captured_at: latestTouch?.capturedAt ?? null,
    event_payload: {
      billingPlanId: input.planId,
    },
  });

  if (insertResult.error) {
    throw new Error(insertResult.error.message || "Failed to write checkout_started growth event.");
  }
}

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
    const analyticsContext = readGrowthAnalyticsContextFromRequest(request);

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

    try {
      await writeCheckoutStartedEvent({
        authUserId: authenticatedUser.user.id,
        customerAccountId: body.customerAccountId,
        planId: body.planId,
        analyticsContext,
      });
    } catch (error) {
      console.error("Failed to write checkout_started growth event.", error);
    }

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
