import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function ControlAtlasPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Control Atlas explains what the main Veltrix control families do and where they live."
      description="This page groups controls by what they change: launch posture, lifecycle state, visibility, warnings, recovery and delivery. It is the fastest way to understand what a control rail is trying to influence before diving into a specific surface."
      referenceSlug="control-atlas"
      stateExplorerSlug="control-atlas"
      relatedHrefs={[
        "/reference",
        "/reference/docs-coverage-map",
        "/reference/empty-states-and-zero-data",
        "/reference/action-buttons-and-safe-next-moves",
        "/reference/permissions",
        "/reference/warning-and-flag-lifecycle",
        "/project-docs/launch-workspace",
        "/operator-docs/escalations",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Control families</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to understand whether a control changes state, changes visibility, explains risk or moves a live issue toward resolution.
          </p>
        </div>
      }
    />
  );
}
