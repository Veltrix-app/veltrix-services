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
      stateExplorerSlug="permissions"
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
    />
  );
}
