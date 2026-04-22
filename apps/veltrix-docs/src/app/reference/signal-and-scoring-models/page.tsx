import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function SignalAndScoringModelsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Signal and Scoring Models explain how Veltrix turns raw activity into warnings, cases and bounded visibility."
      description="This page defines the shared logic behind deterministic rules, warning bands, severity shaping and why project-facing consoles only receive a bounded view of internal safety signals."
      referenceSlug="signal-and-scoring-models"
      relatedHrefs={[
        "/reference",
        "/reference/warning-and-flag-lifecycle",
        "/reference/trust-score-and-severity-bands",
        "/reference/onchain-signal-and-recovery-model",
        "/operator-docs/trust-console",
        "/operator-docs/onchain-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">System logic</p>
          <p className="text-sm leading-7 text-slate-300">
            This is the page to read when you want to understand why a warning exists, how it got its urgency and why the project-side console only sees part of the full story.
          </p>
        </div>
      }
    />
  );
}
