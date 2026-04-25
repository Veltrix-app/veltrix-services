import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function PayoutRiskAndResolutionModelPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Payout Risk and Resolution Model explains why payout safety is driven by visible failures and states rather than a hidden score."
      description="This page documents the explicit model behind blocked claims, delivery failures, finalization pressure, disputes and the resolution states operators and projects see around them."
      referenceSlug="payout-risk-and-resolution-model"
      stateExplorerSlug="payout-risk"
      relatedHrefs={[
        "/reference",
        "/reference/payout-case-types",
        "/operator-docs/payout-console",
        "/operator-docs/claims-and-resolution",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Failure-driven model</p>
          <p className="text-sm leading-7 text-slate-300">
            This page is here to make one thing clear: payout safety in VYNTRO is designed around explicit blocked states, retries and disputes, not around a vague payout score.
          </p>
        </div>
      }
    />
  );
}
