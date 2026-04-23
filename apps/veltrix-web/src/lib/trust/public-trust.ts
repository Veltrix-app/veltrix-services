import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type PublicTrustControl = {
  title: string;
  summary: string;
  bullets: string[];
};

export type PublicTrustDocument = {
  label: string;
  href: string;
  summary: string;
};

export type PublicTrustSubprocessor = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  regionSummary: string;
  status: string;
  websiteUrl?: string;
  lastReviewedAt?: string;
};

export const trustControls: PublicTrustControl[] = [
  {
    title: "Authentication and access",
    summary: "Veltrix uses role-aware portal access with enterprise-ready identity controls for operator surfaces.",
    bullets: [
      "Two-factor authentication can be enabled by any operator and enforced for enterprise owner and admin roles.",
      "Enterprise SSO and SAML are scoped to portal and workspace operators instead of the public member webapp.",
      "Session review and revocation are exposed inside the portal security workspace.",
    ],
  },
  {
    title: "Operational boundaries",
    summary: "Projects receive bounded visibility while internal teams keep the controls needed to investigate, recover and document incidents.",
    bullets: [
      "Trust, payout and on-chain consoles are permissioned instead of fully open to project teams.",
      "Security-sensitive actions are written to audit-friendly event trails.",
      "Status, support and incident language are separated so customer communication stays calm and accurate.",
    ],
  },
  {
    title: "Data lifecycle",
    summary: "Veltrix exposes structured intake and review flows for export and deletion requests instead of treating them as ad hoc support work.",
    bullets: [
      "Data access requests move through submitted, review, verification and completion states.",
      "Privacy, deletion and support lanes stay linked to internal security review queues.",
      "Retention, recovery and evidence posture are tracked as operating controls rather than hidden notes.",
    ],
  },
  {
    title: "Reliability and incident handling",
    summary: "Public status, internal incident command and bounded customer communication all operate from the same platform truth.",
    bullets: [
      "Incidents are tracked with severity, state, ownership and postmortem follow-through.",
      "Backup, restore and recovery posture are reviewed as formal controls.",
      "Security issues and operational incidents can be escalated without exposing unnecessary detail publicly.",
    ],
  },
];

export const trustDocuments: PublicTrustDocument[] = [
  {
    label: "Trust Center",
    href: "/trust",
    summary: "Overview of security posture, identity controls, review channels and operating principles.",
  },
  {
    label: "Privacy",
    href: "/privacy",
    summary: "How Veltrix handles product data, lawful use, retention and request rights.",
  },
  {
    label: "Terms",
    href: "/terms",
    summary: "Core commercial and platform rules for projects, operators and participating members.",
  },
  {
    label: "Subprocessors",
    href: "/subprocessors",
    summary: "Current vendors used to operate infrastructure, payments, email and product delivery.",
  },
  {
    label: "Status",
    href: "/status",
    summary: "Public service posture, active incidents and recently resolved operational events.",
  },
];

export const trustFaqs = [
  {
    question: "Does Veltrix support enterprise identity controls?",
    answer:
      "Yes. Enterprise SSO and SAML are available for portal and workspace operators, and two-factor requirements can be enforced for high-risk roles.",
  },
  {
    question: "Can customers request export or deletion of account data?",
    answer:
      "Yes. Export and deletion requests move through a reviewed lifecycle so Veltrix can verify the requester, track progress and complete the request safely.",
  },
  {
    question: "Where do I report a security issue or ask for a DPA?",
    answer:
      "Use the public support route and choose the security or privacy lane. Veltrix uses that path for buyer reviews, DPA requests and coordinated security follow-up.",
  },
];

export async function loadPublicSubprocessors(): Promise<PublicTrustSubprocessor[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("subprocessors")
    .select("id, name, category, purpose, region_summary, status, website_url, last_reviewed_at")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    purpose: row.purpose,
    regionSummary: row.region_summary,
    status: row.status,
    websiteUrl: row.website_url ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
  }));
}
