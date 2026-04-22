import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function BuilderAndHandoffModelPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Builder and Handoff Model explains how project creation moves across Launch Workspace, Campaign, Quest, Raid and Rewards."
      description="This page documents the exact relationship between builder surfaces, which layer acts as the architectural parent and why project-first handoffs matter."
      referenceSlug="builder-and-handoff-model"
      stateExplorerSlug="builder-handoffs"
      relatedHrefs={[
        "/reference",
        "/project-docs/launch-workspace",
        "/project-docs/campaign-studio",
        "/project-docs/quest-studio",
        "/project-docs/raid-studio",
        "/project-docs/rewards",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Builder system</p>
          <p className="text-sm leading-7 text-slate-300">
            This page exists so the docs can explain why the builder family feels like one product system instead of disconnected creation routes.
          </p>
        </div>
      }
    />
  );
}
