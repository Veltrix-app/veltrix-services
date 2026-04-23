import { getPublicBillingPlan } from "@/lib/billing/plan-catalog";
import { getStripeServerClient } from "@/lib/billing/stripe";

export async function createSubscriptionCheckoutSession(input: {
  planId: string;
  customerAccountId: string;
  successUrl: string;
  cancelUrl: string;
  stripeCustomerId?: string;
  customerEmail?: string;
}) {
  const plan = getPublicBillingPlan(input.planId);

  if (!plan) {
    throw new Error("Unknown billing plan.");
  }

  if (!plan.isCheckoutEnabled || !plan.stripePriceId) {
    throw new Error("This plan cannot be purchased through checkout.");
  }

  const stripe = getStripeServerClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.customerAccountId,
    customer: input.stripeCustomerId,
    customer_email: input.stripeCustomerId ? undefined : input.customerEmail,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: false,
    metadata: {
      customerAccountId: input.customerAccountId,
      billingPlanId: plan.id,
    },
    subscription_data: {
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: {
        customerAccountId: input.customerAccountId,
        billingPlanId: plan.id,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}
