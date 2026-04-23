import { NextRequest, NextResponse } from "next/server";
import { getStripeServerClient } from "@/lib/billing/stripe";
import { syncStripeEvent } from "@/lib/billing/webhook-sync";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Stripe webhook secret is not configured.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.text();
    const stripe = getStripeServerClient();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    await syncStripeEvent(event);

    return NextResponse.json({
      ok: true,
      received: true,
      type: event.type,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Stripe webhook processing failed.",
      },
      { status: 400 }
    );
  }
}
