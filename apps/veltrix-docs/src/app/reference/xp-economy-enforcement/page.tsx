import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function XpEconomyEnforcementReferencePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="XP Economy Enforcement defines how rewards stay fair across the platform."
      description="This page explains standardized XP bands, project caps, proof eligibility, anti-abuse review and appeal posture across quests, raids, DeFi, streaks and claims."
      referenceSlug="xp-economy-enforcement"
      stateExplorerSlug="xp-economy-flow"
      relatedHrefs={[
        "/reference",
        "/project-docs",
        "/project-docs/defi-products",
        "/reference/verification-and-reward-model",
        "/reference/premium-anti-fraud-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Economy guardrail</p>
          <p className="text-sm leading-7 text-slate-300">
            Projects can shape incentives, but the platform should protect XP from easy inflation and coordinated farming.
          </p>
        </div>
      }
    />
  );
}
