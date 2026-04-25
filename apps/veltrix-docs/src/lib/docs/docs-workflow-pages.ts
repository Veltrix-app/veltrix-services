type DocsWorkflowState = {
  label: string;
  summary: string;
  bullets: string[];
  note?: string;
};

type DocsWorkflowEntry = {
  label: string;
  summary: string;
  meta?: string;
};

type DocsWorkflowSection = {
  title: string;
  description?: string;
  items: DocsWorkflowEntry[];
};

type DocsWorkflowDefinition = {
  track: "project-docs" | "operator-docs";
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
  actions: Array<{
    href: string;
    label: string;
  }>;
  relatedHrefs: string[];
  rail: {
    eyebrow: string;
    title: string;
    body: string;
  };
  outcome: {
    title: string;
    description: string;
    bullets: string[];
    asideTitle: string;
    asideBody: string;
  };
  involvedSurfaces: {
    title: string;
    description?: string;
    items: DocsWorkflowEntry[];
  };
  stepFlow: {
    title: string;
    description?: string;
    states: DocsWorkflowState[];
  };
  handoffs: {
    title: string;
    description?: string;
    items: DocsWorkflowEntry[];
  };
  keyRules: {
    title: string;
    description?: string;
    items: DocsWorkflowEntry[];
  };
  deepDive?: {
    title: string;
    description?: string;
    sections: DocsWorkflowSection[];
  };
};

const docsWorkflowPages: DocsWorkflowDefinition[] = [
  {
    track: "project-docs",
    slug: "launch-a-project",
    eyebrow: "Project Docs Workflow",
    title: "Launch a project in VYNTRO without losing sequencing, readiness or builder context.",
    description:
      "This workflow explains how a project moves from first launch posture into the right builders, then back into one readable launch operating state instead of getting lost across routes.",
    chips: ["Workflow", "Launch setup", "Project-first"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/project-docs/launch-workspace", label: "Open Launch Workspace" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/launch-workspace",
      "/project-docs/campaign-studio",
      "/project-docs/quest-studio",
      "/project-docs/raid-studio",
      "/project-docs/rewards",
      "/reference/lifecycle-states",
      "/reference/launch-and-readiness-model",
      "/reference/builder-and-handoff-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Founders and launch operators.",
      body: "This workflow is for teams that need to understand the best order of operations before a launch is public-facing.",
    },
    outcome: {
      title: "What this workflow achieves",
      description:
        "A good project launch flow should leave the team with a ready project posture, the right first campaign objects and a single place to judge what is still missing.",
      bullets: [
        "It starts from project context rather than detached builder routes.",
        "It uses Launch Workspace as the sequencing hub instead of relying on memory.",
        "It returns the team to readiness after each builder step so launch posture stays visible.",
      ],
      asideTitle: "Why it matters",
      asideBody:
        "The launch flow is one of the first places teams decide whether the product feels coherent or scattered. Good docs need to make the order of operations obvious.",
    },
    involvedSurfaces: {
      title: "Involved surfaces",
      description: "These are the main surfaces a project touches while moving through the launch setup sequence.",
      items: [
        {
          label: "Launch Workspace",
          meta: "Project hub",
          summary: "The main readiness, checklist and builder handoff surface.",
        },
        {
          label: "Campaign Studio",
          meta: "Mission architecture",
          summary: "Where the team frames the goal and campaign structure before quests or raids multiply.",
        },
        {
          label: "Quest Studio, Raid Studio and Rewards",
          meta: "Build layer",
          summary: "The creation surfaces that fill in the launch plan with concrete member-facing objects.",
        },
      ],
    },
    stepFlow: {
      title: "Launch sequence",
      description: "This is the cleanest path from empty project context into a launch-ready setup posture.",
      states: [
        {
          label: "Open Launch Workspace",
          summary: "Start in the project launch hub so the system can show readiness and missing pieces first.",
          bullets: [
            "The team sees what is already ready and what still blocks launch.",
            "Starter packs and builder actions are easier to understand from project context.",
            "This is the best first step for teams that do not yet know the route structure.",
          ],
        },
        {
          label: "Shape the campaign layer",
          summary: "Campaign Studio should usually be the first builder, because it creates the mission structure other objects depend on.",
          bullets: [
            "The campaign defines goal posture before isolated quests or raids appear.",
            "It gives rewards and launch sequencing a stronger frame.",
            "The workflow stays strategy-first instead of object-first.",
          ],
        },
        {
          label: "Fill in missions and incentives",
          summary: "Quest, raid and reward builders fill the launch architecture with specific actions and incentives.",
          bullets: [
            "Project context should carry into every builder automatically.",
            "The team should understand why each object exists inside the wider launch.",
            "Reward and raid decisions should stay connected to readiness, not happen in isolation.",
          ],
        },
        {
          label: "Return to readiness",
          summary: "After each creation step, the team should come back to one launch view that updates what is still missing.",
          bullets: [
            "This keeps sequencing visible and avoids route sprawl.",
            "Readiness pressure belongs in the launch layer, not hidden inside forms.",
            "The launch workflow ends when the workspace reads as intentionally ready, not when the team is merely done clicking.",
          ],
        },
      ],
    },
    handoffs: {
      title: "Key handoffs",
      description: "These handoffs keep the launch flow feeling like one system instead of multiple tools.",
      items: [
        {
          label: "Launch Workspace to builders",
          meta: "Navigation handoff",
          summary: "Entry into Campaign, Quest, Raid and Reward surfaces should preserve project context automatically.",
        },
        {
          label: "Builders back to readiness",
          meta: "State handoff",
          summary: "The launch view should reflect progress so teams can see whether the project is getting safer to launch.",
        },
        {
          label: "Launch into community operation",
          meta: "Execution handoff",
          summary: "Once setup is stable, the project should move into Community OS and member-facing execution rather than stay stuck in builder mode.",
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Always start from project context",
          meta: "Flow rule",
          summary: "Launch sequencing is easiest to understand when it begins from Launch Workspace instead of detached creation routes.",
        },
        {
          label: "Campaign before fragmentation",
          meta: "Architecture rule",
          summary: "Campaign structure should usually come before a long tail of quests, raids and rewards.",
        },
        {
          label: "Readiness is the final checkpoint",
          meta: "Launch rule",
          summary: "The workflow ends when the launch hub shows a stable posture, not simply when content objects exist.",
        },
      ],
    },
    deepDive: {
      title: "Why the launch workflow starts from readiness, not from a random create button.",
      description:
        "Launch is an operating sequence, not just a collection of creation routes. This deeper model explains why the product starts with posture, then architecture, then supporting objects.",
      sections: [
        {
          title: "Readiness should lead builder choice",
          description: "Teams make better launch decisions when the system first shows what is missing rather than asking them to guess where to start.",
          items: [
            {
              label: "The workspace surfaces structural gaps",
              meta: "Launch model",
              summary: "Readiness should reflect whether the project already has enough architecture, execution and incentive coverage to support a real public launch.",
            },
            {
              label: "Missing context is the biggest early risk",
              meta: "Risk model",
              summary: "Without a launch hub, projects often create isolated objects that later need to be stitched back into a coherent system.",
            },
            {
              label: "The docs should preserve sequence",
              meta: "Docs rule",
              summary: "A workflow page should help teams understand why the first move is what it is, not just what routes exist.",
            },
          ],
        },
        {
          title: "Campaign comes before content sprawl",
          description: "The workflow gives Campaign Studio priority because campaigns define the frame other builders inherit.",
          items: [
            {
              label: "Architecture precedes objects",
              meta: "Builder model",
              summary: "A strong campaign reduces the chance that quests, raids and rewards become disconnected pieces that confuse members later.",
            },
            {
              label: "Handoffs should preserve meaning",
              meta: "System rule",
              summary: "When supporting builders inherit project and campaign context, the launch plan stays legible across routes.",
            },
            {
              label: "This is why launch is project-first",
              meta: "Navigation rule",
              summary: "The workflow intentionally favors project-driven handoffs over detached object creation.",
            },
          ],
        },
        {
          title: "Launch should resolve into operations",
          description: "The workflow is complete only when the project can leave setup mode and move into live community and member-facing execution.",
          items: [
            {
              label: "Readiness must return after each step",
              meta: "Feedback model",
              summary: "The team should always be able to re-read launch posture after creating a new campaign, quest, raid or reward.",
            },
            {
              label: "Community and member layers are downstream",
              meta: "Execution model",
              summary: "Launch is not just creation; it is the setup that makes Community OS and Member Journey feel coherent once the system goes live.",
            },
            {
              label: "The docs should end on live posture",
              meta: "Outcome rule",
              summary: "A launch workflow should conclude with a credible operating state, not merely a set of published objects.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "build-a-campaign",
    eyebrow: "Project Docs Workflow",
    title: "Build a campaign by moving from goal to mission map to member-facing execution.",
    description:
      "This workflow explains how a project should use Campaign Studio and the connected builders to turn intent into an actual campaign structure that members can move through.",
    chips: ["Workflow", "Campaign build", "Mission architecture"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/project-docs/campaign-studio", label: "Open Campaign Studio" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/campaign-studio",
      "/project-docs/quest-studio",
      "/project-docs/rewards",
      "/project-docs/member-journey",
      "/reference/lifecycle-states",
      "/reference/builder-and-handoff-model",
      "/reference/verification-and-reward-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Growth leads and mission designers.",
      body: "This workflow is for teams shaping a campaign that should read clearly both inside the builder and from the member side later.",
    },
    outcome: {
      title: "What this workflow achieves",
      description:
        "A good campaign flow produces a structured mission path, clear supporting quest and reward objects, and a campaign that still feels legible after it goes live.",
      bullets: [
        "It frames the goal before deep configuration takes over.",
        "It keeps quests and rewards subordinate to one campaign architecture.",
        "It preserves the member-facing consequences of each campaign design choice.",
      ],
      asideTitle: "Why it matters",
      asideBody:
        "Campaigns are where strategy becomes structure. Without a clear workflow here, teams end up with content objects that exist but do not form a strong member journey.",
    },
    involvedSurfaces: {
      title: "Involved surfaces",
      items: [
        {
          label: "Campaign Studio",
          meta: "Primary builder",
          summary: "The storyboard-first surface that defines goals, mission posture and launch framing.",
        },
        {
          label: "Quest Studio",
          meta: "Mission builder",
          summary: "Used to fill the campaign with the actual member actions the strategy requires.",
        },
        {
          label: "Rewards and Member Journey",
          meta: "Experience layer",
          summary: "The downstream surfaces that ensure the campaign design translates into motivation and clarity for members.",
        },
      ],
    },
    stepFlow: {
      title: "Campaign build sequence",
      states: [
        {
          label: "Set the campaign goal",
          summary: "The first move is defining what the campaign is trying to achieve before any quest details appear.",
          bullets: [
            "The campaign goal should explain the mission architecture that follows.",
            "This is the moment to decide whether the campaign is growth, activation, on-chain or reactivation focused.",
            "The docs should keep this step clearly strategic rather than form-heavy.",
          ],
        },
        {
          label: "Map the mission structure",
          summary: "Campaign Studio turns the goal into a mission path, showing how different actions and incentives connect.",
          bullets: [
            "The campaign should read as a sequence or system, not as a bag of unrelated tasks.",
            "The mission map helps teams reason about pressure, progression and reward posture.",
            "This is why Campaign Studio is storyboard-first in the docs.",
          ],
        },
        {
          label: "Add supporting quest and reward objects",
          summary: "Quest and reward builders fill in the parts of the campaign members will actually experience.",
          bullets: [
            "These objects should inherit their place in the campaign rather than being created in a vacuum.",
            "The campaign should still feel coherent after the supporting content is added.",
            "Reward logic matters because it changes campaign motivation, not just claim behavior.",
          ],
        },
        {
          label: "Review the member-facing outcome",
          summary: "The final check is whether the campaign will read clearly from the member side, not just the admin side.",
          bullets: [
            "A campaign should create an understandable member path.",
            "Mission structure should lead cleanly into onboarding, missions and reward flows.",
            "This is where the docs bridge campaign architecture to member journey context.",
          ],
        },
      ],
    },
    handoffs: {
      title: "Key handoffs",
      items: [
        {
          label: "Campaign Studio to Quest Studio",
          meta: "Builder handoff",
          summary: "Quest creation should inherit project and campaign context so the campaign remains the parent structure.",
        },
        {
          label: "Campaign design to rewards",
          meta: "Incentive handoff",
          summary: "Rewards need to reinforce campaign goals instead of feeling like detached perks.",
        },
        {
          label: "Campaign architecture to member journey",
          meta: "Experience handoff",
          summary: "Member-facing routes should reflect the structure designed in the campaign layer.",
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Goal first, fields later",
          meta: "Design rule",
          summary: "Campaigns should begin with intent and structure before deeper admin configuration enters the flow.",
        },
        {
          label: "Supporting objects stay subordinate",
          meta: "Architecture rule",
          summary: "Quests and rewards should reinforce the campaign structure rather than compete with it.",
        },
        {
          label: "Member clarity is the final test",
          meta: "Journey rule",
          summary: "A campaign is only strong if the resulting member path feels coherent, not just configurable.",
        },
      ],
    },
    deepDive: {
      title: "Why campaign building is documented as a goal-to-journey system instead of a one-page create flow.",
      description:
        "Campaigns matter because they shape the architecture that quests, rewards and the member journey later inherit. This deeper layer explains those dependencies explicitly.",
      sections: [
        {
          title: "Campaigns turn strategy into structure",
          description: "The campaign layer exists so projects can reason about progression, pressure and outcome before creating support objects.",
          items: [
            {
              label: "Goal posture determines the mission map",
              meta: "Strategy model",
              summary: "Growth, activation, comeback and on-chain goals should lead to different campaign shapes, which is why the docs start with intent rather than fields.",
            },
            {
              label: "Structure protects clarity",
              meta: "Architecture rule",
              summary: "Campaign documentation should keep the reader aware that coherence is more valuable than a long list of configurable objects.",
            },
            {
              label: "Storyboard-first is intentional",
              meta: "Builder rule",
              summary: "The product uses a storyboard-style campaign surface because the system benefits when teams can see the shape of the journey they are building.",
            },
          ],
        },
        {
          title: "Supporting objects should inherit their place",
          description: "Quest and reward flows make more sense when they enter as children of a campaign rather than standalone artifacts.",
          items: [
            {
              label: "Quest context should not be re-explained manually",
              meta: "Handoff model",
              summary: "The workflow should show that builders inherit project and campaign context so teams do not need to restate why a quest exists.",
            },
            {
              label: "Rewards should reinforce the map",
              meta: "Incentive model",
              summary: "Campaign documentation should explain how incentive placement either strengthens or weakens the mission architecture.",
            },
            {
              label: "The campaign remains the parent surface",
              meta: "System rule",
              summary: "Even after supporting objects are added, the campaign should stay readable as the primary framing layer.",
            },
          ],
        },
        {
          title: "Member clarity is the final validation layer",
          description: "The campaign is only successful if the member-facing experience feels as coherent as the builder did.",
          items: [
            {
              label: "Journey fit should be visible",
              meta: "Experience model",
              summary: "Projects need to understand how the campaign structure translates into missions, recognition and reward posture for actual members.",
            },
            {
              label: "Campaigns should close the loop",
              meta: "Outcome rule",
              summary: "This workflow should teach that member comprehension and momentum are the real test of campaign quality.",
            },
            {
              label: "Docs should connect across tracks",
              meta: "Docs rule",
              summary: "A strong campaign page points naturally into Member Journey and reward safety explanations rather than stopping at the builder.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "run-community-operations",
    eyebrow: "Project Docs Workflow",
    title: "Run community operations by moving from owner posture into captain execution and member follow-through.",
    description:
      "This workflow explains how projects should use Community OS, commands, integrations and member-facing signals together after a launch is already moving.",
    chips: ["Workflow", "Community operations", "Execution"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/project-docs/community-os", label: "Open Community OS" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/community-os",
      "/project-docs/bot-commands",
      "/project-docs/integrations",
      "/project-docs/member-journey",
      "/reference/bot-commands",
      "/reference/community-and-member-signal-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Community leads, captains and owners.",
      body: "This workflow is for the day-to-day operating layer after launch setup has already turned into live community work.",
    },
    outcome: {
      title: "What this workflow achieves",
      description:
        "A good community-operations workflow keeps owner visibility, captain execution and member-facing movement aligned instead of fragmenting into separate dashboards and chats.",
      bullets: [
        "It separates owner posture from captain action without disconnecting them.",
        "It keeps commands, automations and cohort health in the same operating model.",
        "It makes member movement visible so community actions feel tied to outcomes.",
      ],
      asideTitle: "Why it matters",
      asideBody:
        "Community work becomes noisy quickly. The docs need a clear workflow that shows how the system keeps that work structured and accountable.",
    },
    involvedSurfaces: {
      title: "Involved surfaces",
      items: [
        {
          label: "Community OS",
          meta: "Primary workspace",
          summary: "The owner and captain operating surface for health, automations, cohorts and command posture.",
        },
        {
          label: "Bot Commands and Integrations",
          meta: "Activation rails",
          summary: "The delivery layer that turns operating intent into action across Discord, Telegram and connected systems.",
        },
        {
          label: "Member Journey",
          meta: "Outcome layer",
          summary: "The member-facing lane that shows whether community actions are actually changing behavior.",
        },
      ],
    },
    stepFlow: {
      title: "Community operations sequence",
      states: [
        {
          label: "Read owner posture",
          summary: "Start with the owner view so the team understands health, pressure and the next important operating move.",
          bullets: [
            "Owner posture should frame the work before captains start acting.",
            "This is where automations, cohorts and outcome pressure become legible.",
            "The docs should explain owner mode as a decision layer, not just a dashboard.",
          ],
        },
        {
          label: "Move into captain execution",
          summary: "Captain mode turns operating intent into assigned action and accountable follow-through.",
          bullets: [
            "Seat-based permissions keep execution bounded.",
            "The system should make it visible who is acting and what they are responsible for.",
            "This prevents Community OS from collapsing into one undifferentiated team view.",
          ],
        },
        {
          label: "Use commands and integrations",
          summary: "Activation should move through command rails and connected integrations instead of manual improvisation.",
          bullets: [
            "Commands are part of the community operating model, not a side utility.",
            "Integrations carry verification, delivery and community motion into the member experience.",
            "The docs should keep these surfaces connected to Community OS decisions.",
          ],
        },
        {
          label: "Read the member outcome",
          summary: "The workflow ends by checking whether the community operations are changing member behavior and journey state.",
          bullets: [
            "Member Journey surfaces show whether onboarding, comeback and missions are actually moving.",
            "This closes the loop between owner strategy and community action.",
            "The docs should make this feedback loop feel central, not optional.",
          ],
        },
      ],
    },
    handoffs: {
      title: "Key handoffs",
      items: [
        {
          label: "Owner to captain",
          meta: "Execution handoff",
          summary: "Owner posture should translate into captain work with explicit scope and accountability.",
        },
        {
          label: "Community OS to command rails",
          meta: "Activation handoff",
          summary: "Commands and automations should extend community operating decisions rather than exist as detached tools.",
        },
        {
          label: "Community action to member outcome",
          meta: "Feedback handoff",
          summary: "Projects need to read the effect of their community operations in the member-facing product layer.",
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Owner and captain roles stay distinct",
          meta: "Operations rule",
          summary: "Community OS should document the difference between deciding what matters and carrying out the work.",
        },
        {
          label: "Commands are part of the workflow",
          meta: "Activation rule",
          summary: "Command rails belong inside community operations documentation, not outside it.",
        },
        {
          label: "Outcome closes the loop",
          meta: "Journey rule",
          summary: "A community workflow is not complete until the docs show how member behavior and status respond.",
        },
      ],
    },
    deepDive: {
      title: "Why community operations are documented as a feedback loop between owner posture, captain execution and member response.",
      description:
        "Community work is only coherent when decisions, command delivery and member outcomes keep informing one another. This deeper model explains that loop.",
      sections: [
        {
          title: "Owner posture frames the operating week",
          description: "The community workflow begins with the owner view because someone has to decide what matters before tasks get distributed.",
          items: [
            {
              label: "Health and cohorts provide context",
              meta: "Decision model",
              summary: "Owner posture should explain where the community needs pressure, rescue or reactivation instead of only showing recent activity.",
            },
            {
              label: "Automations are part of strategy",
              meta: "Operating model",
              summary: "The docs should explain automations as extensions of owner intent, not as a disconnected utility layer.",
            },
            {
              label: "The product separates decide and execute",
              meta: "Role model",
              summary: "Owner and captain views exist separately because deciding what matters is not the same job as carrying it out.",
            },
          ],
        },
        {
          title: "Commands and integrations are the delivery rails",
          description: "Once the operating posture is clear, the community system pushes that intent through bots and connected surfaces.",
          items: [
            {
              label: "Commands are not side utilities",
              meta: "Activation rule",
              summary: "The workflow should teach that bot commands are one of the main ways community operations turn into member-visible action.",
            },
            {
              label: "Integrations create the proof and sync layer",
              meta: "System dependency",
              summary: "Connected systems influence what can be verified, delivered or measured when the community team acts.",
            },
            {
              label: "Captain accountability stays visible",
              meta: "Execution rule",
              summary: "Projects should understand how assigned action and seat-based scope keep the delivery rails trustworthy.",
            },
          ],
        },
        {
          title: "Member response closes the system loop",
          description: "Community operations only make sense if the project can see the effect on actual member movement.",
          items: [
            {
              label: "Mission and comeback posture respond",
              meta: "Journey model",
              summary: "The member-facing product should visibly change when community operations are doing a good job of pushing members forward or bringing them back.",
            },
            {
              label: "Signals should change next decisions",
              meta: "Feedback rule",
              summary: "Owner posture on the next cycle should reflect what captains and commands actually accomplished.",
            },
            {
              label: "The docs should show a loop, not a line",
              meta: "Docs rule",
              summary: "Community operations are more truthfully described as an ongoing cycle of observe, execute and re-read than as a one-time setup flow.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "review-a-trust-case",
    eyebrow: "Operator Docs Workflow",
    title: "Review a trust case from first signal through escalation and final resolution.",
    description:
      "This workflow explains how a trust signal becomes a case, how ownership and project input work, and how the operator side keeps trust review explainable from beginning to end.",
    chips: ["Workflow", "Trust review", "Case handling"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/operator-docs/trust-console", label: "Open Trust Console" },
    ],
    relatedHrefs: [
      "/operator-docs",
      "/operator-docs/trust-console",
      "/operator-docs/escalations",
      "/reference/trust-case-types",
      "/reference/permissions",
      "/reference/status-labels",
      "/reference/trust-score-and-severity-bands",
      "/reference/warning-and-flag-lifecycle",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Trust operators and support leads.",
      body: "This workflow is for the full trust-review path, including project-bound visibility and the point where a case becomes explainably resolved.",
    },
    outcome: {
      title: "What this workflow achieves",
      description:
        "A good trust workflow leaves the team with a classified case, a visible ownership trail, bounded project participation where needed and a final outcome that stays auditable.",
      bullets: [
        "It turns signals into explicit cases rather than hidden moderation notes.",
        "It keeps visibility, action grants and evidence posture bounded and explainable.",
        "It preserves the timeline so future operators can understand what happened.",
      ],
      asideTitle: "Why it matters",
      asideBody:
        "Trust work often fails when it becomes opaque. The docs need to show how VYNTRO prevents that through case structure, permissions and timelines.",
    },
    involvedSurfaces: {
      title: "Involved surfaces",
      items: [
        {
          label: "Trust Console",
          meta: "Primary console",
          summary: "The internal queue and project-bounded console where trust cases are reviewed and advanced.",
        },
        {
          label: "Escalations",
          meta: "Coordination layer",
          summary: "The shared ownership and waiting-state language that keeps trust handoffs visible.",
        },
        {
          label: "Reference layer",
          meta: "Exact system language",
          summary: "Trust case types, permissions and status labels define the exact posture operators should use.",
        },
      ],
    },
    stepFlow: {
      title: "Trust review sequence",
      states: [
        {
          label: "Triage the signal",
          summary: "The workflow starts by turning a suspicious signal into a known case with a clear type and severity.",
          bullets: [
            "Trust Console should make this classification explicit.",
            "Case type and severity help determine whether the issue stays internal or needs project participation.",
            "The docs should explain this as a case-creation step, not just a review habit.",
          ],
        },
        {
          label: "Assign ownership and investigate",
          summary: "Once the case exists, an internal operator owns the investigation and begins shaping the evidence trail.",
          bullets: [
            "Ownership should be visible immediately.",
            "Internal review should clarify whether project input is needed or not.",
            "This is where the timeline becomes the backbone of explainability.",
          ],
        },
        {
          label: "Request project input if needed",
          summary: "If the case needs bounded project context, the operator can explicitly move it into a project-facing posture.",
          bullets: [
            "Project visibility and action rights should remain permissioned.",
            "The case should show that it is waiting on project input rather than silently stalling.",
            "Escalation posture makes this handoff readable.",
          ],
        },
        {
          label: "Resolve or dismiss with notes",
          summary: "The case should end with a visible outcome, not disappear from view once the operator is done.",
          bullets: [
            "Resolution notes matter for future audits and support follow-through.",
            "Dismissal is still a meaningful, documented outcome.",
            "The docs should show closure as part of the trust workflow, not an afterthought.",
          ],
        },
      ],
    },
    handoffs: {
      title: "Key handoffs",
      items: [
        {
          label: "Signal to case",
          meta: "Classification handoff",
          summary: "Trust review begins only once the system has shaped the issue into a case with a known type and severity.",
        },
        {
          label: "Internal review to project input",
          meta: "Permission handoff",
          summary: "Projects only participate if the operator explicitly requests input and the owner grants appropriate visibility or actions.",
        },
        {
          label: "Investigation to resolution history",
          meta: "Audit handoff",
          summary: "The workflow should end in a timeline that preserves what was decided and why.",
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Trust work stays case-driven",
          meta: "Model rule",
          summary: "Signals become trust cases so ownership, evidence and outcome can remain explicit.",
        },
        {
          label: "Project access stays bounded",
          meta: "Permission rule",
          summary: "Project-side participation is never implied; it depends on explicit visibility and action grants.",
        },
        {
          label: "Resolution is part of the workflow",
          meta: "Audit rule",
          summary: "A trust case is not complete until the final posture is written back into timeline history.",
        },
      ],
    },
    deepDive: {
      title: "Why trust review is documented around case formation, bounded visibility and explainable closure.",
      description:
        "Trust is only defensible if the platform can show how signals became cases, why severity was chosen and how project participation stayed limited and intentional.",
      sections: [
        {
          title: "Signals need normalization before review",
          description: "Warnings, flags and suspicious patterns should become explicit trust cases before deep investigation starts.",
          items: [
            {
              label: "Severity is chosen, not guessed",
              meta: "Scoring model",
              summary: "The docs should explain that trust bands and case types exist so operators can distinguish watch posture from rejection-worthy behavior.",
            },
            {
              label: "Warnings and cases are different layers",
              meta: "Lifecycle rule",
              summary: "A flag may inform a case, but the case is the product object that can carry ownership, timeline and outcome.",
            },
            {
              label: "Classification protects consistency",
              meta: "Ops rule",
              summary: "Normalizing trust issues into known types reduces drift between operators and makes the console easier to read.",
            },
          ],
        },
        {
          title: "Project participation stays permissioned",
          description: "Trust review often benefits from project context, but that does not mean every project user should see raw evidence or act freely.",
          items: [
            {
              label: "Summary-only is the safer baseline",
              meta: "Visibility model",
              summary: "The docs should explain why project teams start with limited trust visibility unless the owner grants more.",
            },
            {
              label: "Evidence stays bounded",
              meta: "Safety rule",
              summary: "Internal trust operators may see raw signals or wallet patterns that the project should only encounter through a summarized, purposeful view.",
            },
            {
              label: "Escalation is the bridge",
              meta: "Handoff model",
              summary: "When project input is genuinely needed, the case should move into a readable waiting state instead of exposing internal review mechanics directly.",
            },
          ],
        },
        {
          title: "Closure should remain explainable later",
          description: "Trust work earns credibility when future operators can still understand why a case ended the way it did.",
          items: [
            {
              label: "Resolution notes matter",
              meta: "Audit model",
              summary: "Resolved or dismissed trust cases should preserve the reason the platform arrived at that conclusion.",
            },
            {
              label: "The timeline protects support quality",
              meta: "Support rule",
              summary: "A readable history makes future review, escalation and dispute handling calmer and more consistent.",
            },
            {
              label: "The docs should reward precision",
              meta: "Docs rule",
              summary: "Trust workflow pages should help readers understand that a precise, documented outcome is a core feature of the system.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "resolve-a-payout-issue",
    eyebrow: "Operator Docs Workflow",
    title: "Resolve a payout issue by moving from claim pressure into safe retries, project input and final closure.",
    description:
      "This workflow explains how payout cases move through the internal queue, when project-side participation is appropriate and how the console keeps claims and delivery issues explainable.",
    chips: ["Workflow", "Payout safety", "Resolution"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/operator-docs/payout-console", label: "Open Payout Console" },
    ],
    relatedHrefs: [
      "/operator-docs",
      "/operator-docs/payout-console",
      "/operator-docs/claims-and-resolution",
      "/operator-docs/escalations",
      "/reference/payout-case-types",
      "/reference/status-labels",
      "/reference/payout-risk-and-resolution-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Payout operators and support responders.",
      body: "This workflow is for the claim and payout problems that need more than a queue view and should end in a clear, auditable resolution.",
    },
    outcome: {
      title: "What this workflow achieves",
      description:
        "A good payout-resolution workflow turns blocked claims and delivery failures into known cases, uses safe retries where possible and preserves a clean record of how the issue closed.",
      bullets: [
        "It explains why a claim is blocked instead of leaving the answer in background systems.",
        "It separates project-safe actions from internal-only recovery decisions.",
        "It keeps disputes, retries and final closure in one readable timeline.",
      ],
      asideTitle: "Why it matters",
      asideBody:
        "Payout issues directly affect member trust and project confidence. The docs need to show a calm, bounded workflow rather than a vague support queue.",
    },
    involvedSurfaces: {
      title: "Involved surfaces",
      items: [
        {
          label: "Payout Console",
          meta: "Primary console",
          summary: "The case-driven queue for blocked claims, incidents, disputes and history.",
        },
        {
          label: "Claims and Resolution",
          meta: "Workflow layer",
          summary: "The explanation of how claim posture, retries and outcomes connect across internal and project rails.",
        },
        {
          label: "Escalation and status labels",
          meta: "Coordination layer",
          summary: "The shared language that explains who owns the issue and what the system is waiting on next.",
        },
      ],
    },
    stepFlow: {
      title: "Payout resolution sequence",
      states: [
        {
          label: "Classify the payout problem",
          summary: "The workflow starts by identifying whether the issue is a blocked claim, delivery failure, dispute or inventory risk.",
          bullets: [
            "Payout case type clarifies the recovery path that follows.",
            "The console should tell the operator why the normal path stopped.",
            "This gives members and projects a better explanation later on.",
          ],
        },
        {
          label: "Choose the next safe move",
          summary: "The operator decides whether the next step is an internal retry, project input or a direct resolution decision.",
          bullets: [
            "Project-safe actions are different from internal-only recovery actions.",
            "The system should keep this distinction visible to avoid risky handoffs.",
            "Waiting state language matters here because cases can otherwise look stalled for no reason.",
          ],
        },
        {
          label: "Loop through retry or project unblock",
          summary: "Some payout cases need one bounded recovery move before they can close cleanly.",
          bullets: [
            "Retries should write back into the timeline.",
            "Project blockers should be explicit when the issue cannot be resolved internally alone.",
            "The docs should show that not every payout issue is fixed the same way.",
          ],
        },
        {
          label: "Write the outcome",
          summary: "Resolved, dismissed or escalated payout cases should all leave behind enough context for future support work.",
          bullets: [
            "Closure should explain what was done, not just mark the issue complete.",
            "This is especially important for disputes and repeated claim problems.",
            "The docs should keep resolution history central to the workflow.",
          ],
        },
      ],
    },
    handoffs: {
      title: "Key handoffs",
      items: [
        {
          label: "Claim signal to payout case",
          meta: "Model handoff",
          summary: "The system turns claim or delivery pressure into an explicit case before deeper operator work begins.",
        },
        {
          label: "Internal review to project-safe action",
          meta: "Permission handoff",
          summary: "Projects only receive bounded actions such as annotate, escalate or safe retry where the owner has allowed them.",
        },
        {
          label: "Resolution to history",
          meta: "Audit handoff",
          summary: "A payout issue should end in an explanation of what changed and why the case is now closed.",
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Payout issues become cases",
          meta: "Model rule",
          summary: "Claims and delivery problems should be shaped into payout cases so the recovery flow stays explainable.",
        },
        {
          label: "Safe actions stay bounded",
          meta: "Recovery rule",
          summary: "Project-visible actions should never blur into the internal-only side of payout recovery.",
        },
        {
          label: "History explains trust",
          meta: "Support rule",
          summary: "Members and projects trust the platform more when payout resolution has a readable trail behind it.",
        },
      ],
    },
    deepDive: {
      title: "Why payout resolution is documented as a failure-driven safety workflow rather than a generic support queue.",
      description:
        "Claims and payouts need a deeper model because blocked flows, retries and disputes all imply different risk and recovery paths.",
      sections: [
        {
          title: "Payout issues start as failure posture",
          description: "The workflow becomes clearer once the docs explain what kind of breakdown happened before any action is taken.",
          items: [
            {
              label: "Different failures imply different moves",
              meta: "Case model",
              summary: "Blocked claims, delivery failures and inventory risk should not collapse into one ambiguous problem label because they need different next actions.",
            },
            {
              label: "The queue should be interpretive",
              meta: "Support rule",
              summary: "Operators need the console to explain why the path stopped, not just to show that something is pending.",
            },
            {
              label: "Risk posture shapes urgency",
              meta: "Resolution rule",
              summary: "The docs should help readers understand which failures are safe to retry quickly and which ones deserve deeper review first.",
            },
          ],
        },
        {
          title: "Safe retries and project blockers are distinct",
          description: "A payout workflow is stronger when it separates bounded recovery actions from situations that still need project clarification or operator judgment.",
          items: [
            {
              label: "Project-safe actions stay narrow",
              meta: "Permission model",
              summary: "Projects may annotate, escalate or take limited retry actions when the owner allows it, but deeper payout control should remain internal.",
            },
            {
              label: "Waiting states should explain the blocker",
              meta: "Escalation rule",
              summary: "The workflow should make it obvious whether the case is waiting on project input, an internal retry or a manual operator decision.",
            },
            {
              label: "This boundary protects trust",
              meta: "Safety rule",
              summary: "Keeping project-safe recovery distinct from internal overrides helps the platform stay both collaborative and controlled.",
            },
          ],
        },
        {
          title: "Resolution history protects member confidence",
          description: "A payout issue has member-facing consequences, so closure needs to be understandable later too.",
          items: [
            {
              label: "Timeline entries explain the fix",
              meta: "Audit model",
              summary: "Retries, resolves and dismissals should all write back into the case history so later support work has something dependable to read.",
            },
            {
              label: "Repeated issues should get easier",
              meta: "Learning rule",
              summary: "Good payout history helps operators and projects recognize familiar patterns and respond with less confusion next time.",
            },
            {
              label: "The docs should link risk to resolution",
              meta: "Docs rule",
              summary: "A payout workflow page should teach not only what to click, but why the system is asking for a particular recovery move.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "recover-an-onchain-case",
    eyebrow: "Operator Docs Workflow",
    title: "Recover an on-chain case by moving from signal to bounded retry, rescan or enrichment rerun.",
    description:
      "This workflow explains how chain-side failures and anomalies are triaged, which recovery moves stay project-safe and how the on-chain console keeps recovery history readable.",
    chips: ["Workflow", "On-chain recovery", "Project-safe actions"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/operator-docs/onchain-console", label: "Open On-chain Console" },
    ],
    relatedHrefs: [
      "/operator-docs",
      "/operator-docs/onchain-console",
      "/operator-docs/escalations",
      "/reference/onchain-case-types",
      "/reference/permissions",
      "/reference/status-labels",
      "/reference/onchain-signal-and-recovery-model",
      "/reference/warning-and-flag-lifecycle",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "On-chain and reliability operators.",
      body: "This workflow is for recovery work that starts with signals or failures but needs to end with bounded, explainable action rather than raw infrastructure noise.",
    },
    outcome: {
      title: "What this workflow achieves",
      description:
        "A good on-chain recovery workflow turns raw failures and anomalies into understandable cases, picks the right recovery move and leaves the system with visible resolution history.",
      bullets: [
        "It keeps chain-side issues legible for both internal operators and bounded project viewers.",
        "It separates project-safe recovery moves from global internal jobs.",
        "It makes retries, rescans and reruns part of a product workflow instead of hidden background operations.",
      ],
      asideTitle: "Why it matters",
      asideBody:
        "On-chain systems can become opaque very quickly. The docs need to show how VYNTRO turns them into case-driven recovery work rather than exposing raw operational chaos.",
    },
    involvedSurfaces: {
      title: "Involved surfaces",
      items: [
        {
          label: "On-chain Console",
          meta: "Primary console",
          summary: "The internal and project-bounded workspace for queue, failures, signals and resolution history.",
        },
        {
          label: "Escalations",
          meta: "Coordination layer",
          summary: "The shared language for ownership, waiting state and next action during recovery.",
        },
        {
          label: "Reference layer",
          meta: "Exact system language",
          summary: "On-chain case types, permissions and status labels define the boundaries of safe recovery work.",
        },
      ],
    },
    stepFlow: {
      title: "On-chain recovery sequence",
      states: [
        {
          label: "Identify the failure or signal",
          summary: "The workflow begins by classifying whether the issue is ingress, enrichment, provider sync or anomaly related.",
          bullets: [
            "The on-chain case type determines which recovery paths are even valid.",
            "This gives operators a cleaner mental model than raw job logs.",
            "The docs should explain classification as the start of recovery, not a side detail.",
          ],
        },
        {
          label: "Choose the safe recovery move",
          summary: "Once classified, the operator decides whether the next step is a retry, asset rescan, enrichment rerun or a deeper internal action.",
          bullets: [
            "Project-safe actions should stay clearly bounded and permissioned.",
            "Internal-only actions remain separate so projects cannot trigger unsafe system work.",
            "The console should make this distinction visible before any action runs.",
          ],
        },
        {
          label: "Run the bounded action",
          summary: "The actual recovery step should execute through one known action and write its posture into the case timeline.",
          bullets: [
            "Retries, rescans and reruns should not disappear into background jobs with no trace.",
            "Waiting state helps teams understand when work is queued versus complete.",
            "The docs should keep the recovery move readable for non-specialists too.",
          ],
        },
        {
          label: "Close with history",
          summary: "The case ends only after the console can explain how the recovery move changed the system posture.",
          bullets: [
            "Resolution should show whether the issue recovered, escalated or was dismissed.",
            "History matters for repeated issues and later debugging.",
            "The docs should treat closure as part of the recovery workflow itself.",
          ],
        },
      ],
    },
    handoffs: {
      title: "Key handoffs",
      items: [
        {
          label: "Raw signal to on-chain case",
          meta: "Model handoff",
          summary: "Failures and anomalies should become explicit cases before operators decide what to do next.",
        },
        {
          label: "Internal recovery to project-safe action",
          meta: "Permission handoff",
          summary: "Projects can only participate through actions such as retry, rerun enrichment or rescan assets when the owner allows it.",
        },
        {
          label: "Queued recovery to resolution history",
          meta: "Audit handoff",
          summary: "The console should preserve how the case moved from signal to recovered state so future debugging stays easier.",
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Recovery is case-driven",
          meta: "Model rule",
          summary: "On-chain operators should work from cases and timelines rather than raw infrastructure context alone.",
        },
        {
          label: "Project-safe actions stay separate",
          meta: "Permission rule",
          summary: "The docs should make the boundary between project recovery moves and internal-only jobs unmistakably clear.",
        },
        {
          label: "History is part of reliability",
          meta: "Reliability rule",
          summary: "Good on-chain recovery documentation always shows how the system preserves context after the issue is handled.",
        },
      ],
    },
    deepDive: {
      title: "Why on-chain recovery is documented as a normalized case system with project-safe action boundaries.",
      description:
        "Raw chain events and job logs are too noisy to reason about directly. The docs should explain how VYNTRO turns that noise into bounded recovery work.",
      sections: [
        {
          title: "Raw failures become readable cases",
          description: "The first job of the on-chain workflow is normalization: turning ingress, sync and enrichment problems into known case types.",
          items: [
            {
              label: "Classification makes recovery legible",
              meta: "Case model",
              summary: "Operators can choose the right next step faster when the system already knows whether the issue is ingress, enrichment, provider sync or anomaly related.",
            },
            {
              label: "Warnings and cases are not identical",
              meta: "Signal model",
              summary: "Some chain-side signals stay at the watch layer, while others become operator-facing cases once they need ownership and action.",
            },
            {
              label: "The console should hide infrastructure noise",
              meta: "UX rule",
              summary: "The docs should frame on-chain recovery around product-readable cases, not around raw job terminology alone.",
            },
          ],
        },
        {
          title: "Project-safe actions stop at the boundary",
          description: "The on-chain console is shared, but the action surface should still distinguish clearly between safe project participation and internal-only recovery jobs.",
          items: [
            {
              label: "Retry, rerun and rescan are bounded",
              meta: "Permission model",
              summary: "Project-side actions should stay limited to safe recovery moves that only affect the relevant project context.",
            },
            {
              label: "Global provider jobs stay internal",
              meta: "Safety rule",
              summary: "The docs should make it unambiguous that broader sync or infrastructure actions remain under internal control.",
            },
            {
              label: "Owner grants control participation",
              meta: "Governance rule",
              summary: "Projects only get deeper visibility or action rights when the owner explicitly expands beyond summary-only posture.",
            },
          ],
        },
        {
          title: "Recovery history is part of reliability",
          description: "The platform becomes easier to operate when every retry, rerun or rescan leaves behind a readable timeline.",
          items: [
            {
              label: "Queued work should stay visible",
              meta: "Waiting-state model",
              summary: "Operators and projects should be able to tell whether the system is waiting on a retry, still blocked or genuinely recovered.",
            },
            {
              label: "Resolution should explain the new posture",
              meta: "Outcome rule",
              summary: "Closing an on-chain case should show whether the issue recovered, escalated or was dismissed after deeper review.",
            },
            {
              label: "The docs should teach observability",
              meta: "Docs rule",
              summary: "Recovery pages should help readers understand why the timeline and status layers are just as important as the action buttons themselves.",
            },
          ],
        },
      ],
    },
  },
];

export function getDocsWorkflowPage(track: "project-docs" | "operator-docs", slug: string) {
  return docsWorkflowPages.find((page) => page.track === track && page.slug === slug);
}
