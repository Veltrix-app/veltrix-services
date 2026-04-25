import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function EmptyStatesAndZeroDataPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Empty States and Zero-Data explain how VYNTRO should talk when a surface has nothing to show yet."
      description="This page documents blank, quiet, blocked and bounded-empty postures so the product can explain missing or calm states without reading like a broken screen."
      referenceSlug="empty-states-and-zero-data"
      stateExplorerSlug="empty-states"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/action-buttons-and-safe-next-moves",
        "/reference/warning-copy-and-escalation-language",
        "/project-docs/launch-workspace",
        "/project-docs/integrations",
        "/operator-docs/overview-and-analytics",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Interaction semantics</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to understand whether a surface is empty because nothing is configured yet, because the system is calm or because another lane still owns the blocker.
          </p>
        </div>
      }
    />
  );
}
