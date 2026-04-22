import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function TrustCaseTypesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Trust Case Types define how trust review gets classified and resolved."
      description="This page defines the trust review taxonomy used by the internal trust workspace and the project-bounded trust console."
      referenceSlug="trust-case-types"
      stateExplorerSlug="trust-flow"
      relatedHrefs={[
        "/reference",
        "/reference/signal-and-scoring-models",
        "/reference/trust-score-and-severity-bands",
        "/operator-docs/trust-console",
        "/operator-docs",
        "/reference/permissions",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Safety layer</p>
          <p className="text-sm leading-7 text-slate-300">
            Trust cases explain why something is under review, not just that it is blocked. That distinction matters throughout the system.
          </p>
        </div>
      }
    />
  );
}
