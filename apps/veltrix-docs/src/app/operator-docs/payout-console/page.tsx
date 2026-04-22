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
    />
  );
}
