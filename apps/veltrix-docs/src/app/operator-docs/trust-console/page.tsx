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
      ]}
      chips={["Flagship page", "Trust review", "Permissioned console"]}
      relatedHrefs={[
        "/operator-docs",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
        "/reference",
        "/reference/trust-case-types",
        "/reference/permissions",
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
    />
  );
}
