export type DocsSnapshotSlug =
  | "campaign-studio"
  | "quest-studio"
  | "community-os"
  | "trust-console"
  | "payout-console"
  | "onchain-console";

export type DocsReferenceSlug =
  | "docs-coverage-map"
  | "control-atlas"
  | "empty-states-and-zero-data"
  | "action-buttons-and-safe-next-moves"
  | "warning-copy-and-escalation-language"
  | "builder-controls-and-state-actions"
  | "visibility-and-grant-controls"
  | "warning-badges-and-status-cues"
  | "recovery-and-resolution-actions"
  | "command-and-automation-controls"
  | "lifecycle-states"
  | "permissions"
  | "entities-and-relationships"
  | "permission-matrices"
  | "launch-and-readiness-model"
  | "builder-and-handoff-model"
  | "verification-and-reward-model"
  | "community-and-member-signal-model"
  | "signal-and-scoring-models"
  | "warning-and-flag-lifecycle"
  | "trust-case-types"
  | "trust-score-and-severity-bands"
  | "payout-case-types"
  | "payout-risk-and-resolution-model"
  | "onchain-case-types"
  | "onchain-signal-and-recovery-model"
  | "automation-types"
  | "bot-commands"
  | "status-labels";

export type DocsStateExplorerSlug =
  | "docs-coverage"
  | "control-atlas"
  | "empty-states"
  | "action-behavior"
  | "warning-semantics"
  | "recovery-actions"
  | "delivery-controls"
  | "lifecycle"
  | "permissions"
  | "launch-readiness"
  | "builder-handoffs"
  | "verification-reward"
  | "community-signals"
  | "trust-flow"
  | "warning-flow"
  | "trust-scoring"
  | "payout-flow"
  | "payout-risk"
  | "onchain-flow"
  | "onchain-signals";

export type DocsSnapshotStat = {
  label: string;
  value: string;
};

export type DocsSnapshotPanel = {
  title: string;
  summary: string;
  highlights: string[];
};

export type DocsSnapshotPhase = {
  label: string;
  title: string;
  summary: string;
};

export type DocsSnapshotSignal = {
  label: string;
  value: string;
  summary: string;
  tone?: "cyan" | "lime" | "slate";
};

export type DocsSurfaceSnapshot = {
  slug: DocsSnapshotSlug;
  title: string;
  summary: string;
  route: string;
  refreshedFrom: string;
  posture: string;
  stats: DocsSnapshotStat[];
  phases: DocsSnapshotPhase[];
  panels: DocsSnapshotPanel[];
  signals: DocsSnapshotSignal[];
};

export type DocsReferenceEntry = {
  label: string;
  summary: string;
  meta?: string;
};

export type DocsReferenceSection = {
  title: string;
  description?: string;
  items: DocsReferenceEntry[];
};

export type DocsReferenceDeepDive = {
  title: string;
  description?: string;
  sections: DocsReferenceSection[];
};

export type DocsReferenceMatrixRow = {
  label: string;
  values: string[];
  summary?: string;
};

export type DocsReferenceMatrix = {
  title: string;
  description?: string;
  columns: string[];
  rows: DocsReferenceMatrixRow[];
};

export type DocsReferenceDataset = {
  slug: DocsReferenceSlug;
  title: string;
  summary: string;
  entries: DocsReferenceEntry[];
  matrix?: DocsReferenceMatrix;
  deepDive?: DocsReferenceDeepDive;
};

export type DocsStateExplorerState = {
  label: string;
  summary: string;
  bullets: string[];
  note?: string;
};

export type DocsStateExplorerDataset = {
  slug: DocsStateExplorerSlug;
  title: string;
  summary: string;
  states: DocsStateExplorerState[];
};
