import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function TrustConsoleDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Operator Docs"
      title="Trust Console shows how Veltrix handles review, escalation and bounded project visibility."
      description="This page explains the permissioned trust system: internal full-control trust ops, project-bounded trust visibility, explicit owner grants and auditable case timelines."
      actions={[
        { href: "/operator-docs", label: "Back to Operator Docs" },
        { href: "/reference", label: "Open Reference" },
        { href: "/reference/recovery-and-resolution-actions", label: "Recovery Actions" },
      ]}
      chips={["Flagship page", "Trust review", "Permissioned console"]}
      relatedHrefs={[
        "/operator-docs",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
        "/reference",
        "/reference/visibility-and-grant-controls",
        "/reference/warning-badges-and-status-cues",
        "/reference/recovery-and-resolution-actions",
        "/reference/trust-case-types",
        "/reference/permissions",
        "/reference/signal-and-scoring-models",
        "/reference/warning-and-flag-lifecycle",
        "/reference/trust-score-and-severity-bands",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Primary users</p>
          <h2 className="text-2xl font-black text-white">Internal trust operators and bounded project reviewers.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Trust Console is designed to keep safety explainable without turning project-facing trust visibility into a free-for-all.
          </p>
        </div>
      }
      snapshotSlug="trust-console"
      stateExplorerSlug="trust-flow"
      whatItIs={{
        description:
          "Trust Console is the case-driven review system for trust and fraud handling. It pairs internal operator control with explicit project-side grants so trust work can be shared without losing safety.",
        bullets: [
          "Internal trust ops keeps full control over investigations, evidence and final resolution.",
          "Projects can receive bounded visibility and action rights if the owner decides they need them.",
          "Every trust action writes history so the system stays explainable across escalations.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "Trust review needed to become a real console so project teams could participate safely without inheriting internal-only control or invisible decision-making.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "Trust docs needs to explain both the internal and project-facing surfaces together, because the product intentionally spans both.",
        items: [
          {
            label: "Internal route",
            meta: "/moderation",
            summary: "The full-control trust workspace for internal operators and deep review handling.",
          },
          {
            label: "Project route",
            meta: "/projects/<id>/trust",
            summary: "The bounded trust console that projects can see if they are allowed to view or act on cases.",
          },
          {
            label: "Permission model",
            summary: "Project access starts from view-only and expands only through owner-managed grants for visibility and actions.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Internal control stays intact",
            meta: "Safety rule",
            summary: "Project-facing trust visibility does not replace internal review authority or raw internal evidence access.",
          },
          {
            label: "Visibility and actions are separate",
            meta: "Permission rule",
            summary: "Seeing a case and acting on a case are different grants, and the docs should keep that distinction explicit.",
          },
          {
            label: "Timeline is non-optional",
            meta: "Explainability rule",
            summary: "Trust work must stay auditable as it moves across internal and project-facing rails.",
          },
        ],
      }}
      controlAtlas={{
        title: "The controls that matter most inside Trust Console",
        description:
          "Trust Console is easiest to understand when its controls are grouped into visibility, signal interpretation and formal case actions rather than treated as one long moderation page.",
        sections: [
          {
            title: "Visibility and grant controls",
            description: "These controls determine who can see trust posture and who can only see a bounded summary.",
            items: [
              {
                label: "Summary-only and detail grants",
                meta: "Visibility control",
                summary: "These controls define whether a project sees only a calm trust summary or deeper case detail that still stays within bounded safety rules.",
              },
              {
                label: "Action grants",
                meta: "Participation control",
                summary: "A project may be able to annotate or escalate a case without receiving the same evidence visibility or final resolution authority as internal operators.",
              },
              {
                label: "Owner-managed expansion",
                meta: "Governance control",
                summary: "The owner controls how collaborative the trust console becomes for a project team, while internal ops keeps the deepest rail.",
              },
            ],
          },
          {
            title: "Warning and severity controls",
            description: "These controls help operators interpret why the console is pressuring a case into review in the first place.",
            items: [
              {
                label: "Warning chips and severity bands",
                meta: "Signal control",
                summary: "These cues tell the operator whether the issue is a watch posture, a higher-severity trust concern or a hard-threshold rejection consequence.",
              },
              {
                label: "Trust score posture",
                meta: "Interpretation control",
                summary: "The console uses score bands and signal severity together so the docs should explain that a case can be risky even when some activity was technically accepted.",
              },
              {
                label: "Case-type classification",
                meta: "Normalization control",
                summary: "Classification turns noisy trust signals into a legible case object before ownership and escalation begin.",
              },
            ],
          },
          {
            title: "Case and closure controls",
            description: "These controls actually move the trust case through its human workflow.",
            items: [
              {
                label: "Annotate and request project input",
                meta: "Collaboration control",
                summary: "These actions preserve context and make it visible when the issue is waiting on a bounded project contribution.",
              },
              {
                label: "Resolve and dismiss",
                meta: "Outcome control",
                summary: "These controls matter because they officially close the review posture and preserve the reason in history.",
              },
              {
                label: "Timeline updates",
                meta: "History control",
                summary: "The timeline is part of the control system because it records what changed after every significant trust action.",
              },
            ],
          },
        ],
      }}
      deepDive={{
        title: "How trust warnings, scores and case pressure are produced",
        description:
          "Trust Console is much easier to understand once the docs make a hard distinction between explicit thresholds, cumulative score posture and the project-bounded view of both.",
        sections: [
          {
            title: "What triggers trust pressure",
            description: "These are the main signal families behind trust review.",
            items: [
              {
                label: "Identity and freshness",
                meta: "Fresh wallets and social proof",
                summary:
                  "Fresh verified wallets and missing connected socials lower the trust score, and the strongest freshness and identity gaps also emit suspicious signals that can open trust review.",
              },
              {
                label: "Abuse-style event patterns",
                meta: "Caps and spam thresholds",
                summary:
                  "Daily on-chain caps, event-type caps and repeated low-value transfers all create explicit signals because they look like farming or scripted activity rather than meaningful participation.",
              },
              {
                label: "Retention and exposure posture",
                meta: "Net buy, hold, LP retention",
                summary:
                  "Net-buy violations, short holds, short LP retention and exit-like activity all reduce trust because they suggest shallow or reversible engagement instead of lasting contribution.",
              },
            ],
          },
          {
            title: "How severity is chosen",
            description: "Trust severity is not random; it follows the runtime signal severity and score bands.",
            items: [
              {
                label: "High severity",
                meta: "Reject thresholds",
                summary:
                  "Hard failures such as cap abuse, net-buy violations, contract-call allowlist breaks and minimum-threshold misses usually surface as high-severity signals and often reject the event entirely.",
              },
              {
                label: "Medium severity",
                meta: "Watch bands",
                summary:
                  "Borderline or watch-posture patterns, such as barely-short hold duration or a watch trust band, stay visible as medium-pressure signals so operators can review without treating them as outright abuse.",
              },
              {
                label: "Case severity follows signals",
                meta: "Case model",
                summary:
                  "Trust cases inherit the suspicious-signal severity associated with the runtime mapping, and repeated evidence refreshes the existing case instead of multiplying duplicate cases.",
              },
            ],
          },
          {
            title: "Why projects see a bounded version",
            description: "The trust docs should explain this clearly because it is one of the most important platform safety rules.",
            items: [
              {
                label: "Visibility and actions stay separate",
                meta: "Grant model",
                summary:
                  "Project teams do not inherit trust detail or trust actions automatically; owners grant visibility and actions independently, and internal operators keep the deeper evidence and final authority.",
              },
              {
                label: "Cases carry the explanation",
                meta: "Public-safe posture",
                summary:
                  "Projects should understand why a case exists and what it is waiting on, but they do not need raw internal payloads to act on bounded project-side responsibilities.",
              },
              {
                label: "Timeline preserves accountability",
                meta: "Audit rule",
                summary:
                  "The trust timeline matters because it lets both internal operators and bounded project viewers understand what changed without exposing unsafe underlying data.",
              },
            ],
          },
        ],
      }}
    />
  );
}
