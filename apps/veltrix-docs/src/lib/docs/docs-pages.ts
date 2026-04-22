export type DocsTrackId =
  | "overview"
  | "project-docs"
  | "operator-docs"
  | "reference"
  | "release-notes";

export type DocsPageStatus = "live" | "flagship" | "planned";

export type DocsPageKind = "surface" | "workflow" | "reference" | "timeline";

export type DocsPageLink = {
  href: string;
  label: string;
  summary: string;
  status: DocsPageStatus;
  kind: DocsPageKind;
};

export type DocsPageSection = {
  id: string;
  label: string;
  summary: string;
  items: DocsPageLink[];
};

export type DocsTrackDefinition = {
  id: DocsTrackId;
  href: string;
  label: string;
  summary: string;
  description: string;
  sections: DocsPageSection[];
};

export const docsTracks: DocsTrackDefinition[] = [
  {
    id: "overview",
    href: "/",
    label: "Overview",
    summary: "Start here for the full product system map.",
    description:
      "Land on the product, understand the full operating model and choose the track that matches the work you need to do next.",
    sections: [
      {
        id: "start-here",
        label: "Start here",
        summary: "Choose the right documentation lane before you go deeper.",
        items: [
          {
            href: "/project-docs",
            label: "Project Docs",
            summary: "Launch setup, studios, rewards, community execution and member flows.",
            status: "live",
            kind: "surface",
          },
          {
            href: "/operator-docs",
            label: "Operator Docs",
            summary: "Trust, payout, on-chain, escalations, analytics and operator workflows.",
            status: "live",
            kind: "surface",
          },
          {
            href: "/reference",
            label: "Reference",
            summary: "The exact system language for states, permissions, cases and commands.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/release-notes",
            label: "Release Notes",
            summary: "A public timeline of major product milestones and doc coverage growth.",
            status: "live",
            kind: "timeline",
          },
        ],
      },
    ],
  },
  {
    id: "project-docs",
    href: "/project-docs",
    label: "Project Docs",
    summary: "Public docs for launch, growth and community teams.",
    description:
      "This track explains how projects use Veltrix to set up launches, build missions, operate communities and guide members through the system.",
    sections: [
      {
        id: "launch-and-build",
        label: "Launch and build",
        summary: "The core build surfaces teams use to structure a launch before it goes live.",
        items: [
          {
            href: "/project-docs/launch-workspace",
            label: "Launch Workspace",
            summary: "The project launch hub for readiness, sequencing and builder entry points.",
            status: "live",
            kind: "surface",
          },
          {
            href: "/project-docs/campaign-studio",
            label: "Campaign Studio",
            summary: "Storyboard-first campaign architecture for goals, missions, rewards and launch posture.",
            status: "flagship",
            kind: "surface",
          },
          {
            href: "/project-docs/quest-studio",
            label: "Quest Studio",
            summary: "Guided experience builder for actions, verification, rewards and member view.",
            status: "flagship",
            kind: "surface",
          },
          {
            href: "/project-docs/raid-studio",
            label: "Raid Studio",
            summary: "Project-safe raid building with cadence, channel posture and execution details.",
            status: "live",
            kind: "surface",
          },
          {
            href: "/project-docs/rewards",
            label: "Rewards",
            summary: "How reward configuration, inventory and claim posture connect to launch flows.",
            status: "live",
            kind: "workflow",
          },
        ],
      },
      {
        id: "operate-and-engage",
        label: "Operate and engage",
        summary: "The community, member and command surfaces that keep the launch moving after creation.",
        items: [
          {
            href: "/project-docs/community-os",
            label: "Community OS",
            summary: "Owner and captain operations, automations, cohorts, health and outcome visibility.",
            status: "flagship",
            kind: "surface",
          },
          {
            href: "/project-docs/member-journey",
            label: "Member Journey",
            summary: "How onboarding, comeback, recognition and mission flows read from the member side.",
            status: "live",
            kind: "workflow",
          },
          {
            href: "/project-docs/bot-commands",
            label: "Bot Commands",
            summary: "Project-facing command posture across Discord and Telegram with deep-link behavior.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/project-docs/integrations",
            label: "Integrations",
            summary: "Connected surfaces for providers, social verification, wallets and delivery rails.",
            status: "live",
            kind: "workflow",
          },
          {
            href: "/project-docs/project-settings",
            label: "Project Settings",
            summary: "Workspace-level settings, team permissions, billing and launch posture controls.",
            status: "live",
            kind: "surface",
          },
        ],
      },
    ],
  },
  {
    id: "operator-docs",
    href: "/operator-docs",
    label: "Operator Docs",
    summary: "Public docs for trust, payout, on-chain and support operations.",
    description:
      "This track explains the case-driven consoles, escalation rails, runbooks and recovery loops that support the full Veltrix system.",
    sections: [
      {
        id: "safety-consoles",
        label: "Safety consoles",
        summary: "The operator workspaces that handle risk, delivery safety and chain-side recovery.",
        items: [
          {
            href: "/operator-docs/trust-console",
            label: "Trust Console",
            summary: "Permissioned trust review with investigations, escalations, project grants and timelines.",
            status: "flagship",
            kind: "surface",
          },
          {
            href: "/operator-docs/payout-console",
            label: "Payout Console",
            summary: "Claim, dispute and payout resolution coverage with internal and project-facing rails.",
            status: "flagship",
            kind: "surface",
          },
          {
            href: "/operator-docs/onchain-console",
            label: "On-chain Console",
            summary: "Ingress, enrichment, signals and project-safe recovery actions for on-chain operations.",
            status: "flagship",
            kind: "surface",
          },
        ],
      },
      {
        id: "resolution-and-support",
        label: "Resolution and support",
        summary: "The operator follow-through around queues, escalations, health and incident handling.",
        items: [
          {
            href: "/operator-docs/claims-and-resolution",
            label: "Claims and Resolution",
            summary: "How claim queues, disputes and resolution logs connect across internal and project rails.",
            status: "live",
            kind: "workflow",
          },
          {
            href: "/operator-docs/escalations",
            label: "Escalations",
            summary: "Named ownership, waiting states and cross-console follow-through across the platform.",
            status: "live",
            kind: "workflow",
          },
          {
            href: "/operator-docs/overview-and-analytics",
            label: "Overview and Analytics",
            summary: "Launch health, metric snapshots, incident pressure and operator-grade outcome views.",
            status: "live",
            kind: "surface",
          },
          {
            href: "/operator-docs/runbooks",
            label: "Runbooks",
            summary: "The operating playbooks for incidents, recovery flows and deploy hygiene.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/operator-docs/incident-handling",
            label: "Incident Handling",
            summary: "How teams move from signal to case to resolution without losing context or auditability.",
            status: "live",
            kind: "workflow",
          },
        ],
      },
    ],
  },
  {
    id: "reference",
    href: "/reference",
    label: "Reference",
    summary: "Exact lifecycle, permission and case-model pages.",
    description:
      "Reference is the exact layer of the docs product. It explains the language and rules that every other page depends on.",
    sections: [
      {
        id: "core-system",
        label: "Core system",
        summary: "Shared system vocabulary used across launch, community, member and operator surfaces.",
        items: [
          {
            href: "/reference/lifecycle-states",
            label: "Lifecycle States",
            summary: "Draft, ready, live, paused, archived and the exact posture around state transitions.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/reference/permissions",
            label: "Permissions",
            summary: "Visibility and action grants across project teams, captains and operators.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/reference/status-labels",
            label: "Status Labels",
            summary: "The display language for readiness, waiting states, incident posture and resolution flow.",
            status: "live",
            kind: "reference",
          },
        ],
      },
      {
        id: "safety-models",
        label: "Safety models",
        summary: "The exact case types and operating language for trust, payout and on-chain workflows.",
        items: [
          {
            href: "/reference/trust-case-types",
            label: "Trust Case Types",
            summary: "The trust review case taxonomy used in the internal and project trust consoles.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/reference/payout-case-types",
            label: "Payout Case Types",
            summary: "The payout and claim safety case taxonomy for delivery, disputes and inventory pressure.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/reference/onchain-case-types",
            label: "On-chain Case Types",
            summary: "The case taxonomy for ingress, enrichment, provider sync and chain-side anomaly review.",
            status: "live",
            kind: "reference",
          },
        ],
      },
      {
        id: "execution-rails",
        label: "Execution rails",
        summary: "The exact models behind automations, bots and system-triggered follow-through.",
        items: [
          {
            href: "/reference/automation-types",
            label: "Automation Types",
            summary: "The automation rails behind community follow-through, timing and bot-driven actions.",
            status: "live",
            kind: "reference",
          },
          {
            href: "/reference/bot-commands",
            label: "Bot Commands",
            summary: "The shared command dictionary for Discord and Telegram mission, profile and captain rails.",
            status: "live",
            kind: "reference",
          },
        ],
      },
    ],
  },
  {
    id: "release-notes",
    href: "/release-notes",
    label: "Release Notes",
    summary: "Track meaningful product evolution over time.",
    description:
      "This lane records the major Veltrix milestones and gives the docs product a living history from public launch onward.",
    sections: [
      {
        id: "launch-milestones",
        label: "Launch milestones",
        summary: "The platform arcs that made Veltrix public-launch ready.",
        items: [
          {
            href: "/release-notes/public-launch",
            label: "Public Launch Baseline",
            summary: "The first public docs-aware milestone across portal, webapp, bots and support surfaces.",
            status: "live",
            kind: "timeline",
          },
          {
            href: "/release-notes/platform-phases",
            label: "Platform Phases 1-8",
            summary: "A structured read of the platform hardening, studios, community, safety and launch work.",
            status: "live",
            kind: "timeline",
          },
        ],
      },
    ],
  },
];

export const docsAllLinks = docsTracks.flatMap((track) => track.sections.flatMap((section) => section.items));
