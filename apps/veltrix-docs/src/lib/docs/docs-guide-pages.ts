type DocsGuideState = {
  label: string;
  summary: string;
  bullets: string[];
  note?: string;
};

type DocsGuideEntry = {
  label: string;
  summary: string;
  meta?: string;
};

type DocsGuideSection = {
  title: string;
  description?: string;
  items: DocsGuideEntry[];
};

type DocsGuideDefinition = {
  track: "project-docs" | "operator-docs";
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  surfaceTitle: string;
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
  whatItIs: {
    description: string;
    bullets: string[];
    asideTitle: string;
    asideBody: string;
  };
  whereToFind: {
    title: string;
    description: string;
    items: DocsGuideEntry[];
  };
  surfaceAnatomy: {
    title: string;
    description?: string;
    items: DocsGuideEntry[];
  };
  howItWorks?: {
    title: string;
    description?: string;
    states: DocsGuideState[];
  };
  keyRules: {
    title: string;
    description?: string;
    items: DocsGuideEntry[];
  };
  deepDive?: {
    title: string;
    description?: string;
    sections: DocsGuideSection[];
  };
};

const docsGuidePages: DocsGuideDefinition[] = [
  {
    track: "project-docs",
    slug: "launch-workspace",
    eyebrow: "Project Docs",
    title: "Launch Workspace explains how a project gets from setup into a launch-ready operating posture.",
    description:
      "This page documents the project launch hub: the place where readiness, sequencing, templates and the first builder handoffs come together before a team starts publishing or operating.",
    surfaceTitle: "Launch Workspace",
    chips: ["Project hub", "Readiness", "Builder handoff"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference", label: "Open Reference" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/campaign-studio",
      "/project-docs/quest-studio",
      "/reference/lifecycle-states",
      "/reference/launch-and-readiness-model",
      "/reference/builder-and-handoff-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Founders and launch operators.",
      body: "Launch Workspace is the project-side entrypoint for sequencing a launch without guessing which builder or readiness check comes next.",
    },
    whatItIs: {
      description:
        "Launch Workspace is the project hub for readiness, sequencing and builder entry. It is where a team sees if the project is ready, which assets still need work and where to go next.",
      bullets: [
        "It centralizes readiness instead of scattering it across campaign, quest and reward pages.",
        "It gives project-first handoffs into Campaign Studio, Quest Studio, Raid Studio and Reward flows.",
        "It keeps templates, launch checklist pressure and sequencing in one visible place.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Without a dedicated launch hub, projects would need to know internal routes and builder order before they can even start operating the product well.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Launch Workspace is project-private and intentionally positioned as the main launch entrypoint.",
      items: [
        {
          label: "Primary route",
          meta: "/projects/<id>/launch",
          summary: "The main launch route for project context, checklist posture and builder handoff.",
        },
        {
          label: "Connected builders",
          summary: "Campaign Studio, Quest Studio, Raid Studio and Reward creation all branch out from this surface.",
        },
        {
          label: "Readiness context",
          summary: "The page reads project state and missing launch pieces instead of behaving like a generic tools page.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Surface anatomy",
      items: [
        {
          label: "Readiness rail",
          meta: "Primary system block",
          summary: "Shows what is launch-ready, what is missing and what still needs operator attention.",
        },
        {
          label: "Starter packs",
          meta: "Accelerator",
          summary: "Gives projects a faster path into common launch setups instead of a blank-canvas start.",
        },
        {
          label: "Builder actions",
          meta: "Entry layer",
          summary: "Routes directly into the relevant studio or content builder with project context already attached.",
        },
      ],
    },
    howItWorks: {
      title: "Launch flow",
      states: [
        {
          label: "Assess readiness",
          summary: "The workspace first tells the team what is missing and what is already structurally sound.",
          bullets: [
            "Teams can scan launch posture before opening any builder.",
            "Readiness pressure becomes visible before publishing mistakes happen.",
            "This is why Launch Workspace belongs above the studios in the docs hierarchy.",
          ],
        },
        {
          label: "Jump into builders",
          summary: "The next move is not manual route-hunting; it is a project-first handoff into the right creation surface.",
          bullets: [
            "Campaign, quest, raid and reward creation all start from current project context.",
            "The workspace reduces route knowledge as a requirement for operating the product.",
            "Starter packs help teams move faster when they are not inventing everything from scratch.",
          ],
        },
        {
          label: "Return to launch posture",
          summary: "After a builder step, the team should return to one hub that shows what changed and what still blocks launch.",
          bullets: [
            "The workspace keeps launch sequencing visible instead of losing it inside individual forms.",
            "Readiness should update as the builders fill in the missing pieces.",
            "This keeps launch setup legible at the project level.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Project-first always",
          meta: "Navigation rule",
          summary: "Launch Workspace should never feel like a detached admin page; it exists because the project context matters.",
        },
        {
          label: "Readiness drives action",
          meta: "Product rule",
          summary: "The page should orient the team around what still blocks a good launch, not just list available tools.",
        },
        {
          label: "Handoffs stay explicit",
          meta: "Flow rule",
          summary: "Builder actions should clearly communicate which surface comes next and why.",
        },
      ],
    },
    deepDive: {
      title: "Why Launch Workspace behaves like a project operating hub instead of a generic tools index.",
      description:
        "Launch Workspace is the place where readiness, builder sequencing and project-safe handoffs stay visible together. This deeper model explains why the page is framed around launch posture rather than forms.",
      sections: [
        {
          title: "Readiness is compositional",
          description: "Launch posture is not a single status bit. It reflects whether the project has enough structure, execution rails and incentive coverage to launch safely.",
          items: [
            {
              label: "Architecture coverage",
              meta: "Campaign layer",
              summary: "The workspace reads whether the project has a campaign or mission structure to anchor the rest of the launch.",
            },
            {
              label: "Execution coverage",
              meta: "Quest, raid and community layer",
              summary: "Readiness improves as the project adds concrete action surfaces and the community operating rails needed to support them.",
            },
            {
              label: "Incentive coverage",
              meta: "Reward and claim posture",
              summary: "The launch should not read as ready if incentives, reward posture or the downstream claim consequences are still undefined.",
            },
          ],
        },
        {
          title: "Builder handoffs stay project-first",
          description: "The hub exists so teams do not need route knowledge before they can launch well.",
          items: [
            {
              label: "Context follows the team",
              meta: "Navigation rule",
              summary: "When someone leaves Launch Workspace for a builder, the project context should already be attached so the builder can explain why this object belongs here.",
            },
            {
              label: "Return path matters",
              meta: "Sequencing rule",
              summary: "The team should be able to return to one readiness view and see what changed, instead of mentally recomputing launch posture from multiple pages.",
            },
            {
              label: "Starter packs reduce blank-canvas risk",
              meta: "Acceleration rule",
              summary: "Templates belong here because the launch hub is where a team decides what kind of launch system they are trying to shape.",
            },
          ],
        },
        {
          title: "Checklist pressure is intentional product language",
          description: "The launch page should explain what still blocks a strong launch rather than just list every available tool.",
          items: [
            {
              label: "Missing pieces become visible",
              meta: "Pressure model",
              summary: "The checklist exists to surface structural gaps before they become live launch mistakes or member confusion.",
            },
            {
              label: "Priority is more useful than exhaustiveness",
              meta: "Docs rule",
              summary: "The workspace should orient the team toward the next highest-value builder or fix, not overwhelm them with every possible configuration surface.",
            },
            {
              label: "Launch posture connects to later operations",
              meta: "System rule",
              summary: "Readiness is only credible if it feeds naturally into community operations, member journey and safety rails after launch goes live.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "raid-studio",
    eyebrow: "Project Docs",
    title: "Raid Studio explains how teams shape time-based activation with project-safe controls.",
    description:
      "This page documents the raid builder: how a project defines cadence, channel posture, captain execution and the operational boundaries that make raids repeatable instead of chaotic.",
    surfaceTitle: "Raid Studio",
    chips: ["Builder", "Raid execution", "Project-safe controls"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference", label: "Open Reference" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/community-os",
      "/project-docs/campaign-studio",
      "/reference/lifecycle-states",
      "/reference/builder-and-handoff-model",
      "/reference/community-and-member-signal-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Growth operators and community leads.",
      body: "Raid Studio is for teams coordinating bursts of activation without letting timing, channels or captain follow-through become messy.",
    },
    whatItIs: {
      description:
        "Raid Studio is the builder for time-sensitive activation moments. It helps projects define where a raid runs, how it is staffed and how the action fits into the broader campaign context.",
      bullets: [
        "It treats raids as operational moments, not just another content object.",
        "It keeps project context attached so raids fit into a campaign or launch posture instead of floating alone.",
        "It gives teams a controlled way to hand responsibilities into the community operating layer.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Raids are high-pressure community actions. They need a dedicated builder because their operational posture is different from static quests or rewards.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Raid Studio sits in the same project-first creation family as Campaign Studio and Quest Studio.",
      items: [
        {
          label: "Primary route",
          meta: "/raids/new",
          summary: "The direct raid builder route for a new creation session.",
        },
        {
          label: "Project-first entry",
          summary: "Projects typically enter Raid Studio from Launch Workspace, project overview or campaign-linked handoffs.",
        },
        {
          label: "Connected surfaces",
          summary: "Community OS, captain operations and campaign context all intersect with raid setup.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Surface anatomy",
      items: [
        {
          label: "Channel and cadence posture",
          meta: "Operational block",
          summary: "Defines where the raid happens and how time pressure is framed for the team and participants.",
        },
        {
          label: "Staffing and execution",
          meta: "Captain block",
          summary: "Explains how captains or community operators are expected to pick up and run the action.",
        },
        {
          label: "Launch connection",
          meta: "Project block",
          summary: "Keeps the raid tied to broader launch or campaign posture instead of letting it become isolated.",
        },
      ],
    },
    howItWorks: {
      title: "Raid setup flow",
      states: [
        {
          label: "Define the raid moment",
          summary: "The builder starts by framing the activation itself: where it happens and what kind of pressure the team is creating.",
          bullets: [
            "Channel posture matters as much as the content of the raid.",
            "Cadence should be intentional instead of improvised.",
            "The team should be able to read the operational shape before publishing.",
          ],
        },
        {
          label: "Connect staffing and ownership",
          summary: "The raid becomes safer to run once captain or operator follow-through is explicit.",
          bullets: [
            "Responsibility should not be inferred from the existence of a raid.",
            "Community OS is where execution accountability lives after creation.",
            "This is why Raid Studio is closely linked to captain workflows in the docs.",
          ],
        },
        {
          label: "Review launch fit",
          summary: "The raid should be treated as part of a launch or campaign plan, not as a disconnected event.",
          bullets: [
            "Teams should understand how a raid supports campaign goals or community momentum.",
            "Project context keeps placement and timing legible.",
            "The docs should always connect the raid back to the system around it.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Operations-first design",
          meta: "Builder rule",
          summary: "Raid setup needs to explain execution posture, not just content fields.",
        },
        {
          label: "Captain context matters",
          meta: "Community rule",
          summary: "The builder should communicate how raid ownership and captain follow-through connect after creation.",
        },
        {
          label: "Project context persists",
          meta: "System rule",
          summary: "Raids should inherit their place in the project or campaign structure instead of forcing teams to recreate that context manually.",
        },
      ],
    },
    deepDive: {
      title: "Why Raid Studio is documented as an activation system, not just another builder form.",
      description:
        "Raids create short, high-pressure community moments. The docs need to explain the execution model, staffing posture and feedback loops that make raids work safely.",
      sections: [
        {
          title: "Raids are time-bound activation objects",
          description: "Raid behavior depends on cadence and channel pressure in a way static quests do not.",
          items: [
            {
              label: "Cadence changes risk",
              meta: "Timing model",
              summary: "A raid's quality depends on when it runs, how often it repeats and how clearly the urgency is framed for the team.",
            },
            {
              label: "Channel posture shapes outcome",
              meta: "Execution model",
              summary: "The same raid objective behaves differently depending on whether it runs in Discord, Telegram or another coordinated community surface.",
            },
            {
              label: "Operational shape comes before copy",
              meta: "Builder model",
              summary: "Raid docs should emphasize who runs the moment and how it is staffed before diving into content details.",
            },
          ],
        },
        {
          title: "Captain execution is part of the builder story",
          description: "Raid setup only becomes real when someone can run it well after it leaves the creation surface.",
          items: [
            {
              label: "Staffing should be explicit",
              meta: "Ownership rule",
              summary: "Raid docs need to explain how captains or community operators inherit responsibility rather than assuming the team will sort it out later.",
            },
            {
              label: "Project-safe controls matter",
              meta: "Safety rule",
              summary: "Teams should understand the boundary between configuring a raid and triggering wider operator or bot-side behavior that needs guardrails.",
            },
            {
              label: "Community OS completes the handoff",
              meta: "Connected surface",
              summary: "Raid Studio belongs next to Community OS in the docs because that is where staffing, commands and accountability continue.",
            },
          ],
        },
        {
          title: "Raids feed member and community signals",
          description: "A raid should be understood as part of a larger signal loop rather than a one-off event.",
          items: [
            {
              label: "Participation affects community health",
              meta: "Signal model",
              summary: "Successful or weak raid participation changes how teams should read community momentum and captain effectiveness.",
            },
            {
              label: "Rewards and recognition amplify the effect",
              meta: "Motivation model",
              summary: "If raids tie into incentives or member recognition, the docs should explain how that changes the activation posture.",
            },
            {
              label: "The raid belongs in the wider launch architecture",
              meta: "System rule",
              summary: "Projects should always see how a raid supports a campaign or launch goal, not only how to publish it.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "rewards",
    eyebrow: "Project Docs",
    title: "Rewards docs explain how incentives, claims and launch outcomes connect inside Veltrix.",
    description:
      "This page documents the reward layer from the project side: what reward setup means, how claims fit in and how rewards connect back into campaigns, quests, raids and member motivation.",
    surfaceTitle: "Rewards",
    chips: ["Incentives", "Claims posture", "Project-facing"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference", label: "Open Reference" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/operator-docs/payout-console",
      "/reference/payout-case-types",
      "/reference/lifecycle-states",
      "/reference/verification-and-reward-model",
      "/reference/payout-risk-and-resolution-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Founders, operators and growth leads.",
      body: "Reward docs should help projects understand both incentive design and the operational consequences once members begin claiming.",
    },
    whatItIs: {
      description:
        "Rewards are the project-side incentive layer for quests, raids and campaigns. They influence not only what members receive, but also how claim pressure, delivery and reward safety behave downstream.",
      bullets: [
        "Reward setup needs to be understood as part of launch design, not just post-launch fulfillment.",
        "The docs should explain how rewards shape motivation, inventory pressure and claim posture together.",
        "Projects need a clear mental model of how reward objects connect to payout and claim safety later.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Rewards change both the member experience and the operator workload. Good docs need to explain that whole system, not just the create form.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Reward flows span both project builders and operator safety consoles, which is why this page links across tracks.",
      items: [
        {
          label: "Primary route",
          meta: "/rewards/new",
          summary: "The project-side reward creation route, often entered from Launch Workspace or campaign context.",
        },
        {
          label: "Connected project surfaces",
          summary: "Campaign Studio, Quest Studio and Launch Workspace all point into reward setup when incentives matter to the launch design.",
        },
        {
          label: "Connected operator surface",
          summary: "Once rewards create claim or delivery pressure, the operator-facing Payout Console becomes part of the story.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Reward anatomy",
      items: [
        {
          label: "Reward configuration",
          meta: "Builder block",
          summary: "Defines what is granted, what member action it supports and how it fits into project goals.",
        },
        {
          label: "Inventory posture",
          meta: "Safety block",
          summary: "Explains stock pressure, availability and the risks that emerge when reward supply is not aligned with demand.",
        },
        {
          label: "Claim consequences",
          meta: "Ops block",
          summary: "Shows that rewards do not end at creation; they flow into claim and delivery behavior later.",
        },
      ],
    },
    howItWorks: {
      title: "Reward flow",
      states: [
        {
          label: "Design the incentive",
          summary: "Projects first decide what behavior the reward supports and what role it plays inside the broader launch plan.",
          bullets: [
            "A reward should make sense in the campaign or quest architecture.",
            "The docs should explain the connection between reward design and member motivation.",
            "This is where projects decide whether the reward is a driver, signal or milestone.",
          ],
        },
        {
          label: "Publish with inventory awareness",
          summary: "Reward setup should surface supply and readiness before a project creates claim pressure it cannot satisfy.",
          bullets: [
            "Inventory posture matters before members ever open a claim.",
            "Readiness and availability are part of reward quality, not an afterthought.",
            "The docs should keep this operational reality visible.",
          ],
        },
        {
          label: "Follow into claims",
          summary: "Once a reward is live, its project-facing story continues through claim, dispute and payout behavior.",
          bullets: [
            "Projects need to understand how rewards create downstream claim states.",
            "Payout Console documentation is part of the same system narrative.",
            "This prevents rewards from being explained as isolated incentives.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Rewards are part of launch architecture",
          meta: "Design rule",
          summary: "Reward docs should always connect incentives back to campaigns, quests, raids and member behavior.",
        },
        {
          label: "Inventory is not optional",
          meta: "Safety rule",
          summary: "Any explanation of rewards should include supply posture and the consequences for claims later on.",
        },
        {
          label: "Claim follow-through matters",
          meta: "System rule",
          summary: "Reward setup is only half the story; the docs should also explain how that setup turns into claim and payout operations.",
        },
      ],
    },
    deepDive: {
      title: "Why reward docs need to explain incentive design and payout consequences at the same time.",
      description:
        "Rewards change both member motivation and operator workload. A complete reward page should explain how configuration, claim posture and safety all connect.",
      sections: [
        {
          title: "Rewards are incentive architecture",
          description: "Reward objects should be explained through the behavior they are supposed to shape, not just by what they deliver.",
          items: [
            {
              label: "Rewards reinforce mission posture",
              meta: "Behavior model",
              summary: "Good reward setup helps a quest, raid or campaign feel worth doing at the right moment in the member journey.",
            },
            {
              label: "Placement changes interpretation",
              meta: "Journey model",
              summary: "The same reward means something different when it appears at onboarding, in an advanced quest path or as community recognition later on.",
            },
            {
              label: "Verification and reward belong together",
              meta: "Builder rule",
              summary: "Projects should understand that proof of action and incentive design are linked because one shapes the trustworthiness of the other.",
            },
          ],
        },
        {
          title: "Claim safety starts at reward setup",
          description: "Many payout problems are downstream consequences of unclear reward posture or inventory planning.",
          items: [
            {
              label: "Inventory pressure is predictive",
              meta: "Risk model",
              summary: "Projects should understand that low stock, high demand or ambiguous eligibility can become payout cases later.",
            },
            {
              label: "Claim load is not neutral",
              meta: "Operational rule",
              summary: "A reward that creates heavy claim activity should be documented with its operator consequences, not only its member appeal.",
            },
            {
              label: "Payout Console is part of the reward story",
              meta: "Cross-track rule",
              summary: "Project-side reward docs should point into the operator layer so teams understand how issues are resolved when claims go wrong.",
            },
          ],
        },
        {
          title: "Project and operator visibility stay different",
          description: "Reward setup is public to projects, but payout recovery should still respect bounded console access.",
          items: [
            {
              label: "Projects design the incentive",
              meta: "Project-facing layer",
              summary: "The project docs should explain reward intent, placement and readiness in terms the team can act on directly.",
            },
            {
              label: "Operators own the deeper safety layer",
              meta: "Operator-facing layer",
              summary: "Delivery failures, disputes and retry logic belong in the payout console because those actions need stronger guardrails.",
            },
            {
              label: "Owners decide who can see more",
              meta: "Permission rule",
              summary: "Where project-side payout visibility exists, it should remain explicit and granted rather than assumed for every teammate.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "member-journey",
    eyebrow: "Project Docs",
    title: "Member Journey explains what the project-side system turns into for members on the other end.",
    description:
      "This page documents the member-facing side of Veltrix from a project perspective: onboarding, comeback, missions, recognition, rewards and the routes that help members know where they are going next.",
    surfaceTitle: "Member Journey",
    chips: ["Member-facing", "Journey layer", "Project context"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference", label: "Open Reference" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/quest-studio",
      "/project-docs/rewards",
      "/reference/status-labels",
      "/reference/community-and-member-signal-model",
      "/reference/verification-and-reward-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Teams shaping the member experience.",
      body: "Projects need this page so they understand how their builders and operations surfaces affect the actual member path through the product.",
    },
    whatItIs: {
      description:
        "Member Journey is the explanatory bridge between project-side setup and the member-facing experience. It describes how the system routes members into onboarding, comeback, missions, recognition and reward follow-through.",
      bullets: [
        "It explains the member side as a real product journey instead of a side effect of admin configuration.",
        "It helps projects understand how content, rewards and automations shape the next best action for members.",
        "It gives the docs site a way to keep member experience central even when the track is project-facing.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Projects make better decisions when they can clearly see what their setup means for the member flow beyond the portal itself.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "This page links project-side operators back into the member-facing web experience and the surfaces that shape it.",
      items: [
        {
          label: "Member-facing surfaces",
          meta: "/community, /home, /rewards, /profile",
          summary: "The member journey primarily lives in the webapp, but it is caused by project and operator decisions elsewhere.",
        },
        {
          label: "Connected project surfaces",
          summary: "Quest Studio, Rewards and Community OS all influence how members are routed, motivated and recognized.",
        },
        {
          label: "Connected operator surfaces",
          summary: "Bot delivery and support follow-through can shape the journey when members need nudges, recovery or visibility.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Journey anatomy",
      items: [
        {
          label: "Onboarding lane",
          meta: "Entry block",
          summary: "Helps new members understand what to do first and why those first actions matter.",
        },
        {
          label: "Mission lane",
          meta: "Engagement block",
          summary: "Routes members into relevant quests, missions or campaign activity without making the app feel random.",
        },
        {
          label: "Recognition and rewards",
          meta: "Retention block",
          summary: "Keeps members aware of progress, status, rewards and what they can unlock next.",
        },
      ],
    },
    howItWorks: {
      title: "Journey flow",
      states: [
        {
          label: "Onboard",
          summary: "The system introduces new members to the project and the first meaningful actions they should take.",
          bullets: [
            "Good onboarding reduces confusion and accelerates contribution.",
            "Project-side setup needs to account for this first moment clearly.",
            "Docs should show that onboarding is not just generic welcome copy.",
          ],
        },
        {
          label: "Sustain engagement",
          summary: "After the first actions, the system needs to route members into the next best mission or community activity.",
          bullets: [
            "Quest design, campaign structure and command rails all influence this stage.",
            "The mission lane keeps the experience from becoming a flat list of tasks.",
            "Recognition helps members feel momentum instead of drift.",
          ],
        },
        {
          label: "Bring people back",
          summary: "The comeback layer matters once members drop out of the main flow or need a clear way back in.",
          bullets: [
            "Notifications, recognition and active missions should all help with re-entry.",
            "Projects need to understand comeback posture as part of the same journey system.",
            "This is where retention begins to matter as much as launch activation.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Member experience is a first-class product layer",
          meta: "Experience rule",
          summary: "The docs should never treat the member journey as an accidental result of project configuration.",
        },
        {
          label: "Next best action matters",
          meta: "Journey rule",
          summary: "Members need clear routing into what matters now, not an overloaded list of possible things to do.",
        },
        {
          label: "Recognition is part of operations",
          meta: "Retention rule",
          summary: "Recognition, streaks and rewards are not fluff; they shape how the community actually retains momentum.",
        },
      ],
    },
    deepDive: {
      title: "Why the member journey is documented as a system of routes, signals and recognition rather than just a set of screens.",
      description:
        "Member Journey is where all project-side setup turns into an actual user experience. The docs need to explain the routing logic and signal loops underneath it.",
      sections: [
        {
          title: "Routing is stateful, not decorative",
          description: "Members should not land on arbitrary screens. The journey layer exists to route them based on readiness, momentum and context.",
          items: [
            {
              label: "Preferred routes shape the first move",
              meta: "Routing model",
              summary: "Onboarding, comeback and community-home posture should change based on what the member still needs to do or recover.",
            },
            {
              label: "Readiness labels create clarity",
              meta: "Status model",
              summary: "The docs should explain how readiness language helps a member know whether they are just starting, active, blocked or ready for deeper work.",
            },
            {
              label: "Mission lanes prevent dead ends",
              meta: "Navigation rule",
              summary: "Member-facing mission prioritization exists so the product keeps giving people a meaningful next move instead of a flat list of tasks.",
            },
          ],
        },
        {
          title: "Community and builder signals feed the journey",
          description: "The member-facing product reflects what the project configured and how the community is operating, not just member-local actions.",
          items: [
            {
              label: "Quest and reward setup influence the lane",
              meta: "Builder model",
              summary: "Projects should understand that the structure they create changes what the member sees first and what feels important.",
            },
            {
              label: "Community operations change momentum",
              meta: "Signal model",
              summary: "Commands, automations and activation pressure can change who needs comeback guidance, who is active and who is ready for deeper progression.",
            },
            {
              label: "The docs should close the loop",
              meta: "System rule",
              summary: "Member Journey pages should keep pointing back to the project and community layers that produce the experience members actually feel.",
            },
          ],
        },
        {
          title: "Recognition is part of operating logic",
          description: "Recognition, streaks and profile posture are not cosmetic if they change retention and contribution behavior.",
          items: [
            {
              label: "Recognition reinforces return behavior",
              meta: "Retention model",
              summary: "Status, streaks and unlocks help the product explain why a member should come back instead of only what they can click next.",
            },
            {
              label: "Rewards and recognition work together",
              meta: "Motivation model",
              summary: "The docs should show where recognition complements material incentives instead of treating them like separate systems.",
            },
            {
              label: "Personalization must stay legible",
              meta: "Experience rule",
              summary: "Members should feel guided by the system without losing the ability to understand why a route or priority changed.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "bot-commands",
    eyebrow: "Project Docs",
    title: "Bot Commands explain how projects activate members through Discord and Telegram.",
    description:
      "This page documents the project-facing command layer: what commands members and captains can use, how deep links work and how command visibility connects to community operations.",
    surfaceTitle: "Bot Commands",
    chips: ["Discord", "Telegram", "Deep links"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference/bot-commands", label: "Open Command Reference" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/community-os",
      "/reference/bot-commands",
      "/reference/automation-types",
      "/reference/community-and-member-signal-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Community leads and growth operators.",
      body: "Projects need to know not only what commands exist, but how command posture changes the way members enter the product from chat surfaces.",
    },
    whatItIs: {
      description:
        "Bot Commands is the project-facing view of the command system that powers Discord and Telegram activation. It explains how commands support missions, profile checks, raids, leaderboards and captain follow-through.",
      bullets: [
        "It treats bot commands as a product layer, not just a technical integration.",
        "It helps projects understand how command exposure shapes member and captain behavior.",
        "It connects command posture to Community OS and member journey instead of leaving commands isolated.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Projects often experience Veltrix through chat surfaces as much as through the webapp. The docs should reflect that reality directly.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "The command layer is configured and understood across project and reference surfaces.",
      items: [
        {
          label: "Project-side control",
          meta: "/projects/<id>/community",
          summary: "Community OS is where command posture, permissions and related community operations come together.",
        },
        {
          label: "Reference layer",
          meta: "/reference/bot-commands",
          summary: "The exact command dictionary lives in Reference and should be linked instead of redefined.",
        },
        {
          label: "Delivery surfaces",
          summary: "Discord and Telegram are the member-facing environments where commands actually execute.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Command anatomy",
      items: [
        {
          label: "Member commands",
          meta: "Activation block",
          summary: "Commands like profile, missions and leaderboard shape how members find context and status quickly.",
        },
        {
          label: "Captain commands",
          meta: "Ops block",
          summary: "Captain-specific commands extend project operations into chat while preserving scope boundaries.",
        },
        {
          label: "Deep-link follow-through",
          meta: "Routing block",
          summary: "Command responses should move people into the right web or portal surface when more context is needed.",
        },
      ],
    },
    howItWorks: {
      title: "Command flow",
      states: [
        {
          label: "Expose the right commands",
          summary: "Projects first decide which command posture makes sense for the community and who needs access.",
          bullets: [
            "Command exposure should match the community operating model.",
            "Captain tools should not feel mixed into general member usage.",
            "The docs should make these boundaries easy to reason about.",
          ],
        },
        {
          label: "Deliver useful replies",
          summary: "The command layer is only good when responses are clear, actionable and consistent with the wider product.",
          bullets: [
            "Commands should reveal status, missions or profile posture quickly.",
            "Fallback language matters because chat is a high-friction environment for unclear UX.",
            "Deep links should feel like continuation, not abandonment of context.",
          ],
        },
        {
          label: "Route back into the system",
          summary: "Commands often hand members or operators into the webapp or portal for richer next steps.",
          bullets: [
            "This is how bots stay part of the product instead of separate scripts.",
            "Projects should understand those handoffs when designing activation flows.",
            "Command docs should always connect back to web and portal surfaces.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Commands are product surfaces",
          meta: "Product rule",
          summary: "The docs should describe command behavior as part of the product experience, not as command-line syntax.",
        },
        {
          label: "Scope still matters",
          meta: "Permission rule",
          summary: "Captain and member command posture should remain distinct, and the docs should preserve that clarity.",
        },
        {
          label: "Deep links should complete the story",
          meta: "Routing rule",
          summary: "Chat commands should guide users into the right next surface instead of leaving them in a dead end.",
        },
      ],
    },
    deepDive: {
      title: "Why bot command docs need to explain scope, delivery posture and system handoffs instead of only listing slash commands.",
      description:
        "Commands are one of the main delivery rails for community execution. The docs should explain how command visibility, output and deep-linking fit into the rest of Veltrix.",
      sections: [
        {
          title: "Commands extend the community operating model",
          description: "Bot rails belong inside the product system because they deliver the actions decided elsewhere.",
          items: [
            {
              label: "Commands are action surfaces",
              meta: "Activation model",
              summary: "A command like /missions or /captain is meaningful because it reflects community posture, project settings and member status at the moment it is called.",
            },
            {
              label: "Output quality affects trust",
              meta: "UX rule",
              summary: "Command docs should explain why concise, rich replies and good failure copy are part of the product, not mere bot polish.",
            },
            {
              label: "Deep links complete the flow",
              meta: "Handoff model",
              summary: "Bot responses should route people back into the right member or project surface when a command alone is not enough.",
            },
          ],
        },
        {
          title: "Command scope is permissioned",
          description: "Not everyone should see or use the same command posture, and the docs should explain those boundaries.",
          items: [
            {
              label: "Owner and project toggles matter",
              meta: "Project model",
              summary: "Projects can decide which command rails are active because commands are part of how the community operating system behaves publicly.",
            },
            {
              label: "Captain and member scopes differ",
              meta: "Permission rule",
              summary: "Captain commands should be documented as an execution layer that sits above the member-facing command set, not as one flat list.",
            },
            {
              label: "Boundaries stay visible",
              meta: "Docs rule",
              summary: "A good command page explains why someone can or cannot do something, not just the syntax of the command itself.",
            },
          ],
        },
        {
          title: "Command rails connect to other surfaces",
          description: "A command is usually the first visible step in a longer system path.",
          items: [
            {
              label: "Community OS defines posture",
              meta: "Control layer",
              summary: "Projects should understand that command behavior is shaped in Community OS and related settings, not invented in the bot itself.",
            },
            {
              label: "Member Journey resolves the action",
              meta: "Experience layer",
              summary: "Many commands hand people into community home, missions, rewards or profile context after the initial response.",
            },
            {
              label: "Integrations and verification still matter",
              meta: "System dependency",
              summary: "Command docs should explain when external connections or verification rules affect whether a command can succeed fully.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "integrations",
    eyebrow: "Project Docs",
    title: "Integrations docs explain how Veltrix connects to the channels, providers and rails a project depends on.",
    description:
      "This page documents the integration layer from the project side: social verification, wallets, provider hooks, chat delivery and the system boundaries that keep integrations understandable.",
    surfaceTitle: "Integrations",
    chips: ["Providers", "Verification rails", "Connected systems"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference", label: "Open Reference" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/project-docs/quest-studio",
      "/project-docs/bot-commands",
      "/operator-docs/onchain-console",
      "/reference/verification-and-reward-model",
      "/reference/onchain-signal-and-recovery-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Founders, operators and technical growth teams.",
      body: "Integrations matter because they change what can be verified, delivered and recovered across the whole system.",
    },
    whatItIs: {
      description:
        "Integrations are the connected rails that let Veltrix verify actions, deliver bot responses, track on-chain context and move information across the product. This page explains the integration layer without collapsing into raw API detail.",
      bullets: [
        "It shows projects how provider choices shape product capabilities and verification posture.",
        "It connects social, wallet, bot and chain rails into one understandable system view.",
        "It keeps projects aware of the operational consequences when an integration is weak or misconfigured.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "A project cannot reason about verification, bot delivery or on-chain signals without understanding the integration rails underneath them.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Integration context appears across multiple project and operator surfaces rather than inside one isolated settings drawer.",
      items: [
        {
          label: "Project-facing setup",
          meta: "/settings and project workspace surfaces",
          summary: "Settings and project flows expose the parts of integration posture that teams need to configure or review directly.",
        },
        {
          label: "Builder dependency",
          summary: "Quest verification, bot delivery and on-chain recovery all depend on the right underlying integration posture.",
        },
        {
          label: "Operator connection",
          summary: "When integrations fail or drift, operator consoles like On-chain or Trust may become part of the follow-through story.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Integration anatomy",
      items: [
        {
          label: "Verification providers",
          meta: "Proof block",
          summary: "These determine how quests, social actions and submissions can be trusted or approved.",
        },
        {
          label: "Delivery rails",
          meta: "Activation block",
          summary: "Discord, Telegram and related channels define where command and notification experiences can happen.",
        },
        {
          label: "Wallet and chain rails",
          meta: "Recovery block",
          summary: "These affect on-chain signals, enrichment and the system’s ability to explain or recover chain-side behavior.",
        },
      ],
    },
    howItWorks: {
      title: "Integration flow",
      states: [
        {
          label: "Connect capabilities",
          summary: "Integrations first expand what the product can actually do for the project.",
          bullets: [
            "Verification and delivery posture both depend on connected providers.",
            "Projects should understand capability changes as product changes, not hidden infrastructure.",
            "The docs should help non-specialists read these dependencies clearly.",
          ],
        },
        {
          label: "Shape product behavior",
          summary: "Once connected, integration rails change how builders, commands and journeys behave.",
          bullets: [
            "Quest verification options become richer or narrower based on provider posture.",
            "Bot and community operations depend on which delivery rails are active.",
            "Chain-side experiences only work as well as wallet and enrichment rails allow.",
          ],
        },
        {
          label: "Recover when needed",
          summary: "Failures or drift move the story from project setup into operator recovery and observability.",
          bullets: [
            "Integration problems can become trust, payout or on-chain cases.",
            "Projects should understand when the system can self-recover and when it needs operator help.",
            "This keeps integration docs connected to the rest of the product.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Integrations are product dependencies",
          meta: "System rule",
          summary: "The docs should explain integrations through the product behaviors they unlock or constrain.",
        },
        {
          label: "Avoid raw API framing",
          meta: "Docs rule",
          summary: "Projects need understandable operational context, not raw endpoint descriptions on this page.",
        },
        {
          label: "Recovery belongs in the story",
          meta: "Ops rule",
          summary: "If an integration failure changes how the system behaves, the docs should point to the operator layer that handles the recovery.",
        },
      ],
    },
    deepDive: {
      title: "Why integration docs should explain product contracts, recovery posture and bounded visibility instead of raw API trivia.",
      description:
        "Integrations are valuable because of the product behavior they unlock. The docs should focus on those contracts and on what happens when they drift or fail.",
      sections: [
        {
          title: "Integrations are product contracts",
          description: "Every connection powers a specific part of the Veltrix system, from verification to on-chain recovery.",
          items: [
            {
              label: "Verification depends on source quality",
              meta: "Proof model",
              summary: "Projects should understand that integrations often determine what the system can verify confidently and what remains weaker evidence.",
            },
            {
              label: "Delivery rails depend on sync posture",
              meta: "Activation model",
              summary: "Bot, community and member-facing experiences are only as strong as the data and events integrations can supply reliably.",
            },
            {
              label: "The docs should stay product-led",
              meta: "Documentation rule",
              summary: "Integration pages should describe what changes in the product when a connection is healthy, missing or degraded.",
            },
          ],
        },
        {
          title: "Failures should become explainable cases",
          description: "Broken integrations are part of the safety and observability story, not just hidden technical glitches.",
          items: [
            {
              label: "Trust, payout and on-chain consoles inherit failures",
              meta: "Safety model",
              summary: "If an external dependency breaks a verification, claim or chain flow, the docs should explain which console becomes responsible next.",
            },
            {
              label: "Recovery posture varies by surface",
              meta: "Recovery rule",
              summary: "Some integration issues can be retried safely from a project context, while others remain internal-only operator work.",
            },
            {
              label: "Observability closes the loop",
              meta: "Platform rule",
              summary: "Projects should see that failed integrations are not invisible; they become snapshots, cases or escalations elsewhere in the platform.",
            },
          ],
        },
        {
          title: "Projects only need the bounded contract view",
          description: "The docs should keep public integration explanations useful without dumping raw internal mechanics.",
          items: [
            {
              label: "Projects see the consequences",
              meta: "Visibility model",
              summary: "What matters most at the project level is what the integration enables, what it blocks and what action the team can safely take.",
            },
            {
              label: "Operators see the deeper payload",
              meta: "Operator model",
              summary: "When failure analysis requires raw job or payload context, that belongs in the operator layer rather than the public project docs.",
            },
            {
              label: "Cross-links preserve depth",
              meta: "Docs rule",
              summary: "Integration pages should link into the exact reference and console pages that explain recovery in deeper detail.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "project-docs",
    slug: "project-settings",
    eyebrow: "Project Docs",
    title: "Project Settings explain how a team shapes workspace access, configuration and account posture.",
    description:
      "This page documents the settings layer: how profile, team, billing and project-specific control surfaces shape what a project can configure and how the team works together.",
    surfaceTitle: "Project Settings",
    chips: ["Settings", "Team access", "Workspace posture"],
    actions: [
      { href: "/project-docs", label: "Back to Project Docs" },
      { href: "/reference/permissions", label: "Open Permissions" },
    ],
    relatedHrefs: [
      "/project-docs",
      "/reference/permissions",
      "/project-docs/launch-workspace",
      "/project-docs/community-os",
      "/reference/launch-and-readiness-model",
      "/reference/community-and-member-signal-model",
    ],
    rail: {
      eyebrow: "Primary users",
      title: "Owners and workspace administrators.",
      body: "Settings are where a project defines who can access what, how the workspace behaves and how commercial posture is handled.",
    },
    whatItIs: {
      description:
        "Project Settings is the workspace governance layer. It covers team access, billing posture, personal settings and the context that shapes how a project uses the rest of Veltrix.",
      bullets: [
        "It explains the workspace itself rather than a single launch surface.",
        "It gives owners a place to understand team access and operating posture together.",
        "It links the commercial and administrative parts of the workspace back into product behavior.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Projects cannot operate confidently if team access, billing and basic workspace posture remain hidden behind fragmented settings flows.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Settings spans both general workspace controls and project-side operating context.",
      items: [
        {
          label: "Primary route",
          meta: "/settings",
          summary: "The shared settings workspace with subpages for profile, team and billing posture.",
        },
        {
          label: "Project connection",
          summary: "Project operations depend on the team and billing settings defined here even when the work happens elsewhere.",
        },
        {
          label: "Permission connection",
          summary: "Settings should be read together with the broader permission model documented in Reference.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Settings anatomy",
      items: [
        {
          label: "Profile controls",
          meta: "Personal block",
          summary: "Personal identity, account posture and user-level controls that affect how someone works in the product.",
        },
        {
          label: "Team controls",
          meta: "Workspace block",
          summary: "Who is in the workspace, what they can access and how the project team is structured.",
        },
        {
          label: "Billing posture",
          meta: "Commercial block",
          summary: "The commercial and subscription posture that affects how the workspace is maintained over time.",
        },
      ],
    },
    howItWorks: {
      title: "Settings flow",
      states: [
        {
          label: "Set personal posture",
          summary: "Users first understand their own identity and account settings before broader project governance comes into play.",
          bullets: [
            "This is the most individual layer of settings.",
            "It matters because account posture affects how people move through the workspace.",
            "The docs should still keep it connected to the team and project context around it.",
          ],
        },
        {
          label: "Govern team access",
          summary: "Owners and administrators shape who can use the workspace and what operational responsibility they can hold.",
          bullets: [
            "Team structure is one of the most important governance layers in the product.",
            "This is where project posture connects directly to permissions.",
            "The settings docs should make that governance role obvious.",
          ],
        },
        {
          label: "Maintain workspace posture",
          summary: "Billing and administrative settings keep the workspace sustainable after initial launch setup.",
          bullets: [
            "This is about ongoing workspace health, not one-time setup.",
            "Teams should understand what changes here can affect product access or operating posture.",
            "The docs should keep settings connected to the real work surfaces they support.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Settings shape the workspace",
          meta: "Governance rule",
          summary: "Settings are part of the operating system, not just profile forms hidden outside the main product.",
        },
        {
          label: "Permissions stay explicit",
          meta: "Access rule",
          summary: "Where settings affect team access, the docs should point back to the exact permission model instead of paraphrasing it loosely.",
        },
        {
          label: "Commercial posture matters",
          meta: "Billing rule",
          summary: "Billing and subscription posture should be explained as part of workspace continuity, not treated like an unrelated checkout screen.",
        },
      ],
    },
    deepDive: {
      title: "Why Project Settings should be documented as governance infrastructure instead of a leftover admin corner.",
      description:
        "Settings determine who can operate the system, what posture the workspace can sustain and how the team keeps access and continuity under control.",
      sections: [
        {
          title: "Workspace governance shapes every surface",
          description: "A launch or community workflow is only as coherent as the team structure and workspace posture behind it.",
          items: [
            {
              label: "Team structure changes operating power",
              meta: "Governance model",
              summary: "Who belongs to the workspace and what responsibility they can hold determines how well the rest of the product can actually be used.",
            },
            {
              label: "Personal and project posture still connect",
              meta: "Identity model",
              summary: "Profile settings matter because user identity and account posture influence how someone moves through project and operator surfaces.",
            },
            {
              label: "Settings are upstream of operations",
              meta: "System rule",
              summary: "Docs should show settings as an upstream layer that quietly shapes launch, community and safety consoles.",
            },
          ],
        },
        {
          title: "Permission posture must stay explicit",
          description: "As the product grows deeper, access should be explained through exact grants and bounded visibility rather than vague role labels alone.",
          items: [
            {
              label: "Owner intent matters",
              meta: "Access model",
              summary: "Owners decide which teammates can see or act inside project-bound safety and community layers, so settings docs should connect clearly to those permission systems.",
            },
            {
              label: "Summary-only defaults are intentional",
              meta: "Visibility rule",
              summary: "Where bounded consoles exist, the default posture should be documented as minimal visibility with explicit expansion by the owner.",
            },
            {
              label: "Reference pages hold the exact language",
              meta: "Docs rule",
              summary: "Settings pages should explain the operating meaning of permissions while pointing into Reference for precise matrices and state labels.",
            },
          ],
        },
        {
          title: "Commercial posture protects continuity",
          description: "Billing and subscription settings should be framed as part of keeping the workspace alive and stable.",
          items: [
            {
              label: "Billing affects continuity",
              meta: "Commercial model",
              summary: "Projects should understand how workspace continuity, access and plan posture connect rather than seeing billing as an isolated purchase surface.",
            },
            {
              label: "Administrative clarity reduces surprises",
              meta: "Stability rule",
              summary: "Good settings docs make it clear who can manage commercial posture and what happens when those settings change.",
            },
            {
              label: "Governance should feel intentional",
              meta: "Product rule",
              summary: "The docs should help settings read like part of the operating system, not like a neglected utility page.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "claims-and-resolution",
    eyebrow: "Operator Docs",
    title: "Claims and Resolution explain how issues move from queue to recovery inside the payout system.",
    description:
      "This page documents the operational flow behind claims: how blocked or disputed claims are reviewed, how timelines stay intact and how the system distinguishes queue work from final resolution.",
    surfaceTitle: "Claims and Resolution",
    chips: ["Queue flow", "Resolution", "Operator-facing"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/reference/payout-case-types", label: "Open Payout Cases" },
    ],
    relatedHrefs: ["/operator-docs", "/operator-docs/payout-console", "/reference/payout-case-types", "/reference/status-labels"],
    rail: {
      eyebrow: "Primary users",
      title: "Payout operators and support leads.",
      body: "This page exists to explain how claim work progresses operationally instead of looking like a flat review queue with hidden outcomes.",
    },
    whatItIs: {
      description:
        "Claims and Resolution is the workflow layer around the payout system. It explains how claims are reviewed, why they become cases and how they eventually resolve, escalate or remain blocked.",
      bullets: [
        "It keeps queue work and final resolution in the same visible story.",
        "It helps operators understand how claim incidents should be triaged and followed through.",
        "It explains why history and timeline matter when claims become more than simple approvals.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Claims are one of the highest-friction points in operational products. The docs need to make that flow explicit instead of assuming operators will infer it.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "This workflow lives primarily inside the payout surfaces, but the docs explain the bigger motion from queue to resolution.",
      items: [
        {
          label: "Internal route",
          meta: "/claims",
          summary: "The main internal payout operations workspace where queue, disputes, incidents and resolution logs live.",
        },
        {
          label: "Project touchpoint",
          meta: "/projects/<id>/payouts",
          summary: "Projects may enter the flow when bounded visibility or safe retry actions are part of the resolution.",
        },
        {
          label: "Reference dependency",
          summary: "Payout case types and status labels provide the exact language used throughout this workflow.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Workflow anatomy",
      items: [
        {
          label: "Queue posture",
          meta: "Entry block",
          summary: "Where claim work first becomes visible and where initial review or blockage is understood.",
        },
        {
          label: "Incident posture",
          meta: "Risk block",
          summary: "Where a claim becomes part of a broader payout problem, not just an isolated approval task.",
        },
        {
          label: "Resolution log",
          meta: "History block",
          summary: "Where the outcome of a case remains visible for future operators or project-side follow-through.",
        },
      ],
    },
    howItWorks: {
      title: "Resolution flow",
      states: [
        {
          label: "Review the queue",
          summary: "Operators first establish whether the claim is routine, blocked or part of a bigger payout issue.",
          bullets: [
            "This is the intake posture for claim operations.",
            "Not every queued claim becomes a deep incident, but the docs should explain when that happens.",
            "Status clarity matters immediately at this stage.",
          ],
        },
        {
          label: "Move into case-driven work",
          summary: "Once the claim has friction, it becomes part of a more explicit case and timeline.",
          bullets: [
            "This is where disputes, retries and project input start to matter.",
            "The timeline helps operators keep context when a claim path stops being simple.",
            "The docs should make this transition obvious rather than hidden behind implementation detail.",
          ],
        },
        {
          label: "Close with history",
          summary: "The outcome should remain visible even after the claim is resolved or dismissed.",
          bullets: [
            "Claims need historical visibility because the same project or member may appear again later.",
            "Resolution should not erase why a case existed.",
            "This is part of what makes payout docs operator-grade.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Claims are part of payout safety",
          meta: "Model rule",
          summary: "The docs should never describe claims as just approvals; they belong to the broader payout safety system.",
        },
        {
          label: "Resolution needs history",
          meta: "Audit rule",
          summary: "If a claim becomes operational work, the outcome should remain explainable for future operators and projects.",
        },
        {
          label: "Project involvement stays bounded",
          meta: "Permission rule",
          summary: "Projects may be involved in the resolution path, but only through explicit visibility and safe actions.",
        },
      ],
    },
    deepDive: {
      title: "Why claims and payout resolution are documented as a case-driven safety layer instead of a simple claims queue.",
      description:
        "Claims only become trustworthy when the system can explain why something is blocked, who can act and how the outcome gets written back into history.",
      sections: [
        {
          title: "Claim pressure becomes payout cases",
          description: "The product should shape blocked claims, disputes and delivery failures into explicit cases before recovery work begins.",
          items: [
            {
              label: "Classification creates the recovery path",
              meta: "Case model",
              summary: "A blocked claim, delivery failure or inventory risk should point toward a different next step, which is why the docs should explain case types clearly.",
            },
            {
              label: "The queue should answer why",
              meta: "Support rule",
              summary: "Claims pages should explain why the normal path stopped instead of asking operators or projects to infer the issue from raw logs.",
            },
            {
              label: "Case state is the product language",
              meta: "Status model",
              summary: "Open, blocked, retry-queued and resolved posture should be explicit so claim handling remains legible.",
            },
          ],
        },
        {
          title: "Project participation is bounded by default",
          description: "Projects should only see and do what the owner has allowed inside payout resolution.",
          items: [
            {
              label: "Summary-only is the default posture",
              meta: "Visibility model",
              summary: "The docs should explain that project teams usually start with summary access and receive more detail or actions through explicit grants.",
            },
            {
              label: "Project-safe actions stay limited",
              meta: "Permission rule",
              summary: "Annotate, escalate or bounded retry actions should be documented as fundamentally different from internal-only payout overrides.",
            },
            {
              label: "Owners control expansion",
              meta: "Governance rule",
              summary: "The payout console should read as a shared but permissioned console, not a fully self-serve project tool.",
            },
          ],
        },
        {
          title: "Resolution history is part of the product promise",
          description: "A claim is not really resolved unless the console can show what changed and why it is safe now.",
          items: [
            {
              label: "Retries should leave a trace",
              meta: "Audit model",
              summary: "Operators and projects need to see when a recovery step ran, whether it worked and what the case state became afterward.",
            },
            {
              label: "Disputes need visible closure",
              meta: "Trust rule",
              summary: "Dismissal, resolution or escalation all need written outcomes so later support work does not start from zero.",
            },
            {
              label: "The docs should protect confidence",
              meta: "Product rule",
              summary: "Explicit history is one of the main ways the claims layer earns member and project trust over time.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "escalations",
    eyebrow: "Operator Docs",
    title: "Escalations explain how ownership moves across consoles without losing context.",
    description:
      "This page documents the escalation layer that sits across trust, payout, on-chain and support work: who owns the next move, what the system is waiting on and how the handoff stays explainable.",
    surfaceTitle: "Escalations",
    chips: ["Ownership", "Waiting state", "Cross-console"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/reference/status-labels", label: "Open Status Labels" },
    ],
    relatedHrefs: ["/operator-docs", "/operator-docs/trust-console", "/operator-docs/payout-console", "/operator-docs/onchain-console", "/reference/status-labels"],
    rail: {
      eyebrow: "Primary users",
      title: "Operators coordinating recovery across teams.",
      body: "Escalations become a product layer once more than one person or team can own the next move in a recovery flow.",
    },
    whatItIs: {
      description:
        "Escalations is the cross-console workflow that tracks waiting states, next actions and named ownership when work moves between internal operators and project teams.",
      bullets: [
        "It helps the product explain who is expected to act next and why the case is still open.",
        "It gives operators a shared language for handoff across trust, payout and on-chain systems.",
        "It prevents recovery work from becoming opaque once multiple people are involved.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "The moment work crosses team boundaries, status labels and ownership become as important as the case detail itself.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Escalation posture is visible across multiple consoles rather than confined to a single one.",
      items: [
        {
          label: "Console surfaces",
          summary: "Trust, Payout and On-chain consoles all show escalation posture as part of their case and timeline views.",
        },
        {
          label: "Analytics and overview",
          summary: "Platform health and waiting-state visibility become meaningful once escalations aggregate across systems.",
        },
        {
          label: "Project involvement",
          summary: "Projects may see escalation state when bounded console access makes them part of the resolution path.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Escalation anatomy",
      items: [
        {
          label: "Owner",
          meta: "Responsibility block",
          summary: "Who currently owns the next meaningful move on the case or incident.",
        },
        {
          label: "Waiting state",
          meta: "Status block",
          summary: "Whether the system is waiting on internal review, project input or a queued recovery step.",
        },
        {
          label: "Next action",
          meta: "Execution block",
          summary: "What actually needs to happen before the case can move again.",
        },
      ],
    },
    howItWorks: {
      title: "Escalation flow",
      states: [
        {
          label: "Assign ownership",
          summary: "The case first needs a clear current owner before an escalation state is meaningful.",
          bullets: [
            "Ownership should not be inferred or hidden in comments.",
            "Named ownership helps support and operators coordinate across consoles.",
            "The docs should make this explicit as a system feature, not just best practice.",
          ],
        },
        {
          label: "Set waiting state",
          summary: "Once the owner is clear, the system needs to show what the case is actually waiting on.",
          bullets: [
            "Waiting on project and waiting on internal are meaningfully different postures.",
            "This keeps resolution work legible when it slows down.",
            "Status labels matter because they shape how quickly people can scan the system.",
          ],
        },
        {
          label: "Resolve or hand back",
          summary: "Escalation ends either when the case resolves or when ownership returns to another lane with enough context to continue.",
          bullets: [
            "A good handoff keeps the timeline coherent.",
            "Escalations should not create context loss across teams.",
            "This is why the docs need to explain escalations across consoles instead of inside one silo.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Ownership must be visible",
          meta: "Coordination rule",
          summary: "Escalation posture is not complete if a case lacks a clear current owner.",
        },
        {
          label: "Waiting state is product language",
          meta: "Status rule",
          summary: "The system should explain whether it is waiting on project input, internal review or a recovery action, not just that it is delayed.",
        },
        {
          label: "Cross-console consistency matters",
          meta: "Platform rule",
          summary: "Escalation posture should read the same way across trust, payout, on-chain and support surfaces.",
        },
      ],
    },
    deepDive: {
      title: "Why escalation docs focus on ownership, waiting state and next action instead of generic severity language.",
      description:
        "Escalations are only useful when they tell the team who owns the issue, what it is waiting on and what should happen next across all safety consoles.",
      sections: [
        {
          title: "Ownership is the backbone",
          description: "Escalation posture starts with naming the current operator, project contact or lane that has the ball.",
          items: [
            {
              label: "Current owner should never be hidden",
              meta: "Coordination model",
              summary: "The docs should explain that escalation only becomes meaningful once a case or incident has visible ownership attached to it.",
            },
            {
              label: "Ownership crosses consoles",
              meta: "Platform rule",
              summary: "Trust, payout, on-chain and community work should all use the same ownership logic so support can scan the platform quickly.",
            },
            {
              label: "Named owners improve accountability",
              meta: "Support rule",
              summary: "A clear owner reduces stalled cases and helps runbooks, overview and community follow-through stay aligned.",
            },
          ],
        },
        {
          title: "Waiting state explains why a case is paused",
          description: "Not every unresolved case is simply slow; some are explicitly waiting on project input, internal review or queued recovery.",
          items: [
            {
              label: "Waiting on project is distinct",
              meta: "Status model",
              summary: "Project-facing waiting posture matters because it changes both urgency and who is expected to act next.",
            },
            {
              label: "Queued recovery is still active work",
              meta: "Recovery model",
              summary: "Cases waiting on a retry or enrichment run should not read as abandoned; the docs should make that posture legible.",
            },
            {
              label: "Status labels are practical language",
              meta: "Docs rule",
              summary: "The escalation page should help readers interpret waiting states quickly rather than burying them in abstract definitions.",
            },
          ],
        },
        {
          title: "Escalation ends in a handoff or closure",
          description: "The point of escalation is controlled movement, not permanent limbo.",
          items: [
            {
              label: "Handoffs need enough context",
              meta: "Handoff model",
              summary: "The receiving team or project should inherit the case with enough timeline and next-step context to continue cleanly.",
            },
            {
              label: "Escalation can resolve indirectly",
              meta: "Outcome rule",
              summary: "Some escalations end when ownership moves and the next lane resolves the issue; the docs should show that as a coherent path.",
            },
            {
              label: "The platform should read consistently",
              meta: "System rule",
              summary: "Escalation language becomes much more valuable when it reads the same way everywhere the user encounters it.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "overview-and-analytics",
    eyebrow: "Operator Docs",
    title: "Overview and Analytics explain how platform health, outcomes and pressure become visible at the system level.",
    description:
      "This page documents the operator-facing summary layer: health, escalations, metric snapshots and outcome trends across the rest of the platform.",
    surfaceTitle: "Overview and Analytics",
    chips: ["Health", "Snapshots", "Outcome visibility"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/reference/status-labels", label: "Open Status Labels" },
    ],
    relatedHrefs: ["/operator-docs", "/operator-docs/escalations", "/release-notes/platform-phases", "/reference/status-labels"],
    rail: {
      eyebrow: "Primary users",
      title: "Operators and support leads.",
      body: "Overview and Analytics turns separate consoles into a readable platform posture so operators can tell what is healthy, what is blocked and what is trending the wrong way.",
    },
    whatItIs: {
      description:
        "Overview and Analytics is the summary layer over the platform. It brings together health, escalations, metric snapshots and outcome trends so teams can understand the system as a whole.",
      bullets: [
        "It explains how the platform feels at a glance rather than inside one console at a time.",
        "It keeps launch posture, support pressure and system outcomes readable in one place.",
        "It helps operators move from raw cases into platform-level understanding.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Without a system-level summary layer, operators would only ever see local problems and would struggle to understand platform-wide health or repeated patterns.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "The overview layer is built from the signals created everywhere else in the platform.",
      items: [
        {
          label: "Primary routes",
          meta: "/overview and /analytics",
          summary: "The command-center and trend-board surfaces that summarize how the platform is behaving.",
        },
        {
          label: "Source systems",
          summary: "Trust, payout, on-chain and community layers all feed the signals that make this summary meaningful.",
        },
        {
          label: "Escalation connection",
          summary: "Named ownership and waiting-state posture become more visible when they aggregate at the overview level.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Surface anatomy",
      items: [
        {
          label: "Health command center",
          meta: "Overview block",
          summary: "Shows launch health, system pressure, deploy posture and active escalations in one scan.",
        },
        {
          label: "Trend board",
          meta: "Analytics block",
          summary: "Shows how signals, outcomes or platform quality move over time instead of only right now.",
        },
        {
          label: "Escalation rail",
          meta: "Coordination block",
          summary: "Keeps support and operators aware of what needs intervention next.",
        },
      ],
    },
    howItWorks: {
      title: "Summary flow",
      states: [
        {
          label: "Aggregate signals",
          summary: "The system first needs to turn case and workflow signals into something summary surfaces can read clearly.",
          bullets: [
            "This is where metric snapshots and platform health aggregation matter.",
            "Local case detail becomes operator-level signal here.",
            "The docs should explain this summary layer as a real product system.",
          ],
        },
        {
          label: "Surface pressure",
          summary: "Once aggregated, the system can show what is trending well, what is blocked and where intervention is needed.",
          bullets: [
            "Operators should be able to scan the product for pressure, not just browse consoles reactively.",
            "Escalations and health are what make summaries actionable.",
            "This gives analytics practical value instead of decorative reporting.",
          ],
        },
        {
          label: "Guide next action",
          summary: "The goal is not only visibility, but better operating decisions across the platform.",
          bullets: [
            "Overview should tell people where to go next.",
            "Analytics should tell people what is changing over time and why it matters.",
            "The docs should preserve that distinction.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Summary should stay operational",
          meta: "UX rule",
          summary: "Overview and Analytics should help someone operate and decide, not just admire charts or status cards.",
        },
        {
          label: "Signals come from real systems",
          meta: "Data rule",
          summary: "The docs should explain that summary surfaces depend on signals generated by trust, payout, on-chain and community systems.",
        },
        {
          label: "Escalations stay visible",
          meta: "Support rule",
          summary: "Health without named ownership or waiting-state context is not enough for operator-grade decision-making.",
        },
      ],
    },
    deepDive: {
      title: "Why Overview and Analytics are documented as an intervention layer instead of a dashboard gallery.",
      description:
        "These pages only matter if they turn platform signals into pressure, ownership and better decisions. The docs should explain how summary surfaces remain operational.",
      sections: [
        {
          title: "Snapshots aggregate real system posture",
          description: "Overview and analytics are only credible because other consoles and jobs generate the signals they summarize.",
          items: [
            {
              label: "Metric snapshots come from live subsystems",
              meta: "Aggregation model",
              summary: "Trust, payout, on-chain, community and support systems all feed the health and outcome cards shown in the summary layer.",
            },
            {
              label: "Summary cards should compress complexity",
              meta: "Operator model",
              summary: "The goal is to help someone scan the platform quickly, not to duplicate every local console in miniature.",
            },
            {
              label: "Deploy hygiene belongs here too",
              meta: "Platform rule",
              summary: "If deploy posture or job health affects platform stability, the summary surfaces should expose that pressure in the same command-center language.",
            },
          ],
        },
        {
          title: "Trends should point toward action",
          description: "Analytics becomes useful when it explains where the platform is drifting and which team should care.",
          items: [
            {
              label: "Outcomes beat vanity metrics",
              meta: "Reporting rule",
              summary: "Charts and counts should help operators understand whether launches, community work or safety systems are improving or degrading.",
            },
            {
              label: "Named ownership matters at summary level",
              meta: "Escalation model",
              summary: "A summary page becomes more actionable when it preserves which issues still have an owner, waiting state or next action attached.",
            },
            {
              label: "Trend pages should route back into consoles",
              meta: "Navigation rule",
              summary: "Overview and analytics should help someone decide where to go next in the product, not trap them inside a reporting surface.",
            },
          ],
        },
        {
          title: "Summary and detail should stay in sync",
          description: "The docs need to explain that the high-level posture must always agree with the underlying cases and runs.",
          items: [
            {
              label: "Health without detail is weak",
              meta: "Trust rule",
              summary: "If a summary page cannot be traced back to the underlying console state, operators will stop trusting it.",
            },
            {
              label: "Detail without summary is noisy",
              meta: "Usability rule",
              summary: "Conversely, operators need the summary layer so they do not have to infer platform posture from dozens of local issues.",
            },
            {
              label: "The docs should teach both directions",
              meta: "Docs rule",
              summary: "Readers should learn how to move from summary to detail and back again as part of the operating model.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "runbooks",
    eyebrow: "Operator Docs",
    title: "Runbooks explain how operators handle incidents and recover the platform without improvising.",
    description:
      "This page documents the runbook layer: the playbooks for outages, degraded flows, deploy hygiene and the support routines that turn chaos into repeatable action.",
    surfaceTitle: "Runbooks",
    chips: ["Playbooks", "Incident response", "Operator hygiene"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/release-notes", label: "Open Release Notes" },
    ],
    relatedHrefs: ["/operator-docs", "/operator-docs/escalations", "/operator-docs/overview-and-analytics", "/release-notes/platform-phases"],
    rail: {
      eyebrow: "Primary users",
      title: "Support, reliability and incident operators.",
      body: "Runbooks matter because a serious product cannot rely on memory and improvisation once something important fails.",
    },
    whatItIs: {
      description:
        "Runbooks are the operator playbooks for failure, degraded behavior, deployment hygiene and cross-team response. They explain how the system should be handled when normal paths are not enough.",
      bullets: [
        "They turn support and incident response from ad hoc heroics into repeatable process.",
        "They connect technical recovery to product surfaces and escalation posture.",
        "They help operators know when to inspect, retry, escalate or pause rather than guessing.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Once a platform gets this deep, good operations requires shared playbooks. The docs should surface them as part of the product, not as hidden internal notes.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Runbooks are informed by the whole platform, but should route operators back into the right live surfaces quickly.",
      items: [
        {
          label: "Runbook discovery",
          summary: "Operators should be able to find the relevant playbook from the console or summary surface that exposed the issue.",
        },
        {
          label: "Connected surfaces",
          summary: "Overview, escalations, trust, payout and on-chain consoles all create the contexts where runbooks become relevant.",
        },
        {
          label: "Deploy hygiene",
          summary: "Some runbooks are about outages or incidents, while others are about keeping deployments and rollout posture healthy.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Runbook anatomy",
      items: [
        {
          label: "Detection",
          meta: "First block",
          summary: "How the operator knows there is a real problem and where the signal first appears.",
        },
        {
          label: "Decision path",
          meta: "Response block",
          summary: "The bounded set of actions or handoffs that should happen next.",
        },
        {
          label: "Escalation or closure",
          meta: "Outcome block",
          summary: "How the incident leaves the runbook path: via resolution, escalation or monitored follow-up.",
        },
      ],
    },
    howItWorks: {
      title: "Runbook flow",
      states: [
        {
          label: "Detect and classify",
          summary: "Operators first identify the problem and match it to the right category of incident or degraded behavior.",
          bullets: [
            "Good runbooks start with recognition, not action spam.",
            "Overview and console signals are often what makes classification possible.",
            "The docs should make this identification step explicit.",
          ],
        },
        {
          label: "Follow a bounded path",
          summary: "The runbook gives a narrow set of recovery moves or escalation options instead of asking the operator to invent a process.",
          bullets: [
            "This makes incident response calmer and safer.",
            "It also reduces drift between different operators handling similar issues.",
            "The docs should position runbooks as real operating aids, not theory pages.",
          ],
        },
        {
          label: "Capture the outcome",
          summary: "The final step is making sure the incident leaves behind usable history and next-step context.",
          bullets: [
            "Some incidents resolve immediately, others move into escalation or monitoring.",
            "Either way, the path should remain visible for the team.",
            "This is how runbooks stay part of a larger product operating model.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Runbooks should stay actionable",
          meta: "Ops rule",
          summary: "A runbook is valuable only if it helps someone act under pressure without inventing new process in the moment.",
        },
        {
          label: "Surfaces should point into runbooks",
          meta: "Navigation rule",
          summary: "Operators should discover runbooks from the console or overview context that surfaced the issue in the first place.",
        },
        {
          label: "History matters after recovery",
          meta: "Learning rule",
          summary: "Runbooks should support visible outcomes so repeated incidents become easier to handle later.",
        },
      ],
    },
    deepDive: {
      title: "Why runbooks are treated as living operator tools rather than static incident notes.",
      description:
        "Runbooks matter because they reduce improvisation under pressure. The docs should explain how they are triggered, how they bound response and how they leave learning behind.",
      sections: [
        {
          title: "Runbooks begin at signal recognition",
          description: "A runbook is relevant only when the operator can classify what kind of degraded behavior they are looking at.",
          items: [
            {
              label: "Signals should point into a playbook",
              meta: "Trigger model",
              summary: "Overview, escalations and console-specific incidents should make it clear which playbook category the operator is in.",
            },
            {
              label: "Classification prevents action spam",
              meta: "Ops rule",
              summary: "The docs should reinforce that operators should not fire every possible retry or pause action until they know what type of issue they are facing.",
            },
            {
              label: "Runbooks are part of product posture",
              meta: "Platform rule",
              summary: "A serious public product needs discoverable playbooks just as much as it needs visible consoles.",
            },
          ],
        },
        {
          title: "Playbooks intentionally narrow the response",
          description: "A good runbook makes the next few choices smaller and safer.",
          items: [
            {
              label: "Bounded recovery protects the platform",
              meta: "Response model",
              summary: "Operators should understand which actions are safe first moves and which ones are escalation-only or last-resort paths.",
            },
            {
              label: "Consistency matters more than heroics",
              meta: "Operations rule",
              summary: "Runbooks help different operators respond the same way to similar problems, which improves product stability over time.",
            },
            {
              label: "Cross-surface links keep context intact",
              meta: "Docs rule",
              summary: "A runbook should always point back into the surface that exposed the issue so the operator never loses the live state of the problem.",
            },
          ],
        },
        {
          title: "Runbooks should improve future response",
          description: "Recovery is only half the value; better future recognition is the other half.",
          items: [
            {
              label: "Outcomes need visible capture",
              meta: "Learning model",
              summary: "The team should be able to see whether a runbook led to resolution, escalation, monitoring or a follow-up change in posture.",
            },
            {
              label: "Repeat incidents should get easier",
              meta: "Improvement rule",
              summary: "A useful runbook helps the next operator respond with more clarity and less time-to-understanding.",
            },
            {
              label: "Docs and platform history should align",
              meta: "System rule",
              summary: "The public explanation of the playbook should match the real operating patterns the platform now uses.",
            },
          ],
        },
      ],
    },
  },
  {
    track: "operator-docs",
    slug: "incident-handling",
    eyebrow: "Operator Docs",
    title: "Incident Handling explains how Veltrix moves from signal to coordinated recovery.",
    description:
      "This page documents the broader incident response layer across consoles, summary surfaces and support posture: how incidents are recognized, coordinated and brought back under control.",
    surfaceTitle: "Incident Handling",
    chips: ["Incidents", "Recovery coordination", "Operator response"],
    actions: [
      { href: "/operator-docs", label: "Back to Operator Docs" },
      { href: "/operator-docs/runbooks", label: "Open Runbooks" },
    ],
    relatedHrefs: ["/operator-docs", "/operator-docs/escalations", "/operator-docs/overview-and-analytics", "/operator-docs/runbooks"],
    rail: {
      eyebrow: "Primary users",
      title: "Incident leads and support operators.",
      body: "Incident handling sits above any single console because it explains how the platform responds when several systems need attention at once.",
    },
    whatItIs: {
      description:
        "Incident Handling is the cross-system response layer for platform problems that need coordination, not just local case resolution. It describes how teams move from signal to ownership to recovery across the whole product.",
      bullets: [
        "It explains how issues become incidents instead of staying isolated console problems.",
        "It connects health visibility, escalation posture and runbooks into one response model.",
        "It helps operators understand platform-wide response beyond single-case handling.",
      ],
      asideTitle: "Why it exists",
      asideBody:
        "Some failures are bigger than one console or one case. The docs need a page that explains how the whole operating system responds under pressure.",
    },
    whereToFind: {
      title: "Where to find it",
      description: "Incident handling spans multiple surfaces and should be read as a coordination layer, not one page in isolation.",
      items: [
        {
          label: "Signal entrypoints",
          summary: "Overview, Analytics and the individual operator consoles are often the first place an incident becomes visible.",
        },
        {
          label: "Coordination rails",
          summary: "Escalations, runbooks and named ownership become the main coordination tools once an incident is recognized.",
        },
        {
          label: "Recovery surfaces",
          summary: "The actual resolution may still happen inside Trust, Payout, On-chain or Community systems, depending on the issue.",
        },
      ],
    },
    surfaceAnatomy: {
      title: "Incident anatomy",
      items: [
        {
          label: "Detection",
          meta: "Signal block",
          summary: "The system notices a problem through health drift, failures or repeated pressure patterns.",
        },
        {
          label: "Coordination",
          meta: "Response block",
          summary: "The team assigns ownership, opens the right runbook and aligns next actions across surfaces.",
        },
        {
          label: "Recovery and learning",
          meta: "Outcome block",
          summary: "The product returns to a healthy posture while preserving enough history to respond better next time.",
        },
      ],
    },
    howItWorks: {
      title: "Incident flow",
      states: [
        {
          label: "Recognize the incident",
          summary: "The first step is deciding that the problem is bigger than local console work and needs wider coordination.",
          bullets: [
            "This usually happens when multiple systems or teams are affected.",
            "Overview and health summaries help make that recognition possible.",
            "The docs should show why this is different from normal case handling.",
          ],
        },
        {
          label: "Coordinate the response",
          summary: "Once recognized, the issue needs ownership, escalation posture and a bounded response plan.",
          bullets: [
            "Runbooks keep the response from becoming improvised.",
            "Escalation language keeps the team clear on who acts next.",
            "The docs should explain this as an operating model, not a vague principle.",
          ],
        },
        {
          label: "Restore and learn",
          summary: "A resolved incident should leave the platform healthier and the team better prepared for the next one.",
          bullets: [
            "Recovery is not just getting back to green; it also means preserving useful context.",
            "This is where incident handling connects back into release notes, runbooks and observability.",
            "The docs should help people see that incidents are part of the full system story.",
          ],
        },
      ],
    },
    keyRules: {
      title: "Key rules",
      items: [
        {
          label: "Incidents exceed local cases",
          meta: "Model rule",
          summary: "The docs should distinguish clearly between single-console resolution and multi-surface incident response.",
        },
        {
          label: "Coordination must be explicit",
          meta: "Response rule",
          summary: "Ownership, runbooks and waiting-state posture should all be visible once an incident is underway.",
        },
        {
          label: "History improves future response",
          meta: "Learning rule",
          summary: "Incident handling should leave behind enough context that future operators can respond faster and more consistently.",
        },
      ],
    },
    deepDive: {
      title: "Why incident handling is documented above any single console.",
      description:
        "Incidents are cross-system coordination events. The docs should explain how local case pressure becomes broader incident posture and how the platform recovers coherently.",
      sections: [
        {
          title: "Incidents are promoted from local pressure",
          description: "Not every issue is an incident. The incident model begins when the problem is larger than one console or team lane.",
          items: [
            {
              label: "Repeated or multi-system pressure matters",
              meta: "Promotion model",
              summary: "When several consoles degrade together or an issue creates wider launch and support risk, the system should treat it as an incident instead of local noise.",
            },
            {
              label: "Health drift is often the clue",
              meta: "Detection model",
              summary: "Overview and analytics help reveal when a pattern is no longer isolated and needs coordinated attention.",
            },
            {
              label: "The docs should distinguish scale clearly",
              meta: "Docs rule",
              summary: "Readers need to understand why incident handling exists above trust, payout or on-chain resolution alone.",
            },
          ],
        },
        {
          title: "Coordination uses shared language",
          description: "Once promoted, an incident needs named owners, runbooks and waiting-state posture that everyone can read.",
          items: [
            {
              label: "Ownership and escalation are central",
              meta: "Coordination model",
              summary: "Incident work is mostly about aligning people and systems, not just triggering technical actions.",
            },
            {
              label: "Runbooks narrow the recovery path",
              meta: "Response rule",
              summary: "The docs should explain how incident handling leans on runbooks so the response stays bounded and repeatable.",
            },
            {
              label: "Consoles remain the execution layer",
              meta: "Surface rule",
              summary: "Even during an incident, recovery often still happens inside the underlying trust, payout, on-chain or community surfaces.",
            },
          ],
        },
        {
          title: "Closure should leave the platform smarter",
          description: "A resolved incident should make future detection and response better, not just restore green status.",
          items: [
            {
              label: "History becomes training data for operators",
              meta: "Learning model",
              summary: "Incident timelines, runbook outcomes and overview signals help future operators recognize similar patterns faster.",
            },
            {
              label: "Release notes and observability matter",
              meta: "Platform improvement",
              summary: "The docs should connect incident handling back into platform evolution so public product posture and recovery practice stay aligned.",
            },
            {
              label: "Recovery includes confidence repair",
              meta: "Trust rule",
              summary: "Part of incident closure is making sure projects and operators can understand what happened and why the system is stable again.",
            },
          ],
        },
      ],
    },
  },
];

export function getDocsGuidePage(track: "project-docs" | "operator-docs", slug: string) {
  return docsGuidePages.find((page) => page.track === track && page.slug === slug);
}
