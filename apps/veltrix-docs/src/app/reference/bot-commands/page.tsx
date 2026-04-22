import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function BotCommandsReferencePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Bot Commands define the shared member and captain command language."
      description="This page explains the command dictionary used across Discord and Telegram, and how those commands connect back to the wider Veltrix system."
      referenceSlug="bot-commands"
      relatedHrefs={["/reference", "/project-docs", "/project-docs/community-os", "/operator-docs"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Command layer</p>
          <p className="text-sm leading-7 text-slate-300">
            Commands are part of the product model, not a side appendix, which is why they belong in reference.
          </p>
        </div>
      }
    />
  );
}
