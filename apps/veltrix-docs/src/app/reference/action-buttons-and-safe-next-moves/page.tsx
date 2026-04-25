import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function ActionButtonsAndSafeNextMovesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Action Buttons and Safe Next Moves explain what VYNTRO buttons change and where they send you next."
      description="This page documents the main action families across launch, builders and safety consoles so readers understand whether a button routes, changes posture, starts recovery or changes visibility."
      referenceSlug="action-buttons-and-safe-next-moves"
      stateExplorerSlug="action-behavior"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/empty-states-and-zero-data",
        "/reference/builder-controls-and-state-actions",
        "/reference/recovery-and-resolution-actions",
        "/reference/warning-copy-and-escalation-language",
        "/project-docs/launch-workspace",
        "/operator-docs/claims-and-resolution",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Action semantics</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to know whether a button opens the next surface, changes lifecycle posture, triggers bounded recovery or expands access.
          </p>
        </div>
      }
    />
  );
}
