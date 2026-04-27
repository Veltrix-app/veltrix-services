import { NextRequest, NextResponse } from "next/server";
import {
  assertCustomerAccountMembership,
  getBillingBearerToken,
  resolveAuthenticatedBillingUser,
} from "@/lib/billing/account-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { SupportTicketType } from "@/lib/support/support-intake";

type RequestBody = {
  ticketType?: SupportTicketType;
  subject?: string;
  message?: string;
  requesterName?: string;
  requesterEmail?: string;
  customerAccountId?: string;
  projectId?: string;
  contextDetails?: string;
};

const validTicketTypes = new Set<SupportTicketType>([
  "product_question",
  "technical_issue",
  "billing_issue",
  "account_access",
  "reward_or_claim_issue",
  "trust_or_abuse_report",
  "provider_or_integration_issue",
  "general_request",
]);

function derivePriority(ticketType: SupportTicketType) {
  switch (ticketType) {
    case "reward_or_claim_issue":
    case "trust_or_abuse_report":
      return "urgent";
    case "technical_issue":
    case "billing_issue":
    case "account_access":
    case "provider_or_integration_issue":
      return "high";
    default:
      return "normal";
  }
}

function deriveDisplayName(input: { email: string | null; metadata?: Record<string, unknown> }) {
  const metadata = input.metadata ?? {};
  const raw =
    metadata.username ??
    metadata.user_name ??
    metadata.full_name ??
    metadata.name ??
    input.email?.split("@")[0] ??
    "Workspace operator";

  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "Workspace operator";
}

async function resolveAccountContext(authUserId: string) {
  const supabase = createSupabaseServiceClient();
  const { data: memberships, error } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const firstMembership = (memberships ?? [])[0] as { customer_account_id?: string | null } | undefined;

  if (!firstMembership?.customer_account_id) {
    return null;
  }

  const [{ data: account, error: accountError }, { data: onboarding, error: onboardingError }] =
    await Promise.all([
      supabase
        .from("customer_accounts")
        .select("name")
        .eq("id", firstMembership.customer_account_id)
        .maybeSingle(),
      supabase
        .from("customer_account_onboarding")
        .select("first_project_id")
        .eq("customer_account_id", firstMembership.customer_account_id)
        .maybeSingle(),
    ]);

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (onboardingError) {
    throw new Error(onboardingError.message);
  }

  return {
    customerAccountId: firstMembership.customer_account_id,
    accountName: account?.name ?? null,
    firstProjectId: onboarding?.first_project_id ?? null,
  };
}

function buildTicketRef() {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `SUP-${stamp}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as RequestBody | null;

    const ticketType = body?.ticketType;
    const subject = body?.subject?.trim() ?? "";
    const message = body?.message?.trim() ?? "";

    if (!ticketType || !validTicketTypes.has(ticketType)) {
      return NextResponse.json({ ok: false, error: "Choose a valid support lane." }, { status: 400 });
    }

    if (subject.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Add a clearer subject so the support queue can route this correctly." },
        { status: 400 }
      );
    }

    if (message.length < 20) {
      return NextResponse.json(
        { ok: false, error: "Add a bit more detail so the support queue has enough context." },
        { status: 400 }
      );
    }

    const hasBearer = Boolean(getBillingBearerToken(request));
    const authenticatedUser = hasBearer ? await resolveAuthenticatedBillingUser(request) : null;
    const serviceSupabase = createSupabaseServiceClient();

    const requesterName =
      authenticatedUser?.email || authenticatedUser?.user?.user_metadata
        ? deriveDisplayName({
            email: authenticatedUser?.email ?? null,
            metadata: (authenticatedUser?.user?.user_metadata as Record<string, unknown> | undefined) ?? {},
          })
        : (body?.requesterName?.trim() ?? "");
    const requesterEmail = authenticatedUser?.email ?? body?.requesterEmail?.trim() ?? "";
    let customerAccountId = body?.customerAccountId?.trim() || null;
    let projectId = body?.projectId?.trim() || null;

    if (!authenticatedUser) {
      if (!requesterName || !requesterEmail) {
        return NextResponse.json(
          { ok: false, error: "Name and email are required when you are not signed in." },
          { status: 400 }
        );
      }
    } else {
      if (customerAccountId) {
        await assertCustomerAccountMembership({
          authUserId: authenticatedUser.user.id,
          customerAccountId,
        });
      } else {
        const fallbackContext = await resolveAccountContext(authenticatedUser.user.id);
        customerAccountId = fallbackContext?.customerAccountId ?? null;
        projectId = projectId ?? fallbackContext?.firstProjectId ?? null;
      }
    }

    if (projectId) {
      const { data: project, error: projectError } = await serviceSupabase
        .from("projects")
        .select("id, customer_account_id")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) {
        return NextResponse.json({ ok: false, error: projectError.message }, { status: 500 });
      }

      if (!project?.id) {
        return NextResponse.json(
          { ok: false, error: "The linked project could not be resolved." },
          { status: 400 }
        );
      }

      if (customerAccountId && project.customer_account_id && project.customer_account_id !== customerAccountId) {
        return NextResponse.json(
          { ok: false, error: "The selected project is not attached to the same workspace account." },
          { status: 400 }
        );
      }
    }

    const ticketId = crypto.randomUUID();
    const ticketRef = buildTicketRef();
    const createdAt = new Date().toISOString();
    const metadata = {
      contextDetails: body?.contextDetails?.trim() || null,
      submittedFrom: request.nextUrl.pathname,
    };

    const { error: insertError } = await serviceSupabase.from("support_tickets").insert({
      id: ticketId,
      ticket_ref: ticketRef,
      auth_user_id: authenticatedUser?.user.id ?? null,
      customer_account_id: customerAccountId,
      project_id: projectId,
      source_origin: authenticatedUser ? "web_authenticated" : "web_public",
      ticket_type: ticketType,
      priority: derivePriority(ticketType),
      status: "new",
      waiting_state: "none",
      escalation_state: "none",
      subject,
      message,
      requester_name: requesterName,
      requester_email: requesterEmail,
      metadata,
      created_at: createdAt,
      updated_at: createdAt,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    const { error: eventError } = await serviceSupabase.from("support_ticket_events").insert({
      support_ticket_id: ticketId,
      event_type: "ticket_created",
      visibility_scope: "both",
      actor_auth_user_id: authenticatedUser?.user.id ?? null,
      title: "Support ticket created",
      body: authenticatedUser
        ? "The support request was received and linked to the signed-in workspace context."
        : "The support request was received from the public support intake.",
      metadata,
      created_at: createdAt,
    });

    if (eventError) {
      return NextResponse.json({ ok: false, error: eventError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        ticket: {
          id: ticketId,
          ticketRef,
          status: "new",
          ticketType,
          subject,
          linkedAccountId: customerAccountId ?? undefined,
          linkedProjectId: projectId ?? undefined,
          createdAt,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Support ticket submission failed.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Account access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
