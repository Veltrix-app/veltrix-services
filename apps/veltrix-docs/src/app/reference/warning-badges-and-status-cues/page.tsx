import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function WarningBadgesAndStatusCuesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Warning Badges and Status Cues explain what the most important labels in Veltrix are trying to tell you."
      description="This page documents readiness cues, warning chips, waiting states and outcome labels so readers can understand what those badges mean across launch, safety and recovery surfaces."
      referenceSlug="warning-badges-and-status-cues"
      stateExplorerSlug="warning-flow"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/status-labels",
        "/reference/warning-and-flag-lifecycle",
        "/project-docs/launch-workspace",
        "/operator-docs/escalations",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Signal cue family</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to know what a badge, warning chip or waiting-state label is actually compressing from the deeper system underneath it.
          </p>
        </div>
      }
    />
  );
}
