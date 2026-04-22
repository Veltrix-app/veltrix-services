import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function OnchainCaseTypesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="On-chain Case Types define the recovery language for ingress, sync and anomaly handling."
      description="This page defines the case taxonomy used by the internal on-chain workspace and the project-bounded on-chain console."
      referenceSlug="onchain-case-types"
      stateExplorerSlug="onchain-flow"
      relatedHrefs={[
        "/reference",
        "/reference/onchain-signal-and-recovery-model",
        "/reference/trust-score-and-severity-bands",
        "/operator-docs/onchain-console",
        "/operator-docs",
        "/reference/permissions",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Recovery layer</p>
          <p className="text-sm leading-7 text-slate-300">
            On-chain cases let the product explain technical recovery paths in product language without hiding the seriousness of the issue.
          </p>
        </div>
      }
    />
  );
}
