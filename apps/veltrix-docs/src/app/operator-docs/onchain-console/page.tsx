import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function OnchainConsoleDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Operator Docs"
      title="On-chain Console explains how chain-side failures and signals become bounded recovery work."
      description="This page documents the on-chain resolution system: internal full-control recovery, project-bounded health visibility, project-safe retries and the case model that keeps chain-side issues understandable."
      actions={[
        { href: "/operator-docs", label: "Back to Operator Docs" },
        { href: "/reference", label: "Open Reference" },
      ]}
      chips={["Flagship page", "On-chain recovery", "Project-safe actions"]}
      relatedHrefs={[
        "/operator-docs",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/reference",
        "/reference/onchain-case-types",
        "/reference/permissions",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Primary users</p>
          <h2 className="text-2xl font-black text-white">Internal chain operators and bounded project recovery leads.</h2>
          <p className="text-sm leading-7 text-slate-300">
            On-chain Console turns chain-side failures and anomalies into explicit cases with safe, documented recovery posture.
          </p>
        </div>
      }
      snapshotSlug="onchain-console"
      stateExplorerSlug="onchain-flow"
      whatItIs={{
        description:
          "On-chain Console is the case-driven recovery layer for ingress, enrichment, sync and anomaly review. It gives internal operators full control while keeping project-facing recovery safely bounded.",
        bullets: [
          "Internal on-chain ops can see failures, signals and rawer recovery posture in one workspace.",
          "Projects can receive explicit, project-safe actions like retry, rerun enrichment or rescan assets if owners allow it.",
          "The case model keeps chain-side incidents explainable even when the underlying jobs are technical.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "Chain-side recovery was too easy to understand only through internal job logs. This console gives it a true product surface and a safe project-facing counterpart.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "The docs page needs to explain internal and project-facing recovery as one system with different permission boundaries.",
        items: [
          {
            label: "Internal route",
            meta: "/onchain",
            summary: "The full on-chain ops workspace for queues, failures, signals and resolution history.",
          },
          {
            label: "Project route",
            meta: "/projects/<id>/onchain",
            summary: "The bounded on-chain console where projects can inspect health and perform project-safe recovery actions if granted.",
          },
          {
            label: "Action posture",
            summary: "Project-facing actions stay limited to safe retries, rescans and reruns rather than global provider control.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Project-safe actions only",
            meta: "Permission rule",
            summary: "Owners can grant project-safe recovery moves, but not full internal provider or global sync control.",
          },
          {
            label: "Signal shaping matters",
            meta: "Docs rule",
            summary: "The public docs layer should explain on-chain anomalies without exposing unsafe raw payload detail.",
          },
          {
            label: "Recovery must stay case-driven",
            meta: "Operating rule",
            summary: "On-chain issues should remain visible as explicit cases with timeline context, not disappear into technical job abstractions.",
          },
        ],
      }}
    />
  );
}
