import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function EntitiesAndRelationshipsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Entities and Relationships map how the full VYNTRO system is composed."
      description="This page explains the parent-child and surface-to-surface relationships that make the product read as one operating system instead of separate tools."
      referenceSlug="entities-and-relationships"
      relatedHrefs={[
        "/reference",
        "/project-docs/campaign-studio",
        "/project-docs/community-os",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Atlas page</p>
          <p className="text-sm leading-7 text-slate-300">
            This is the system map for readers who need to understand how the major VYNTRO objects depend on each other before going deeper into any single feature page.
          </p>
        </div>
      }
    />
  );
}
