import type { DocsStateExplorerDataset } from "@/lib/docs-data/types";

const docsStateExplorerDatasets: DocsStateExplorerDataset[] = [
  {
    slug: "lifecycle",
    title: "Lifecycle posture",
    summary: "The common progression from preparation to activation to historical state.",
    states: [
      {
        label: "Draft to ready",
        summary: "Objects move from incomplete to prepared once the system has enough context to treat them as intentional.",
        bullets: [
          "Draft is safe for unfinished setup work.",
          "Ready implies the main configuration is in place.",
          "This is where launch checklists and readiness rails matter most.",
        ],
      },
      {
        label: "Ready to live",
        summary: "The transition from readiness into active use is where most publication and activation actions sit.",
        bullets: [
          "Live means the object is active in the relevant product surface.",
          "The system should keep this transition auditable.",
          "Project docs need this state change to stay understandable, not hidden.",
        ],
      },
      {
        label: "Paused to archived",
        summary: "Objects can be halted without being destroyed, and later preserved without staying active.",
        bullets: [
          "Pause is for temporary safety or operational holds.",
          "Archive keeps history and context without cluttering active workflows.",
          "Lifecycle-safe actions are a core Veltrix posture rather than a side feature.",
        ],
      },
    ],
  },
  {
    slug: "permissions",
    title: "Permission posture",
    summary: "Veltrix permissions are split across what someone can see and what someone can do.",
    states: [
      {
        label: "Summary access",
        summary: "A user can see high-level posture and counts without receiving sensitive or action-heavy detail.",
        bullets: [
          "This is the safest default for bounded project-facing operator consoles.",
          "It preserves visibility without leaking operational depth.",
          "Summary-only is the baseline for public console posture in docs.",
        ],
      },
      {
        label: "Detail access",
        summary: "A user can inspect more contextual case, member or system detail within the bounds of the product.",
        bullets: [
          "Owners can grant this explicitly where the console allows it.",
          "Not all detail levels are appropriate for public-facing project roles.",
          "The docs layer should make these boundaries very obvious.",
        ],
      },
      {
        label: "Action access",
        summary: "A user can take bounded actions such as annotate, escalate, retry or resolve, depending on the console.",
        bullets: [
          "Action rights are separate from visibility rights.",
          "Project-safe actions stay different from internal-only operator actions.",
          "This is a core theme across trust, payout and on-chain consoles.",
        ],
      },
    ],
  },
  {
    slug: "trust-flow",
    title: "Trust case flow",
    summary: "Trust cases move through review, escalation and resolution with explicit ownership.",
    states: [
      {
        label: "Open and triaging",
        summary: "The case exists and needs an operator to establish initial context and severity.",
        bullets: ["Signals are grouped into a case.", "Triage clarifies type and urgency.", "History starts immediately."],
      },
      {
        label: "Needs project input",
        summary: "The internal team needs bounded project-side context before the case can be closed.",
        bullets: [
          "Project teams receive explicit visibility and action rights only if allowed.",
          "The case timeline keeps the handoff visible.",
          "This posture prevents unclear responsibility during review.",
        ],
      },
      {
        label: "Resolved or dismissed",
        summary: "The case reaches a known outcome and stays in history for explainability.",
        bullets: [
          "Resolution is not silent; it writes notes and history.",
          "Dismissal is still a meaningful outcome, not a deleted trail.",
          "This is why trust docs need to stay operator-grade even when public.",
        ],
      },
    ],
  },
  {
    slug: "payout-flow",
    title: "Payout case flow",
    summary: "Payout cases track blocked claims, disputes and safe retries across internal and project rails.",
    states: [
      {
        label: "Blocked or disputed",
        summary: "A claim or payout path hit a problem that needs review or manual follow-through.",
        bullets: [
          "The console groups review work into explicit cases.",
          "Inventory and delivery pressure stay visible instead of hidden in logs.",
          "The system can now explain why a claim is not simply progressing.",
        ],
      },
      {
        label: "Retry or project input",
        summary: "The next move is either a safe retry or a bounded project-side unblock action.",
        bullets: [
          "Projects only receive safe actions if owners grant them.",
          "Retry posture should be visible in the timeline.",
          "The docs need to clarify what a project can and cannot do here.",
        ],
      },
      {
        label: "Resolved history",
        summary: "The case closes with an auditable outcome and remains part of the resolution history.",
        bullets: [
          "Internal and project-facing timelines stay consistent.",
          "Resolution notes matter for future disputes or support follow-through.",
          "This is why payout docs should feel like console documentation, not FAQ text.",
        ],
      },
    ],
  },
  {
    slug: "onchain-flow",
    title: "On-chain recovery flow",
    summary: "On-chain cases explain how signals and failures move into bounded recovery actions.",
    states: [
      {
        label: "Signal or failure detected",
        summary: "Ingress, enrichment or sync issues become explicit cases instead of hidden job noise.",
        bullets: [
          "Internal operators see the broader recovery surface.",
          "Projects only see bounded context if the console allows it.",
          "This makes chain-side issues explainable to non-specialists.",
        ],
      },
      {
        label: "Safe recovery queued",
        summary: "A project-safe retry, rerun or asset rescan is queued where appropriate.",
        bullets: [
          "Project-safe actions stay distinct from global internal jobs.",
          "Retry posture must stay visible in the timeline.",
          "Owners decide whether project teammates can perform these actions.",
        ],
      },
      {
        label: "Resolved or historical",
        summary: "Recovered cases move into a clear historical state with visible context.",
        bullets: [
          "The system preserves how the issue was recovered.",
          "This matters for future debugging and support handoffs.",
          "The docs should make the difference between signal and resolution very clear.",
        ],
      },
    ],
  },
];

export function listDocsStateExplorerDatasets() {
  return docsStateExplorerDatasets;
}

export function loadDocsStateExplorerDataset(slug: string) {
  return docsStateExplorerDatasets.find((dataset) => dataset.slug === slug);
}
