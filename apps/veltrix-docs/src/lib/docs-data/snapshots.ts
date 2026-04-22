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
    phases: [
      {
        label: "Phase 01",
        title: "Set the mission goal",
        summary: "The campaign starts by framing why the launch exists before the builder drops into deeper object configuration.",
      },
      {
        label: "Phase 02",
        title: "Map the quest and raid structure",
        summary: "The studio keeps quests, raids and rewards visible as one mission architecture instead of independent objects.",
      },
      {
        label: "Phase 03",
        title: "Review readiness before go-live",
        summary: "Checklist pressure and missing pieces stay in the same surface so the campaign can be judged as launch-ready.",
      },
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
    signals: [
      {
        label: "Default entry",
        value: "Project-first",
        summary: "Campaign work is strongest when it starts from Launch Workspace or project context rather than a detached tools view.",
        tone: "cyan",
      },
      {
        label: "Strategic lens",
        value: "Goal before fields",
        summary: "The builder makes strategy visible before teams disappear into configuration depth.",
        tone: "lime",
      },
      {
        label: "Member consequence",
        value: "Mission map",
        summary: "Every campaign decision eventually shapes what members see across missions, rewards and launch progression.",
        tone: "slate",
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
    phases: [
      {
        label: "Phase 01",
        title: "Frame the member action",
        summary: "The first layer defines exactly what the member should do and where the quest belongs inside the campaign context.",
      },
      {
        label: "Phase 02",
        title: "Choose the proof logic",
        summary: "Verification is split from action design so teams can understand approval posture without mixing concepts.",
      },
      {
        label: "Phase 03",
        title: "Preview the experience",
        summary: "The studio keeps a member-facing card view visible so the quest still feels like a product moment, not just admin configuration.",
      },
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
    signals: [
      {
        label: "Verification posture",
        value: "Separated cleanly",
        summary: "Teams can reason about proof logic without losing sight of the action itself.",
        tone: "cyan",
      },
      {
        label: "Reward framing",
        value: "Visible early",
        summary: "Quest incentives remain part of the builder flow rather than a hidden afterthought.",
        tone: "lime",
      },
      {
        label: "Experience lens",
        value: "Member-first preview",
        summary: "The preview rail helps teams judge tone, CTA clarity and completion feel before launch.",
        tone: "slate",
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
    phases: [
      {
        label: "Phase 01",
        title: "Read owner posture",
        summary: "Community OS begins with owner-level health, cohorts and next-action pressure rather than raw activity noise.",
      },
      {
        label: "Phase 02",
        title: "Move into captain execution",
        summary: "Seat-based permissions and assignment rails make sure action follows from strategy without collapsing roles together.",
      },
      {
        label: "Phase 03",
        title: "Check outcome movement",
        summary: "The workspace keeps community actions tied to member movement, health and activation rather than isolated busywork.",
      },
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
    signals: [
      {
        label: "Role split",
        value: "Owner / captain",
        summary: "The docs-safe snapshot shows how decision posture and execution posture remain separate but connected.",
        tone: "cyan",
      },
      {
        label: "Activation rail",
        value: "Commands + cohorts",
        summary: "Commands and health reads stay part of one operating model instead of separate tooling islands.",
        tone: "lime",
      },
      {
        label: "Outcome lens",
        value: "Member movement",
        summary: "The workspace is strongest when it helps projects see whether community work is changing member behavior.",
        tone: "slate",
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
    phases: [
      {
        label: "Phase 01",
        title: "Classify the trust signal",
        summary: "The console turns suspicious behavior into an explicit case with severity, ownership and the right investigation posture.",
      },
      {
        label: "Phase 02",
        title: "Investigate and request input",
        summary: "Internal operators keep full control, but can move the case into bounded project visibility when that context is actually needed.",
      },
      {
        label: "Phase 03",
        title: "Close with timeline history",
        summary: "Trust work ends with a visible resolution trail, not a silent state change that future operators cannot explain.",
      },
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
    signals: [
      {
        label: "Default visibility",
        value: "Bounded",
        summary: "Projects do not inherit deep trust detail by default; owner-managed grants keep the console safe.",
        tone: "cyan",
      },
      {
        label: "Case backbone",
        value: "Timeline-first",
        summary: "Every trust action matters because the system keeps an explainable record of how a case moved.",
        tone: "lime",
      },
      {
        label: "Resolution style",
        value: "Explicit outcomes",
        summary: "Resolved, dismissed and waiting states should all be understandable without internal-only context.",
        tone: "slate",
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
    phases: [
      {
        label: "Phase 01",
        title: "Identify the payout issue",
        summary: "Blocked claims, disputes and delivery failures become explicit payout cases instead of hidden operational noise.",
      },
      {
        label: "Phase 02",
        title: "Choose the next safe move",
        summary: "The console helps operators decide whether the path forward is retry, project input, escalation or direct resolution.",
      },
      {
        label: "Phase 03",
        title: "Write back the outcome",
        summary: "Cases close through visible history so projects and support teams can see why the issue is no longer active.",
      },
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
    signals: [
      {
        label: "Safe default",
        value: "Summary-only",
        summary: "Projects begin from bounded payout visibility and only receive deeper detail or actions when the owner allows it.",
        tone: "cyan",
      },
      {
        label: "Recovery posture",
        value: "Retry or unblock",
        summary: "The console keeps the next safe recovery move legible instead of burying it inside support notes.",
        tone: "lime",
      },
      {
        label: "Trust outcome",
        value: "Claim clarity",
        summary: "Members and projects need to understand why a payout moved, stalled or closed.",
        tone: "slate",
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
    phases: [
      {
        label: "Phase 01",
        title: "Turn raw failures into cases",
        summary: "Ingress, enrichment and provider sync problems first become explicit on-chain cases with a known recovery posture.",
      },
      {
        label: "Phase 02",
        title: "Choose a bounded recovery move",
        summary: "The console separates project-safe actions like retry or rescan from deeper internal-only system jobs.",
      },
      {
        label: "Phase 03",
        title: "Track the resolved state",
        summary: "The history layer shows how the chain-side issue changed, rather than leaving recovery hidden in background jobs.",
      },
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
    signals: [
      {
        label: "Recovery boundary",
        value: "Project-safe only",
        summary: "Projects can participate in bounded retries and rescans without receiving global provider control.",
        tone: "cyan",
      },
      {
        label: "Chain visibility",
        value: "Signal to case",
        summary: "The docs snapshot explains how raw chain issues become understandable product cases.",
        tone: "lime",
      },
      {
        label: "History posture",
        value: "Resolved, not hidden",
        summary: "On-chain recovery should leave behind a visible trail that future operators and projects can follow.",
        tone: "slate",
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
