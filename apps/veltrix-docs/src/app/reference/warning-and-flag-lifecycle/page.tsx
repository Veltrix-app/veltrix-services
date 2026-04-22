import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function WarningAndFlagLifecyclePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Warning and Flag Lifecycle explains how a raw issue becomes a visible operator workflow."
      description="This page documents the path from raw input to suspicious signal, review flag, explicit case and final timeline history across trust, payout and on-chain layers."
      referenceSlug="warning-and-flag-lifecycle"
      stateExplorerSlug="warning-flow"
      relatedHrefs={[
        "/reference",
        "/reference/signal-and-scoring-models",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Case backbone</p>
          <p className="text-sm leading-7 text-slate-300">
            A good public doc should explain not only that the system raised a warning, but also how that warning grew into a case with ownership, status and history.
          </p>
        </div>
      }
    />
  );
}
