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
        { href: "/reference/command-and-automation-controls", label: "Delivery Controls" },
      ]}
      chips={["Flagship page", "Owner and captain modes", "Community execution"]}
      relatedHrefs={[
        "/project-docs",
        "/operator-docs",
        "/reference",
        "/reference/visibility-and-grant-controls",
        "/reference/command-and-automation-controls",
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
      controlAtlas={{
        title: "The controls that matter most inside Community OS",
        description:
          "Community OS is a dense operating surface, but the most important controls cluster around role posture, delivery rails and signal-driven follow-through.",
        sections: [
          {
            title: "Role and scope controls",
            description: "These controls determine who is deciding, who is executing and how much authority each lane carries.",
            items: [
              {
                label: "Owner versus captain mode",
                meta: "Role control",
                summary: "This is one of the core Community OS controls because it changes the level of visibility, accountability and decision posture on the page.",
              },
              {
                label: "Captain permissions and seats",
                meta: "Scope control",
                summary: "Seat-based controls matter because they keep community execution bounded instead of turning every teammate into a full operator.",
              },
              {
                label: "Project-level visibility settings",
                meta: "Governance control",
                summary: "These controls shape which team members can inspect community health, commands and operational context at all.",
              },
            ],
          },
          {
            title: "Command and automation controls",
            description: "These are the delivery rails that turn owner intent into recurring or chat-based execution.",
            items: [
              {
                label: "Command family toggles",
                meta: "Delivery control",
                summary: "Command controls decide which member and captain rails exist for the project and therefore how the community experiences the operating system in chat.",
              },
              {
                label: "Automation cadence and enablement",
                meta: "Cadence control",
                summary: "Automation settings matter because they determine whether follow-through happens manually or through a timed system rail.",
              },
              {
                label: "Deep-link handoffs",
                meta: "Routing control",
                summary: "Community controls are stronger when command or automation outputs route people back into the right member or project surface with context preserved.",
              },
            ],
          },
          {
            title: "Signal and action controls",
            description: "Community OS should help teams interpret health and decide what to do next, not only report numbers.",
            items: [
              {
                label: "Cohort and health views",
                meta: "Signal control",
                summary: "These controls shape what pressure the team notices first and which member groups should receive attention next.",
              },
              {
                label: "Captain action accountability",
                meta: "Execution control",
                summary: "Community OS needs visible action ownership so the system can explain what work is already in motion and what still needs pickup.",
              },
              {
                label: "Escalation into wider support rails",
                meta: "Cross-system control",
                summary: "When community work exposes trust, payout or incident pressure, the operating surface should help teams hand that work into the right console cleanly.",
              },
            ],
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
      playbookExamples={{
        title: "Community OS playbook examples",
        description: "These examples show how Community OS should speak when a team has no operating rhythm yet, needs a clear next action or is drifting into weak follow-through.",
        items: [
          {
            label: "No live community rhythm",
            meta: "Empty state",
            trigger: "Shown when campaigns or quests exist but commands, automations or captain follow-through are not yet configured.",
            copy: "No community operating rhythm yet. Enable a command or automation rail before expecting this project to sustain launch momentum.",
            outcome: "The empty state should make it clear that Community OS exists to operationalize the launch, not just report on it.",
          },
          {
            label: "Open automation center",
            meta: "Primary CTA",
            trigger: "Shown when owner posture is healthy enough to move from passive observation into repeatable execution.",
            copy: "Open automation center",
            outcome: "This action helps the page route owners toward systemized follow-through instead of manual community hustle.",
          },
          {
            label: "Captain coverage warning",
            meta: "Warning copy",
            trigger: "Shown when the project is asking captains to execute recurring work without enough seat coverage or clear accountability.",
            copy: "Captain execution is expected here, but coverage is still thin. Assign seats or narrow the live command rail before pressure builds.",
            outcome: "The warning should read like an operating caution tied to accountability, not a generic permission issue.",
          },
        ],
      }}
    />
  );
}
