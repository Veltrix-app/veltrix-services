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
    slug: "signal-and-scoring-models",
    title: "Signal and Scoring Models",
    summary: "The shared map for how Veltrix turns raw system activity into warnings, severity bands, cases and bounded project visibility.",
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
            { label: "Unlinked wallet activity", meta: "Identity gate", summary: "Tracked activity reached the system for a wallet that is not linked to a verified Veltrix account." },
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
