export type SupportTicketType =
  | "product_question"
  | "technical_issue"
  | "billing_issue"
  | "account_access"
  | "reward_or_claim_issue"
  | "trust_or_abuse_report"
  | "provider_or_integration_issue"
  | "general_request";

export type SupportTicketReceipt = {
  id: string;
  ticketRef: string;
  status: string;
  ticketType: SupportTicketType;
  subject: string;
  linkedAccountId?: string;
  linkedProjectId?: string;
  createdAt: string;
};

export type SubmitSupportTicketInput = {
  ticketType: SupportTicketType;
  subject: string;
  message: string;
  requesterName?: string;
  requesterEmail?: string;
  customerAccountId?: string;
  projectId?: string;
  contextDetails?: string;
  accessToken?: string | null;
};

export const supportTicketTypeOptions: Array<{
  value: SupportTicketType;
  label: string;
  description: string;
}> = [
  {
    value: "product_question",
    label: "Product question",
    description: "How the product works, rollout order, or which surface to use next.",
  },
  {
    value: "technical_issue",
    label: "Technical issue",
    description: "A real bug, broken workflow, or runtime problem that needs investigation.",
  },
  {
    value: "billing_issue",
    label: "Billing issue",
    description: "Plans, invoices, upgrades, or payment posture problems.",
  },
  {
    value: "account_access",
    label: "Account access",
    description: "Login, verification, invite, or workspace access trouble.",
  },
  {
    value: "reward_or_claim_issue",
    label: "Reward or claim issue",
    description: "Claim delivery, reward inventory, or payout blockers.",
  },
  {
    value: "trust_or_abuse_report",
    label: "Trust or abuse report",
    description: "Suspicious behavior, abuse, or a bounded trust escalation request.",
  },
  {
    value: "provider_or_integration_issue",
    label: "Provider or integration issue",
    description: "Discord, Telegram, verification, or sync/provider failures.",
  },
  {
    value: "general_request",
    label: "General request",
    description: "Anything else that still needs a clear Veltrix owner.",
  },
];

export async function submitSupportTicket(input: SubmitSupportTicketInput) {
  const response = await fetch("/api/support/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.accessToken
        ? {
            Authorization: `Bearer ${input.accessToken}`,
          }
        : {}),
    },
    body: JSON.stringify({
      ticketType: input.ticketType,
      subject: input.subject,
      message: input.message,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      customerAccountId: input.customerAccountId,
      projectId: input.projectId,
      contextDetails: input.contextDetails,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        ticket?: SupportTicketReceipt;
        error?: string;
      }
    | null;

  if (!response.ok || !payload?.ok || !payload.ticket) {
    throw new Error(payload?.error ?? "Support ticket submission failed.");
  }

  return payload.ticket;
}
