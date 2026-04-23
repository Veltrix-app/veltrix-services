import { getStripeServerClient } from "@/lib/billing/stripe";

export async function createCustomerPortalSession(input: {
  stripeCustomerId: string;
  returnUrl: string;
}) {
  const stripe = getStripeServerClient();

  return stripe.billingPortal.sessions.create({
    customer: input.stripeCustomerId,
    return_url: input.returnUrl,
  });
}
