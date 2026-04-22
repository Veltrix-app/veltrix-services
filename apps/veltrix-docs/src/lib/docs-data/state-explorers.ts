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
    slug: "warning-flow",
    title: "Warning and flag lifecycle",
    summary: "Veltrix does not jump straight from raw activity to operator work; signals are progressively shaped into flags, cases and history.",
    states: [
      {
        label: "Raw event or failure",
        summary: "The system first sees a chain event, payout failure, delivery issue or provider-side incident in its raw operational form.",
        bullets: [
          "This layer is noisy and too technical for most operators or projects on its own.",
          "Risk flags and metadata are derived here before the issue becomes product language.",
          "Not every raw event becomes a visible warning, because many events remain healthy after assessment.",
        ],
      },
      {
        label: "Warning or review flag",
        summary: "If the event trips a threshold or suspicious pattern, the system turns it into a warning-style signal with explicit severity and reason text.",
        bullets: [
          "Trust signals produce flag types such as low-value transfer spam, short holds or low trust posture.",
          "Review flags keep the signal visible even before a deeper case workflow begins.",
          "This layer is where severity first becomes legible to humans instead of staying as raw metadata.",
        ],
      },
      {
        label: "Case and timeline",
        summary: "The signal becomes an explicit trust, payout or on-chain case once the product needs ownership, escalation or recovery tracking.",
        bullets: [
          "Cases add status, owner, escalation state and history.",
          "The same issue can stay bounded in project-facing views while internal operators retain deeper control.",
          "Resolution writes back into the timeline rather than silently removing the issue.",
        ],
      },
    ],
  },
  {
    slug: "trust-scoring",
    title: "Trust scoring flow",
    summary: "Trust posture is a bounded score with explicit bonuses, penalties, reject thresholds and warning bands.",
    states: [
      {
        label: "Start from latest score",
        summary: "The on-chain trust assessment begins from the user's latest trust snapshot score, or 50 if no prior score exists.",
        bullets: [
          "Trust is cumulative rather than recalculated from zero on every event.",
          "Every accepted or rejected event can move the next snapshot up or down.",
          "The score is clamped into a 0 to 100 range after bonuses and penalties are applied.",
        ],
      },
      {
        label: "Apply explicit bonuses and penalties",
        summary: "Wallet age, connected socials, event caps, low-value spam, hold windows, LP retention and allowlists all push the score up or down.",
        bullets: [
          "Examples include positive weight for older wallets or meaningful-value activity.",
          "Negative weight appears for fresh wallets, missing socials, exit-like activity or failing hold and LP retention windows.",
          "Some conditions both reduce score and create a visible suspicious signal at the same time.",
        ],
      },
      {
        label: "Derive warning bands",
        summary: "The final score is mapped into watch or high-risk posture bands that can open new trust warnings even if the event itself was not rejected.",
        bullets: [
          "Scores at or below 45 enter the watch band and emit a medium warning.",
          "Scores at or below 35 enter the high-risk band and emit a high-severity warning.",
          "This is why trust posture can remain under review even after an event was technically accepted.",
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
    slug: "payout-risk",
    title: "Payout risk flow",
    summary: "Payout safety is mostly failure-driven rather than score-driven: blocked claims, finalization failures, delivery issues and disputes become cases directly.",
    states: [
      {
        label: "Failure or pressure appears",
        summary: "A blocked claim, reward inventory risk, delivery failure or campaign finalization problem creates payout pressure.",
        bullets: [
          "This layer is driven by explicit operational failures rather than a hidden numeric risk score.",
          "Case types tell operators what kind of follow-through is needed next.",
          "This makes payout safety easier to explain to projects than a black-box score would be.",
        ],
      },
      {
        label: "Bounded recovery path",
        summary: "The console decides whether the next move is retry, project input, dispute handling or direct operator resolution.",
        bullets: [
          "Project teams start from summary-only visibility and only receive safe actions when the owner grants them.",
          "Retries and project blockers stay visible in the timeline.",
          "The product prefers explicit case states over fuzzy payout-health labels.",
        ],
      },
      {
        label: "Resolution history",
        summary: "Once the payout issue is recovered or dismissed, the case stays in history so future disputes and support work remain explainable.",
        bullets: [
          "Resolution is part of trust-building for both members and project teams.",
          "The operator side needs to preserve what changed, not just that it is now green.",
          "This is why payout docs should feel like console documentation, not a claim FAQ.",
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
  {
    slug: "onchain-signals",
    title: "On-chain signal model",
    summary: "On-chain warnings come from explicit trust thresholds, asset matching failures, wallet-link posture and provider-side recovery problems.",
    states: [
      {
        label: "Validate event and project context",
        summary: "The system first checks whether the event matches an active project asset and a verified wallet before any scoring or XP logic happens.",
        bullets: [
          "Missing asset matches open unmatched-project-asset cases.",
          "Unverified or unlinked wallets open unlinked-wallet-activity cases.",
          "These are deterministic product checks, not heuristic score bands.",
        ],
      },
      {
        label: "Assess trust pressure",
        summary: "If the event passes basic validation, the trust assessment applies caps, watch bands and anti-abuse thresholds to decide whether the event is healthy, suspicious or rejected.",
        bullets: [
          "Daily caps, event-type caps, low-value transfer spam, short holds and allowlist violations can all create warnings.",
          "Some thresholds reject the event immediately, while others allow it but still open suspicious-signal pressure.",
          "The highest suspicious-signal severity is then used for the corresponding on-chain case.",
        ],
      },
      {
        label: "Enrich and recover",
        summary: "After ingestion, enrichment and provider sync rails can still create or clear on-chain cases if the deeper recovery jobs fail or succeed.",
        bullets: [
          "Enrichment failures and provider-sync failures become explicit blocked cases.",
          "Retry and rerun actions resolve those cases when the system recovers.",
          "Project-safe actions stay bounded to retry, rescan and rerun rather than global provider control.",
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
