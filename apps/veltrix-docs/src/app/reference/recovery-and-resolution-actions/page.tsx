import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function RecoveryAndResolutionActionsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Recovery and Resolution Actions explain what retry, rerun, rescan, annotate, escalate and resolve actually do."
      description="This page documents the concrete recovery controls used across trust, payout, on-chain and escalation rails so the product's live-action layer is easier to interpret."
      referenceSlug="recovery-and-resolution-actions"
      stateExplorerSlug="recovery-actions"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/warning-and-flag-lifecycle",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
        "/operator-docs/escalations",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Recovery control family</p>
          <p className="text-sm leading-7 text-slate-300">
            Use this page when you want a function-level explanation of what the main live recovery actions change and why some of them stay internal-only.
          </p>
        </div>
      }
    />
  );
}
