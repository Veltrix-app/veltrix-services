import type { DocsSurfaceSnapshot } from "@/lib/docs-data/types";

const docsSurfaceSnapshots: DocsSurfaceSnapshot[] = [
  {
    slug: "campaign-studio",
    title: "Campaign Studio",
    summary:
      "Storyboard-first campaign builder with mission architecture, launch posture and a clear progression from goal to launch.",
    route: "/campaigns/new",
    refreshedFrom: "Current product model",
    posture: "Read-only docs snapshot",
    stats: [
      { label: "Builder mode", value: "Storyboard" },
      { label: "Primary objects", value: "Goal, quests, raids" },
      { label: "Launch posture", value: "Readiness-led" },
    ],
    panels: [
      {
        title: "Goal block",
        summary: "Sets the campaign intent before any deeper configuration happens.",
        highlights: ["Founder-facing goal language", "Template-aware entry", "Project context carried forward"],
      },
      {
        title: "Mission architecture",
        summary: "Shows how quests, raids and rewards fit together before the campaign goes live.",
        highlights: ["Storyboard sequencing", "Reward posture in-view", "Launch map preview"],
      },
      {
        title: "Launch readiness",
        summary: "Brings checklist pressure, completion posture and missing pieces into the same surface.",
        highlights: ["Readiness state", "Missing actions", "Launch-safe review"],
      },
    ],
  },
  {
    slug: "quest-studio",
    title: "Quest Studio",
    summary:
      "Guided mission builder for actions, verification, reward posture and the member-facing view of a quest.",
    route: "/quests/new",
    refreshedFrom: "Current product model",
    posture: "Read-only docs snapshot",
    stats: [
      { label: "Builder mode", value: "Guided" },
      { label: "Primary steps", value: "Action to launch" },
      { label: "Preview posture", value: "Member-facing" },
    ],
    panels: [
      {
        title: "Action and placement",
        summary: "Explains what the member needs to do and where the quest belongs in the campaign context.",
        highlights: ["Project-prefilled context", "Mission posture", "Destination clarity"],
      },
      {
        title: "Verification rail",
        summary: "Separates proof logic from the action itself so teams can understand the approval path cleanly.",
        highlights: ["Manual and provider verification", "Submission posture", "Edge-case behavior"],
      },
      {
        title: "Member preview",
        summary: "Keeps the builder tied to what the quest will feel like from the member side.",
        highlights: ["CTA framing", "Status chips", "Reward posture preview"],
      },
    ],
  },
  {
    slug: "community-os",
    title: "Community OS",
    summary:
      "Project-side operating workspace for owners and captains with automation, cohort, mission and health rails.",
    route: "/projects/<id>/community",
    refreshedFrom: "Current product model",
    posture: "Read-only docs snapshot",
    stats: [
      { label: "Primary modes", value: "Owner and captain" },
      { label: "System rails", value: "Commands, automations, health" },
      { label: "Visibility", value: "Outcome-led" },
    ],
    panels: [
      {
        title: "Owner lane",
        summary: "Shows launch pressure, playbooks, cohort posture and what the project should act on next.",
        highlights: ["Health visibility", "Automation center", "Command posture"],
      },
      {
        title: "Captain lane",
        summary: "Keeps day-to-day community execution accountable without mixing it into owner controls.",
        highlights: ["Seat-based permissions", "Action accountability", "Assigned follow-through"],
      },
      {
        title: "Signals and outcomes",
        summary: "Shows what is moving, what is stalled and which community cohorts need attention.",
        highlights: ["Cohort health", "Activation trends", "Run-state visibility"],
      },
    ],
  },
  {
    slug: "trust-console",
    title: "Trust Console",
    summary:
      "Permissioned trust review with cases, timelines, escalations and owner-managed project visibility.",
    route: "/moderation and /projects/<id>/trust",
    refreshedFrom: "Current product model",
    posture: "Read-only docs snapshot",
    stats: [
      { label: "Console shape", value: "Case-driven" },
      { label: "Project posture", value: "View-only by default" },
      { label: "Evidence layer", value: "Bounded public detail" },
    ],
    panels: [
      {
        title: "Internal queue",
        summary: "Internal operators hold full control over triage, evidence, escalation and final resolution.",
        highlights: ["Investigations", "Timeline writes", "Internal-only actions"],
      },
      {
        title: "Project trust console",
        summary: "Projects can receive bounded visibility and explicit action grants without inheriting internal control.",
        highlights: ["Owner-managed visibility", "Escalate or resolve rails", "Case detail shaping"],
      },
      {
        title: "Auditability",
        summary: "Every trust action writes history, so cases remain explainable when they move across teams.",
        highlights: ["Case events", "Resolution notes", "Escalation state"],
      },
    ],
  },
  {
    slug: "payout-console",
    title: "Payout Console",
    summary:
      "Case-driven payout and claim safety workspace for incidents, disputes, retries and bounded project visibility.",
    route: "/claims and /projects/<id>/payouts",
    refreshedFrom: "Current product model",
    posture: "Read-only docs snapshot",
    stats: [
      { label: "Console shape", value: "Queue plus incidents" },
      { label: "Project posture", value: "Summary-only default" },
      { label: "Recovery moves", value: "Retry, escalate, resolve" },
    ],
    panels: [
      {
        title: "Internal payout ops",
        summary: "Handles blocked claims, disputes, finalization failures and delivery issues in one resolution rail.",
        highlights: ["Queue modes", "Dispute handling", "Manual review posture"],
      },
      {
        title: "Project payout console",
        summary: "Projects can see payout health and act within safe bounds if owners allow it.",
        highlights: ["Owner grants", "Project-safe retries", "History and timeline"],
      },
      {
        title: "Inventory and delivery pressure",
        summary: "The console keeps stock pressure and payout blockage visible instead of leaving them buried in logs.",
        highlights: ["Inventory risk", "Delivery failure posture", "Resolution logging"],
      },
    ],
  },
  {
    slug: "onchain-console",
    title: "On-chain Console",
    summary:
      "Case-driven on-chain recovery workspace for ingress, enrichment, provider sync issues and bounded project-safe actions.",
    route: "/onchain and /projects/<id>/onchain",
    refreshedFrom: "Current product model",
    posture: "Read-only docs snapshot",
    stats: [
      { label: "Console shape", value: "Queue, failures, signals" },
      { label: "Project posture", value: "Summary-only default" },
      { label: "Safe actions", value: "Retry, rerun, rescan" },
    ],
    panels: [
      {
        title: "Internal on-chain ops",
        summary: "Internal operators see the rawer recovery posture across ingress, enrichment and provider sync flows.",
        highlights: ["Full queue", "Failure grouping", "Internal control rails"],
      },
      {
        title: "Project on-chain console",
        summary: "Projects get a bounded console focused on health, cases, signals and project-safe actions.",
        highlights: ["Owner-managed grants", "Project-safe retries", "Wallet and asset posture"],
      },
      {
        title: "Signal shaping",
        summary: "The docs layer keeps chain-side anomalies explainable without exposing unsafe raw payload detail.",
        highlights: ["Case summaries", "Event context", "Resolution history"],
      },
    ],
  },
];

export function listDocsSurfaceSnapshots() {
  return docsSurfaceSnapshots;
}

export function loadDocsSurfaceSnapshot(slug: string) {
  return docsSurfaceSnapshots.find((snapshot) => snapshot.slug === slug);
}
