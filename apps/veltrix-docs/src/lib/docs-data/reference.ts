import type { DocsReferenceDataset } from "@/lib/docs-data/types";

const docsReferenceDatasets: DocsReferenceDataset[] = [
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
      description: "Veltrix permissions are deliberately split by what someone can see and what someone can do.",
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
    summary: "The map of how the main Veltrix objects and surfaces depend on each other.",
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
