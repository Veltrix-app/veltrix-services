import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function TrustScoreAndSeverityBandsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Trust Score and Severity Bands explain exactly how trust posture moves and why warnings appear."
      description="This page documents the bonuses, penalties, reject thresholds and watch bands behind on-chain trust posture, including why some events are rejected while others remain accepted but suspicious."
      referenceSlug="trust-score-and-severity-bands"
      stateExplorerSlug="trust-scoring"
      relatedHrefs={[
        "/reference",
        "/reference/signal-and-scoring-models",
        "/reference/trust-case-types",
        "/operator-docs/trust-console",
        "/operator-docs/onchain-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Trust math</p>
          <p className="text-sm leading-7 text-slate-300">
            This page exists to make the trust score feel explicit instead of magical, especially around watch bands, hard rejects and suspicious accepted events.
          </p>
        </div>
      }
    />
  );
}
