import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function CommunityOsDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Project Docs"
      title="Community OS documents the daily operating layer after the launch is already moving."
      description="This page explains how owners and captains use Community OS to run automations, coordinate missions, inspect cohorts, watch health and keep community execution accountable."
      actions={[
        { href: "/project-docs", label: "Back to Project Docs" },
        { href: "/reference", label: "Open Reference" },
      ]}
      chips={["Flagship page", "Owner and captain modes", "Community execution"]}
      relatedHrefs={[
        "/project-docs",
        "/operator-docs",
        "/reference",
        "/reference/permissions",
        "/reference/automation-types",
        "/reference/community-and-member-signal-model",
        "/reference/builder-and-handoff-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Primary users</p>
          <h2 className="text-2xl font-black text-white">Owners, community leads and captains.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Community OS is where launch energy turns into everyday operating rhythm, not just a campaign setup afterthought.
          </p>
        </div>
      }
      snapshotSlug="community-os"
      stateExplorerSlug="community-signals"
      whatItIs={{
        description:
          "Community OS is the project-facing workspace for day-to-day execution. It is where owner posture, captain posture, automations, command rails and health signals live together.",
        bullets: [
          "Owner and captain modes are intentionally separated so strategic visibility does not blur into daily action work.",
          "Automations, commands, cohorts and health live inside the same operating surface instead of scattered admin pages.",
          "The page keeps community execution tied to measurable signals rather than pure task lists.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "Projects do not stop needing structure once the launch goes live. Community OS gives that ongoing operating layer a real home.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "Community OS is a project-private workspace rather than a global dashboard.",
        items: [
          {
            label: "Primary route",
            meta: "/projects/<id>/community",
            summary: "The main project-side community workspace for owners, captains and community operators.",
          },
          {
            label: "Connected surfaces",
            summary: "Bot commands, launch workspace, member journey and project settings all feed context into this operating surface.",
          },
          {
            label: "Permissions posture",
            summary: "Owner and captain rails follow explicit scopes so operational responsibility stays clear.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Owner and captain separation",
            meta: "Operating rule",
            summary: "The surface should explain strategic ownership and daily action ownership as related but distinct layers.",
          },
          {
            label: "Automations stay visible",
            meta: "Execution rule",
            summary: "Automation posture belongs in the same workspace as commands, cohorts and health, not in a hidden sub-tool.",
          },
          {
            label: "Signals drive action",
            meta: "Outcome rule",
            summary: "The page should keep health, cohorts and activation pressure tied to next actions rather than passive reporting.",
          },
        ],
      }}
      deepDive={{
        title: "How Community OS turns launch structure into daily movement",
        description:
          "Community OS should be documented as a loop between owner posture, captain execution, command rails and member-facing response, not as a static admin dashboard.",
        sections: [
          {
            title: "Why owner and captain are separate",
            description: "The split is a product design choice, not an arbitrary permission detail.",
            items: [
              {
                label: "Owner mode",
                meta: "Strategic posture",
                summary:
                  "Owner posture is where the project reads health, cohorts, automations and next action pressure before deciding what the community needs now.",
              },
              {
                label: "Captain mode",
                meta: "Execution posture",
                summary:
                  "Captain posture exists so live community action remains bounded, accountable and distinct from the broader decision rights the owner holds.",
              },
              {
                label: "Permission split matters",
                meta: "Role model",
                summary:
                  "The docs should show that this role separation is what keeps community execution coherent once launches become busy and multi-person.",
              },
            ],
          },
          {
            title: "Why commands and automations belong here",
            description: "These are not side tools; they are part of the operating model.",
            items: [
              {
                label: "Commands as delivery rails",
                meta: "Activation layer",
                summary:
                  "Discord and Telegram commands carry community and mission posture into live chat surfaces, which is why they belong inside Community OS documentation.",
              },
              {
                label: "Automations as operating rhythm",
                meta: "Cadence layer",
                summary:
                  "Automations give the project repeatable follow-through on reminders, activations and upkeep instead of relying on manual community hustle alone.",
              },
              {
                label: "Health signals create next actions",
                meta: "Outcome layer",
                summary:
                  "Cohorts, activation trends and community health only matter because they tell the owner or captain what to do next.",
              },
            ],
          },
          {
            title: "Why this page connects to the member journey",
            description: "The docs should always close the loop from community work back into member behavior.",
            items: [
              {
                label: "Member response is the proof",
                meta: "Feedback loop",
                summary:
                  "Onboarding progress, comeback motion, recognition and mission completion are how the project learns whether community work is actually doing something useful.",
              },
              {
                label: "Commands change the journey",
                meta: "Chat-to-product flow",
                summary:
                  "Commands and community prompts can route members into their next mission, reward or profile surface, which is why Community OS has direct consequence inside the webapp.",
              },
              {
                label: "Builders feed this layer",
                meta: "System loop",
                summary:
                  "Campaigns, quests, raids and rewards create the content and incentives that Community OS later operationalizes and measures.",
              },
            ],
          },
        ],
      }}
    />
  );
}
