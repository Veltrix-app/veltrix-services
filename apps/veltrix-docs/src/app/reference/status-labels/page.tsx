import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function StatusLabelsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Status Labels define the public-facing language for readiness, waiting and recovery."
      description="This page explains how Veltrix labels health, pressure and next-action posture across builder, member and operator surfaces."
      referenceSlug="status-labels"
      relatedHrefs={["/reference", "/reference/lifecycle-states", "/reference/permissions", "/operator-docs"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Display layer</p>
          <p className="text-sm leading-7 text-slate-300">
            Consistent status language is what keeps the whole system readable once the product gets deep.
          </p>
        </div>
      }
    />
  );
}
