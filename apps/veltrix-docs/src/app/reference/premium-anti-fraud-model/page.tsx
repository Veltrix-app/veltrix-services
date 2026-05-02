import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function PremiumAntiFraudModelReferencePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Premium Anti-Fraud Model defines the trust layer behind high-quality rewards."
      description="This page explains wallet graph, device and session reputation, velocity checks, duplicate social detection, suspicious claim patterns, manual review and appeal posture."
      referenceSlug="premium-anti-fraud-model"
      stateExplorerSlug="premium-anti-fraud-flow"
      relatedHrefs={[
        "/reference",
        "/operator-docs/trust-console",
        "/reference/trust-score-and-severity-bands",
        "/reference/xp-economy-enforcement",
        "/reference/warning-and-flag-lifecycle",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Trust posture</p>
          <p className="text-sm leading-7 text-slate-300">
            Premium fraud prevention is not one score. It is correlated evidence, bounded visibility and reviewable outcomes.
          </p>
        </div>
      }
    />
  );
}
