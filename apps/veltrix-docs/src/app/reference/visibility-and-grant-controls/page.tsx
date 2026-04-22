import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function VisibilityAndGrantControlsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Visibility and Grant Controls explain how bounded consoles decide who can see and do what."
      description="This page documents summary-only defaults, detail grants, action grants and the owner-managed control posture behind trust, payout, on-chain and community surfaces."
      referenceSlug="visibility-and-grant-controls"
      stateExplorerSlug="permissions"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/permissions",
        "/reference/permission-matrices",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Grant control family</p>
          <p className="text-sm leading-7 text-slate-300">
            Use this page when you want a control-level explanation of why projects start bounded and how owners expand visibility or safe actions intentionally.
          </p>
        </div>
      }
    />
  );
}
