import type { DocsReferenceDataset } from "@/lib/docs-data/types";

const docsReferenceDatasets: DocsReferenceDataset[] = [
  {
    slug: "docs-coverage-map",
    title: "Docs Coverage Map",
    summary: "The atlas view of which VYNTRO product domains are covered by surface docs, workflow docs and exact reference language.",
    entries: [
      { label: "Project launch and builders", meta: "Surface and workflow heavy", summary: "Launch Workspace, Campaign Studio, Quest Studio, Raid Studio and reward flows now have both narrative surface coverage and system-model depth." },
      { label: "Community and member journey", meta: "Cross-lane coverage", summary: "Community OS, member journey, commands and integrations are documented from both the project operating side and the member consequence side." },
      { label: "Safety consoles", meta: "Deep operator coverage", summary: "Trust, payout and on-chain each have flagship console docs, workflows and reference pages for scoring, cases, states and bounded visibility." },
      { label: "Observability and support", meta: "Operator and reference coverage", summary: "Overview, analytics, escalations, runbooks and incident handling are documented as a connected operating layer rather than isolated pages." },
      { label: "Bots and delivery rails", meta: "Project and reference coverage", summary: "Bot commands and automation rails are documented through project usage, reference dictionaries and workflow context." },
      { label: "Public launch and legal surfaces", meta: "Supporting coverage", summary: "The public site, privacy, terms, support and reward disclaimer exist in the product and are part of the docs-aware launch posture even if they need fewer deep reference pages." },
    ],
    matrix: {
      title: "Coverage depth matrix",
      description: "This map shows where the encyclopedia is already deep across surfaces, workflows and exact system language.",
      columns: ["Surface docs", "Workflow docs", "Reference depth"],
      rows: [
        {
          label: "Launch and builder domain",
          values: ["Strong", "Strong", "Strong"],
          summary: "Launch Workspace, builders and their operating models now read as one of the deepest domains in the docs product.",
        },
        {
          label: "Community and member domain",
          values: ["Strong", "Strong", "Strong"],
          summary: "Community OS, member journey, commands and connected signal models now explain both execution and downstream member effect.",
        },
        {
          label: "Safety console domain",
          values: ["Strong", "Strong", "Strong"],
          summary: "Trust, payout and on-chain are now covered through console pages, workflows and detailed scoring, case and recovery reference pages.",
        },
        {
          label: "Observability and support domain",
          values: ["Strong", "Strong", "Medium to strong"],
          summary: "Overview, analytics, escalations, runbooks and incident handling have good operating coverage, with room for future ultra-granular playbook references if needed.",
        },
        {
          label: "Public site and support domain",
          values: ["Medium", "Light", "Light"],
          summary: "These surfaces are intentionally simpler but still belong in the atlas so the docs reflect the whole public system.",
        },
      ],
    },
    deepDive: {
      title: "How to read the coverage map",
      description: "The goal of this page is not to grade the product for its own sake, but to make it easy to see whether a reader can understand each domain from multiple angles.",
      sections: [
        {
          title: "Coverage should be layered",
          description: "A domain becomes easy to understand when the docs explain the page itself, the repeated workflow and the exact system rules behind both.",
          items: [
            {
              label: "Surface layer",
              meta: "What it is",
              summary: "Surface docs orient the reader by showing anatomy, route placement and connected pages.",
            },
            {
              label: "Workflow layer",
              meta: "How it moves",
              summary: "Workflow docs explain the actual sequence of decisions, handoffs and safe actions across several surfaces.",
            },
            {
              label: "Reference layer",
              meta: "Why it is exact",
              summary: "Reference pages prevent drift by defining the shared states, permissions, case types and scoring logic once.",
            },
          ],
        },
        {
          title: "The deepest areas are the operating core",
          description: "The docs are most mature where the product would otherwise feel most complex or opaque.",
          items: [
            {
              label: "Builders and launch",
              meta: "Project core",
              summary: "Because launch setup is where first impressions are formed, the encyclopedia now gives it both strategic and exact operational treatment.",
            },
            {
              label: "Trust, payout and on-chain",
              meta: "Safety core",
              summary: "These domains needed the deepest explanation because warnings, flags and bounded visibility are easy to misunderstand without real system context.",
            },
            {
              label: "Community and member loop",
              meta: "Growth core",
              summary: "This area now explains how commands, captains, cohorts and journey signals reinforce one another instead of reading like separate subsystems.",
            },
          ],
        },
        {
          title: "The next level of completeness is control-level coverage",
          description: "Once domain-level coverage is strong, the next useful layer is explaining concrete controls, actions and visibility rules page by page.",
          items: [
            {
              label: "Why a control atlas exists",
              meta: "Docs evolution",
              summary: "Readers often need to know not only what a surface is, but what each family of controls changes and who should use it.",
            },
            {
              label: "Coverage is now broad enough for that layer",
              meta: "Atlas readiness",
              summary: "Because the main domains already have strong narrative and reference coverage, the docs product can now support a cross-surface control atlas usefully.",
            },
            {
              label: "The atlas should stay linked",
              meta: "Navigation rule",
              summary: "Control-level explanations are strongest when they remain tied to the domains and workflows that use them rather than floating as an abstract glossary.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "control-atlas",
    title: "Control Atlas",
    summary: "The map of the main control families across launch, builders, community surfaces and safety consoles.",
    entries: [
      { label: "Builder entry controls", meta: "Route and context controls", summary: "Launch Workspace entries, project-first create routes and campaign handoffs decide where a creation session begins and which context it inherits." },
      { label: "Lifecycle controls", meta: "State controls", summary: "Publish, pause, resume, archive and duplicate actions move objects through safe lifecycle posture rather than letting them drift informally." },
      { label: "Verification and incentive controls", meta: "Mission controls", summary: "Action placement, proof posture and reward framing determine not only mission design but later claim and payout consequences." },
      { label: "Visibility and permission grants", meta: "Access controls", summary: "Summary-only defaults, detail grants and action grants control how much of a shared console a project teammate can actually see or use." },
      { label: "Warnings, flags and severity labels", meta: "Signal controls", summary: "These controls do not always mutate data directly, but they change how the system explains trust, payout, readiness and on-chain posture." },
      { label: "Recovery and escalation controls", meta: "Resolution controls", summary: "Retry, rerun, rescan, annotate, escalate, resolve and dismiss keep live systems recoverable without exposing unsafe global actions broadly." },
      { label: "Command and automation controls", meta: "Delivery controls", summary: "Bot toggles, command scopes and automation rails extend community and member-facing execution beyond the core web surfaces." },
    ],
    matrix: {
      title: "Control family matrix",
      description: "This matrix shows where the major control families live, what they change and who usually operates them.",
      columns: ["Primary surfaces", "What the controls change", "Typical operator"],
      rows: [
        {
          label: "Builder entry and launch controls",
          values: ["Launch Workspace, Campaign Studio, Quest Studio, Raid Studio", "Which builder opens next and what context it inherits", "Project founders and operators"],
          summary: "These controls shape the structure and sequencing of setup rather than only the content inside a form.",
        },
        {
          label: "Lifecycle controls",
          values: ["Campaign, quest, raid and reward detail surfaces", "Whether an object is draft, ready, live, paused or archived", "Project owners and leads"],
          summary: "Lifecycle-safe controls are some of the most important trust-preserving actions in the product.",
        },
        {
          label: "Permission and visibility controls",
          values: ["Trust, payout, on-chain and community consoles", "What a user can see and what actions they can take", "Owners and internal operators"],
          summary: "These controls keep shared consoles collaborative without turning them into unsafe all-access workspaces.",
        },
        {
          label: "Signal and warning controls",
          values: ["Launch, trust, payout, on-chain, overview", "How the system frames risk, readiness and urgency", "Project teams and operators"],
          summary: "Warnings and labels are part of the control atlas because they shape interpretation and next action.",
        },
        {
          label: "Recovery controls",
          values: ["Claims, moderation, on-chain and support rails", "How an issue is retried, rerun, escalated or closed", "Internal operators with bounded project participation"],
          summary: "These controls are strongest when they are explicit about what is safe for projects and what stays internal-only.",
        },
        {
          label: "Delivery controls",
          values: ["Community OS, bot command settings, integrations", "How community intent reaches members and channels", "Owners, captains and community leads"],
          summary: "Delivery controls bridge community operations and the member-facing product experience.",
        },
      ],
    },
    deepDive: {
      title: "How control families should be read",
      description: "Controls become easier to understand once they are grouped by what they are trying to change in the product rather than by whichever page happens to host them.",
      sections: [
        {
          title: "State controls",
          description: "Some controls primarily move an object or workflow into a new posture.",
          items: [
            {
              label: "Publish, pause and archive",
              meta: "Lifecycle family",
              summary: "These are state-transition controls because they change the object's operating posture across the whole product.",
            },
            {
              label: "Launch readiness actions",
              meta: "Setup family",
              summary: "Builder-entry actions and launch checklist prompts are also stateful because they move the project toward a safer launch tier.",
            },
            {
              label: "Why this matters",
              meta: "Interpretation rule",
              summary: "Readers should know when a control changes a core object state versus when it merely reveals more context.",
            },
          ],
        },
        {
          title: "Visibility controls",
          description: "Other controls exist primarily to bound what different people can see or interpret.",
          items: [
            {
              label: "Summary-only defaults",
              meta: "Access family",
              summary: "These controls intentionally expose a calmer, safer posture to most project users before any deeper detail is granted.",
            },
            {
              label: "Warnings and flags",
              meta: "Signal family",
              summary: "Labels, bands and warning chips help readers interpret health and risk without always granting deeper action rights.",
            },
            {
              label: "Why this matters",
              meta: "Product rule",
              summary: "A docs atlas should treat signaling and visibility as first-class controls because they change behavior even when they do not mutate an object directly.",
            },
          ],
        },
        {
          title: "Recovery controls",
          description: "The last major family is about moving a live issue toward closure while preserving safety and history.",
          items: [
            {
              label: "Retry, rerun and rescan",
              meta: "Bounded recovery",
              summary: "These controls are safe when they are scoped tightly to a case or project context and leave history behind.",
            },
            {
              label: "Annotate, escalate, resolve and dismiss",
              meta: "Case management",
              summary: "These actions shape ownership, explanation and closure more than raw system data, which is why they belong in the atlas too.",
            },
            {
              label: "Why this matters",
              meta: "Trust rule",
              summary: "A live system feels more trustworthy when people can tell which recovery controls are safe, who can use them and what they will write back into the history layer.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "empty-states-and-zero-data",
    title: "Empty States and Zero-Data",
    summary: "The reference model for how VYNTRO should explain blank, calm, blocked or not-yet-configured surfaces without leaving users guessing.",
    entries: [
      { label: "Not configured yet", meta: "Setup posture", summary: "Use when the surface is empty because the user has not created the underlying object or connected the required setup yet." },
      { label: "Configured but quiet", meta: "Calm posture", summary: "Use when the system is healthy but currently has no open work, incidents, claims or matching activity in that slice." },
      { label: "Blocked elsewhere", meta: "Dependency posture", summary: "Use when the page is empty because another surface or owner still has unresolved prerequisite work." },
      { label: "No permission to see detail", meta: "Bounded visibility", summary: "Use when the console intentionally withholds deeper detail and the correct next move is to understand the boundary, not assume the data is missing." },
    ],
    matrix: {
      title: "Empty-state matrix",
      description: "An empty surface should help the user understand what kind of emptiness they are seeing and what to do next.",
      columns: ["State type", "What it means", "Best next move"],
      rows: [
        {
          label: "No object yet",
          values: ["The campaign, quest, reward, raid or provider connection does not exist yet", "Open the builder or setup path that creates the missing object", "Use an explicit creation CTA with route context"],
          summary: "This is the most common builder-side empty state and should feel like a guided starting line rather than a blank panel.",
        },
        {
          label: "Healthy but no activity",
          values: ["The surface is structurally ready but currently has no matching activity, incidents or queued work", "Reassure the reader and explain what would make this surface populate later", "Prefer calm copy over urgency language"],
          summary: "Analytics, resolution history and quiet safety consoles often need this posture so users do not confuse calmness with failure.",
        },
        {
          label: "Blocked by dependency",
          values: ["Another surface still owns the missing prerequisite or unresolved blocker", "Route directly to the owning surface or next bounded action", "Name the dependency clearly"],
          summary: "A good dependency empty state prevents users from clicking around randomly when the answer already lives in Launch, Integrations, Claims or another lane.",
        },
        {
          label: "Summary-only empty",
          values: ["The user can see that the console exists but not the deeper detail", "Explain the permission boundary or owner-managed grant path", "Avoid implying the system failed to load"],
          summary: "This posture matters for trust, payout and on-chain because bounded visibility is a feature, not a bug.",
        },
      ],
    },
    deepDive: {
      title: "How empty states should behave in a serious product manual",
      description: "An empty state is part of product logic. The docs should explain what the system knows, what it does not know yet and whether the user can change that from here.",
      sections: [
        {
          title: "Empty should still be informative",
          description: "A surface without rows, cases or objects should still teach the user what category of product posture they are looking at.",
          items: [
            {
              label: "Name the missing thing",
              meta: "Clarity rule",
              summary: "The strongest empty states tell the reader exactly what object, capability or prerequisite is still absent instead of speaking in generic placeholder language.",
            },
            {
              label: "Explain whether the system is calm or incomplete",
              meta: "Interpretation rule",
              summary: "Quiet history and incomplete setup are very different postures, so the copy should make that difference legible immediately.",
            },
            {
              label: "Preserve product confidence",
              meta: "UX rule",
              summary: "A good empty state should reassure the reader that the system understands the surface, even if the answer is currently 'nothing here yet'.",
            },
          ],
        },
        {
          title: "Dependency empties should route cleanly",
          description: "When another surface owns the next move, the empty state should act like a handoff, not a dead end.",
          items: [
            {
              label: "Point to the owning surface",
              meta: "Navigation rule",
              summary: "If Launch Workspace, Integrations, Project Settings or another console is the real unblocker, the empty state should say so explicitly.",
            },
            {
              label: "Keep the next move bounded",
              meta: "Action rule",
              summary: "The state should recommend one safe next step instead of presenting a bag of unrelated links or options.",
            },
            {
              label: "Avoid implied blame",
              meta: "Tone rule",
              summary: "Dependency empties should explain the blocker without sounding accusatory toward the project, operator or another team lane.",
            },
          ],
        },
        {
          title: "Bounded empties should explain visibility",
          description: "When a page is intentionally quiet because of permissions, the docs should treat that as part of the control system.",
          items: [
            {
              label: "Permission language should be explicit",
              meta: "Access rule",
              summary: "Readers should understand whether they are seeing a summary-only surface, a hidden detail area or a true absence of data.",
            },
            {
              label: "Owner-managed grants matter",
              meta: "Governance rule",
              summary: "If deeper detail exists behind owner-controlled grants, the docs should explain that path rather than implying the data is unavailable to everyone.",
            },
            {
              label: "The UI should still feel complete",
              meta: "Product rule",
              summary: "Even bounded pages should read as deliberate product surfaces, not partial or broken loads.",
            },
          ],
        },
        {
          title: "Surface-level examples",
          description: "These examples show how empty states should sound on real VYNTRO surfaces instead of as abstract rules only.",
          items: [
            {
              label: "\"No launch spine yet. Open Campaign Studio to define the first campaign architecture for this project.\"",
              meta: "Launch Workspace example",
              summary: "This is a good not-configured-yet empty state because it names the missing object and gives one explicit next move.",
            },
            {
              label: "\"No active payout issues right now. Claims and delivery history will appear here when a reward path needs review.\"",
              meta: "Payout calm-state example",
              summary: "This is a good configured-but-quiet message because it reassures the reader that the system is healthy instead of implying a failed load.",
            },
            {
              label: "\"Trust detail is bounded on this project. Ask an owner for case-detail access if you need member-level evidence.\"",
              meta: "Summary-only example",
              summary: "This is a good bounded empty state because it explains that the silence comes from permissions rather than missing data.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "action-buttons-and-safe-next-moves",
    title: "Action Buttons and Safe Next Moves",
    summary: "The reference model for what core action buttons do, when they appear and how they move users into the next safe product posture.",
    entries: [
      { label: "Open or continue", meta: "Routing actions", summary: "Buttons that move the user into a builder, workflow or linked surface with context preserved." },
      { label: "Change state", meta: "Lifecycle actions", summary: "Buttons that publish, pause, resume, archive, duplicate or otherwise change how the system treats the object." },
      { label: "Recover or resolve", meta: "Case actions", summary: "Buttons that retry, rerun, rescan, annotate, escalate, resolve or dismiss live issues with explicit boundaries." },
      { label: "Grant or reveal", meta: "Visibility actions", summary: "Buttons that expand visibility, apply grants or otherwise change who can see and do what next." },
    ],
    matrix: {
      title: "Action behavior matrix",
      description: "A button is easier to understand when readers know whether it routes, mutates state, starts recovery or changes access.",
      columns: ["Action family", "What changes", "What good docs should explain"],
      rows: [
        {
          label: "Open builder or continue flow",
          values: ["The user moves into another surface with source context attached", "Why this surface is next and what context will already be present", "That the action routes rather than mutates state directly"],
          summary: "These buttons are common in Launch Workspace, builders, bots and summary pages where the product is guiding the next move.",
        },
        {
          label: "Publish, pause, archive, duplicate",
          values: ["The object's lifecycle posture changes", "What downstream surfaces will now read differently", "Which users can safely take the action"],
          summary: "Lifecycle buttons should be documented as trust-bearing controls because they affect the full operating system around the object.",
        },
        {
          label: "Retry, rerun, rescan, resolve",
          values: ["A live issue moves into bounded recovery or closure", "What blocker should already be visible before this action is used", "What history will be written after the action completes"],
          summary: "These controls matter most in trust, payout and on-chain flows where the system must stay explainable while recovering.",
        },
        {
          label: "Grant access or reveal detail",
          values: ["Another user or lane can now see more or do more", "Which visibility or action boundary changed", "Whether the change is owner-only or broadly available"],
          summary: "Grant actions are governance controls and should never read like casual toggles.",
        },
      ],
    },
    deepDive: {
      title: "How to document button behavior in a product-grade manual",
      description: "The docs should tell readers what a button changes, why it is safe, when it appears and what the next surface or state will be afterward.",
      sections: [
        {
          title: "Route buttons should preserve narrative",
          description: "Buttons that open another page should still explain the story of why the user is going there next.",
          items: [
            {
              label: "Source context matters",
              meta: "Routing rule",
              summary: "Open-builder and deep-link actions should preserve whether the user came from launch, a command, a case or another surface so the next page feels intentional.",
            },
            {
              label: "The destination should be implied",
              meta: "Labeling rule",
              summary: "Action text should help the reader understand whether they are starting a new object, continuing an existing flow or inspecting the underlying cause of a warning.",
            },
            {
              label: "Routing is still product logic",
              meta: "Docs rule",
              summary: "Even non-mutating buttons deserve explicit docs because they shape how users learn the product and move through it safely.",
            },
          ],
        },
        {
          title: "State-changing buttons need consequence language",
          description: "Lifecycle and governance actions should be documented through their downstream effect, not only their label.",
          items: [
            {
              label: "State transitions should name the new posture",
              meta: "Lifecycle rule",
              summary: "Publish, pause, archive and similar actions should explain what the object becomes afterward and how other surfaces will now treat it.",
            },
            {
              label: "Irreversibility should be legible",
              meta: "Safety rule",
              summary: "If an action is harder to undo, the docs should say so plainly rather than assuming the user will infer that from the label.",
            },
            {
              label: "Role boundaries should stay visible",
              meta: "Governance rule",
              summary: "A button may exist on the page but still be owner-only, operator-only or bounded to a project-safe subset of users.",
            },
          ],
        },
        {
          title: "Recovery buttons should name the safe next move",
          description: "Recovery actions are strongest when the docs describe the current blocker and the specific effect of the action.",
          items: [
            {
              label: "Retry versus resolve should not blur",
              meta: "Recovery rule",
              summary: "Retry actions re-attempt work, while resolve actions close posture explicitly. The docs should distinguish those outcomes clearly.",
            },
            {
              label: "Escalate is a coordination action",
              meta: "Support rule",
              summary: "Escalation buttons should explain that they move ownership or attention, not the underlying technical state directly.",
            },
            {
              label: "Timeline writes matter",
              meta: "Audit rule",
              summary: "The docs should say when an action creates a note, event or visible history entry so operators understand why the timeline changes afterward.",
            },
          ],
        },
        {
          title: "Surface-level button examples",
          description: "These examples show how concrete VYNTRO buttons should be interpreted when someone reads the docs page for that surface.",
          items: [
            {
              label: "\"Open Campaign Studio\"",
              meta: "Launch Workspace example",
              summary: "This is a route button. It should be documented as a context-preserving handoff into campaign architecture, not as a state mutation on the launch page itself.",
            },
            {
              label: "\"Publish quest\"",
              meta: "Quest lifecycle example",
              summary: "This is a lifecycle button. The docs should explain that the quest becomes live, member-visible and part of active execution posture after the action succeeds.",
            },
            {
              label: "\"Retry provider sync\"",
              meta: "On-chain recovery example",
              summary: "This is a bounded recovery button. The docs should say that it re-attempts the project-safe sync path without granting access to global provider jobs.",
            },
            {
              label: "\"Grant payout detail\"",
              meta: "Project permissions example",
              summary: "This is a visibility action. The docs should explain that it changes what another teammate may inspect, not the payout case itself.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "warning-copy-and-escalation-language",
    title: "Warning Copy and Escalation Language",
    summary: "The reference model for how VYNTRO phrases warnings, blocked states, waiting states and escalation prompts so risk feels clear without becoming vague or alarmist.",
    entries: [
      { label: "Advisory warning", meta: "Watch posture", summary: "Use when the system wants attention or prioritization but the current path is still usable if the reader understands the caveat." },
      { label: "Blocking warning", meta: "Needs action", summary: "Use when the current path cannot proceed safely until a specific missing input, setup step or owner action is resolved." },
      { label: "Waiting-state prompt", meta: "Coordination language", summary: "Use when the issue is already in motion but the next step belongs to another lane such as internal review, project response or a queued recovery job." },
      { label: "Escalation language", meta: "Cross-surface coordination", summary: "Use when the system needs to signal who now owns the next move and why the issue has left a local surface or queue." },
    ],
    matrix: {
      title: "Warning semantics matrix",
      description: "Warning copy should help readers separate caution, blockage, coordination and incident pressure instead of flattening them into one scary tone.",
      columns: ["Warning style", "What it means", "What the copy should do next"],
      rows: [
        {
          label: "Advisory warning",
          values: ["There is pressure, drift or incompleteness, but the surface is still usable", "Explain the caveat plainly and recommend a priority-aware next move", "Avoid panic language"],
          summary: "Advisory warnings are common in launch readiness, trust watch bands and integration drift.",
        },
        {
          label: "Blocking warning",
          values: ["The current action path is not safe or possible until a dependency changes", "Name the exact blocker and the surface or owner that can remove it", "Pair with a bounded CTA when possible"],
          summary: "These warnings should feel specific and actionable, not generic.",
        },
        {
          label: "Waiting-state language",
          values: ["The system is already waiting on another lane or queued recovery step", "Clarify who owns the next move and whether the reader should act or simply monitor", "Reduce duplicate action attempts"],
          summary: "This language matters especially in escalations, claims and operator consoles where several teams can otherwise step on each other.",
        },
        {
          label: "Escalation prompt",
          values: ["The issue has exceeded local handling and now needs named coordination", "Signal ownership, next action and the lane of responsibility clearly", "Preserve calmness while conveying seriousness"],
          summary: "Escalation copy is strongest when it explains coordination, not just severity.",
        },
      ],
    },
    deepDive: {
      title: "How warning and escalation copy should behave in a public product manual",
      description: "The docs should explain not only what warning families exist, but how they should sound and what kind of next-step clarity they owe the reader.",
      sections: [
        {
          title: "Warnings should separate risk from failure",
          description: "Not every warning means the system is broken, and the docs should teach that difference explicitly.",
          items: [
            {
              label: "Advisory copy should calm and clarify",
              meta: "Tone rule",
              summary: "When the system is surfacing caution rather than blockage, the copy should help users prioritize without implying urgent failure everywhere.",
            },
            {
              label: "Blocking copy should stay specific",
              meta: "Clarity rule",
              summary: "A blocking warning should say what is blocked and why, not hide behind generic phrases like 'something needs attention'.",
            },
            {
              label: "Different surfaces can share the same semantics",
              meta: "Consistency rule",
              summary: "Launch, trust, payout and integrations should all use recognizably similar warning semantics even when the underlying cause differs.",
            },
          ],
        },
        {
          title: "Waiting-state language should reduce coordination confusion",
          description: "Once an issue is already in motion, the copy should keep readers from duplicating work or assuming the wrong owner.",
          items: [
            {
              label: "Name the waiting lane",
              meta: "Coordination rule",
              summary: "Phrases like awaiting internal review or needs project input should tell readers exactly which side owns the next move.",
            },
            {
              label: "Distinguish waiting from stuck",
              meta: "State rule",
              summary: "Queued retries and in-flight escalations are different from stalled incidents, and the copy should not blur those states together.",
            },
            {
              label: "Keep next actions bounded",
              meta: "Action rule",
              summary: "If the reader should not act yet, the copy should make that clear instead of suggesting broad intervention.",
            },
          ],
        },
        {
          title: "Escalation copy should explain ownership, not only urgency",
          description: "The strongest escalation language tells the team who needs to act next and why local handling is no longer enough.",
          items: [
            {
              label: "Escalation is a coordination event",
              meta: "Support rule",
              summary: "The docs should frame escalation language as a handoff into named ownership rather than a generic increase in severity.",
            },
            {
              label: "Seriousness should stay calm",
              meta: "Tone rule",
              summary: "Even incident-promoting copy should sound controlled and operator-grade, not dramatic or alarmist.",
            },
            {
              label: "Cross-surface links complete the message",
              meta: "Navigation rule",
              summary: "Escalation language is strongest when it points toward the console, runbook or owner lane that now carries the next meaningful action.",
            },
          ],
        },
        {
          title: "Surface-level copy examples",
          description: "These examples show how warning and escalation language should sound on real surfaces when the product is under pressure.",
          items: [
            {
              label: "\"Launch posture is usable, but rewards are still missing. Add a reward before treating this path as member-ready.\"",
              meta: "Advisory launch example",
              summary: "This is good advisory copy because it signals meaningful incompleteness without implying the launch surface is broken.",
            },
            {
              label: "\"Claims are blocked because reward inventory is exhausted. Refill inventory or pause the reward before new claims continue.\"",
              meta: "Blocking payout example",
              summary: "This is good blocking copy because it names the blocker directly and points to the bounded next move instead of using vague urgency language.",
            },
            {
              label: "\"Awaiting internal review. The project does not need to act yet unless the owner requests more context.\"",
              meta: "Waiting-state example",
              summary: "This is good waiting-state language because it clarifies ownership and prevents duplicate action attempts from the wrong lane.",
            },
            {
              label: "\"Needs project input. A project owner must confirm the wallet or reward context before resolution can continue.\"",
              meta: "Escalation example",
              summary: "This is good escalation language because it tells the reader who owns the next move and why the issue has left simple local handling.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "builder-controls-and-state-actions",
    title: "Builder Controls and State Actions",
    summary: "The map of the controls that shape launch posture, open builders, preserve context and move content safely through lifecycle states.",
    entries: [
      { label: "Builder entry actions", meta: "Open and route", summary: "Launch Workspace and project-first create actions determine which builder opens next and which context it inherits automatically." },
      { label: "Lifecycle state actions", meta: "Publish, pause, archive", summary: "These controls move campaigns, quests, raids and rewards through safe operating posture instead of relying on hidden toggles." },
      { label: "Return-to-posture actions", meta: "Back into launch or operations", summary: "After a builder step, the system should route the team back into Launch Workspace or another operating surface so they can re-read readiness." },
      { label: "Duplicate and template actions", meta: "Acceleration controls", summary: "Starter packs, templates and duplicate flows exist to reduce blank-canvas risk without breaking the system's structural rules." },
    ],
    matrix: {
      title: "Builder control matrix",
      description: "These controls are about shaping structure and state, not merely editing fields in place.",
      columns: ["Common surfaces", "What the control changes", "Why it matters"],
      rows: [
        {
          label: "Open builder from launch",
          values: ["Launch Workspace, project overview", "Creates a new builder session with project context already attached", "Preserves project-first posture and reduces route hunting"],
          summary: "Entry controls are strongest when they keep the reason for the builder legible before the user starts filling fields.",
        },
        {
          label: "Publish, pause, resume, archive",
          values: ["Campaign, quest, raid, reward detail pages", "Moves the object into a new lifecycle state", "Makes live posture auditable and reversible"],
          summary: "Lifecycle actions are core trust-preserving controls because they govern how things become active or inactive.",
        },
        {
          label: "Duplicate, template, starter pack",
          values: ["Launch Workspace, studios", "Copies or scaffolds known-good structure", "Speeds up creation without sacrificing coherence"],
          summary: "These controls help teams build faster while staying inside the product's structural model.",
        },
      ],
    },
    deepDive: {
      title: "How to interpret builder and state controls",
      description: "The docs should help readers tell the difference between controls that open structure, controls that change posture and controls that accelerate setup.",
      sections: [
        {
          title: "Entry controls should preserve context",
          description: "A create button is not neutral if it decides whether the next builder understands the project and campaign it belongs to.",
          items: [
            {
              label: "Project-first create actions",
              meta: "Routing model",
              summary: "These controls matter because they prevent teams from rebuilding context by hand after they enter a studio.",
            },
            {
              label: "Launch-based entry is intentional",
              meta: "Readiness model",
              summary: "The docs should explain that Launch Workspace is part of the control system because it decides which builder should be opened next and why.",
            },
            {
              label: "Campaign-first sequencing",
              meta: "Architecture rule",
              summary: "Entry actions are better when they reflect the mission architecture model rather than a flat list of create buttons.",
            },
          ],
        },
        {
          title: "Lifecycle controls change trust posture",
          description: "Publishing or pausing content is one of the most important moments in the product because it changes what the system treats as live.",
          items: [
            {
              label: "State transitions should stay visible",
              meta: "Lifecycle rule",
              summary: "A good docs page explains not only that a control exists, but which downstream surfaces now read the object differently afterward.",
            },
            {
              label: "Pause is a safety action",
              meta: "Operational rule",
              summary: "Pause and resume belong in the same atlas as publish because they govern live risk and recovery without destroying history.",
            },
            {
              label: "Archive protects history",
              meta: "Historical rule",
              summary: "Archive controls matter because they preserve context while removing clutter from active operations.",
            },
          ],
        },
        {
          title: "Acceleration controls should respect architecture",
          description: "Templates and duplicates only help if they preserve the system's mental model.",
          items: [
            {
              label: "Starter packs reduce blank-canvas risk",
              meta: "Launch rule",
              summary: "These controls are strongest when they create the first good shape of a launch rather than just filling random fields quickly.",
            },
            {
              label: "Duplicate is not copy without meaning",
              meta: "Builder rule",
              summary: "A duplicate action should still preserve the parent-child campaign and mission logic that made the original object coherent.",
            },
            {
              label: "The docs should explain the why",
              meta: "Docs rule",
              summary: "Acceleration controls are part of the product architecture, not mere convenience shortcuts.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "visibility-and-grant-controls",
    title: "Visibility and Grant Controls",
    summary: "The map of summary-only defaults, detail grants and action grants across community and safety consoles.",
    entries: [
      { label: "Summary-only defaults", meta: "Safe baseline", summary: "Most project-facing safety consoles begin from a bounded summary posture so people can see health without inheriting deep operational detail." },
      { label: "Detail grants", meta: "Expanded visibility", summary: "Owners can expose case detail, member-level context, wallet detail or other bounded views when a teammate needs more than summaries." },
      { label: "Action grants", meta: "Bounded participation", summary: "Annotate, escalate, retry or resolve-style actions are granted separately from visibility, which keeps shared consoles controllable." },
      { label: "Role-shaped visibility", meta: "Owner, captain, operator", summary: "Different product roles are defined by their intended scope of action and context, not only by a broad title." },
    ],
    matrix: {
      title: "Grant control matrix",
      description: "Visibility and action grants are deliberately separate so the product can be collaborative without becoming unsafe.",
      columns: ["Default posture", "Grantable expansion", "Who usually controls it"],
      rows: [
        {
          label: "Trust",
          values: ["View-only", "Case detail and bounded actions", "Project owner and internal trust ops"],
          summary: "Trust uses the strictest bounded visibility model because evidence and review posture can be sensitive.",
        },
        {
          label: "Payout",
          values: ["Summary-only", "Claim detail and project-safe actions", "Project owner and internal payout ops"],
          summary: "Payout grants help a project coordinate without handing out internal recovery power.",
        },
        {
          label: "On-chain",
          values: ["Summary-only", "Wallet detail and project-safe recovery actions", "Project owner and internal chain ops"],
          summary: "On-chain grants are shaped around the line between project-safe retries and internal-only infrastructure control.",
        },
        {
          label: "Community and captain rails",
          values: ["Role-scoped", "Captain-specific execution rights", "Owners and workspace admins"],
          summary: "Community visibility is broader than safety-console visibility, but it still uses explicit role shaping.",
        },
      ],
    },
    deepDive: {
      title: "How to interpret visibility and grant controls",
      description: "The atlas should help readers understand that visibility is part of product behavior, not a side topic hidden in settings.",
      sections: [
        {
          title: "Why summary-only exists",
          description: "Bounded default visibility is a design choice that protects teams from accidental oversharing and unsafe collaboration.",
          items: [
            {
              label: "Safety before convenience",
              meta: "Product posture",
              summary: "Summary-only defaults help the product stay open enough to be collaborative while still protecting internal-only evidence or recovery paths.",
            },
            {
              label: "Calmer posture for most users",
              meta: "UX rule",
              summary: "Most teammates need to know what is wrong before they need all the details of why, which is why summaries are a stable first layer.",
            },
            {
              label: "The docs should say this explicitly",
              meta: "Docs rule",
              summary: "Readers trust the system more when the docs explain why a bounded view exists instead of making it feel arbitrary.",
            },
          ],
        },
        {
          title: "Detail and action grants are different",
          description: "A user who can see more is not automatically someone who should act more.",
          items: [
            {
              label: "Seeing a case is not resolving a case",
              meta: "Grant split",
              summary: "This split keeps the product from collapsing into broad, unsafe role buckets.",
            },
            {
              label: "Project-safe actions need their own category",
              meta: "Safety rule",
              summary: "Some actions are safe for a project lead or captain, while deeper controls remain internal-only even if detail access is granted.",
            },
            {
              label: "The docs should name the boundary",
              meta: "Interpretation rule",
              summary: "Readers should be able to tell whether a grant changes visibility, action or both.",
            },
          ],
        },
        {
          title: "Owners are the local authority",
          description: "Owner-managed grants are one of the key ways VYNTRO balances autonomy and safety.",
          items: [
            {
              label: "Owner intent shapes the console",
              meta: "Governance model",
              summary: "Project owners decide how collaborative or tightly bounded a project-side console should become for their team.",
            },
            {
              label: "Internal operators still keep the deep rail",
              meta: "Platform rule",
              summary: "Even when projects get more detail or safe actions, internal operators retain the deepest control surfaces.",
            },
            {
              label: "The docs should reflect both layers",
              meta: "Cross-track rule",
              summary: "A strong encyclopedia shows how local owner control and platform-level operator authority coexist.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "warning-badges-and-status-cues",
    title: "Warning Badges and Status Cues",
    summary: "The atlas of labels, chips, bands and status language that explain readiness, trust, payout pressure and recovery posture across the product.",
    entries: [
      { label: "Readiness cues", meta: "Launch and builder posture", summary: "Blocked, warming up, launchable and live-ready style language helps teams understand how safe the current launch posture is." },
      { label: "Warning and flag cues", meta: "Trust and on-chain posture", summary: "Warnings, flags, severity labels and suspicious bands explain why an issue deserves watch or deeper review." },
      { label: "Waiting-state cues", meta: "Escalation and recovery posture", summary: "Needs project input, retry queued and similar labels explain what the system is waiting on next." },
      { label: "Outcome cues", meta: "Resolution posture", summary: "Resolved, dismissed, paused and archived labels explain closure and ongoing state without requiring the user to infer it." },
    ],
    matrix: {
      title: "Status cue matrix",
      description: "These labels matter because they change interpretation and next action even when they are not direct action controls.",
      columns: ["Typical surfaces", "What the cue explains", "Why it matters"],
      rows: [
        {
          label: "Readiness bands",
          values: ["Launch Workspace, builders", "How structurally safe the current launch or object posture is", "Helps projects know whether to keep building, fix blockers or go live"],
          summary: "Readiness cues are one of the main ways the product teaches launch posture in plain language.",
        },
        {
          label: "Warnings and severity labels",
          values: ["Trust, on-chain, overview", "Whether activity or cases should be watched, reviewed or treated as high risk", "Prevents scoring and signal systems from becoming opaque"],
          summary: "These cues let the product express concern without turning every signal into an immediate hard block.",
        },
        {
          label: "Waiting-state labels",
          values: ["Escalations, payout, on-chain, support", "Who or what the system is currently waiting on", "Helps teams distinguish stalled work from active queued recovery"],
          summary: "Waiting-state cues are essential for coordination because they reduce ambiguity under pressure.",
        },
        {
          label: "Outcome labels",
          values: ["History, timelines, lifecycle surfaces", "What state a case, object or workflow ended in", "Preserves trust and auditability across the product"],
          summary: "These cues are what make the product's history layer readable later on.",
        },
      ],
    },
    deepDive: {
      title: "How to interpret warning and status cues",
      description: "The same cue family often appears on different surfaces, but its role is always to make the current posture legible and actionable.",
      sections: [
        {
          title: "Warnings are explanation layers",
          description: "A warning chip is not just decoration; it compresses a deeper model into a quick cue that a human can act on.",
          items: [
            {
              label: "Warnings should point to a deeper explanation",
              meta: "UX rule",
              summary: "A cue is strongest when the docs can point the reader to the exact reference page or console model that generated it.",
            },
            {
              label: "Severity should feel earned",
              meta: "Signal rule",
              summary: "Labels like watch, high or blocked should map to explicit thresholds, not vague product mood.",
            },
            {
              label: "The docs should preserve calmness",
              meta: "Interpretation rule",
              summary: "Status cues should help the reader prioritize, not overwhelm them with unexplained alarm language.",
            },
          ],
        },
        {
          title: "Waiting states deserve their own family",
          description: "A system can be healthy, blocked or simply waiting; those are meaningfully different postures.",
          items: [
            {
              label: "Needs project input",
              meta: "Coordination cue",
              summary: "This label matters because it tells the operator and the project that the next move is local context, not another blind retry.",
            },
            {
              label: "Retry queued",
              meta: "Recovery cue",
              summary: "Queued work is different from unresolved work, and the docs should preserve that difference.",
            },
            {
              label: "Waiting on internal",
              meta: "Escalation cue",
              summary: "This label is part of how the platform makes shared consoles feel coordinated rather than mysterious.",
            },
          ],
        },
        {
          title: "Outcome cues protect trust",
          description: "The product feels more serious when it makes endings as readable as warnings.",
          items: [
            {
              label: "Resolved and dismissed should stay visible",
              meta: "History rule",
              summary: "These cues matter because they explain what happened after the pressure or warning phase ended.",
            },
            {
              label: "Paused and archived are structural states",
              meta: "Lifecycle rule",
              summary: "They are not merely administrative labels; they change how other surfaces interpret the object.",
            },
            {
              label: "The docs should connect cue to consequence",
              meta: "Docs rule",
              summary: "Readers should learn what each cue means for action, visibility and later product behavior, not only what text appears on screen.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "recovery-and-resolution-actions",
    title: "Recovery and Resolution Actions",
    summary: "The map of retry, rerun, rescan, annotate, escalate, resolve and dismiss actions across safety consoles and support rails.",
    entries: [
      { label: "Retry-style actions", meta: "Technical recovery", summary: "Retry, rerun and rescan actions attempt a bounded recovery step when the system already knows the most likely safe next move." },
      { label: "Coordination actions", meta: "Ownership and handoff", summary: "Annotate and escalate actions help people coordinate context before a deeper recovery action is taken." },
      { label: "Outcome actions", meta: "Closure and history", summary: "Resolve and dismiss actions formally move a case or incident into a known historical posture." },
      { label: "Pause and freeze actions", meta: "Containment", summary: "Some actions exist to stop further damage or pressure while the team investigates or waits on another lane." },
    ],
    matrix: {
      title: "Recovery action matrix",
      description: "The same words can appear across consoles, but the action is only safe when the docs explain its scope and consequence.",
      columns: ["Typical surfaces", "What the action changes", "Who usually uses it"],
      rows: [
        {
          label: "Retry, rerun, rescan",
          values: ["Payout, on-chain, support rails", "Attempts a bounded technical recovery step", "Internal operators or owner-granted project leads"],
          summary: "These actions are safest when tightly scoped to the current case or project context.",
        },
        {
          label: "Annotate and escalate",
          values: ["Trust, payout, on-chain, escalations", "Adds context or moves the issue into another lane", "Projects and operators, depending on grants"],
          summary: "These are collaboration controls more than technical controls, which is why they belong in the atlas too.",
        },
        {
          label: "Resolve and dismiss",
          values: ["All case-driven consoles", "Changes the official outcome posture and timeline history", "Mostly operators, sometimes project-bounded users"],
          summary: "Closure actions matter because they end ambiguity and preserve auditability.",
        },
        {
          label: "Pause and freeze",
          values: ["Lifecycle surfaces, payout or reward rails", "Contains risk by stopping a live path temporarily", "Owners and operators"],
          summary: "Containment controls help prevent deeper damage while preserving history and reversibility.",
        },
      ],
    },
    deepDive: {
      title: "How to interpret recovery actions",
      description: "Recovery controls make the most sense when the docs explain what layer of the system they are acting on.",
      sections: [
        {
          title: "Some actions are technical",
          description: "Retry, rerun and rescan change the runtime path of a case more than its human ownership model.",
          items: [
            {
              label: "Retry repeats a bounded path",
              meta: "Recovery family",
              summary: "Use retry when the system believes the previous failure may resolve through the same path once the immediate issue is cleared.",
            },
            {
              label: "Rerun and rescan target derived work",
              meta: "Derived-state family",
              summary: "These actions are for recalculating enrichment, metadata or asset-linked state rather than replaying the full original flow.",
            },
            {
              label: "The docs should explain scope first",
              meta: "Safety rule",
              summary: "Readers need to know whether the action affects only the current case, the project or a wider infrastructure rail.",
            },
          ],
        },
        {
          title: "Some actions are collaborative",
          description: "Annotate and escalate shape how a team understands and moves an issue even if they do not directly fix the underlying runtime problem.",
          items: [
            {
              label: "Annotate preserves context",
              meta: "History family",
              summary: "Annotation matters because it reduces context loss across project and operator handoffs.",
            },
            {
              label: "Escalate changes the lane",
              meta: "Ownership family",
              summary: "Escalation should make the next owner and waiting state clearer, not just toss the problem to another team.",
            },
            {
              label: "The docs should name the human effect",
              meta: "Interpretation rule",
              summary: "A recovery atlas is stronger when it explains what an action does socially and operationally, not only technically.",
            },
          ],
        },
        {
          title: "Some actions are formal closure",
          description: "Resolve, dismiss, pause and freeze shape the official operating posture of the case or object afterward.",
          items: [
            {
              label: "Resolve is a product state change",
              meta: "Closure family",
              summary: "Resolve matters because it tells every later reader that the issue is considered closed and why.",
            },
            {
              label: "Dismiss still means something",
              meta: "Audit family",
              summary: "Dismissal is not deletion; it is a recorded decision that the case does not require further action.",
            },
            {
              label: "Pause and freeze contain risk",
              meta: "Containment family",
              summary: "Containment controls help teams stop pressure before they have a full answer, which is why they belong in the same atlas as recovery and closure.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "command-and-automation-controls",
    title: "Command and Automation Controls",
    summary: "The map of command scopes, toggles, automation posture and deep-link behavior across community and member-facing delivery rails.",
    entries: [
      { label: "Command scope controls", meta: "Member, captain, project rails", summary: "These controls decide which commands exist for members, captains or project teams and how much each audience can do with them." },
      { label: "Activation toggles", meta: "Enable and route", summary: "Projects control whether command families and delivery rails are active so community posture stays intentional." },
      { label: "Automation posture controls", meta: "Cadence and follow-through", summary: "Automations extend community operating intent across time and should be understood as part of the product's delivery layer." },
      { label: "Deep-link handoff controls", meta: "Cross-surface routing", summary: "Many command responses are only the first step; deep links send members or captains back into the right web surface with context preserved." },
    ],
    matrix: {
      title: "Delivery control matrix",
      description: "Delivery rails matter because they determine how project and community intent reaches real users.",
      columns: ["Typical surfaces", "What the control changes", "Who usually manages it"],
      rows: [
        {
          label: "Command scope and toggles",
          values: ["Community OS, command settings, bots", "Which commands are active and who can use them", "Owners and community leads"],
          summary: "These controls decide whether a command rail exists at all and what audience it serves.",
        },
        {
          label: "Captain command posture",
          values: ["Captain lanes and bot rails", "How much execution power captains receive", "Owners and admins"],
          summary: "Captain controls are stronger when the docs show how they differ from member commands and deeper operator actions.",
        },
        {
          label: "Automation cadence and enablement",
          values: ["Community OS, automation center", "When follow-through happens and whether it is active", "Owners, operators and automation leads"],
          summary: "Automation controls shape ongoing execution, not just one-time responses.",
        },
        {
          label: "Deep-link handoffs",
          values: ["Bot outputs, notifications, member surfaces", "Where a user goes next after a command or automation fires", "The system, configured by project posture"],
          summary: "These controls help delivery rails feel like part of the product instead of disconnected notification tools.",
        },
      ],
    },
    deepDive: {
      title: "How to interpret command and automation controls",
      description: "Delivery controls are easiest to understand when the docs explain how they connect operating intent to member or captain behavior.",
      sections: [
        {
          title: "Command controls shape audience and tone",
          description: "A command rail should exist for a reason, not simply because the bot can support it.",
          items: [
            {
              label: "Member commands guide the journey",
              meta: "Experience family",
              summary: "Commands like profile, missions and leaderboard should be documented as journey and recognition surfaces, not just chat utilities.",
            },
            {
              label: "Captain commands guide execution",
              meta: "Operations family",
              summary: "Captain rails should explain assigned work, next action and bounded authority in the same language the community console uses.",
            },
            {
              label: "The docs should explain both scope and purpose",
              meta: "Docs rule",
              summary: "Readers should understand not only what a command does, but who it is for and why the system offers it.",
            },
          ],
        },
        {
          title: "Automation controls extend community intent over time",
          description: "Automations are not a side feature; they are how the product keeps certain kinds of follow-through from becoming manual labor.",
          items: [
            {
              label: "Cadence should feel strategic",
              meta: "Timing model",
              summary: "Automation toggles matter because they determine when the system should nudge, post, refresh or follow through without human intervention.",
            },
            {
              label: "Ownership still matters",
              meta: "Governance rule",
              summary: "A strong docs atlas should explain who configures automation posture and how it ties back to owner or operator responsibility.",
            },
            {
              label: "The system should stay observable",
              meta: "Control rule",
              summary: "Commands and automations both feel more trustworthy when the product makes their run posture and outputs legible.",
            },
          ],
        },
        {
          title: "Deep links complete the delivery loop",
          description: "A command reply or automation message is often only the first half of the real control effect.",
          items: [
            {
              label: "Bot outputs should route intentionally",
              meta: "Handoff family",
              summary: "Deep links matter because they hand the user back into the right member or project surface with context preserved.",
            },
            {
              label: "Delivery controls bridge tracks",
              meta: "System rule",
              summary: "These controls connect project docs, community operations and member journey documentation into one delivery story.",
            },
            {
              label: "The docs should explain the loop",
              meta: "Docs posture",
              summary: "Delivery controls are strongest when the reader can see how the action starts in a bot or automation rail and ends in a product surface.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "lifecycle-states",
    title: "Lifecycle States",
    summary: "The common state language used across campaigns, quests, raids, rewards and operator flows.",
    entries: [
      { label: "Draft", meta: "Pre-launch", summary: "The object exists but is not ready for member-facing or operational use." },
      { label: "Ready", meta: "Prepared", summary: "Configuration is complete enough to move toward activation or publication." },
      { label: "Live", meta: "Active", summary: "The object is currently active and visible in the relevant operating or member-facing surface." },
      { label: "Paused", meta: "Hold", summary: "The object is intentionally halted without being destroyed or archived." },
      { label: "Archived", meta: "Historical", summary: "The object is preserved for history and audit, but no longer part of active workflows." },
    ],
    matrix: {
      title: "Lifecycle posture map",
      description: "This map shows how the same lifecycle states read differently depending on which layer of the product you are in.",
      columns: ["Builder posture", "Member posture", "Operator posture"],
      rows: [
        {
          label: "Draft",
          values: ["Safe to keep shaping", "Invisible or not yet relevant", "Usually not action-worthy unless setup blocks launch"],
          summary: "Draft is the protected setup state before the system treats an object as intentionally ready.",
        },
        {
          label: "Ready",
          values: ["Prepared for activation", "Still not fully active", "Important for readiness and launch checks"],
          summary: "Ready is the pre-activation state where structure is stable enough to move forward safely.",
        },
        {
          label: "Live",
          values: ["Actively in use", "Visible and meaningful", "Needs monitoring, support and history"],
          summary: "Live means the object has crossed into active system or member use.",
        },
        {
          label: "Paused or archived",
          values: ["Held or preserved", "No longer actively moving", "Still important for audit and recovery context"],
          summary: "Pause and archive protect history while removing the object from active motion.",
        },
      ],
    },
  },
  {
    slug: "permissions",
    title: "Permissions",
    summary: "The exact model for who can see what and who can act on what.",
    entries: [
      { label: "Visibility permissions", meta: "See layer", summary: "Controls whether a user can see summaries, lists, detail views or rawer bounded evidence." },
      { label: "Action permissions", meta: "Do layer", summary: "Controls whether a user can annotate, escalate, retry, resolve or apply other system actions." },
      { label: "Owner-managed grants", meta: "Project control", summary: "Project owners decide who receives additional visibility or action posture in bounded consoles." },
      { label: "Default bounded access", meta: "Safety rule", summary: "Project-facing safety consoles start from view-only or summary-only rather than broad access." },
    ],
    matrix: {
      title: "Permission split matrix",
      description: "VYNTRO permissions are deliberately split by what someone can see and what someone can do.",
      columns: ["Summary access", "Detail access", "Action access"],
      rows: [
        {
          label: "Project teammate",
          values: ["Default", "Only with owner grant", "Only with owner grant"],
          summary: "Projects begin from a bounded posture instead of inheriting internal visibility or actions automatically.",
        },
        {
          label: "Project owner",
          values: ["Full project summary", "Full project detail", "Project-safe actions and grant management"],
          summary: "Owners are the authority for who gets extra trust, payout or on-chain rights inside their own project scope.",
        },
        {
          label: "Captain",
          values: ["Bounded to assigned lane", "Role-specific", "Only captain-safe actions"],
          summary: "Captain permissions are narrower and should stay tied to community execution rather than deep safety consoles.",
        },
        {
          label: "Internal operator",
          values: ["Full", "Full", "Full internal control"],
          summary: "Internal operators retain the deepest visibility and recovery posture across the platform.",
        },
      ],
    },
  },
  {
    slug: "entities-and-relationships",
    title: "Entities and Relationships",
    summary: "The map of how the main VYNTRO objects and surfaces depend on each other.",
    entries: [
      { label: "Project", meta: "Root object", summary: "The context that holds launch posture, team access, community operations and the project-side settings surface together." },
      { label: "Campaign", meta: "Mission architecture", summary: "The strategic parent object that gives quests, raids and rewards their place in a launch or growth path." },
      { label: "Quest / Raid / Reward", meta: "Execution objects", summary: "The concrete member-facing or activation-facing objects that carry the campaign into action." },
      { label: "Community and member layers", meta: "Outcome surfaces", summary: "The project and member-facing rails that show whether the created structure is actually moving a community forward." },
      { label: "Safety consoles", meta: "Recovery surfaces", summary: "Trust, payout and on-chain layers that handle risk, delivery and recovery once the rest of the system is already live." },
    ],
    matrix: {
      title: "System relationship map",
      description: "This map shows which major objects act as parent structure, execution layer or recovery layer in the wider platform.",
      columns: ["Depends on", "Shapes", "Feeds into"],
      rows: [
        {
          label: "Project",
          values: ["Workspace, team, settings", "Launch posture and builder context", "Campaigns, community operations, safety visibility"],
        },
        {
          label: "Campaign",
          values: ["Project context", "Quest, raid and reward placement", "Member journey and launch structure"],
        },
        {
          label: "Quest / Raid / Reward",
          values: ["Campaign or project context", "Member action and incentive posture", "Claims, commands, community and payout behavior"],
        },
        {
          label: "Community OS",
          values: ["Project and live content", "Captain execution and command posture", "Member movement and health signals"],
        },
        {
          label: "Trust / Payout / On-chain",
          values: ["Live system behavior", "Recovery and escalation posture", "Operator history, project-safe follow-through and observability"],
        },
      ],
    },
  },
  {
    slug: "permission-matrices",
    title: "Permission Matrices",
    summary: "The cross-console view of bounded project access versus internal control.",
    entries: [
      { label: "Trust Console", summary: "Projects default to view-only while internal operators keep full investigation and resolution control." },
      { label: "Payout Console", summary: "Projects default to summary-only and can be granted safe review or retry actions by the owner." },
      { label: "On-chain Console", summary: "Projects default to summary-only and can only receive project-safe recovery actions, never global jobs." },
      { label: "Community OS", summary: "Community permissions are broader than safety-console permissions, but still split across owner and captain scope." },
    ],
    matrix: {
      title: "Console permission matrix",
      description: "This matrix makes the safe-default posture across the major bounded consoles easy to compare at a glance.",
      columns: ["Default project visibility", "Grantable detail", "Grantable actions"],
      rows: [
        {
          label: "Trust",
          values: ["View-only", "Member or case detail", "Annotate, escalate, resolve bounded project-side case work"],
        },
        {
          label: "Payout",
          values: ["Summary-only", "Claim and payout detail", "Annotate, escalate, retry project-safe flow, resolve blocker"],
        },
        {
          label: "On-chain",
          values: ["Summary-only", "Wallet or event detail", "Retry case, rerun project enrichment, rescan project assets"],
        },
        {
          label: "Community",
          values: ["Owner or captain lane", "Role-specific detail", "Captain-safe community actions and command posture"],
        },
      ],
    },
  },
  {
    slug: "launch-and-readiness-model",
    title: "Launch and Readiness Model",
    summary: "The exact model behind Launch Workspace, readiness groups, hard blockers, soft blockers and why a project is or is not launchable.",
    entries: [
      { label: "Identity group", meta: "Profile, brand, contact", summary: "Launch posture starts with whether the project looks real, branded and reachable enough to be taken seriously." },
      { label: "Community rail group", meta: "Providers, targets, push tests", summary: "Connected providers and configured Discord or Telegram targets matter because launch cannot distribute safely without them." },
      { label: "Content spine group", meta: "Campaigns, quests, raids", summary: "The readiness model checks whether the project has an actual campaign and mission stack rather than a blank shell." },
      { label: "Rewards and operations groups", meta: "Outcomes and calmness", summary: "Reward presence, assets, incidents and active overrides all influence whether launch posture feels safe or still fragile." },
    ],
    matrix: {
      title: "Readiness group map",
      description: "Launch posture is deliberately broader than content completeness alone.",
      columns: ["What it checks", "What blocks it", "Why it matters"],
      rows: [
        {
          label: "Identity",
          values: ["Profile basics, logo, banner, contact path", "Missing profile, weak brand surface or no contact route", "Public launch confidence starts with whether the project itself feels real"],
        },
        {
          label: "Community rail",
          values: ["Connected providers, targets, push tests", "No provider, no target or untested delivery", "Launch fails operationally if the project cannot actually distribute and activate"],
        },
        {
          label: "Content spine",
          values: ["Campaigns plus quest or raid rails", "No campaign or no mission rail", "Members need somewhere meaningful to go once the launch is live"],
        },
        {
          label: "Operations",
          values: ["Incidents and overrides", "Critical incidents or active unsafe overrides", "A launch can be structurally complete and still operationally unsafe"],
        },
      ],
    },
    deepDive: {
      title: "How readiness is actually derived",
      description: "These explanations come from the project launch-readiness helper rather than from generic PM language.",
      sections: [
        {
          title: "Hard blockers",
          description: "Hard blockers stop the launch from being called ready even if other areas look healthy.",
          items: [
            { label: "No live providers", meta: "Critical blocker", summary: "If the project has no usable provider rails, launch posture is blocked because verification and delivery cannot happen safely." },
            { label: "No campaign spine", meta: "Critical blocker", summary: "The readiness helper treats the first campaign as required because quests, raids and rewards need a parent mission structure." },
            { label: "No live mission rail", meta: "Critical blocker", summary: "Launch needs at least one quest or raid so members have a real first action instead of only a promise." },
          ],
        },
        {
          title: "Soft blockers and warming-up posture",
          description: "Soft blockers do not fully stop launch, but they explain why the posture is still fragile.",
          items: [
            { label: "No reward surface yet", meta: "Warning", summary: "The project can still move forward, but the launch lacks a clear conversion or recognition layer." },
            { label: "No push test logged", meta: "Warning", summary: "Delivery rails may be connected, but launch still lacks proof that they work end-to-end." },
            { label: "Nothing live yet", meta: "Warning", summary: "A project can be structurally complete and still not have moved anything into active posture." },
          ],
        },
        {
          title: "Readiness tiers",
          description: "The score and blocker mix ultimately decide the launch tier.",
          items: [
            { label: "Blocked", meta: "Hard blocker present", summary: "At least one critical prerequisite is missing or unsafe, so the project should not be treated as launch-ready." },
            { label: "Warming up or launchable", meta: "Intermediate tiers", summary: "The project has momentum, but either the score or the warning posture says more tightening is still needed." },
            { label: "Live ready", meta: "High score plus no blockers", summary: "The project looks coherent, equipped and calm enough to handle real launch traffic." },
          ],
        },
      ],
    },
  },
  {
    slug: "builder-and-handoff-model",
    title: "Builder and Handoff Model",
    summary: "The exact model for how Launch Workspace, Campaign Studio, Quest Studio, Raid Studio and reward flows pass context into each other.",
    entries: [
      { label: "Project-first entry", meta: "Workspace context", summary: "The system prefers starting from project or launch context so builder sessions inherit the right project and campaign state automatically." },
      { label: "Campaign as parent architecture", meta: "Mission structure", summary: "Campaign Studio defines the mission map that later quests, raids and rewards should fit inside." },
      { label: "Quest and raid as execution builders", meta: "Action layers", summary: "Quest and raid builders turn strategy into concrete member and activation motions without replacing the campaign architecture above them." },
      { label: "Return to operating posture", meta: "Readiness loop", summary: "After creation, the system should return users to Launch Workspace or Community OS so they can judge what changed next." },
    ],
    matrix: {
      title: "Builder relationship map",
      description: "Builders should read like one family, not a loose collection of forms.",
      columns: ["Primary role", "Receives context from", "Feeds into"],
      rows: [
        {
          label: "Launch Workspace",
          values: ["Readiness and routing", "Project state and onboarding facts", "Campaign, quest, raid and reward builders"],
        },
        {
          label: "Campaign Studio",
          values: ["Mission architecture", "Project context and launch posture", "Quest, raid and reward placement"],
        },
        {
          label: "Quest / Raid Studio",
          values: ["Execution builders", "Project or campaign context", "Member journey and community activation"],
        },
        {
          label: "Rewards",
          values: ["Incentive layer", "Campaign or quest context", "Claims, payout posture and member motivation"],
        },
      ],
    },
    deepDive: {
      title: "Why the handoff model matters",
      description: "A product like VYNTRO breaks down fast if builders feel detached from each other or from the launch state around them.",
      sections: [
        {
          title: "Why Campaign usually comes first",
          description: "The system treats campaign as the architectural parent of later mission objects.",
          items: [
            { label: "Goal before objects", meta: "Strategy rule", summary: "Campaign Studio forces intent and mission structure into view before a team can drown in individual quest or raid fields." },
            { label: "Placement becomes clearer", meta: "Builder rule", summary: "Quest, raid and reward creation all become easier to explain when the campaign already exists as a frame." },
            { label: "Member path stays coherent", meta: "Journey rule", summary: "Campaign structure helps the later member journey feel like a route rather than disconnected tasks." },
          ],
        },
        {
          title: "Why Launch Workspace exists",
          description: "Launch Workspace is not only a convenience menu; it is the routing and readiness hub for the whole builder family.",
          items: [
            { label: "Route memory should not be required", meta: "UX rule", summary: "Projects should not need to know hidden admin routes before they can launch effectively." },
            { label: "Readiness should update after each build step", meta: "State rule", summary: "Returning to launch posture makes creation feel cumulative rather than like scattered one-off sessions." },
            { label: "The next move should stay obvious", meta: "Operating rule", summary: "Builder handoffs are strongest when the product tells the team what to open next and why." },
          ],
        },
      ],
    },
  },
  {
    slug: "verification-and-reward-model",
    title: "Verification and Reward Model",
    summary: "The exact model for how member action, proof logic, reward framing and downstream claim posture stay connected across project builders.",
    entries: [
      { label: "Action layer", meta: "What the member actually does", summary: "Quest and raid builders first need a clear member or community action before verification and reward logic can make sense." },
      { label: "Verification layer", meta: "Why the system trusts completion", summary: "Proof posture explains whether completion is manual, provider-backed or derived from a structured input." },
      { label: "Reward layer", meta: "Why the action matters", summary: "Rewards affect motivation before they ever become claims, so they need to be explained inside the builder model, not only inside payout docs." },
      { label: "Claim consequence", meta: "Downstream ops", summary: "Later claim and payout pressure is part of the same system story and should be linked back into builder docs explicitly." },
    ],
    matrix: {
      title: "Mission-to-claim map",
      description: "This is the bridge between project-side creation and operator-side payout behavior.",
      columns: ["Builder decision", "Immediate effect", "Downstream consequence"],
      rows: [
        {
          label: "Action design",
          values: ["Changes what the member is asked to do", "Shapes CTA clarity and mission placement", "Influences later journey and completion quality"],
        },
        {
          label: "Verification type",
          values: ["Changes how proof is supplied or checked", "Shapes trust in completion", "Affects review posture and what can later become a payout-safe claim"],
        },
        {
          label: "Reward framing",
          values: ["Changes motivation and conversion", "Keeps incentive visible during building", "Can later create inventory pressure or payout cases"],
        },
      ],
    },
    deepDive: {
      title: "How the model should be read",
      description: "Project docs should explain all four layers together so teams understand consequence, not just configuration.",
      sections: [
        {
          title: "Why verification deserves its own explanation",
          description: "Verification is one of the easiest places for builder docs to become too shallow.",
          items: [
            { label: "Manual confirmation", meta: "Human-trust posture", summary: "Manual verification is strongest when the docs explain that it trades automation for controlled review and deliberate proof handling." },
            { label: "Provider-backed proof", meta: "Automation posture", summary: "Provider checks feel lighter operationally, but the docs should explain their dependencies on connected rails and data quality." },
            { label: "Structured config still matters", meta: "Builder clarity", summary: "Even machine-checkable proof needs structured configuration so the operator side later understands what was supposed to be verified." },
          ],
        },
        {
          title: "Why reward docs must mention claims",
          description: "Projects make better incentive choices when they also understand the operational tail behind them.",
          items: [
            { label: "A reward is not only a perk", meta: "Conversion model", summary: "Rewards create meaning and momentum, but they also create delivery, stock and dispute consequences later." },
            { label: "Inventory is part of builder quality", meta: "Launch rule", summary: "A reward setup that cannot support expected demand weakens the launch even if the quest itself looks strong." },
            { label: "Payout Console is downstream, not separate", meta: "Cross-track rule", summary: "Project docs should make it obvious that payout operations are the downstream consequence of earlier reward choices." },
          ],
        },
      ],
    },
  },
  {
    slug: "community-and-member-signal-model",
    title: "Community and Member Signal Model",
    summary: "The exact model for how Community OS, commands, cohorts, health and the member journey feed each other.",
    entries: [
      { label: "Owner posture", meta: "Strategic operating layer", summary: "Owner mode reads health, cohorts, automations and next pressure to decide what matters most for the project now." },
      { label: "Captain and command posture", meta: "Execution layer", summary: "Captain scopes and bot commands turn owner intent into daily action without collapsing all permissions into one lane." },
      { label: "Community health signals", meta: "Operational feedback", summary: "Cohorts, activation trends, readiness signals and commands all help explain whether community work is producing motion." },
      { label: "Member-facing loop", meta: "Journey and recognition", summary: "The member journey is where projects see whether their community and content decisions are actually changing behavior and status." },
    ],
    matrix: {
      title: "Community feedback loop map",
      description: "Community OS is strongest when it is read as a loop rather than a dashboard.",
      columns: ["Starts from", "Moves through", "Shows up as"],
      rows: [
        {
          label: "Owner decision",
          values: ["Health, cohorts, commands, automations", "Captain follow-through and command rails", "Visible community action and pressure"],
        },
        {
          label: "Command or automation",
          values: ["Bot rails or scheduled follow-through", "Community channels and member prompts", "Signals, missions, raids or claims becoming visible to members"],
        },
        {
          label: "Member response",
          values: ["Journey lane and recognition posture", "Mission completion and comeback or onboarding movement", "Updated health and outcome signals back in Community OS"],
        },
      ],
    },
    deepDive: {
      title: "Why the community layer needs deeper docs",
      description: "This is where a lot of products become vague. VYNTRO should explain the loop clearly instead of treating community work as generic growth activity.",
      sections: [
        {
          title: "Owner versus captain is a design choice",
          description: "The docs should make the role split feel intentional and productive.",
          items: [
            { label: "Owner mode", meta: "Decide and inspect", summary: "Owner posture is about what needs attention, which cohort is drifting and which operating rail needs to move next." },
            { label: "Captain mode", meta: "Carry out bounded work", summary: "Captain posture exists so daily community execution stays accountable without exposing deeper owner or safety-console control." },
            { label: "Command rails bridge both", meta: "Execution bridge", summary: "Commands are how operating posture gets delivered into live community spaces without leaving the product model." },
          ],
        },
        {
          title: "Why member journey belongs here too",
          description: "Member-facing movement is the proof that community operations are doing something real.",
          items: [
            { label: "Onboarding and comeback are outputs", meta: "Journey rule", summary: "Those lanes are not isolated member pages; they are shaped by launch content, commands, provider rails and community follow-through." },
            { label: "Recognition is feedback", meta: "Community reward loop", summary: "Streaks, milestones and next unlocks help projects see whether the community layer is turning activity into status and retention." },
            { label: "Signals should come back upstream", meta: "Outcome rule", summary: "Community OS becomes much stronger when the docs show that member behavior flows back into project-side health and cohort views." },
          ],
        },
      ],
    },
  },
  {
    slug: "signal-and-scoring-models",
    title: "Signal and Scoring Models",
    summary: "The shared map for how VYNTRO turns raw system activity into warnings, severity bands, cases and bounded project visibility.",
    entries: [
      { label: "Deterministic rules", meta: "Exact thresholds", summary: "These are explicit checks such as event caps, hold windows, allowlist violations, missing wallet links or blocked finalization paths." },
      { label: "Watch bands", meta: "Posture layer", summary: "Some inputs do not hard-reject the workflow, but they still push the system into a warning or watch posture that operators should see." },
      { label: "Severity shaping", meta: "Human-readable urgency", summary: "Signals map into low, medium, high or critical urgency so cases and queues can be scanned without reading raw payloads first." },
      { label: "Bounded projection", meta: "Public-safe view", summary: "Project-facing consoles receive a deliberately shaped version of the model rather than raw internal diagnostics or global recovery control." },
    ],
    matrix: {
      title: "Signal model map",
      description: "Different product layers use different kinds of signal logic, and the docs should make that distinction explicit.",
      columns: ["Primary driver", "How it becomes visible", "Why it exists"],
      rows: [
        {
          label: "Trust",
          values: ["Score bands plus explicit thresholds", "Suspicious signals, review flags and trust cases", "To keep member integrity and anti-abuse posture explainable",
          ],
          summary: "Trust combines cumulative scoring with explicit anti-abuse triggers instead of relying on only one model.",
        },
        {
          label: "Payout",
          values: ["Blocked states and concrete failures", "Payout cases, incidents and disputes", "To keep delivery and claim follow-through legible without inventing fake scores"],
          summary: "Payout safety is mostly failure-driven rather than score-driven.",
        },
        {
          label: "On-chain",
          values: ["Validation checks, trust thresholds and recovery jobs", "On-chain cases, review flags and recovery history", "To turn raw chain-side failures into product-safe operator work"],
          summary: "On-chain combines deterministic validation, suspicious-signal pressure and explicit recovery cases.",
        },
        {
          label: "Project-facing view",
          values: ["Owner grants and bounded summaries", "Summary-only or view-only consoles", "To let projects participate safely without inheriting internal-only evidence"],
          summary: "Visibility is a product decision, not a direct mirror of internal data tables.",
        },
      ],
    },
    deepDive: {
      title: "How the shared model works",
      description: "These are the core principles behind warnings, flags and scores across the platform.",
      sections: [
        {
          title: "What counts as deterministic",
          description: "Deterministic logic comes from explicit conditions in the runtime rather than operator interpretation.",
          items: [
            { label: "Event caps", meta: "Trust / on-chain", summary: "Daily caps and event-type caps trigger explicit penalties and can reject the event when thresholds are crossed." },
            { label: "Validation gates", meta: "On-chain", summary: "Missing project-asset matches or missing verified wallet links open cases immediately because the event lacks required system context." },
            { label: "Finalization failures", meta: "Payout", summary: "Campaign reward finalization and delivery failures become payout cases directly because the failure is already known." },
          ],
        },
        {
          title: "What stays heuristic or posture-based",
          description: "Some values are designed to indicate pressure rather than serve as a single yes-or-no gate.",
          items: [
            { label: "Trust watch band", meta: "Score <= 45", summary: "The system keeps the event visible as medium-pressure posture even if the pipeline technically continues." },
            { label: "Exit-like activity", meta: "Trust signal", summary: "Exit patterns push the score down and stay visible for review because they may be valid but still deserve context." },
            { label: "Suspicious accepted events", meta: "On-chain", summary: "Accepted events can still produce suspicious-signal pressure and corresponding cases when the event is technically valid but operationally risky." },
          ],
        },
        {
          title: "Why the public docs should explain this",
          description: "A public encyclopedia needs to explain how the system thinks without exposing unsafe raw internals.",
          items: [
            { label: "Warnings should feel earned", meta: "Trust rule", summary: "If operators or projects see a flag, the docs should explain the kind of threshold or band that likely produced it." },
            { label: "Scores should not feel magical", meta: "Product rule", summary: "Readers should understand that scores come from explicit bonuses, penalties and clamp bands rather than black-box AI." },
            { label: "Project views stay bounded", meta: "Safety rule", summary: "The docs must keep repeating that project consoles show shaped context, not raw operator payloads or global recovery levers." },
          ],
        },
      ],
    },
  },
  {
    slug: "warning-and-flag-lifecycle",
    title: "Warning and Flag Lifecycle",
    summary: "The path from raw event or failure to warning, review flag, explicit case and final timeline history.",
    entries: [
      { label: "Raw event or failure", meta: "Input layer", summary: "A chain event, payout failure, delivery problem or provider-side issue enters the system before any product-safe shaping occurs." },
      { label: "Warning or suspicious signal", meta: "Interpretation layer", summary: "The runtime evaluates thresholds and can emit a warning-style signal with explicit severity and reason text." },
      { label: "Review flag", meta: "Tracking layer", summary: "Review flags preserve the suspicious posture on the object even before or alongside a deeper case workflow." },
      { label: "Case and timeline", meta: "Operator layer", summary: "Cases add ownership, escalation state, resolution history and the project-bounded view if the issue needs human follow-through." },
    ],
    matrix: {
      title: "Lifecycle map",
      description: "Not every issue moves through every step, but the product uses the same overall shape across trust, payout and on-chain layers.",
      columns: ["Starts from", "Intermediate layer", "Ends as"],
      rows: [
        {
          label: "Trust warning",
          values: ["Suspicious on-chain or trust posture signal", "Review flag and suspicious-signal severity", "Trust case with owner and history"],
          summary: "Trust signals often move through review flags before or while a trust case is opened.",
        },
        {
          label: "Payout issue",
          values: ["Blocked claim or finalization failure", "Case classification and waiting state", "Payout case with retry or resolution history"],
          summary: "Payout often skips a separate scoring step because the failure is already concrete.",
        },
        {
          label: "On-chain recovery issue",
          values: ["Ingress reject, sync failure or suspicious pattern", "Case type plus optional review flags", "On-chain case with retry, rerun or rescan history"],
          summary: "On-chain can create both suspicious review posture and explicit recovery cases around the same event.",
        },
      ],
    },
    deepDive: {
      title: "What changes at each layer",
      description: "Each layer adds more product meaning and more operational accountability.",
      sections: [
        {
          title: "From raw input to warning",
          description: "This is where the system decides whether something is interesting enough to surface.",
          items: [
            { label: "Reason text appears", meta: "Signal layer", summary: "Warnings gain a human-readable explanation, such as low-value transfer spam or short hold duration." },
            { label: "Severity appears", meta: "Signal layer", summary: "The system maps the condition into low, medium, high or critical urgency so operators can scan faster." },
            { label: "Metadata stays bounded", meta: "Safety layer", summary: "Internal payloads can remain deeper than what eventually becomes visible in public or project-facing docs." },
          ],
        },
        {
          title: "From warning to case",
          description: "This is where the platform decides a human or recovery workflow now owns the issue.",
          items: [
            { label: "Owner and status", meta: "Case layer", summary: "A case gains a current owner, a status such as open or blocked and an escalation posture." },
            { label: "Timeline writes", meta: "Audit layer", summary: "Case events preserve when the issue opened, refreshed, escalated or resolved." },
            { label: "Project projection", meta: "Visibility layer", summary: "If the case is allowed to appear project-side, the system shows a shaped view rather than the raw operator surface." },
          ],
        },
        {
          title: "From case to history",
          description: "Resolution is not deletion; it is a preserved outcome.",
          items: [
            { label: "Resolved", meta: "Known outcome", summary: "The issue recovered and the system can explain what changed." },
            { label: "Dismissed", meta: "Reviewed outcome", summary: "The issue was examined and intentionally set aside rather than silently disappearing." },
            { label: "Still instructive", meta: "Atlas rule", summary: "Historical cases remain part of the product narrative because later operators and projects may need that context." },
          ],
        },
      ],
    },
  },
  {
    slug: "trust-case-types",
    title: "Trust Case Types",
    summary: "The review taxonomy used for trust and fraud handling.",
    entries: [
      { label: "Sybil or duplicate signals", summary: "Cases opened when the system suspects duplicate or low-integrity member behavior." },
      { label: "Suspicious activity", summary: "Cases for anomalous engagement patterns or trust-adjacent signals that need review." },
      { label: "Project input needed", summary: "Cases that need bounded project-side context before resolution can complete." },
      { label: "Manual trust review", summary: "Cases opened directly by operators to track investigative work and resolution history." },
    ],
    matrix: {
      title: "Trust case handling map",
      columns: ["Typical owner", "Usual next move", "Common end state"],
      rows: [
        { label: "Sybil or duplicate signals", values: ["Internal trust operator", "Investigate and classify severity", "Resolved, dismissed or escalated"] },
        { label: "Suspicious activity", values: ["Internal trust operator", "Review evidence and request more context if needed", "Resolved or needs project input"] },
        { label: "Project input needed", values: ["Internal plus bounded project visibility", "Wait for project context", "Resolved once context closes the gap"] },
        { label: "Manual trust review", values: ["Internal trust operator", "Continue investigation or handoff", "Resolved with timeline notes"] },
      ],
    },
    deepDive: {
      title: "How trust signals become trust cases",
      description: "Trust case types are not random labels; the runtime maps specific suspicious signals into specific case families.",
      sections: [
        {
          title: "Signal-to-case mapping",
          description: "These mappings come directly from the trust-case runtime helper.",
          items: [
            { label: "Sybil suspicion", meta: "fresh wallet, no socials, cap reached, low-value spam", summary: "Signals such as fresh-wallet activity, missing social proof, cap abuse and repeated tiny transfers map into the sybil-suspicion lane." },
            { label: "Fake engagement", meta: "net-buy violation, short hold, short LP retention, exit pattern", summary: "Signals that suggest shallow or reversible participation map into fake-engagement review rather than simple rule failures." },
            { label: "Wallet anomaly", meta: "allowlist or watch label", summary: "Wallet-watch labels and contract-call allowlist violations map into wallet-anomaly review because they reflect trust posture outside simple mission behavior." },
            { label: "Trust drop", meta: "score bands", summary: "Low-trust-posture and watch-trust-posture signals create trust-drop cases when the score itself becomes the issue." },
          ],
        },
        {
          title: "Severity behavior",
          description: "Trust case severity follows the signal severity produced by the trust assessment.",
          items: [
            { label: "High severity", meta: "Immediate pressure", summary: "Reject thresholds such as net-buy violations, cap breaches and hard hold failures usually produce high-severity trust signals." },
            { label: "Medium severity", meta: "Watch pressure", summary: "Watch bands and borderline behaviors stay visible through medium-severity signals so operators can review without treating them as hard failures." },
            { label: "Case refreshes", meta: "Repeated evidence", summary: "If the same dedupe key appears again, the trust case is refreshed rather than duplicated, which keeps the timeline coherent." },
          ],
        },
      ],
    },
  },
  {
    slug: "payout-case-types",
    title: "Payout Case Types",
    summary: "The safety taxonomy used for claims, delivery and payout follow-through.",
    entries: [
      { label: "Claim review", summary: "A claim needs manual or higher-confidence review before it can be completed." },
      { label: "Delivery failure", summary: "A reward or payout delivery path failed and needs follow-through." },
      { label: "Inventory risk", summary: "Reward stock or issuance posture creates risk for new or pending claims." },
      { label: "Payout dispute", summary: "A payout or claim has conflicting evidence and needs explicit resolution." },
    ],
    matrix: {
      title: "Payout case handling map",
      columns: ["Typical owner", "Typical recovery move", "Common end state"],
      rows: [
        { label: "Claim review", values: ["Internal payout operator", "Review or request bounded project input", "Resolved or dismissed"] },
        { label: "Delivery failure", values: ["Internal payout operator", "Retry, investigate or escalate", "Recovered or escalated"] },
        { label: "Inventory risk", values: ["Project plus payout visibility", "Pause pressure or adjust reward posture", "Resolved once stock risk is removed"] },
        { label: "Payout dispute", values: ["Internal payout operator", "Investigate, annotate and decide", "Resolved with visible history"] },
      ],
    },
    deepDive: {
      title: "How payout cases are classified",
      description: "Payout safety is more failure- and state-driven than trust. The type tells the operator what kind of unblock path exists.",
      sections: [
        {
          title: "Failure-first classification",
          description: "Most payout cases start from something concrete already going wrong.",
          items: [
            { label: "Campaign finalization failure", meta: "High by default", summary: "If reward finalization cannot complete, the runtime opens a blocked campaign-finalization-failure case tied to that campaign." },
            { label: "Claim blocked or review", meta: "Queue posture", summary: "Claim problems become claim-review or claim-blocked cases because the issue already exists as a member-facing blockage." },
            { label: "Delivery failure", meta: "Follow-through", summary: "Delivery problems do not need a trust-like score; they already have a concrete operational failure to classify." },
          ],
        },
        {
          title: "Why payout has fewer scores",
          description: "Payout docs should explain that not every safety layer is score-driven.",
          items: [
            { label: "Explicit blocker beats abstract risk", meta: "Model choice", summary: "When a payout is failing, operators need the direct failure and next safe move more than a derived score." },
            { label: "Statuses matter more", meta: "Blocked, retry queued, needs project input", summary: "Payout clarity often comes from visible state transitions and retry posture rather than a numeric rating." },
            { label: "Owner-granted action rails", meta: "Project-safe recovery", summary: "Projects can help annotate, escalate or retry safe flows, but they still do not inherit internal payout control." },
          ],
        },
      ],
    },
  },
  {
    slug: "payout-risk-and-resolution-model",
    title: "Payout Risk and Resolution Model",
    summary: "The explicit model behind blocked claims, payout incidents, retry posture and why payout safety is not a hidden black-box score.",
    entries: [
      { label: "Failure-driven by design", meta: "Core model", summary: "Payout safety begins from concrete blocked claims, finalization failures, delivery issues and disputes rather than a single composite score." },
      { label: "Case type sets the path", meta: "Recovery model", summary: "The payout case type explains whether the next step is retry, project input, inventory follow-through or manual review." },
      { label: "Waiting state matters", meta: "Coordination model", summary: "Needs-project-input, blocked and retry-queued are often more meaningful than a number because they tell the operator what the system is waiting for." },
      { label: "Resolution history matters", meta: "Trust model", summary: "Payout safety needs a readable trail because members and projects care about why a claim stalled or closed." },
    ],
    matrix: {
      title: "Payout risk map",
      description: "This layer is designed to explain concrete reward and claim problems instead of inventing artificial score bands.",
      columns: ["Typical trigger", "How it becomes visible", "Next safe move"],
      rows: [
        {
          label: "Blocked claim",
          values: ["Manual review, policy gate or delivery dependency", "Claim case and queue state", "Review, annotate or request bounded project input"],
        },
        {
          label: "Finalization failure",
          values: ["Campaign rewards could not finalize", "Blocked payout case plus audit history", "Retry finalization or investigate source data"],
        },
        {
          label: "Inventory pressure",
          values: ["Reward stock posture no longer matches demand", "Project-visible incident or health signal", "Pause pressure or adjust reward posture"],
        },
        {
          label: "Dispute",
          values: ["Conflicting evidence about payout or claim outcome", "Dispute case with visible history", "Investigate, annotate and explicitly resolve"],
        },
      ],
    },
    deepDive: {
      title: "How payout safety should be read",
      description: "This page exists to explain that payout clarity comes from explicit states and case handling, not a mysterious payout score.",
      sections: [
        {
          title: "What counts as a payout warning",
          description: "Warnings in the payout layer are usually blocked or waiting states rather than severity-only alerts.",
          items: [
            { label: "Blocked", meta: "Action required", summary: "The system knows the current path cannot complete without intervention." },
            { label: "Needs project input", meta: "Bounded handoff", summary: "The operator side needs project context or a safe unblock step before the case can close." },
            { label: "Retry queued", meta: "Recovery in motion", summary: "A safe retry or rerun is already moving, which is different from an unresolved idle failure." },
          ],
        },
        {
          title: "Why public docs should say this plainly",
          description: "Project teams should understand that payout risk is operational and resolvable, not mystical.",
          items: [
            { label: "No fake confidence score", meta: "Clarity rule", summary: "The docs should explicitly say when the product uses concrete failure states instead of a score." },
            { label: "Cases explain trust", meta: "Member confidence", summary: "A readable case trail helps projects explain payout posture to members without exposing internal-only evidence." },
            { label: "Bounded project actions", meta: "Safety rule", summary: "Owners can grant safe payout actions, but internal operators still own the deeper payout rails." },
          ],
        },
      ],
    },
  },
  {
    slug: "onchain-case-types",
    title: "On-chain Case Types",
    summary: "The case taxonomy for ingress, enrichment and provider-side recovery.",
    entries: [
      { label: "Ingress rejected", summary: "An on-chain event or input was rejected before it could join the normal pipeline." },
      { label: "Enrichment failed", summary: "A chain-side event exists, but enrichment failed or produced incomplete usable context." },
      { label: "Provider sync failure", summary: "A provider or sync rail failed and needs bounded recovery." },
      { label: "Suspicious pattern", summary: "An anomaly or signal suggests review is needed even if the pipeline technically completed." },
    ],
    matrix: {
      title: "On-chain case handling map",
      columns: ["Typical owner", "Project-safe move", "Common end state"],
      rows: [
        { label: "Ingress rejected", values: ["Internal on-chain operator", "Usually none", "Resolved after retry or deeper operator action"] },
        { label: "Enrichment failed", values: ["Internal or project-bounded", "Rerun project enrichment", "Recovered or escalated"] },
        { label: "Provider sync failure", values: ["Internal on-chain operator", "Project visibility only", "Recovered after sync or queued deeper action"] },
        { label: "Suspicious pattern", values: ["Internal review", "Usually annotate or escalate", "Resolved, dismissed or linked into trust review"] },
      ],
    },
    deepDive: {
      title: "How on-chain cases are triggered",
      description: "On-chain cases come from both validation gates and later recovery rails, which is why the case taxonomy spans accepted and rejected events.",
      sections: [
        {
          title: "Pre-ingestion validation cases",
          description: "These cases appear before the event can safely join the normal pipeline.",
          items: [
            { label: "Unmatched project asset", meta: "Validation gate", summary: "The event contract or token did not match an active tracked project asset, so the system opens an unmatched-project-asset case." },
            { label: "Unlinked wallet activity", meta: "Identity gate", summary: "Tracked activity reached the system for a wallet that is not linked to a verified VYNTRO account." },
            { label: "Ingress rejected", meta: "Trust gate", summary: "The event failed the trust assessment hard enough that the pipeline rejected it instead of accepting it with warnings." },
          ],
        },
        {
          title: "Accepted but suspicious cases",
          description: "Some events are valid enough to ingest, but still carry risk that operators should see.",
          items: [
            { label: "Suspicious on-chain pattern", meta: "Accepted with pressure", summary: "If the event is accepted but still emits suspicious signals, the runtime opens or refreshes a suspicious-onchain-pattern case." },
            { label: "Trust case companion", meta: "Cross-console link", summary: "The same suspicious signals can also upsert trust cases, because chain-side behavior can affect the trust console too." },
            { label: "Highest-severity carry-through", meta: "Severity rule", summary: "The on-chain case inherits the highest severity among the suspicious signals attached to that event." },
          ],
        },
        {
          title: "Recovery-job cases",
          description: "Cases can also open later when retry, enrichment or provider sync jobs fail after the original event exists.",
          items: [
            { label: "Ingress retry failed", meta: "Retry rail", summary: "If a rejected ingress event is retried and still fails or throws, the runtime opens an ingress-retry-failed case." },
            { label: "Enrichment failed", meta: "Metadata rail", summary: "If the enrichment job cannot write derived metadata, the runtime opens an enrichment-failed case." },
            { label: "Provider sync failure", meta: "Indexer rail", summary: "If the provider sync cannot finish for a tracked asset, the runtime opens a blocked provider-sync-failure case." },
          ],
        },
      ],
    },
  },
  {
    slug: "trust-score-and-severity-bands",
    title: "Trust Score and Severity Bands",
    summary: "The exact bonuses, penalties, reject thresholds and watch bands that shape trust posture around on-chain activity.",
    entries: [
      { label: "Trust starts from the latest snapshot", meta: "Default 50", summary: "The assessment begins from the latest trust snapshot score, or 50 if no earlier trust posture exists." },
      { label: "Bonuses and penalties are explicit", meta: "No black box", summary: "Wallet age, linked socials, value bands, exit-like activity, hold windows, LP retention and allowlists all have named effects." },
      { label: "Some conditions reject immediately", meta: "Hard thresholds", summary: "Net-buy violations, cap breaches, hard hold failures and allowlist violations can reject the event before XP is granted." },
      { label: "Bands still matter after acceptance", meta: "Watch versus high", summary: "Even accepted events can still produce watch-band or high-risk warnings when the resulting trust posture falls too low." },
    ],
    matrix: {
      title: "Trust threshold map",
      description: "These bands and thresholds are intentionally explicit so operators can explain why the trust posture moved.",
      columns: ["Threshold or band", "Typical signal", "System consequence"],
      rows: [
        {
          label: "Wallet age under 1 day",
          values: ["fresh_wallet_activity", "Medium severity", "Score drops and the event stays suspicious even if it is otherwise valid"],
        },
        {
          label: "No connected socials",
          values: ["no_social_proof", "Medium severity", "Score drops sharply because the account lacks identity proof beyond the wallet"],
        },
        {
          label: "Daily cap or event-type cap reached",
          values: ["onchain_daily_cap_reached or onchain_event_type_cap_reached", "High severity", "The event is rejected and trust review posture opens immediately"],
        },
        {
          label: "Score <= 45 / <= 35",
          values: ["watch_trust_posture or low_trust_posture", "Medium or high severity", "The user enters watch or high-risk trust posture even after other logic finishes"],
        },
      ],
    },
    deepDive: {
      title: "What actually changes the score",
      description: "These examples come directly from the trust assessment helper, not from marketing copy or inferred behavior.",
      sections: [
        {
          title: "Identity and freshness signals",
          description: "The system cares whether the wallet and user identity feel durable enough to trust.",
          items: [
            { label: "Older wallets gain trust", meta: "7d and 30d bonuses", summary: "Wallets older than 7 or 30 days receive positive score weight because they look less farm-like." },
            { label: "Fresh wallets lose trust", meta: "Under 1 day or under 7 days", summary: "Very new wallets receive penalties, and extremely fresh wallets also emit a suspicious warning." },
            { label: "Linked socials matter", meta: "0, 1, 2, 3+", summary: "Three linked socials add strong trust, one linked social is weaker and zero socials trigger a visible no-social-proof warning." },
          ],
        },
        {
          title: "Behavioral thresholds",
          description: "Event pattern and value behavior often matter more than the event type name alone.",
          items: [
            { label: "Low-value transfer spam", meta: "Alert at 3, reject at 4", summary: "Repeated tiny transfers first create medium watch pressure, then cross into high-severity anti-abuse rejection." },
            { label: "Net-buy only rule", meta: "High severity", summary: "Buy-like events that do not actually increase net exposure trigger a hard violation and reject the event." },
            { label: "Exit-like activity", meta: "Medium pressure", summary: "Exit-like events lower trust and stay visible as review pressure because they may still be contextually valid." },
          ],
        },
        {
          title: "Retention and allowlists",
          description: "Some signals are specifically about proving meaningful on-chain commitment.",
          items: [
            { label: "Hold duration", meta: "<24h reject, <72h watch", summary: "Holds that are too short reject the event, while borderline holds stay in a watch band." },
            { label: "LP retention", meta: "<48h reject, <168h watch", summary: "LP removal too early creates high-severity rejection, while short-but-not-minimal retention stays watch-visible." },
            { label: "Contract call allowlist", meta: "High severity", summary: "Tracked contract calls outside the asset allowlist reject the event because they break the intended project signal model." },
          ],
        },
      ],
    },
  },
  {
    slug: "onchain-signal-and-recovery-model",
    title: "On-chain Signal and Recovery Model",
    summary: "The exact model behind on-chain warnings, suspicious patterns, provider sync failures and project-safe recovery actions.",
    entries: [
      { label: "Validation before scoring", meta: "Asset and wallet gates", summary: "The runtime first checks for active tracked asset matches and verified wallet links before any XP or deeper trust logic runs." },
      { label: "Trust-aware event acceptance", meta: "Assessment layer", summary: "If the event passes basic validation, the trust assessment decides whether the event is healthy, suspicious or rejected." },
      { label: "Recovery rails stay explicit", meta: "Retry, enrich, sync", summary: "Later jobs can still open on-chain cases even after the event exists, which is why recovery docs must explain more than ingestion alone." },
      { label: "Project-safe actions stay bounded", meta: "Permission model", summary: "Projects can retry, rerun enrichment or rescan assets if granted, but never run global provider jobs or internal-only recovery flows." },
    ],
    matrix: {
      title: "On-chain trigger map",
      description: "These are the major ways chain-side issues become visible in the product.",
      columns: ["Trigger", "Case or signal opened", "Typical next move"],
      rows: [
        {
          label: "No tracked asset match",
          values: ["unmatched_project_asset", "Inspect asset mapping or project configuration", "Resolve after tracked asset posture is corrected"],
        },
        {
          label: "Wallet not verified",
          values: ["unlinked_wallet_activity", "Link or verify the wallet before normal scoring can continue", "Resolve after identity posture recovers"],
        },
        {
          label: "Accepted event still looks risky",
          values: ["suspicious_onchain_pattern plus review flags", "Annotate, escalate or link into trust review", "Resolve or dismiss once the pattern is understood"],
        },
        {
          label: "Retry, enrichment or sync job fails",
          values: ["ingress_retry_failed, enrichment_failed or provider_sync_failure", "Retry, rerun, rescan or investigate deeper job health", "Resolve after the recovery rail completes"],
        },
      ],
    },
    deepDive: {
      title: "How the runtime makes these calls",
      description: "The public docs should say plainly which parts are deterministic checks and which parts are watch-pressure layers.",
      sections: [
        {
          title: "Deterministic validation checks",
          description: "These happen before the event can safely become part of the normal product flow.",
          items: [
            { label: "Tracked asset match", meta: "Project-assets check", summary: "If the contract address or token address does not match an active project asset, the event is blocked into an unmatched-project-asset case." },
            { label: "Verified wallet link", meta: "Wallet-links check", summary: "If the wallet is not linked to a verified account, the event is blocked into an unlinked-wallet-activity case." },
            { label: "Hard trust rejections", meta: "Trust assessment", summary: "If cap abuse, hard hold failure, allowlist violation or similar reject logic triggers, the event becomes ingress-rejected or suspicious-onchain-pattern instead of earning XP." },
          ],
        },
        {
          title: "Accepted but suspicious posture",
          description: "These rules let the event in while still telling operators something deserves review.",
          items: [
            { label: "Suspicious signals remain visible", meta: "Accepted event", summary: "The runtime still opens suspicious-onchain-pattern and trust cases when accepted activity looks risky enough to deserve attention." },
            { label: "Highest severity wins", meta: "On-chain case severity", summary: "The on-chain case severity is the highest severity found among the suspicious signals attached to that event." },
            { label: "Trust snapshots still update", meta: "Cumulative posture", summary: "Even rejected or suspicious events update trust posture so the next event assessment starts from a new baseline." },
          ],
        },
        {
          title: "Recovery jobs and bounded actions",
          description: "Later recovery rails are part of the model, not an implementation detail to hide.",
          items: [
            { label: "Ingress retry", meta: "Retry job", summary: "Previously rejected ingress rows can recover later, or they can become ingress-retry-failed cases if the retry still fails." },
            { label: "Enrichment rerun", meta: "Derived metadata job", summary: "Enrichment writes trust band, USD band, signal class and suspicious-flag count; if that write fails, the system opens an enrichment-failed case." },
            { label: "Provider sync", meta: "Indexer job", summary: "Provider sync failures open blocked cases per tracked asset, while successful later runs resolve those cases and write audit history." },
          ],
        },
      ],
    },
  },
  {
    slug: "automation-types",
    title: "Automation Types",
    summary: "The common automation rails used for community execution and follow-through.",
    entries: [
      { label: "Scheduled automations", summary: "Time-driven rails that post, remind or refresh at a planned cadence." },
      { label: "State-driven automations", summary: "Automations that fire because a system posture or workflow state changed." },
      { label: "Recovery automations", summary: "Follow-through rails that attempt retries, refreshes or bounded system recovery." },
    ],
  },
  {
    slug: "bot-commands",
    title: "Bot Commands",
    summary: "The shared command dictionary across Discord and Telegram.",
    entries: [
      { label: "/profile", summary: "Shows member identity, rank and recognition posture." },
      { label: "/missions", summary: "Routes a member into their active mission or quest rail." },
      { label: "/leaderboard", summary: "Shows standings and competitive status inside the active community context." },
      { label: "/raid", summary: "Surfaces the current raid context, status or entry posture." },
      { label: "/captain", summary: "Project-safe command rail for captain follow-through and assigned responsibilities." },
    ],
    matrix: {
      title: "Command audience matrix",
      columns: ["Primary user", "Primary output", "Connected layer"],
      rows: [
        { label: "/profile", values: ["Member", "Status and recognition posture", "Member Journey"], summary: "Shows who the member is in the current system context." },
        { label: "/missions", values: ["Member", "Active mission route", "Quest and campaign structure"], summary: "Routes members toward the next best mission action." },
        { label: "/leaderboard", values: ["Member or community", "Competitive standing", "Community OS and recognition"], summary: "Surfaces relative status inside the live community context." },
        { label: "/raid", values: ["Member or operator", "Current raid posture", "Raid execution"], summary: "Explains the activation context around an active raid moment." },
        { label: "/captain", values: ["Captain", "Assigned work and controls", "Community operations"], summary: "Supports bounded captain execution rather than deep operator control." },
      ],
    },
  },
  {
    slug: "status-labels",
    title: "Status Labels",
    summary: "The display-facing language the product uses for health, pressure and next-action posture.",
    entries: [
      { label: "Ready", meta: "Activation", summary: "The system believes the object can move forward safely." },
      { label: "Needs project input", meta: "Escalation", summary: "An operator or system flow is waiting on bounded project-side context." },
      { label: "Retry queued", meta: "Recovery", summary: "A safe retry or rerun is already scheduled and still in motion." },
      { label: "Resolved", meta: "History", summary: "The issue is closed with a known outcome and preserved timeline." },
    ],
  },
];

export function listDocsReferenceDatasets() {
  return docsReferenceDatasets;
}

export function loadDocsReferenceDataset(slug: string) {
  return docsReferenceDatasets.find((dataset) => dataset.slug === slug);
}
