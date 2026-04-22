import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function OnchainConsoleDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Operator Docs"
      title="On-chain Console explains how chain-side failures and signals become bounded recovery work."
      description="This page documents the on-chain resolution system: internal full-control recovery, project-bounded health visibility, project-safe retries and the case model that keeps chain-side issues understandable."
      actions={[
        { href: "/operator-docs", label: "Back to Operator Docs" },
        { href: "/reference", label: "Open Reference" },
        { href: "/reference/recovery-and-resolution-actions", label: "Recovery Actions" },
      ]}
      chips={["Flagship page", "On-chain recovery", "Project-safe actions"]}
      relatedHrefs={[
        "/operator-docs",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/reference",
        "/reference/visibility-and-grant-controls",
        "/reference/warning-badges-and-status-cues",
        "/reference/recovery-and-resolution-actions",
        "/reference/onchain-case-types",
        "/reference/permissions",
        "/reference/signal-and-scoring-models",
        "/reference/warning-and-flag-lifecycle",
        "/reference/trust-score-and-severity-bands",
        "/reference/onchain-signal-and-recovery-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Primary users</p>
          <h2 className="text-2xl font-black text-white">Internal chain operators and bounded project recovery leads.</h2>
          <p className="text-sm leading-7 text-slate-300">
            On-chain Console turns chain-side failures and anomalies into explicit cases with safe, documented recovery posture.
          </p>
        </div>
      }
      snapshotSlug="onchain-console"
      stateExplorerSlug="onchain-flow"
      whatItIs={{
        description:
          "On-chain Console is the case-driven recovery layer for ingress, enrichment, sync and anomaly review. It gives internal operators full control while keeping project-facing recovery safely bounded.",
        bullets: [
          "Internal on-chain ops can see failures, signals and rawer recovery posture in one workspace.",
          "Projects can receive explicit, project-safe actions like retry, rerun enrichment or rescan assets if owners allow it.",
          "The case model keeps chain-side incidents explainable even when the underlying jobs are technical.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "Chain-side recovery was too easy to understand only through internal job logs. This console gives it a true product surface and a safe project-facing counterpart.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "The docs page needs to explain internal and project-facing recovery as one system with different permission boundaries.",
        items: [
          {
            label: "Internal route",
            meta: "/onchain",
            summary: "The full on-chain ops workspace for queues, failures, signals and resolution history.",
          },
          {
            label: "Project route",
            meta: "/projects/<id>/onchain",
            summary: "The bounded on-chain console where projects can inspect health and perform project-safe recovery actions if granted.",
          },
          {
            label: "Action posture",
            summary: "Project-facing actions stay limited to safe retries, rescans and reruns rather than global provider control.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Project-safe actions only",
            meta: "Permission rule",
            summary: "Owners can grant project-safe recovery moves, but not full internal provider or global sync control.",
          },
          {
            label: "Signal shaping matters",
            meta: "Docs rule",
            summary: "The public docs layer should explain on-chain anomalies without exposing unsafe raw payload detail.",
          },
          {
            label: "Recovery must stay case-driven",
            meta: "Operating rule",
            summary: "On-chain issues should remain visible as explicit cases with timeline context, not disappear into technical job abstractions.",
          },
        ],
      }}
      controlAtlas={{
        title: "The controls that matter most inside On-chain Console",
        description:
          "On-chain Console is easier to reason about when its controls are separated into validation cues, project-safe recovery moves and internal-only deeper rails.",
        sections: [
          {
            title: "Validation and visibility controls",
            description: "These controls explain whether the chain-side issue is even eligible to continue through the normal path.",
            items: [
              {
                label: "Asset-match and wallet-link cues",
                meta: "Validation control",
                summary: "These controls matter because unmatched assets and unlinked wallets are deterministic reasons an event or case will not behave like a normal healthy flow.",
              },
              {
                label: "Summary-only versus deeper detail",
                meta: "Visibility control",
                summary: "Projects should understand why they only see bounded health and case context until an owner explicitly grants more detail.",
              },
              {
                label: "Signal and warning chips",
                meta: "Interpretation control",
                summary: "These cues explain whether the issue is a simple validation failure, a suspicious accepted event or a deeper recovery problem.",
              },
            ],
          },
          {
            title: "Project-safe recovery controls",
            description: "These are the main actions a project may be allowed to use when helping with chain-side recovery.",
            items: [
              {
                label: "Retry case",
                meta: "Recovery control",
                summary: "A bounded retry action re-attempts the case path when the system believes the original failure may now recover cleanly.",
              },
              {
                label: "Rerun enrichment",
                meta: "Derived-state control",
                summary: "This control is for rebuilding derived metadata and signal context after an enrichment failure or stale state.",
              },
              {
                label: "Rescan project assets",
                meta: "Scope control",
                summary: "This action rechecks asset-linked context without crossing into global provider or infrastructure control.",
              },
            ],
          },
          {
            title: "Internal-only deeper rails",
            description: "Some controls remain deliberately outside project reach because they touch broader platform health.",
            items: [
              {
                label: "Global provider sync",
                meta: "Operator-only control",
                summary: "This remains internal because it changes broader sync posture, not just the state of one project-bound case.",
              },
              {
                label: "Blocked recovery and escalation actions",
                meta: "Case management control",
                summary: "Internal operators still need the deeper power to triage, escalate and classify harder chain-side issues.",
              },
              {
                label: "Timeline and outcome writes",
                meta: "History control",
                summary: "As with other safety consoles, the history layer is part of the control anatomy because it records what actually happened to the case.",
              },
            ],
          },
        ],
      }}
      deepDive={{
        title: "How on-chain warnings, flags and recovery cases are created",
        description:
          "On-chain Console only becomes intuitive when the docs explain the layered model behind it: validation gates first, trust-aware event assessment second and explicit recovery jobs after that.",
        sections: [
          {
            title: "What triggers on-chain warnings",
            description: "Not every on-chain issue comes from scoring; many start from explicit validation gates.",
            items: [
              {
                label: "Asset and wallet validation",
                meta: "Deterministic gates",
                summary:
                  "If the event does not match an active project asset or the wallet is not linked to a verified account, the system opens unmatched-project-asset or unlinked-wallet-activity cases immediately.",
              },
              {
                label: "Trust-based suspicious signals",
                meta: "Assessment layer",
                summary:
                  "After validation, the trust assessment can still mark an event as suspicious because of caps, low-value spam, short holds, short LP retention, allowlist violations or weak trust posture.",
              },
              {
                label: "Recovery-job failures",
                meta: "Retry, enrich, sync",
                summary:
                  "Even after an event exists, retry-on-ingress, enrichment and provider-sync jobs can open new on-chain cases if the recovery rail itself fails.",
              },
            ],
          },
          {
            title: "How severity is chosen",
            description: "The on-chain console uses both deterministic case severities and severity inherited from suspicious signals.",
            items: [
              {
                label: "Highest suspicious severity wins",
                meta: "Accepted but risky events",
                summary:
                  "If an accepted event still carries suspicious-signal pressure, the on-chain case severity becomes the highest severity among those signals so the queue reflects the strongest concern.",
              },
              {
                label: "Blocked recovery cases stay explicit",
                meta: "Retry and sync failures",
                summary:
                  "Ingress-retry failures, enrichment failures and provider-sync failures set their own explicit blocked severity because the recovery path itself is now the issue.",
              },
              {
                label: "Severity and acceptance are different",
                meta: "Key system rule",
                summary:
                  "An event can be accepted into the product and still create serious on-chain review pressure, which is why the docs should separate ingestion success from operator confidence.",
              },
            ],
          },
          {
            title: "Why projects only get project-safe actions",
            description: "The docs should be very explicit here because this boundary is core to the product's safety posture.",
            items: [
              {
                label: "Summary-only by default",
                meta: "Visibility boundary",
                summary:
                  "Project teams see only bounded health and case context until owners explicitly grant deeper wallet detail or project-safe actions.",
              },
              {
                label: "Project-safe recovery only",
                meta: "Action boundary",
                summary:
                  "Projects can retry a case, rerun project enrichment or rescan project assets when allowed, but they never inherit global provider jobs or internal-only chain control.",
              },
              {
                label: "History explains the chain side",
                meta: "Docs posture",
                summary:
                  "On-chain recovery should leave a readable trail because most readers are not raw blockchain operators and still need to understand what changed and why.",
              },
            ],
          },
        ],
      }}
      playbookExamples={{
        title: "On-chain Console playbook examples",
        description: "These examples show how chain-side recovery should explain bounded visibility, safe retries and the difference between quiet health and real chain pressure.",
        items: [
          {
            label: "No active chain recovery",
            meta: "Empty state",
            trigger: "Shown when the current project or operator lane has no unresolved ingress, enrichment or sync failures.",
            copy: "No unresolved on-chain cases right now. New validation failures, suspicious chain signals or recovery jobs will appear here when they need attention.",
            outcome: "The empty state should clarify what belongs in this console without pretending healthy chain posture means the page has no purpose.",
          },
          {
            label: "Rerun project enrichment",
            meta: "Project-safe action",
            trigger: "Shown when a case is blocked by stale or failed derived metadata and the current role has bounded permission to refresh it.",
            copy: "Rerun project enrichment",
            outcome: "This reinforces the distinction between safe project-scoped recovery and deeper internal provider control.",
          },
          {
            label: "Bounded wallet-detail warning",
            meta: "Warning copy",
            trigger: "Shown when a project can see the on-chain case but not the deeper wallet or event detail required for full investigation.",
            copy: "Wallet detail is still bounded on this project. Ask an owner for deeper access before using this case for member-level review.",
            outcome: "The warning should explain the permission boundary instead of making the user think data is missing or broken.",
          },
        ],
      }}
    />
  );
}
