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
        { href: "/reference/builder-controls-and-state-actions", label: "Builder Controls" },
      ]}
      chips={["Flagship page", "Storyboard builder", "Launch posture"]}
      relatedHrefs={[
        "/project-docs",
        "/project-docs/quest-studio",
        "/project-docs/community-os",
        "/reference",
        "/reference/builder-controls-and-state-actions",
        "/reference/warning-badges-and-status-cues",
        "/reference/lifecycle-states",
        "/reference/launch-and-readiness-model",
        "/reference/builder-and-handoff-model",
        "/reference/verification-and-reward-model",
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
      stateExplorerSlug="builder-handoffs"
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
      controlAtlas={{
        title: "The controls that matter most inside Campaign Studio",
        description:
          "Campaign Studio has many fields, but a smaller set of controls really determine how the campaign behaves in the wider system. These are the ones worth understanding first.",
        sections: [
          {
            title: "Entry and placement controls",
            description: "These controls decide where the campaign comes from and how it stays connected to the launch posture around it.",
            items: [
              {
                label: "Open from Launch Workspace",
                meta: "Entry control",
                summary: "This matters because it carries project and readiness context into the builder instead of starting a detached create flow.",
              },
              {
                label: "Campaign goal and lane selection",
                meta: "Architecture control",
                summary: "These settings shape the mission map and determine what kinds of quest, raid and reward objects will make sense downstream.",
              },
              {
                label: "Return to launch posture",
                meta: "Loop control",
                summary: "After campaign edits, the system should route back into launch or campaign context so the team can re-read what changed in the wider stack.",
              },
            ],
          },
          {
            title: "Lifecycle and publication controls",
            description: "These controls are the difference between a campaign existing as draft structure and becoming a live part of the product.",
            items: [
              {
                label: "Publish and ready-state actions",
                meta: "State control",
                summary: "These actions move the campaign from preparation into live posture and should therefore stay auditable and explicit.",
              },
              {
                label: "Pause and archive",
                meta: "Containment control",
                summary: "These actions let a team contain launch risk or preserve history without destroying the campaign object outright.",
              },
              {
                label: "Duplicate and template actions",
                meta: "Acceleration control",
                summary: "These controls help teams reuse strong mission architecture without starting from scratch every time.",
              },
            ],
          },
          {
            title: "Downstream handoff controls",
            description: "Campaign Studio matters because it hands context into the rest of the builder family.",
            items: [
              {
                label: "Quest handoff",
                meta: "Builder control",
                summary: "Quest creation should inherit campaign placement so the mission feels like part of the architecture rather than a detached object.",
              },
              {
                label: "Reward framing",
                meta: "Incentive control",
                summary: "Reward posture belongs here because it changes the conversion and recognition logic of the campaign itself.",
              },
              {
                label: "Mission-map visibility",
                meta: "Interpretation control",
                summary: "Campaign controls are stronger when the system keeps the resulting mission structure visible instead of hiding it behind raw form state.",
              },
            ],
          },
        ],
      }}
      deepDive={{
        title: "How Campaign Studio actually works as a system layer",
        description:
          "Campaign Studio is strongest when the docs explain not only the builder layout, but also why campaign sits above quest, raid and reward depth inside the wider launch model.",
        sections: [
          {
            title: "Why campaign is the architecture layer",
            description: "Campaign exists so the system has a strategic parent object before it creates individual missions.",
            items: [
              {
                label: "Goal before object sprawl",
                meta: "Builder rule",
                summary:
                  "Campaign Studio starts from launch intent because later quest, raid and reward objects only make sense once the project has decided what the launch is trying to accomplish.",
              },
              {
                label: "Mission map before execution depth",
                meta: "Structure rule",
                summary:
                  "The campaign layer gives the product a place to show sequencing, pressure and reward posture before the team starts managing single mission surfaces one by one.",
              },
              {
                label: "Member path starts here",
                meta: "Journey consequence",
                summary:
                  "Campaign decisions matter because they shape what members later see as an ordered mission path rather than disconnected content objects.",
              },
            ],
          },
          {
            title: "How readiness influences the builder",
            description: "Campaign Studio is not separate from launch posture; it is one of the main ways launch readiness becomes real.",
            items: [
              {
                label: "Launch Workspace handoff",
                meta: "Project-first routing",
                summary:
                  "Projects should usually enter Campaign Studio from Launch Workspace or project context so the builder inherits the right readiness and operating state.",
              },
              {
                label: "Lifecycle-safe editing",
                meta: "State model",
                summary:
                  "Campaign actions follow the shared lifecycle posture, which keeps publication and activation readable instead of burying state changes in ad hoc toggles.",
              },
              {
                label: "Missing content still matters",
                meta: "Readiness pressure",
                summary:
                  "Campaigns can exist before quests, raids and rewards are ready, but the docs should explain that this still leaves the project in a warming-up or blocked posture depending on the rest of launch readiness.",
              },
            ],
          },
          {
            title: "Why rewards and quests are linked here",
            description: "Campaign Studio should make its downstream consequence obvious instead of forcing readers to infer it.",
            items: [
              {
                label: "Quests inherit placement",
                meta: "Builder handoff",
                summary:
                  "Quest Studio should receive project and campaign context so the quest reads as part of the campaign spine rather than a detached task.",
              },
              {
                label: "Rewards create conversion pressure",
                meta: "Incentive model",
                summary:
                  "Reward posture belongs inside campaign architecture because incentives help determine how the mission path converts and what later payout pressure might exist.",
              },
              {
                label: "Community OS is downstream",
                meta: "Execution loop",
                summary:
                  "Once the campaign is live, Community OS becomes the place where the project watches whether the architecture is actually creating movement.",
              },
            ],
          },
        ],
      }}
    />
  );
}
