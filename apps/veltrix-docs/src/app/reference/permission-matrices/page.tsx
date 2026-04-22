import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function PermissionMatricesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Permission Matrices compare the bounded access posture across the major consoles."
      description="This page gives the side-by-side permission view for trust, payout, on-chain and community surfaces, so readers can compare defaults and grantable actions quickly."
      referenceSlug="permission-matrices"
      relatedHrefs={[
        "/reference",
        "/reference/permissions",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
        "/project-docs/community-os",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Comparison layer</p>
          <p className="text-sm leading-7 text-slate-300">
            This page exists to make the differences between summary-only, view-only and project-safe action grants obvious without forcing readers to compare multiple console pages manually.
          </p>
        </div>
      }
    />
  );
}
