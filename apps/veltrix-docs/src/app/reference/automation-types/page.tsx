import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function AutomationTypesPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Automation Types define how follow-through enters the product."
      description="This page explains the common automation rails that power scheduled, state-driven and recovery-led follow-through across VYNTRO."
      referenceSlug="automation-types"
      relatedHrefs={["/reference", "/project-docs/community-os", "/project-docs", "/operator-docs"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Execution layer</p>
          <p className="text-sm leading-7 text-slate-300">
            Automation docs should stay exact enough to explain behavior while still readable for public project teams.
          </p>
        </div>
      }
    />
  );
}
