import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function QuestStudioDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Project Docs"
      title="Quest Studio explains how a single mission becomes clear, verifiable and member-facing."
      description="This page documents the guided builder for quests: action posture, placement, verification, reward framing and the member preview that keeps the builder tied to the actual experience."
      actions={[
        { href: "/project-docs", label: "Back to Project Docs" },
        { href: "/reference", label: "Open Reference" },
      ]}
      chips={["Flagship page", "Guided builder", "Verification and preview"]}
      relatedHrefs={[
        "/project-docs",
        "/project-docs/campaign-studio",
        "/project-docs/community-os",
        "/reference",
        "/reference/lifecycle-states",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Primary users</p>
          <h2 className="text-2xl font-black text-white">Project builders and launch operators.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Quest Studio turns a single mission into something the team can explain internally and members can understand instantly.
          </p>
        </div>
      }
      snapshotSlug="quest-studio"
      stateExplorerSlug="lifecycle"
      whatItIs={{
        description:
          "Quest Studio is the mission-focused builder for a single quest. Its job is to make action, verification, reward posture and member-facing presentation feel like one coherent object.",
        bullets: [
          "It separates the action itself from the proof needed to trust completion.",
          "It keeps campaign and project context prefilled instead of making the builder feel detached.",
          "It keeps a member-facing preview in view so the builder does not drift into pure admin language.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "If quest creation is only a data-entry form, projects lose clarity on what members actually need to do and how that action will be verified.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "Quest Studio is typically reached from project or campaign context, not from a hidden generic route.",
        items: [
          {
            label: "Primary route",
            meta: "/quests/new",
            summary: "The direct creation route for a fresh quest builder session.",
          },
          {
            label: "Project and campaign handoff",
            summary: "Project overview, launch workspace and campaign detail pages hand context into the builder automatically.",
          },
          {
            label: "Connected surfaces",
            summary: "Campaign Studio sets the bigger mission architecture while Rewards and Member Journey show what the quest ultimately changes downstream.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Action and verification stay separate",
            meta: "Builder rule",
            summary: "The member task and the proof model should be understandable independently, even when they are tightly linked in the product.",
          },
          {
            label: "Project context should persist",
            meta: "System rule",
            summary: "Quest creation should inherit project or campaign context so builders are not forced to reconstruct placement manually.",
          },
          {
            label: "Preview is part of the builder",
            meta: "Experience rule",
            summary: "The member-facing presentation is not an afterthought; it is part of how the builder validates the quest design.",
          },
        ],
      }}
    />
  );
}
