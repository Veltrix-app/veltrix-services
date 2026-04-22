import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function CampaignStudioDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Project Docs"
      title="Campaign Studio turns launch intent into a mission architecture."
      description="This page explains Campaign Studio as the campaign-building core of Veltrix: where a project frames the goal, shapes the mission path and gets launch posture ready before members ever see the campaign."
      actions={[
        { href: "/project-docs", label: "Back to Project Docs" },
        { href: "/reference", label: "Open Reference" },
      ]}
      chips={["Flagship page", "Storyboard builder", "Launch posture"]}
      relatedHrefs={[
        "/project-docs",
        "/project-docs/quest-studio",
        "/project-docs/community-os",
        "/reference",
        "/reference/lifecycle-states",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Primary users</p>
          <h2 className="text-2xl font-black text-white">Founders, growth leads and launch operators.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Campaign Studio is where a launch becomes an explicit architecture instead of a loose set of tasks.
          </p>
        </div>
      }
      snapshotSlug="campaign-studio"
      stateExplorerSlug="lifecycle"
      whatItIs={{
        description:
          "Campaign Studio is the project-facing campaign builder. It is not just a form for campaign metadata. It is the place where launch intent, mission structure, reward posture and readiness all meet.",
        bullets: [
          "It forces the team to define the goal before configuration depth takes over.",
          "It treats quests, raids and rewards as parts of one mission map instead of unrelated objects.",
          "It keeps launch readiness visible while the campaign is being shaped.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "Without a campaign architecture layer, the product would collapse into individual quest and raid creation without enough strategic framing.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "Campaign Studio is a builder surface, but it is entered from project context rather than from a detached tools menu.",
        items: [
          {
            label: "Primary route",
            meta: "/campaigns/new",
            summary: "The direct creation route for a new campaign builder session.",
          },
          {
            label: "Project-first entry",
            meta: "/projects/<id>/launch",
            summary: "The preferred path for teams starting from project launch context and readiness posture.",
          },
          {
            label: "Connected surfaces",
            summary: "Quest Studio, reward configuration, launch workspace and later community execution all connect back into this surface.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        description: "These are the core behaviors other docs pages should not redefine in their own words.",
        items: [
          {
            label: "Goal before configuration",
            meta: "Builder rule",
            summary: "Campaign setup starts with the mission intent and only then drops into deeper object configuration.",
          },
          {
            label: "Lifecycle-safe editing",
            meta: "System rule",
            summary: "Campaign actions follow the shared lifecycle posture rather than relying on ad hoc publish toggles.",
          },
          {
            label: "Member-facing consequences",
            meta: "Journey rule",
            summary: "The campaign architecture only matters because it shapes the quest, raid and reward experience for members later.",
          },
        ],
      }}
    />
  );
}
