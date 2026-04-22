export type DocsSnapshotSlug =
  | "campaign-studio"
  | "quest-studio"
  | "community-os"
  | "trust-console"
  | "payout-console"
  | "onchain-console";

export type DocsReferenceSlug =
  | "lifecycle-states"
  | "permissions"
  | "entities-and-relationships"
  | "permission-matrices"
  | "trust-case-types"
  | "payout-case-types"
  | "onchain-case-types"
  | "automation-types"
  | "bot-commands"
  | "status-labels";

export type DocsStateExplorerSlug =
  | "lifecycle"
  | "permissions"
  | "trust-flow"
  | "payout-flow"
  | "onchain-flow";

export type DocsSnapshotStat = {
  label: string;
  value: string;
};

export type DocsSnapshotPanel = {
  title: string;
  summary: string;
  highlights: string[];
};

export type DocsSurfaceSnapshot = {
  slug: DocsSnapshotSlug;
  title: string;
  summary: string;
  route: string;
  refreshedFrom: string;
  posture: string;
  stats: DocsSnapshotStat[];
  panels: DocsSnapshotPanel[];
};

export type DocsReferenceEntry = {
  label: string;
  summary: string;
  meta?: string;
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
