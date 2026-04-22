import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function BuilderControlsAndStateActionsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Builder Controls and State Actions explain the controls that shape launch posture and lifecycle safety."
      description="This page documents the create, route, publish, pause, archive, duplicate and starter-pack style controls that make the project builders feel like one coherent operating family."
      referenceSlug="builder-controls-and-state-actions"
      stateExplorerSlug="lifecycle"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/project-docs/launch-workspace",
        "/project-docs/campaign-studio",
        "/project-docs/quest-studio",
        "/project-docs/raid-studio",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Builder control family</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to understand what a create, publish, duplicate or launch-entry action actually changes in the wider product.
          </p>
        </div>
      }
    />
  );
}
