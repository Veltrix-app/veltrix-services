import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function TweetToRaidCommandFlowReferencePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Tweet-to-Raid Command Flow defines live raid creation from X sources and /newraid."
      description="This page explains autopilot polling, command defaults, default campaigns, fallback banners, dedupe and Telegram/Discord delivery for command-created raids."
      referenceSlug="tweet-to-raid-command-flow"
      stateExplorerSlug="tweet-to-raid-flow"
      relatedHrefs={[
        "/reference",
        "/project-docs/tweet-to-raid",
        "/project-docs/bot-commands",
        "/reference/bot-commands",
        "/reference/command-and-automation-controls",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Command rail</p>
          <p className="text-sm leading-7 text-slate-300">
            /newraid should create the same live raid object the portal and webapp expect, not a chat-only side effect.
          </p>
        </div>
      }
    />
  );
}
