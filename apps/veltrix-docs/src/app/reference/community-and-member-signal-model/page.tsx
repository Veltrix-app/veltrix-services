import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function CommunityAndMemberSignalModelPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Community and Member Signal Model explains how owner posture, commands, cohorts and the member journey feed each other."
      description="This page documents the exact feedback loop between Community OS, captain execution, command rails, member recognition and the signals that flow back into project-side health."
      referenceSlug="community-and-member-signal-model"
      stateExplorerSlug="community-signals"
      relatedHrefs={[
        "/reference",
        "/project-docs/community-os",
        "/project-docs/member-journey",
        "/project-docs/bot-commands",
        "/reference/bot-commands",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Community loop</p>
          <p className="text-sm leading-7 text-slate-300">
            Community work gets much easier to explain once the docs show it as a loop from owner posture into captain execution and back through member behavior.
          </p>
        </div>
      }
    />
  );
}
