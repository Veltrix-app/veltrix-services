import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function WarningCopyAndEscalationLanguagePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Warning Copy and Escalation Language explain how VYNTRO phrases caution, blockage and coordination clearly."
      description="This page documents advisory warnings, blocking warnings, waiting-state prompts and escalation language so the product can communicate risk without sounding vague or alarmist."
      referenceSlug="warning-copy-and-escalation-language"
      stateExplorerSlug="warning-semantics"
      relatedHrefs={[
        "/reference",
        "/reference/control-atlas",
        "/reference/empty-states-and-zero-data",
        "/reference/action-buttons-and-safe-next-moves",
        "/reference/warning-badges-and-status-cues",
        "/reference/warning-and-flag-lifecycle",
        "/operator-docs/escalations",
        "/operator-docs/incident-handling",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Warning semantics</p>
          <p className="text-sm leading-7 text-slate-300">
            Read this page when you want to understand how warning and escalation copy should feel: calm, exact and explicit about who owns the next move.
          </p>
        </div>
      }
    />
  );
}
