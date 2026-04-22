import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function CommandAndAutomationControlsPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Command and Automation Controls explain how delivery rails are scoped, activated and routed back into the product."
      description="This page documents command scopes, automation posture, captain-versus-member delivery rails and the deep-link behavior that turns bot outputs into real product flow."
      referenceSlug="command-and-automation-controls"
      stateExplorerSlug="delivery-controls"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/bot-commands",
        "/reference/automation-types",
        "/project-docs/bot-commands",
        "/project-docs/community-os",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Delivery control family</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to understand what command scopes, automation toggles and deep-link rails actually control in the live system.
          </p>
        </div>
      }
    />
  );
}
