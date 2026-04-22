import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function PayoutCaseTypesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Payout Case Types define the safety model behind claims, delivery and disputes."
      description="This page defines the payout case taxonomy used by the internal claims workspace and the project-bounded payout console."
      referenceSlug="payout-case-types"
      stateExplorerSlug="payout-flow"
      relatedHrefs={[
        "/reference",
        "/reference/payout-risk-and-resolution-model",
        "/operator-docs/payout-console",
        "/operator-docs",
        "/reference/permissions",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Safety layer</p>
          <p className="text-sm leading-7 text-slate-300">
            Payout cases translate claim and delivery problems into an explainable operating model instead of a background support issue.
          </p>
        </div>
      }
    />
  );
}
