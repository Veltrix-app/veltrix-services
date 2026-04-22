import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function LifecycleStatesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Lifecycle States define how Veltrix treats readiness, activation and historical posture."
      description="This page explains the common lifecycle language shared across builder surfaces and operator workflows."
      referenceSlug="lifecycle-states"
      stateExplorerSlug="lifecycle"
      relatedHrefs={["/reference", "/project-docs/campaign-studio", "/project-docs/quest-studio", "/project-docs"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Used by</p>
          <p className="text-sm leading-7 text-slate-300">
            Campaign Studio, Quest Studio, launch readiness and the operator recovery surfaces all rely on the same lifecycle language.
          </p>
        </div>
      }
    />
  );
}
