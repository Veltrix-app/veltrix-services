import type { DocsStateExplorerDataset } from "@/lib/docs-data/types";

const docsStateExplorerDatasets: DocsStateExplorerDataset[] = [
  {
    slug: "docs-coverage",
    title: "Documentation coverage layers",
    summary: "VYNTRO Docs is strongest when a domain is covered from three angles: surface, workflow and exact reference language.",
    states: [
      {
        label: "Surface coverage",
        summary: "Surface pages explain what a page or console is, where to find it and how it fits into the rest of the system.",
        bullets: [
          "This is where snapshots, anatomy blocks and connected-surface context are most useful.",
          "Surface coverage helps a reader orient quickly before they need deeper procedural detail.",
          "A strong encyclopedia should make the surface feel legible without requiring product access first.",
        ],
      },
      {
        label: "Workflow coverage",
        summary: "Workflow pages explain how people move across surfaces and why the product sequences work the way it does.",
        bullets: [
          "Good workflow coverage prevents the docs from becoming a pile of disconnected screen explanations.",
          "This is where handoffs, bounded actions and operating loops become easiest to understand.",
          "A workflow layer is especially important for launches, trust review and recovery paths.",
        ],
      },
      {
        label: "Reference coverage",
        summary: "Reference pages define the exact states, grants, case types and models the rest of the docs link back to.",
        bullets: [
          "Reference is what keeps the encyclopedia precise instead of slowly drifting into fuzzy paraphrases.",
          "This layer carries status labels, permission matrices and scoring or signal logic.",
          "Coverage becomes complete when surface and workflow pages have a strong reference backbone behind them.",
        ],
      },
    ],
  },
  {
    slug: "control-atlas",
    title: "Control atlas families",
    summary: "VYNTRO controls fall into a few repeatable families: state transitions, visibility grants, signaling layers, recovery actions and delivery rails.",
    states: [
      {
        label: "State and builder controls",
        summary: "These controls change the shape or readiness of objects: open builders, publish, pause, archive, duplicate or move through launch posture.",
        bullets: [
          "They are strongest when they preserve context and clearly explain the next safe move.",
          "Launch and builder surfaces rely heavily on this control family.",
          "These controls should feel architectural rather than merely administrative.",
        ],
      },
      {
        label: "Visibility and signaling controls",
        summary: "These controls explain or reveal posture: summary-only access, detail grants, warnings, flags, severity labels and readiness bands.",
        bullets: [
          "They do not always mutate state directly, but they strongly shape how humans interpret the system.",
          "Trust, payout and on-chain consoles depend on these controls to stay bounded and explainable.",
          "A good docs atlas should show why these labels exist, not only where they appear.",
        ],
      },
      {
        label: "Recovery and delivery controls",
        summary: "These controls move work forward after something has already happened: retries, reruns, rescans, escalations, command rails and automation toggles.",
        bullets: [
          "They exist to keep the live system moving without exposing unsafe global operations to everyone.",
          "Projects often get only the bounded version of these controls, while operators retain deeper ones.",
          "The atlas should help readers recognize where a control belongs in the operating model.",
        ],
      },
    ],
  },
  {
    slug: "empty-states",
    title: "Empty-state posture",
    summary: "Empty states in VYNTRO should explain what is missing, why it matters and what the safest next move is.",
    states: [
      {
        label: "Not configured yet",
        summary: "The surface is empty because the project or operator has not created the underlying object or completed the prerequisite setup.",
        bullets: [
          "This state should name what is still missing rather than apologizing that nothing is here.",
          "Launch Workspace, builder pages and integration surfaces often use this posture before the first object exists.",
          "Good empty copy should point directly to the builder, setting or connection that resolves the gap.",
        ],
      },
      {
        label: "Configured but quiet",
        summary: "The surface is technically healthy, but there is currently no live pressure, no matching activity or no open work in this slice.",
        bullets: [
          "This state should reassure the reader that the system is calm rather than implying something failed.",
          "Overview, analytics, trust history and payout history often need this calm-posture empty state.",
          "The safest next move may be to keep monitoring instead of forcing the user into a fake action.",
        ],
      },
      {
        label: "Blocked by another surface",
        summary: "The page is empty because another prerequisite or owning surface still has unresolved work.",
        bullets: [
          "This state should name the blocking dependency: launch readiness, inventory posture, permissions, provider health or review ownership.",
          "It should route to the exact surface that can actually unblock the current page.",
          "This prevents empty states from reading like dead ends when the real problem lives elsewhere.",
        ],
      },
    ],
  },
  {
    slug: "action-behavior",
    title: "Action behavior posture",
    summary: "VYNTRO action buttons should explain what they change, who can use them and what surface or state comes next.",
    states: [
      {
        label: "Open or route",
        summary: "Some buttons primarily move the user into the next surface with context preserved rather than mutating data immediately.",
        bullets: [
          "Examples include opening a builder from Launch Workspace or following a deep link from a bot command.",
          "These actions should communicate destination and purpose so they read like guided next moves, not generic navigation.",
          "The docs should make it explicit when a button is a context-preserving route rather than a state change.",
        ],
      },
      {
        label: "Change lifecycle or posture",
        summary: "Other buttons change the state of an object or workflow: publish, pause, archive, duplicate or apply a grant.",
        bullets: [
          "These actions need clear consequence language because other surfaces will read the object differently afterward.",
          "Lifecycle and permission buttons should explain their downstream effects, not just their labels.",
          "The docs should treat these as trust-bearing actions because they materially change product posture.",
        ],
      },
      {
        label: "Recover or resolve",
        summary: "Recovery actions narrow live work toward closure through retries, rescans, escalations, annotations or explicit resolution states.",
        bullets: [
          "These buttons are strongest when the current blocker, owner and waiting state are already visible nearby.",
          "Project-safe recovery buttons should read more bounded than internal-only operator controls.",
          "The docs should explain what history gets written when one of these actions succeeds.",
        ],
      },
    ],
  },
  {
    slug: "warning-semantics",
    title: "Warning semantics",
    summary: "Warning copy should tell the reader what kind of risk exists, how urgent it is and whether the next move is local, cross-surface or operator-owned.",
    states: [
      {
        label: "Advisory warning",
        summary: "The system is surfacing pressure or drift, but the current posture is still usable if the reader understands the caveat.",
        bullets: [
          "This warning should explain what feels risky without sounding like a hard failure.",
          "Examples include watch-band trust posture, early launch incompleteness or mild integration drift.",
          "The docs should show that advisory warnings guide prioritization more than immediate incident response.",
        ],
      },
      {
        label: "Blocking warning",
        summary: "The current path cannot proceed safely until something specific changes.",
        bullets: [
          "This copy should name the blocker directly: missing project input, blocked claim, absent provider setup or unresolved incident ownership.",
          "Blocking warnings should usually pair with a bounded next action or a link to the owning surface.",
          "The docs should distinguish blocked from merely concerning so users do not overreact to every caution label.",
        ],
      },
      {
        label: "Escalation language",
        summary: "Some warnings are really coordination prompts that explain who needs to act next across teams or consoles.",
        bullets: [
          "These cues should use explicit waiting-state and ownership language instead of vague urgency wording.",
          "Examples include awaiting internal review, needs project input or incident promotion posture.",
          "The docs should show how escalation copy reduces ambiguity by naming the lane of responsibility clearly.",
        ],
      },
    ],
  },
  {
    slug: "recovery-actions",
    title: "Recovery action posture",
    summary: "Recovery controls move a live issue toward closure through a bounded sequence: clarify, act safely, then write history.",
    states: [
      {
        label: "Clarify the blocker",
        summary: "Before a retry or resolve action makes sense, the system should already explain what is blocked, who owns it and what lane it belongs to.",
        bullets: [
          "Blocked, needs project input and retry queued are not cosmetic labels; they guide which recovery control is safe next.",
          "The console should make the current owner and waiting state readable before anyone takes action.",
          "This is what keeps recovery controls from becoming a random button set.",
        ],
      },
      {
        label: "Run the bounded action",
        summary: "Safe recovery actions are intentionally narrow: retry, rerun, rescan, annotate, escalate, resolve or dismiss depending on the console.",
        bullets: [
          "Project-safe actions should stay visibly narrower than internal-only operator actions.",
          "The docs should explain the consequence of each action, not only the label on the button.",
          "A control is strongest when readers understand what layer of the system it changes.",
        ],
      },
      {
        label: "Write back into history",
        summary: "Recovery is not complete until the product can show what changed and why the case or incident is now in a new posture.",
        bullets: [
          "Timeline entries are part of the recovery control family because they preserve explainability.",
          "A resolved case without visible history weakens future support and trust.",
          "This is why the docs atlas treats history as part of the action model.",
        ],
      },
    ],
  },
  {
    slug: "delivery-controls",
    title: "Delivery control posture",
    summary: "Command and automation controls are the delivery rails that move project or community intent into member-visible action.",
    states: [
      {
        label: "Define the command posture",
        summary: "The first question is which commands or bot rails should exist for the project and who is supposed to use them.",
        bullets: [
          "Mission, profile, leaderboard, raid and captain commands serve different audiences and should be documented that way.",
          "Owner-level settings decide whether certain command families are active at all.",
          "The docs should explain command scope as part of community operations rather than as standalone syntax.",
        ],
      },
      {
        label: "Bound delivery through scope",
        summary: "Delivery controls are stronger when they make the difference between member, captain and operator rails obvious.",
        bullets: [
          "Command visibility and action scope should stay consistent with the broader permission posture of the product.",
          "Automation toggles and command scopes both shape who receives what behavior and when.",
          "This is why delivery controls belong in the atlas next to grants and recovery rails.",
        ],
      },
      {
        label: "Route back into the product",
        summary: "A delivery control often matters because it hands the user back into the right surface with context preserved.",
        bullets: [
          "Deep links complete the command flow when a bot response is only the first step.",
          "Automations and commands should feel like extensions of the web product, not parallel tools.",
          "The docs should help readers see delivery controls as part of one operating system.",
        ],
      },
    ],
  },
  {
    slug: "lifecycle",
    title: "Lifecycle posture",
    summary: "The common progression from preparation to activation to historical state.",
    states: [
      {
        label: "Draft to ready",
        summary: "Objects move from incomplete to prepared once the system has enough context to treat them as intentional.",
        bullets: [
          "Draft is safe for unfinished setup work.",
          "Ready implies the main configuration is in place.",
          "This is where launch checklists and readiness rails matter most.",
        ],
      },
      {
        label: "Ready to live",
        summary: "The transition from readiness into active use is where most publication and activation actions sit.",
        bullets: [
          "Live means the object is active in the relevant product surface.",
          "The system should keep this transition auditable.",
          "Project docs need this state change to stay understandable, not hidden.",
        ],
      },
      {
        label: "Paused to archived",
        summary: "Objects can be halted without being destroyed, and later preserved without staying active.",
        bullets: [
          "Pause is for temporary safety or operational holds.",
          "Archive keeps history and context without cluttering active workflows.",
          "Lifecycle-safe actions are a core VYNTRO posture rather than a side feature.",
        ],
      },
    ],
  },
  {
    slug: "permissions",
    title: "Permission posture",
    summary: "VYNTRO permissions are split across what someone can see and what someone can do.",
    states: [
      {
        label: "Summary access",
        summary: "A user can see high-level posture and counts without receiving sensitive or action-heavy detail.",
        bullets: [
          "This is the safest default for bounded project-facing operator consoles.",
          "It preserves visibility without leaking operational depth.",
          "Summary-only is the baseline for public console posture in docs.",
        ],
      },
      {
        label: "Detail access",
        summary: "A user can inspect more contextual case, member or system detail within the bounds of the product.",
        bullets: [
          "Owners can grant this explicitly where the console allows it.",
          "Not all detail levels are appropriate for public-facing project roles.",
          "The docs layer should make these boundaries very obvious.",
        ],
      },
      {
        label: "Action access",
        summary: "A user can take bounded actions such as annotate, escalate, retry or resolve, depending on the console.",
        bullets: [
          "Action rights are separate from visibility rights.",
          "Project-safe actions stay different from internal-only operator actions.",
          "This is a core theme across trust, payout and on-chain consoles.",
        ],
      },
    ],
  },
  {
    slug: "launch-readiness",
    title: "Launch readiness flow",
    summary: "Launch posture is a structured progression from identity and provider setup into content, rewards and calm operations.",
    states: [
      {
        label: "Identity and provider baseline",
        summary: "A project starts by proving it is real, reachable and technically connected enough to launch safely.",
        bullets: [
          "Profile basics, brand surface and contact path all contribute to launch credibility.",
          "Provider rails and community targets matter before any campaign is considered truly launchable.",
          "The launch model is intentionally broader than 'do you have content yet'.",
        ],
      },
      {
        label: "Content and reward spine",
        summary: "Once identity and delivery are healthy, the launch posture checks whether the project has an actual campaign and mission stack to send members into.",
        bullets: [
          "Campaigns create the launch spine, quests and raids create movement, and rewards create conversion or recognition pressure.",
          "The readiness model treats missing campaigns and missing mission rails as hard blockers.",
          "A launch is not considered mature if the project has infrastructure but nothing meaningful for members to do.",
        ],
      },
      {
        label: "Operations calmness",
        summary: "The last layer asks whether incidents, overrides and delivery posture are calm enough to support real traffic.",
        bullets: [
          "Critical incidents and active overrides change launch posture even when content is present.",
          "Push tests and calm operations matter because launch safety is operational, not just editorial.",
          "This is why Launch Workspace belongs in the docs as a real operating model rather than a convenience page.",
        ],
      },
    ],
  },
  {
    slug: "builder-handoffs",
    title: "Builder handoff flow",
    summary: "Project creation works best when the system hands context cleanly from launch posture into campaign, quest, raid and reward surfaces.",
    states: [
      {
        label: "Project-first entry",
        summary: "The project or launch workspace chooses the next builder so the user starts with the right context already attached.",
        bullets: [
          "Project context should be the default source of builder truth.",
          "This reduces route memory and keeps the builder family feeling like one system.",
          "The docs should frame this as a product rule rather than a convenience feature.",
        ],
      },
      {
        label: "Campaign as architecture layer",
        summary: "Campaign Studio usually comes before quest or raid depth because it provides the mission structure that later objects depend on.",
        bullets: [
          "Campaigns define intent, mission map and readiness posture.",
          "Quest, raid and reward builders should inherit this structure rather than recreate it.",
          "The docs should keep that parent-child relationship explicit.",
        ],
      },
      {
        label: "Builders return to operating posture",
        summary: "After content creation, the system should route users back into readiness or execution layers so they can judge what changed.",
        bullets: [
          "Launch Workspace is the natural return point during setup.",
          "Community OS becomes the natural return point once the launch is live.",
          "Good docs should explain that builders are part of a loop, not isolated one-off forms.",
        ],
      },
    ],
  },
  {
    slug: "verification-reward",
    title: "Verification and reward flow",
    summary: "Quest action, proof, incentive and downstream claim posture belong to one connected model rather than separate tools.",
    states: [
      {
        label: "Action first",
        summary: "The member task needs to be clear before any proof or reward logic becomes meaningful.",
        bullets: [
          "The docs should keep the member action readable in plain product language.",
          "Placement inside a campaign lane matters because it changes why the action exists at all.",
          "Action clarity is the prerequisite for later verification confidence.",
        ],
      },
      {
        label: "Verification posture",
        summary: "Proof logic should explain whether completion is manual, provider-driven or structured through explicit inputs.",
        bullets: [
          "Verification is a trust layer, not just a form field.",
          "Manual review and provider checks carry different latency and certainty posture.",
          "This is why Quest Studio needs a deeper docs explanation than a generic builder page.",
        ],
      },
      {
        label: "Reward and claim consequence",
        summary: "Reward logic changes not only motivation, but later claim pressure, payout cases and member expectations.",
        bullets: [
          "A reward is part of mission design before it ever becomes a payout event.",
          "The docs should connect Quest and Reward decisions to the Payout Console without forcing people to infer the relationship.",
          "Public docs are stronger when they show both motivation and operational consequence in the same model.",
        ],
      },
    ],
  },
  {
    slug: "community-signals",
    title: "Community and member signal flow",
    summary: "Community OS, commands and the member journey are linked by health, cohort, mission and recognition signals.",
    states: [
      {
        label: "Owner posture",
        summary: "Community work starts with owner-level visibility into health, cohorts, automations and next action pressure.",
        bullets: [
          "Owner mode is about choosing the next important move, not doing every task directly.",
          "Health signals should point toward action rather than sit as passive reporting.",
          "The docs should explain that owner posture is strategic but still operational.",
        ],
      },
      {
        label: "Captain and command execution",
        summary: "Captain lanes and bot commands turn owner posture into daily work and member activation.",
        bullets: [
          "Command rails are part of community operations, not a detached utility layer.",
          "Captain permissions are narrower than owner permissions on purpose.",
          "This is where the system moves from visibility into actual community motion.",
        ],
      },
      {
        label: "Member-facing feedback loop",
        summary: "Recognition, missions, signals and next-best-action routing show whether community work is actually moving the member journey.",
        bullets: [
          "The member journey closes the loop on community operations.",
          "Recognition, claimable rewards and mission lanes are all output signals from earlier project decisions.",
          "The docs should keep this loop explicit so Community OS never reads like internal busywork.",
        ],
      },
    ],
  },
  {
    slug: "trust-flow",
    title: "Trust case flow",
    summary: "Trust cases move through review, escalation and resolution with explicit ownership.",
    states: [
      {
        label: "Open and triaging",
        summary: "The case exists and needs an operator to establish initial context and severity.",
        bullets: ["Signals are grouped into a case.", "Triage clarifies type and urgency.", "History starts immediately."],
      },
      {
        label: "Needs project input",
        summary: "The internal team needs bounded project-side context before the case can be closed.",
        bullets: [
          "Project teams receive explicit visibility and action rights only if allowed.",
          "The case timeline keeps the handoff visible.",
          "This posture prevents unclear responsibility during review.",
        ],
      },
      {
        label: "Resolved or dismissed",
        summary: "The case reaches a known outcome and stays in history for explainability.",
        bullets: [
          "Resolution is not silent; it writes notes and history.",
          "Dismissal is still a meaningful outcome, not a deleted trail.",
          "This is why trust docs need to stay operator-grade even when public.",
        ],
      },
    ],
  },
  {
    slug: "warning-flow",
    title: "Warning and flag lifecycle",
    summary: "VYNTRO does not jump straight from raw activity to operator work; signals are progressively shaped into flags, cases and history.",
    states: [
      {
        label: "Raw event or failure",
        summary: "The system first sees a chain event, payout failure, delivery issue or provider-side incident in its raw operational form.",
        bullets: [
          "This layer is noisy and too technical for most operators or projects on its own.",
          "Risk flags and metadata are derived here before the issue becomes product language.",
          "Not every raw event becomes a visible warning, because many events remain healthy after assessment.",
        ],
      },
      {
        label: "Warning or review flag",
        summary: "If the event trips a threshold or suspicious pattern, the system turns it into a warning-style signal with explicit severity and reason text.",
        bullets: [
          "Trust signals produce flag types such as low-value transfer spam, short holds or low trust posture.",
          "Review flags keep the signal visible even before a deeper case workflow begins.",
          "This layer is where severity first becomes legible to humans instead of staying as raw metadata.",
        ],
      },
      {
        label: "Case and timeline",
        summary: "The signal becomes an explicit trust, payout or on-chain case once the product needs ownership, escalation or recovery tracking.",
        bullets: [
          "Cases add status, owner, escalation state and history.",
          "The same issue can stay bounded in project-facing views while internal operators retain deeper control.",
          "Resolution writes back into the timeline rather than silently removing the issue.",
        ],
      },
    ],
  },
  {
    slug: "trust-scoring",
    title: "Trust scoring flow",
    summary: "Trust posture is a bounded score with explicit bonuses, penalties, reject thresholds and warning bands.",
    states: [
      {
        label: "Start from latest score",
        summary: "The on-chain trust assessment begins from the user's latest trust snapshot score, or 50 if no prior score exists.",
        bullets: [
          "Trust is cumulative rather than recalculated from zero on every event.",
          "Every accepted or rejected event can move the next snapshot up or down.",
          "The score is clamped into a 0 to 100 range after bonuses and penalties are applied.",
        ],
      },
      {
        label: "Apply explicit bonuses and penalties",
        summary: "Wallet age, connected socials, event caps, low-value spam, hold windows, LP retention and allowlists all push the score up or down.",
        bullets: [
          "Examples include positive weight for older wallets or meaningful-value activity.",
          "Negative weight appears for fresh wallets, missing socials, exit-like activity or failing hold and LP retention windows.",
          "Some conditions both reduce score and create a visible suspicious signal at the same time.",
        ],
      },
      {
        label: "Derive warning bands",
        summary: "The final score is mapped into watch or high-risk posture bands that can open new trust warnings even if the event itself was not rejected.",
        bullets: [
          "Scores at or below 45 enter the watch band and emit a medium warning.",
          "Scores at or below 35 enter the high-risk band and emit a high-severity warning.",
          "This is why trust posture can remain under review even after an event was technically accepted.",
        ],
      },
    ],
  },
  {
    slug: "payout-flow",
    title: "Payout case flow",
    summary: "Payout cases track blocked claims, disputes and safe retries across internal and project rails.",
    states: [
      {
        label: "Blocked or disputed",
        summary: "A claim or payout path hit a problem that needs review or manual follow-through.",
        bullets: [
          "The console groups review work into explicit cases.",
          "Inventory and delivery pressure stay visible instead of hidden in logs.",
          "The system can now explain why a claim is not simply progressing.",
        ],
      },
      {
        label: "Retry or project input",
        summary: "The next move is either a safe retry or a bounded project-side unblock action.",
        bullets: [
          "Projects only receive safe actions if owners grant them.",
          "Retry posture should be visible in the timeline.",
          "The docs need to clarify what a project can and cannot do here.",
        ],
      },
      {
        label: "Resolved history",
        summary: "The case closes with an auditable outcome and remains part of the resolution history.",
        bullets: [
          "Internal and project-facing timelines stay consistent.",
          "Resolution notes matter for future disputes or support follow-through.",
          "This is why payout docs should feel like console documentation, not FAQ text.",
        ],
      },
    ],
  },
  {
    slug: "payout-risk",
    title: "Payout risk flow",
    summary: "Payout safety is mostly failure-driven rather than score-driven: blocked claims, finalization failures, delivery issues and disputes become cases directly.",
    states: [
      {
        label: "Failure or pressure appears",
        summary: "A blocked claim, reward inventory risk, delivery failure or campaign finalization problem creates payout pressure.",
        bullets: [
          "This layer is driven by explicit operational failures rather than a hidden numeric risk score.",
          "Case types tell operators what kind of follow-through is needed next.",
          "This makes payout safety easier to explain to projects than a black-box score would be.",
        ],
      },
      {
        label: "Bounded recovery path",
        summary: "The console decides whether the next move is retry, project input, dispute handling or direct operator resolution.",
        bullets: [
          "Project teams start from summary-only visibility and only receive safe actions when the owner grants them.",
          "Retries and project blockers stay visible in the timeline.",
          "The product prefers explicit case states over fuzzy payout-health labels.",
        ],
      },
      {
        label: "Resolution history",
        summary: "Once the payout issue is recovered or dismissed, the case stays in history so future disputes and support work remain explainable.",
        bullets: [
          "Resolution is part of trust-building for both members and project teams.",
          "The operator side needs to preserve what changed, not just that it is now green.",
          "This is why payout docs should feel like console documentation, not a claim FAQ.",
        ],
      },
    ],
  },
  {
    slug: "onchain-flow",
    title: "On-chain recovery flow",
    summary: "On-chain cases explain how signals and failures move into bounded recovery actions.",
    states: [
      {
        label: "Signal or failure detected",
        summary: "Ingress, enrichment or sync issues become explicit cases instead of hidden job noise.",
        bullets: [
          "Internal operators see the broader recovery surface.",
          "Projects only see bounded context if the console allows it.",
          "This makes chain-side issues explainable to non-specialists.",
        ],
      },
      {
        label: "Safe recovery queued",
        summary: "A project-safe retry, rerun or asset rescan is queued where appropriate.",
        bullets: [
          "Project-safe actions stay distinct from global internal jobs.",
          "Retry posture must stay visible in the timeline.",
          "Owners decide whether project teammates can perform these actions.",
        ],
      },
      {
        label: "Resolved or historical",
        summary: "Recovered cases move into a clear historical state with visible context.",
        bullets: [
          "The system preserves how the issue was recovered.",
          "This matters for future debugging and support handoffs.",
          "The docs should make the difference between signal and resolution very clear.",
        ],
      },
    ],
  },
  {
    slug: "onchain-signals",
    title: "On-chain signal model",
    summary: "On-chain warnings come from explicit trust thresholds, asset matching failures, wallet-link posture and provider-side recovery problems.",
    states: [
      {
        label: "Validate event and project context",
        summary: "The system first checks whether the event matches an active project asset and a verified wallet before any scoring or XP logic happens.",
        bullets: [
          "Missing asset matches open unmatched-project-asset cases.",
          "Unverified or unlinked wallets open unlinked-wallet-activity cases.",
          "These are deterministic product checks, not heuristic score bands.",
        ],
      },
      {
        label: "Assess trust pressure",
        summary: "If the event passes basic validation, the trust assessment applies caps, watch bands and anti-abuse thresholds to decide whether the event is healthy, suspicious or rejected.",
        bullets: [
          "Daily caps, event-type caps, low-value transfer spam, short holds and allowlist violations can all create warnings.",
          "Some thresholds reject the event immediately, while others allow it but still open suspicious-signal pressure.",
          "The highest suspicious-signal severity is then used for the corresponding on-chain case.",
        ],
      },
      {
        label: "Enrich and recover",
        summary: "After ingestion, enrichment and provider sync rails can still create or clear on-chain cases if the deeper recovery jobs fail or succeed.",
        bullets: [
          "Enrichment failures and provider-sync failures become explicit blocked cases.",
          "Retry and rerun actions resolve those cases when the system recovers.",
          "Project-safe actions stay bounded to retry, rescan and rerun rather than global provider control.",
        ],
      },
    ],
  },
];

export function listDocsStateExplorerDatasets() {
  return docsStateExplorerDatasets;
}

export function loadDocsStateExplorerDataset(slug: string) {
  return docsStateExplorerDatasets.find((dataset) => dataset.slug === slug);
}
