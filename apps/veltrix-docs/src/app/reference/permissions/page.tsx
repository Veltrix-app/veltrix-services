import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function PermissionsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Permissions explain who can see what and who can act on what."
      description="This page defines the shared permission posture across project workspaces, captain scopes and the bounded operator-facing consoles."
      referenceSlug="permissions"
      stateExplorerSlug="permissions"
      relatedHrefs={["/reference", "/project-docs/community-os", "/operator-docs/trust-console", "/operator-docs/payout-console", "/operator-docs/onchain-console"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Core split</p>
          <p className="text-sm leading-7 text-slate-300">
            Visibility and action are separate grants on purpose. That split is one of the most important system rules in VYNTRO.
          </p>
        </div>
      }
    />
  );
}
