import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function OnchainSignalAndRecoveryModelPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="On-chain Signal and Recovery Model explains how chain-side warnings, flags and cases are actually created."
      description="This page documents the validation gates, trust thresholds, suspicious-signal pressure and recovery-job behavior that shape on-chain warnings and cases in Veltrix."
      referenceSlug="onchain-signal-and-recovery-model"
      stateExplorerSlug="onchain-signals"
      relatedHrefs={[
        "/reference",
        "/reference/onchain-case-types",
        "/reference/trust-score-and-severity-bands",
        "/operator-docs/onchain-console",
        "/operator-docs/trust-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Chain-side model</p>
          <p className="text-sm leading-7 text-slate-300">
            On-chain warnings are not only about chain data. They also depend on project asset mapping, wallet verification, trust posture and the recovery jobs that run after ingestion.
          </p>
        </div>
      }
    />
  );
}
