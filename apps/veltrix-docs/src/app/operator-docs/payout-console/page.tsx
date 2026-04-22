import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function PayoutConsoleDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Operator Docs"
      title="Payout Console explains how claim, dispute and payout safety stays case-driven."
      description="This page documents the shared payout safety system: internal payout ops, project-bounded payout visibility, summary-only defaults and the retry or resolution rails that keep claims explainable."
      actions={[
        { href: "/operator-docs", label: "Back to Operator Docs" },
        { href: "/reference", label: "Open Reference" },
      ]}
      chips={["Flagship page", "Payout safety", "Claim resolution"]}
      relatedHrefs={[
        "/operator-docs",
        "/operator-docs/trust-console",
        "/operator-docs/onchain-console",
        "/reference",
        "/reference/payout-case-types",
        "/reference/permissions",
        "/reference/signal-and-scoring-models",
        "/reference/warning-and-flag-lifecycle",
        "/reference/payout-risk-and-resolution-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Primary users</p>
          <h2 className="text-2xl font-black text-white">Internal payout operators and bounded project payout leads.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Payout Console brings claims, delivery failures and retries into one visible resolution system instead of leaving them fragmented.
          </p>
        </div>
      }
      snapshotSlug="payout-console"
      stateExplorerSlug="payout-flow"
      whatItIs={{
        description:
          "Payout Console is the case-driven layer for claims and reward delivery safety. It turns blocked, disputed or risky payout situations into explicit cases with project-safe follow-through where allowed.",
        bullets: [
          "Internal payout ops can review, retry, resolve or dismiss cases with full context.",
          "Projects get bounded payout visibility and only safe actions when an owner explicitly grants them.",
          "Inventory risk, disputes and retry posture stay visible instead of disappearing into background jobs or support notes.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "Claims and payouts needed a real operating model so teams could explain why something is blocked and what the next recovery move actually is.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "This documentation explains both the internal ops surface and the project-bounded payout console together.",
        items: [
          {
            label: "Internal route",
            meta: "/claims",
            summary: "The internal payout operations workspace for queue, incidents, disputes and resolution history.",
          },
          {
            label: "Project route",
            meta: "/projects/<id>/payouts",
            summary: "The bounded payout console projects can see once the owner decides what their team should access.",
          },
          {
            label: "Connected systems",
            summary: "Reward posture, trust visibility and escalation history all intersect with payout safety documentation.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Summary-only default",
            meta: "Permission rule",
            summary: "Project teams start from a safe summary posture and only gain deeper visibility or actions through explicit owner grants.",
          },
          {
            label: "Retry posture must stay visible",
            meta: "Recovery rule",
            summary: "If a payout case is queued for retry, the system and the docs should make that explicit instead of hiding it behind silent background behavior.",
          },
          {
            label: "Claims are part of a broader payout system",
            meta: "Model rule",
            summary: "This console is not just a claim list; it is the safety and resolution layer over claims, delivery and inventory pressure.",
          },
        ],
      }}
      deepDive={{
        title: "How payout warnings, blocked states and safe actions are actually determined",
        description:
          "Payout Console is easier to trust once the docs explain that payout safety is not a hidden score. It is a case-driven layer built from explicit failures, blocked states and visible retries.",
        sections: [
          {
            title: "What creates payout pressure",
            description: "Most payout warnings start from a known operational problem rather than a probabilistic model.",
            items: [
              {
                label: "Blocked claims and manual review",
                meta: "Queue entry",
                summary:
                  "When a claim cannot complete on the normal path, the system turns that blocked posture into a payout case so the issue can be owned, reviewed and resolved explicitly.",
              },
              {
                label: "Delivery and finalization failures",
                meta: "Runtime failures",
                summary:
                  "Campaign finalization failures and delivery issues become payout cases directly because the system already knows the payout path is broken or incomplete.",
              },
              {
                label: "Inventory pressure",
                meta: "Availability posture",
                summary:
                  "Reward stock and issuance pressure are treated as payout risk because they can block or distort claims even before a member reaches the final delivery step.",
              },
            ],
          },
          {
            title: "How urgency is expressed",
            description: "This console relies more on visible case state than on a single numeric score.",
            items: [
              {
                label: "Blocked and needs project input",
                meta: "Primary operator language",
                summary:
                  "These states matter more than a number because they tell the operator exactly why the case is stalled and what kind of intervention is needed next.",
              },
              {
                label: "Retry queued",
                meta: "Recovery in motion",
                summary:
                  "The product surfaces retry posture explicitly so operators and projects can see whether the issue is already being worked rather than simply lingering in the queue.",
              },
              {
                label: "Severity stays contextual",
                meta: "Failure-driven",
                summary:
                  "High or critical payout urgency usually comes from the consequence of the failure, such as finalization breakage or unresolved delivery, rather than from a derived payout-health score.",
              },
            ],
          },
          {
            title: "Why project actions remain bounded",
            description: "The docs should make the boundary between project participation and internal payout authority explicit.",
            items: [
              {
                label: "Summary-only by default",
                meta: "Safe posture",
                summary:
                  "Projects begin from summary-only payout visibility so they can understand health without inheriting internal-only details or operator recovery power.",
              },
              {
                label: "Owner-granted actions",
                meta: "Bounded collaboration",
                summary:
                  "Owners can grant safe actions like annotate, escalate or retry project-safe flows, but internal operators still control the deeper payout rails and final authority.",
              },
              {
                label: "History keeps trust intact",
                meta: "Explanation layer",
                summary:
                  "Readable payout history is what lets projects explain blocked claims and recovered payouts later without needing direct access to internal-only data.",
              },
            ],
          },
        ],
      }}
    />
  );
}
