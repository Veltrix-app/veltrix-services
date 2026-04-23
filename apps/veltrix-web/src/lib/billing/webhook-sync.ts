import type Stripe from "stripe";
import { getPublicBillingPlan } from "@/lib/billing/plan-catalog";
import { getStripeServerClient } from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): "trialing" | "active" | "past_due" | "canceled" | "grace" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    case "paused":
      return "grace";
    case "incomplete":
      return "past_due";
    default:
      return "active";
  }
}

function readMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function serializeMetadata(metadata: Stripe.Metadata | null | undefined) {
  return metadata ?? {};
}

function resolveStripeId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function resolveSubscriptionGraceUntil(subscription: Stripe.Subscription) {
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  if (subscription.status === "paused" && currentPeriodEnd) {
    return new Date(currentPeriodEnd * 1000).toISOString();
  }

  if (subscription.cancel_at) {
    return new Date(subscription.cancel_at * 1000).toISOString();
  }

  return null;
}

function resolveInvoiceSubscriptionStripeId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

function resolveInvoicePaymentIntentId(invoice: Stripe.Invoice) {
  const defaultPayment = invoice.payments?.data[0]?.payment;

  if (!defaultPayment) {
    return null;
  }

  if (defaultPayment.type === "payment_intent") {
    return typeof defaultPayment.payment_intent === "string"
      ? defaultPayment.payment_intent
      : defaultPayment.payment_intent?.id ?? null;
  }

  return null;
}

async function resolveCustomerAccountId(params: {
  stripeCustomerId?: string | null;
  metadata?: Stripe.Metadata | null;
}) {
  const directAccountId = readMetadataValue(params.metadata, "customerAccountId");
  if (directAccountId) {
    return directAccountId;
  }

  if (!params.stripeCustomerId) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("customer_account_billing_profiles")
    .select("customer_account_id")
    .eq("stripe_customer_id", params.stripeCustomerId)
    .maybeSingle();

  return data?.customer_account_id ?? null;
}

async function upsertBillingProfile(input: {
  customerAccountId: string;
  stripeCustomerId: string;
  billingEmail?: string | null;
  stripeDefaultPaymentMethodId?: string | null;
  paymentMethodStatus?: "missing" | "ready" | "requires_attention";
}) {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("customer_account_billing_profiles")
    .select("customer_account_id, metadata")
    .eq("customer_account_id", input.customerAccountId)
    .maybeSingle();

  const { error } = await supabase.from("customer_account_billing_profiles").upsert(
    {
      customer_account_id: input.customerAccountId,
      billing_email: input.billingEmail ?? "",
      stripe_customer_id: input.stripeCustomerId,
      stripe_default_payment_method_id:
        typeof input.stripeDefaultPaymentMethodId === "string"
          ? input.stripeDefaultPaymentMethodId
          : null,
      payment_method_status: input.paymentMethodStatus ?? (existing ? undefined : "missing"),
      metadata: existing?.metadata ?? {},
      updated_at: now,
    },
    { onConflict: "customer_account_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function resolveCustomerPaymentSnapshot(params: {
  stripeCustomerId?: string | null;
  subscription?: Stripe.Subscription | null;
  invoice?: Stripe.Invoice | null;
  forceAttention?: boolean;
}) {
  const customerId = params.stripeCustomerId;

  let customer: Stripe.Customer | null = null;
  if (customerId) {
    const stripe = getStripeServerClient();
    const response = await stripe.customers.retrieve(customerId);
    customer = response.deleted ? null : response;
  }

  const defaultPaymentMethodId =
    resolveStripeId(params.invoice?.default_payment_method) ||
    resolveStripeId(params.subscription?.default_payment_method) ||
    resolveStripeId(customer?.invoice_settings?.default_payment_method) ||
    null;

  return {
    billingEmail:
      params.invoice?.customer_email ??
      customer?.email ??
      null,
    stripeDefaultPaymentMethodId: defaultPaymentMethodId,
    paymentMethodStatus: params.forceAttention
      ? ("requires_attention" as const)
      : defaultPaymentMethodId
        ? ("ready" as const)
        : ("missing" as const),
  };
}

async function hasSyncedStripeEvent(eventId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("customer_account_billing_events")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

async function insertBillingEvent(input: {
  customerAccountId: string;
  customerAccountSubscriptionId?: string | null;
  customerAccountInvoiceId?: string | null;
  eventSource: "stripe_webhook" | "portal_admin" | "system" | "customer";
  eventType:
    | "profile_created"
    | "subscription_started"
    | "subscription_updated"
    | "subscription_canceled"
    | "invoice_created"
    | "invoice_paid"
    | "invoice_payment_failed"
    | "trial_extended"
    | "grace_extended"
    | "plan_changed"
    | "enterprise_managed_set"
    | "billing_synced"
    | "business_note_added";
  stripeEventId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from("customer_account_billing_events").insert({
    customer_account_id: input.customerAccountId,
    customer_account_subscription_id: input.customerAccountSubscriptionId ?? null,
    customer_account_invoice_id: input.customerAccountInvoiceId ?? null,
    event_source: input.eventSource,
    event_type: input.eventType,
    stripe_event_id: input.stripeEventId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncCustomerBillingProfile(customer: Stripe.Customer, stripeEventId: string) {
  const customerId = customer.id;
  const customerAccountId = await resolveCustomerAccountId({
    stripeCustomerId: customerId,
    metadata: customer.metadata,
  });

  if (!customerAccountId) {
    return;
  }

  const defaultPaymentMethodId = resolveStripeId(customer.invoice_settings?.default_payment_method);

  await upsertBillingProfile({
    customerAccountId,
    stripeCustomerId: customerId,
    billingEmail: customer.email,
    stripeDefaultPaymentMethodId: defaultPaymentMethodId,
    paymentMethodStatus: defaultPaymentMethodId ? "ready" : "missing",
  });

  await insertBillingEvent({
    customerAccountId,
    eventSource: "stripe_webhook",
    eventType: "billing_synced",
    stripeEventId,
    summary: "Stripe customer billing profile synced.",
    metadata: {
      stripeCustomerId: customerId,
    },
  });
}

async function syncSubscription(subscription: Stripe.Subscription, stripeEventId: string) {
  const customerAccountId = await resolveCustomerAccountId({
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    metadata: subscription.metadata,
  });

  if (!customerAccountId) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const billingPlanId = readMetadataValue(subscription.metadata, "billingPlanId") || "starter";
  const plan = getPublicBillingPlan(billingPlanId) ?? getPublicBillingPlan("starter");
  const customerPaymentSnapshot = await resolveCustomerPaymentSnapshot({
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    subscription,
  });

  await upsertBillingProfile({
    customerAccountId,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? "",
    billingEmail: customerPaymentSnapshot.billingEmail,
    stripeDefaultPaymentMethodId: customerPaymentSnapshot.stripeDefaultPaymentMethodId,
    paymentMethodStatus: customerPaymentSnapshot.paymentMethodStatus,
  });

  const { data: existing } = await supabase
    .from("customer_account_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  const { data: currentSubscription } = await supabase
    .from("customer_account_subscriptions")
    .select("id")
    .eq("customer_account_id", customerAccountId)
    .eq("is_current", true)
    .maybeSingle();

  if (currentSubscription?.id && currentSubscription.id !== existing?.id) {
    await supabase
      .from("customer_account_subscriptions")
      .update({
        is_current: false,
        ended_at: now,
        updated_at: now,
      })
      .eq("id", currentSubscription.id);
  }

  const payload = {
    id: existing?.id,
    customer_account_id: customerAccountId,
    billing_plan_id: billingPlanId,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    stripe_subscription_id: subscription.id,
    status: mapStripeSubscriptionStatus(subscription.status),
    is_current: true,
    started_at: existing ? undefined : new Date(subscription.start_date * 1000).toISOString(),
    current_period_start: subscription.items.data[0]?.current_period_start
      ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
    trial_started_at: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    grace_until: resolveSubscriptionGraceUntil(subscription),
    metadata: serializeMetadata(subscription.metadata),
    updated_at: now,
  };

  const { error: subscriptionError } = await supabase
    .from("customer_account_subscriptions")
    .upsert(payload, { onConflict: "id" });

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  const { data: syncedSubscription } = await supabase
    .from("customer_account_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (plan && syncedSubscription?.id) {
    const { error: entitlementError } = await supabase
      .from("customer_account_entitlements")
      .upsert(
        {
          customer_account_id: customerAccountId,
          billing_plan_id: plan.id,
          customer_account_subscription_id: syncedSubscription.id,
          max_projects: plan.projectsLimit,
          max_active_campaigns: plan.campaignsLimit,
          max_live_quests: plan.questsLimit,
          max_live_raids: plan.raidsLimit,
          max_providers: plan.providersLimit,
          included_billable_seats: plan.includedBillableSeats,
          self_serve_allowed: plan.isSelfServe,
          enterprise_managed: plan.isEnterprise,
          last_computed_at: now,
          updated_at: now,
        },
        { onConflict: "customer_account_id" }
      );

    if (entitlementError) {
      throw new Error(entitlementError.message);
    }
  }

  await insertBillingEvent({
    customerAccountId,
    customerAccountSubscriptionId: syncedSubscription?.id ?? null,
    eventSource: "stripe_webhook",
    eventType:
      subscription.status === "canceled" || subscription.status === "unpaid"
        ? "subscription_canceled"
        : existing
          ? "subscription_updated"
          : "subscription_started",
    stripeEventId,
    summary: "Stripe subscription synced.",
    metadata: {
      stripeStatus: subscription.status,
      billingPlanId,
    },
  });
}

async function syncInvoice(input: {
  invoice: Stripe.Invoice;
  eventType: "invoice_created" | "invoice_paid" | "invoice_payment_failed" | "billing_synced";
  stripeEventId: string;
  collectionStatusOverride?: "clear" | "renewing_soon" | "payment_failed" | "action_required" | "refunded";
}) {
  const invoice = input.invoice;
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const customerAccountId = await resolveCustomerAccountId({
    stripeCustomerId: customerId,
    metadata: invoice.parent?.subscription_details?.metadata ?? invoice.metadata ?? null,
  });

  if (!customerAccountId) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const paymentSnapshot = await resolveCustomerPaymentSnapshot({
    stripeCustomerId: customerId,
    invoice,
    forceAttention:
      input.collectionStatusOverride === "action_required" ||
      input.collectionStatusOverride === "payment_failed" ||
      input.eventType === "invoice_payment_failed",
  });

  let subscriptionId: string | null = null;
  const invoiceSubscriptionStripeId = resolveInvoiceSubscriptionStripeId(invoice);
  if (invoiceSubscriptionStripeId) {
    const { data: syncedSubscription } = await supabase
      .from("customer_account_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", invoiceSubscriptionStripeId)
      .maybeSingle();

    subscriptionId = syncedSubscription?.id ?? null;
  }

  const { data: existing } = await supabase
    .from("customer_account_invoices")
    .select("id")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();

  const refundedAmount = (invoice.post_payment_credit_notes_amount ?? 0) / 100;
  const collectionStatus =
    input.collectionStatusOverride ??
    (refundedAmount > 0
      ? "refunded"
      : input.eventType === "invoice_paid"
        ? "clear"
        : input.eventType === "invoice_payment_failed"
          ? "payment_failed"
          : "renewing_soon");

  const { error: invoiceError } = await supabase.from("customer_account_invoices").upsert(
    {
      id: existing?.id,
      customer_account_id: customerAccountId,
      customer_account_subscription_id: subscriptionId,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: resolveInvoicePaymentIntentId(invoice),
      invoice_number: invoice.number,
      status: invoice.status === "paid" ? "paid" : invoice.status === "void" ? "void" : invoice.status === "uncollectible" ? "uncollectible" : "open",
      collection_status: collectionStatus,
      currency: invoice.currency ?? "eur",
      subtotal_amount: (invoice.subtotal ?? 0) / 100,
      tax_amount: (invoice.total_taxes?.reduce((sum, item) => sum + (item.amount ?? 0), 0) ?? 0) / 100,
      total_amount: (invoice.total ?? 0) / 100,
      amount_paid: (invoice.amount_paid ?? 0) / 100,
      amount_remaining: (invoice.amount_remaining ?? 0) / 100,
      refunded_amount: refundedAmount,
      due_at: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paid_at: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf_url: invoice.invoice_pdf,
      metadata: serializeMetadata(invoice.metadata),
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (customerId) {
    await upsertBillingProfile({
      customerAccountId,
      stripeCustomerId: customerId,
      billingEmail: paymentSnapshot.billingEmail,
      stripeDefaultPaymentMethodId: paymentSnapshot.stripeDefaultPaymentMethodId,
      paymentMethodStatus: paymentSnapshot.paymentMethodStatus,
    });
  }

  const { data: syncedInvoice } = await supabase
    .from("customer_account_invoices")
    .select("id")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();

  await insertBillingEvent({
    customerAccountId,
    customerAccountSubscriptionId: subscriptionId,
    customerAccountInvoiceId: syncedInvoice?.id ?? null,
    eventSource: "stripe_webhook",
    eventType: input.eventType,
    stripeEventId: input.stripeEventId,
    summary: "Stripe invoice synced.",
    metadata: {
      stripeInvoiceId: invoice.id,
      stripeStatus: invoice.status,
      collectionStatus,
      refundedAmount,
    },
  });
}

export async function syncStripeEvent(event: Stripe.Event) {
  if (await hasSyncedStripeEvent(event.id)) {
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerAccountId = session.metadata?.customerAccountId;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

      if (customerAccountId && customerId) {
        await upsertBillingProfile({
          customerAccountId,
          stripeCustomerId: customerId,
          billingEmail: session.customer_details?.email,
        });

        await insertBillingEvent({
          customerAccountId,
          eventSource: "stripe_webhook",
          eventType: "billing_synced",
          stripeEventId: event.id,
          summary: "Stripe checkout completion synced.",
          metadata: {
            stripeCustomerId: customerId,
            stripeCheckoutSessionId: session.id,
          },
        });
      }

      return;
    }
    case "customer.updated": {
      const customer = event.data.object as Stripe.Customer;
      if (!customer.deleted) {
        await syncCustomerBillingProfile(customer, event.id);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncSubscription(event.data.object as Stripe.Subscription, event.id);
      return;
    case "invoice.created":
      await syncInvoice({
        invoice: event.data.object as Stripe.Invoice,
        eventType: "invoice_created",
        stripeEventId: event.id,
      });
      return;
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await syncInvoice({
        invoice: event.data.object as Stripe.Invoice,
        eventType: "invoice_paid",
        stripeEventId: event.id,
      });
      return;
    case "invoice.payment_failed":
      await syncInvoice({
        invoice: event.data.object as Stripe.Invoice,
        eventType: "invoice_payment_failed",
        stripeEventId: event.id,
      });
      return;
    case "invoice.payment_action_required":
      await syncInvoice({
        invoice: event.data.object as Stripe.Invoice,
        eventType: "billing_synced",
        stripeEventId: event.id,
        collectionStatusOverride: "action_required",
      });
      return;
    case "invoice.updated":
    case "invoice.overpaid":
    case "invoice.voided":
    case "invoice.marked_uncollectible":
    case "credit_note.created":
    case "credit_note.updated":
    case "credit_note.voided": {
      const stripe = getStripeServerClient();
      const invoiceId =
        resolveStripeId(
          "invoice" in event.data.object
            ? (event.data.object as { invoice?: string | { id: string } | null }).invoice ?? null
            : null
        ) ?? event.data.object.id;

      const invoice = await stripe.invoices.retrieve(invoiceId);
      await syncInvoice({
        invoice,
        eventType: "billing_synced",
        stripeEventId: event.id,
      });
      return;
    }
    case "payment_method.attached":
    case "payment_method.updated":
    case "payment_method.detached": {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      const customerId = resolveStripeId(paymentMethod.customer);

      if (!customerId) {
        return;
      }

      const stripe = getStripeServerClient();
      const response = await stripe.customers.retrieve(customerId);
      if (!response.deleted) {
        await syncCustomerBillingProfile(response, event.id);
      }
      return;
    }
    default:
      return;
  }
}
