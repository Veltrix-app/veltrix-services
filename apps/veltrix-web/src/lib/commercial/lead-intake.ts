import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { GrowthAnalyticsContext } from "@/lib/analytics/attribution";

type CommercialSource =
  | "manual"
  | "pricing"
  | "start"
  | "homepage"
  | "trust"
  | "docs"
  | "demo_request"
  | "enterprise_intake"
  | "support"
  | "billing"
  | "success"
  | "analytics"
  | "converted_account";

type CommercialLeadState =
  | "new"
  | "qualified"
  | "watching"
  | "engaged"
  | "evaluation"
  | "converted"
  | "cooling_off"
  | "lost";

type CommercialRequestStatus = "new" | "qualified" | "converted" | "closed";

type CommercialNoteType =
  | "general"
  | "qualification"
  | "buyer_concern"
  | "enterprise_requirement"
  | "follow_up";

type CommercialTaskType =
  | "follow_up"
  | "qualification"
  | "demo_follow_up"
  | "enterprise_review"
  | "expansion_follow_up";

type CommercialEventType =
  | "lead_created"
  | "signal_captured"
  | "qualified"
  | "state_changed"
  | "note_added"
  | "task_added"
  | "task_resolved"
  | "request_linked"
  | "account_linked"
  | "converted"
  | "cooling_off"
  | "lost";

export type CommercialLeadContext = {
  from?: string | null;
  plan?: string | null;
  intent?: string | null;
  accountId?: string | null;
  returnTo?: string | null;
  sourcePath?: string | null;
};

export type DemoRequestInput = {
  requesterName: string;
  requesterEmail: string;
  companyName: string;
  teamSize: string;
  useCase: string;
  urgency: string;
  context?: CommercialLeadContext | null;
  analyticsContext?: GrowthAnalyticsContext | null;
};

export type EnterpriseIntakeInput = DemoRequestInput & {
  requirementSummary: string;
  securityRequirements?: string;
  billingRequirements?: string;
  onboardingRequirements?: string;
};

function sanitizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function sanitizeNullableText(value: unknown) {
  const trimmed = sanitizeText(value);
  return trimmed.length > 0 ? trimmed : null;
}

function deriveCompanyDomain(params: { email: string; companyDomain?: string | null }) {
  const explicit = sanitizeNullableText(params.companyDomain);
  if (explicit) {
    return explicit.toLowerCase();
  }

  const email = sanitizeText(params.email).toLowerCase();
  const domain = email.split("@")[1]?.trim() ?? "";
  return domain.length > 0 ? domain : null;
}

function resolveCommercialSource(context: CommercialLeadContext | null | undefined): CommercialSource {
  const from = sanitizeText(context?.from).toLowerCase();

  switch (from) {
    case "pricing":
      return "pricing";
    case "start":
      return "start";
    case "homepage":
    case "landing":
      return "homepage";
    case "trust":
      return "trust";
    case "docs":
    case "buyer_guides":
      return "docs";
    case "support":
      return "support";
    case "billing":
      return "billing";
    case "success":
      return "success";
    case "analytics":
      return "analytics";
    default:
      return "manual";
  }
}

function buildIntentSummary(input: {
  companyName: string;
  useCase: string;
  urgency: string;
  plan?: string | null;
  intent?: string | null;
  source: CommercialSource;
}) {
  const parts = [
    `${input.companyName || "Buyer"} came through ${input.source.replace(/_/g, " ")}`,
    input.plan ? `around ${input.plan} pricing` : null,
    input.intent ? `with ${input.intent.replace(/_/g, " ")}` : null,
    input.urgency ? `and marked urgency as ${input.urgency}` : null,
  ].filter(Boolean);

  return `${parts.join(" ")}. ${input.useCase}`;
}

function buildQualificationSummary(input: {
  teamSize: string;
  source: CommercialSource;
  sourcePath?: string | null;
}) {
  const path = sanitizeNullableText(input.sourcePath);
  return `Team size ${input.teamSize || "unknown"} | source ${input.source.replace(/_/g, " ")}${path ? ` | path ${path}` : ""}`;
}

function deriveTaskDueState(dueAt: string) {
  const now = new Date();
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return "upcoming";
  }

  if (due.getTime() < now.getTime()) {
    return "overdue";
  }

  if (due.getTime() - now.getTime() <= 1000 * 60 * 60 * 24) {
    return "due_now";
  }

  return "upcoming";
}

function addDays(value: number) {
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + value);
  return next.toISOString();
}

function leadStateRank(state: CommercialLeadState) {
  switch (state) {
    case "new":
      return 0;
    case "qualified":
      return 1;
    case "watching":
      return 2;
    case "engaged":
      return 3;
    case "evaluation":
      return 4;
    case "converted":
      return 5;
    case "cooling_off":
      return 6;
    case "lost":
      return 7;
  }
}

function promoteLeadState(
  current: CommercialLeadState,
  minimum: CommercialLeadState
): CommercialLeadState {
  return leadStateRank(current) >= leadStateRank(minimum) ? current : minimum;
}

async function resolveLinkedCustomerAccount(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  accountId?: string | null;
  requesterEmail: string;
}) {
  const explicitAccountId = sanitizeNullableText(params.accountId);
  if (explicitAccountId) {
    const { data, error } = await params.supabase
      .from("customer_accounts")
      .select("id, name")
      .eq("id", explicitAccountId)
      .maybeSingle();

    if (!error && data?.id) {
      return {
        accountId: data.id,
        accountName: data.name ?? null,
      };
    }
  }

  const { data, error } = await params.supabase
    .from("customer_accounts")
    .select("id, name")
    .ilike("contact_email", params.requesterEmail)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      accountId: null,
      accountName: null,
    };
  }

  const account = (data ?? [])[0] as { id?: string; name?: string | null } | undefined;
  return {
    accountId: account?.id ?? null,
    accountName: account?.name ?? null,
  };
}

async function findReusableLead(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  requesterEmail: string;
  companyDomain: string | null;
}) {
  const { data, error } = await params.supabase
    .from("commercial_leads")
    .select("*")
    .eq("contact_email", params.requesterEmail)
    .in("lead_state", ["new", "qualified", "watching", "engaged", "evaluation", "cooling_off"])
    .order("updated_at", { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(error.message || "Failed to inspect existing commercial leads.");
  }

  const match = ((data ?? []) as Array<{ id: string; company_domain?: string | null; lead_state: CommercialLeadState }>).find(
    (lead) => !params.companyDomain || !lead.company_domain || lead.company_domain === params.companyDomain
  );

  return match ?? null;
}

async function insertLeadEvent(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  leadId: string;
  eventType: CommercialEventType;
  summary: string;
  eventPayload?: Record<string, unknown>;
}) {
  const { error } = await params.supabase.from("commercial_lead_events").insert({
    commercial_lead_id: params.leadId,
    event_type: params.eventType,
    summary: params.summary,
    event_payload: params.eventPayload ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to write commercial lead event.");
  }
}

async function insertLeadTask(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  leadId: string;
  taskType: CommercialTaskType;
  title: string;
  summary: string;
  dueAt: string;
}) {
  const { error } = await params.supabase.from("commercial_follow_up_tasks").insert({
    commercial_lead_id: params.leadId,
    task_type: params.taskType,
    status: "open",
    due_state: deriveTaskDueState(params.dueAt),
    title: params.title,
    summary: params.summary,
    due_at: params.dueAt,
    metadata: {},
  });

  if (error) {
    throw new Error(error.message || "Failed to create commercial follow-up task.");
  }
}

async function insertLeadNote(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  leadId: string;
  noteType: CommercialNoteType;
  title: string;
  body: string;
}) {
  const { error } = await params.supabase.from("commercial_lead_notes").insert({
    commercial_lead_id: params.leadId,
    note_type: params.noteType,
    status: "open",
    title: params.title,
    body: params.body,
    metadata: {},
  });

  if (error) {
    throw new Error(error.message || "Failed to create commercial lead note.");
  }
}

async function upsertCommercialLead(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  contactName: string;
  contactEmail: string;
  companyName: string;
  companyDomain: string | null;
  source: CommercialSource;
  linkedCustomerAccountId: string | null;
  qualificationSummary: string;
  intentSummary: string;
  minimumState: CommercialLeadState;
  metadata: Record<string, unknown>;
}) {
  const existing = await findReusableLead({
    supabase: params.supabase,
    requesterEmail: params.contactEmail,
    companyDomain: params.companyDomain,
  });

  if (existing?.id) {
    const nextState = promoteLeadState(existing.lead_state, params.minimumState);
    const now = new Date().toISOString();
    const { data, error } = await params.supabase
      .from("commercial_leads")
      .update({
        lead_state: nextState,
        source: params.source,
        contact_name: params.contactName,
        company_name: params.companyName,
        company_domain: params.companyDomain,
        linked_customer_account_id: params.linkedCustomerAccountId,
        qualification_summary: params.qualificationSummary,
        intent_summary: params.intentSummary,
        last_signal_at: now,
        last_contact_at: now,
        metadata: params.metadata,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update commercial lead.");
    }

    await insertLeadEvent({
      supabase: params.supabase,
      leadId: existing.id,
      eventType: "signal_captured",
      summary: `Lead refreshed from ${params.source.replace(/_/g, " ")} activity.`,
      eventPayload: params.metadata,
    });

    return data;
  }

  const now = new Date().toISOString();
  const { data, error } = await params.supabase
    .from("commercial_leads")
    .insert({
      lead_state: params.minimumState,
      source: params.source,
      contact_name: params.contactName,
      contact_email: params.contactEmail,
      company_name: params.companyName,
      company_domain: params.companyDomain,
      linked_customer_account_id: params.linkedCustomerAccountId,
      qualification_summary: params.qualificationSummary,
      intent_summary: params.intentSummary,
      last_signal_at: now,
      last_contact_at: now,
      metadata: params.metadata,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create commercial lead.");
  }

  await insertLeadEvent({
    supabase: params.supabase,
    leadId: data.id,
    eventType: "lead_created",
    summary: `Lead created from ${params.source.replace(/_/g, " ")} activity.`,
    eventPayload: params.metadata,
  });

  return data;
}

export async function submitDemoRequest(input: DemoRequestInput) {
  const supabase = createSupabaseServiceClient();
  const requesterName = sanitizeText(input.requesterName);
  const requesterEmail = sanitizeText(input.requesterEmail).toLowerCase();
  const companyName = sanitizeText(input.companyName);
  const teamSize = sanitizeText(input.teamSize);
  const useCase = sanitizeText(input.useCase);
  const urgency = sanitizeText(input.urgency);
  const source = resolveCommercialSource(input.context);
  const companyDomain = deriveCompanyDomain({
    email: requesterEmail,
    companyDomain: null,
  });
  const linkedAccount = await resolveLinkedCustomerAccount({
    supabase,
    accountId: input.context?.accountId ?? null,
    requesterEmail,
  });
  const metadata = {
    kind: "demo_request",
    context: input.context ?? null,
    analyticsContext: input.analyticsContext ?? null,
    linkedAccountName: linkedAccount.accountName,
  };

  const lead = await upsertCommercialLead({
    supabase,
    contactName: requesterName,
    contactEmail: requesterEmail,
    companyName,
    companyDomain,
    source: source === "manual" ? "demo_request" : source,
    linkedCustomerAccountId: linkedAccount.accountId,
    qualificationSummary: buildQualificationSummary({
      teamSize,
      source: source === "manual" ? "demo_request" : source,
      sourcePath: input.context?.sourcePath ?? null,
    }),
    intentSummary: buildIntentSummary({
      companyName,
      useCase,
      urgency,
      plan: input.context?.plan ?? null,
      intent: input.context?.intent ?? null,
      source: source === "manual" ? "demo_request" : source,
    }),
    minimumState: "engaged",
    metadata,
  });

  const { data: requestRow, error: requestError } = await supabase
    .from("demo_requests")
    .insert({
      commercial_lead_id: lead.id,
      requester_name: requesterName,
      requester_email: requesterEmail,
      company_name: companyName,
      company_domain: companyDomain,
      team_size: teamSize,
      use_case: useCase,
      urgency,
      request_source: source === "manual" ? "talk_to_sales" : source,
      status: "new" satisfies CommercialRequestStatus,
      source_path: sanitizeNullableText(input.context?.sourcePath),
      metadata,
    })
    .select("*")
    .single();

  if (requestError || !requestRow) {
    throw new Error(requestError?.message || "Failed to store demo request.");
  }

  await insertLeadEvent({
    supabase,
    leadId: lead.id,
    eventType: "request_linked",
    summary: "Demo request linked to the lead timeline.",
    eventPayload: {
      requestId: requestRow.id,
      requestType: "demo_request",
      source,
    },
  });

  await insertLeadTask({
    supabase,
    leadId: lead.id,
    taskType: "demo_follow_up",
    title: `Follow up on ${companyName || requesterName} demo request`,
    summary: `Respond to the buyer, qualify the use case and decide whether the path stays self-serve or becomes a guided rollout conversation.`,
    dueAt: addDays(2),
  });

  await insertLeadNote({
    supabase,
    leadId: lead.id,
    noteType: "qualification",
    title: "Demo request captured",
    body: `${companyName || requesterName} requested a demo. Use case: ${useCase}. Urgency: ${urgency}.`,
  });

  return {
    leadId: lead.id as string,
    requestId: requestRow.id as string,
  };
}

export async function submitEnterpriseIntake(input: EnterpriseIntakeInput) {
  const supabase = createSupabaseServiceClient();
  const requesterName = sanitizeText(input.requesterName);
  const requesterEmail = sanitizeText(input.requesterEmail).toLowerCase();
  const companyName = sanitizeText(input.companyName);
  const teamSize = sanitizeText(input.teamSize);
  const useCase = sanitizeText(input.useCase);
  const urgency = sanitizeText(input.urgency);
  const requirementSummary = sanitizeText(input.requirementSummary);
  const securityRequirements = sanitizeText(input.securityRequirements);
  const billingRequirements = sanitizeText(input.billingRequirements);
  const onboardingRequirements = sanitizeText(input.onboardingRequirements);
  const source = resolveCommercialSource(input.context);
  const companyDomain = deriveCompanyDomain({
    email: requesterEmail,
    companyDomain: null,
  });
  const linkedAccount = await resolveLinkedCustomerAccount({
    supabase,
    accountId: input.context?.accountId ?? null,
    requesterEmail,
  });
  const metadata = {
    kind: "enterprise_intake",
    context: input.context ?? null,
    analyticsContext: input.analyticsContext ?? null,
    linkedAccountName: linkedAccount.accountName,
  };

  const lead = await upsertCommercialLead({
    supabase,
    contactName: requesterName,
    contactEmail: requesterEmail,
    companyName,
    companyDomain,
    source: source === "manual" ? "enterprise_intake" : source,
    linkedCustomerAccountId: linkedAccount.accountId,
    qualificationSummary: buildQualificationSummary({
      teamSize,
      source: source === "manual" ? "enterprise_intake" : source,
      sourcePath: input.context?.sourcePath ?? null,
    }),
    intentSummary: buildIntentSummary({
      companyName,
      useCase,
      urgency,
      plan: input.context?.plan ?? null,
      intent: input.context?.intent ?? null,
      source: source === "manual" ? "enterprise_intake" : source,
    }),
    minimumState: "evaluation",
    metadata,
  });

  const { data: requestRow, error: requestError } = await supabase
    .from("enterprise_intake_requests")
    .insert({
      commercial_lead_id: lead.id,
      requester_name: requesterName,
      requester_email: requesterEmail,
      company_name: companyName,
      company_domain: companyDomain,
      team_size: teamSize,
      use_case: useCase,
      requirement_summary: requirementSummary,
      security_requirements: securityRequirements,
      billing_requirements: billingRequirements,
      onboarding_requirements: onboardingRequirements,
      urgency,
      request_source: source === "manual" ? "talk_to_sales" : source,
      status: "new" satisfies CommercialRequestStatus,
      source_path: sanitizeNullableText(input.context?.sourcePath),
      metadata,
    })
    .select("*")
    .single();

  if (requestError || !requestRow) {
    throw new Error(requestError?.message || "Failed to store enterprise intake.");
  }

  await insertLeadEvent({
    supabase,
    leadId: lead.id,
    eventType: "request_linked",
    summary: "Enterprise intake linked to the lead timeline.",
    eventPayload: {
      requestId: requestRow.id,
      requestType: "enterprise_intake",
      source,
    },
  });

  await insertLeadTask({
    supabase,
    leadId: lead.id,
    taskType: "enterprise_review",
    title: `Review ${companyName || requesterName} enterprise request`,
    summary: `Check security, billing and onboarding requirements before deciding whether this account should move into a higher-touch enterprise path.`,
    dueAt: addDays(1),
  });

  await insertLeadNote({
    supabase,
    leadId: lead.id,
    noteType: "enterprise_requirement",
    title: "Enterprise request captured",
    body: `${companyName || requesterName} asked for enterprise review. Requirements: ${requirementSummary}. Security: ${securityRequirements || "not specified"}. Billing: ${billingRequirements || "not specified"}.`,
  });

  return {
    leadId: lead.id as string,
    requestId: requestRow.id as string,
  };
}
