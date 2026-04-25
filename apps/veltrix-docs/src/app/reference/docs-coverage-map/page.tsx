import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function DocsCoverageMapPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Docs Coverage Map explains how deep each VYNTRO product domain is documented today."
      description="This page is the atlas view of documentation depth. It shows which domains are covered through surface pages, workflows and exact reference language so the encyclopedia stays legible as it grows."
      referenceSlug="docs-coverage-map"
      stateExplorerSlug="docs-coverage"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/project-docs",
        "/operator-docs",
        "/reference/entities-and-relationships",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Coverage atlas</p>
          <p className="text-sm leading-7 text-slate-300">
            Use this page when you want to know whether a product domain is already explained as a surface, a workflow and an exact system model instead of only one of those layers.
          </p>
        </div>
      }
    />
  );
}
