import type { DocsReferenceDataset } from "@/lib/docs-data/types";

const docsReferenceDatasets: DocsReferenceDataset[] = [
  {
    slug: "lifecycle-states",
    title: "Lifecycle States",
    summary: "The common state language used across campaigns, quests, raids, rewards and operator flows.",
    entries: [
      { label: "Draft", meta: "Pre-launch", summary: "The object exists but is not ready for member-facing or operational use." },
      { label: "Ready", meta: "Prepared", summary: "Configuration is complete enough to move toward activation or publication." },
      { label: "Live", meta: "Active", summary: "The object is currently active and visible in the relevant operating or member-facing surface." },
      { label: "Paused", meta: "Hold", summary: "The object is intentionally halted without being destroyed or archived." },
      { label: "Archived", meta: "Historical", summary: "The object is preserved for history and audit, but no longer part of active workflows." },
    ],
  },
  {
    slug: "permissions",
    title: "Permissions",
    summary: "The exact model for who can see what and who can act on what.",
    entries: [
      { label: "Visibility permissions", meta: "See layer", summary: "Controls whether a user can see summaries, lists, detail views or rawer bounded evidence." },
      { label: "Action permissions", meta: "Do layer", summary: "Controls whether a user can annotate, escalate, retry, resolve or apply other system actions." },
      { label: "Owner-managed grants", meta: "Project control", summary: "Project owners decide who receives additional visibility or action posture in bounded consoles." },
      { label: "Default bounded access", meta: "Safety rule", summary: "Project-facing safety consoles start from view-only or summary-only rather than broad access." },
    ],
  },
  {
    slug: "trust-case-types",
    title: "Trust Case Types",
    summary: "The review taxonomy used for trust and fraud handling.",
    entries: [
      { label: "Sybil or duplicate signals", summary: "Cases opened when the system suspects duplicate or low-integrity member behavior." },
      { label: "Suspicious activity", summary: "Cases for anomalous engagement patterns or trust-adjacent signals that need review." },
      { label: "Project input needed", summary: "Cases that need bounded project-side context before resolution can complete." },
      { label: "Manual trust review", summary: "Cases opened directly by operators to track investigative work and resolution history." },
    ],
  },
  {
    slug: "payout-case-types",
    title: "Payout Case Types",
    summary: "The safety taxonomy used for claims, delivery and payout follow-through.",
    entries: [
      { label: "Claim review", summary: "A claim needs manual or higher-confidence review before it can be completed." },
      { label: "Delivery failure", summary: "A reward or payout delivery path failed and needs follow-through." },
      { label: "Inventory risk", summary: "Reward stock or issuance posture creates risk for new or pending claims." },
      { label: "Payout dispute", summary: "A payout or claim has conflicting evidence and needs explicit resolution." },
    ],
  },
  {
    slug: "onchain-case-types",
    title: "On-chain Case Types",
    summary: "The case taxonomy for ingress, enrichment and provider-side recovery.",
    entries: [
      { label: "Ingress rejected", summary: "An on-chain event or input was rejected before it could join the normal pipeline." },
      { label: "Enrichment failed", summary: "A chain-side event exists, but enrichment failed or produced incomplete usable context." },
      { label: "Provider sync failure", summary: "A provider or sync rail failed and needs bounded recovery." },
      { label: "Suspicious pattern", summary: "An anomaly or signal suggests review is needed even if the pipeline technically completed." },
    ],
  },
  {
    slug: "automation-types",
    title: "Automation Types",
    summary: "The common automation rails used for community execution and follow-through.",
    entries: [
      { label: "Scheduled automations", summary: "Time-driven rails that post, remind or refresh at a planned cadence." },
      { label: "State-driven automations", summary: "Automations that fire because a system posture or workflow state changed." },
      { label: "Recovery automations", summary: "Follow-through rails that attempt retries, refreshes or bounded system recovery." },
    ],
  },
  {
    slug: "bot-commands",
    title: "Bot Commands",
    summary: "The shared command dictionary across Discord and Telegram.",
    entries: [
      { label: "/profile", summary: "Shows member identity, rank and recognition posture." },
      { label: "/missions", summary: "Routes a member into their active mission or quest rail." },
      { label: "/leaderboard", summary: "Shows standings and competitive status inside the active community context." },
      { label: "/raid", summary: "Surfaces the current raid context, status or entry posture." },
      { label: "/captain", summary: "Project-safe command rail for captain follow-through and assigned responsibilities." },
    ],
  },
  {
    slug: "status-labels",
    title: "Status Labels",
    summary: "The display-facing language the product uses for health, pressure and next-action posture.",
    entries: [
      { label: "Ready", meta: "Activation", summary: "The system believes the object can move forward safely." },
      { label: "Needs project input", meta: "Escalation", summary: "An operator or system flow is waiting on bounded project-side context." },
      { label: "Retry queued", meta: "Recovery", summary: "A safe retry or rerun is already scheduled and still in motion." },
      { label: "Resolved", meta: "History", summary: "The issue is closed with a known outcome and preserved timeline." },
    ],
  },
];

export function listDocsReferenceDatasets() {
  return docsReferenceDatasets;
}

export function loadDocsReferenceDataset(slug: string) {
  return docsReferenceDatasets.find((dataset) => dataset.slug === slug);
}
