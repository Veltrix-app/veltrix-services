import type {
  TradingCostStatus,
  TradingSnapshotCadence,
  TradingTrackingMode,
} from "./types.js";

export type TrackingCostEstimateInput = {
  mode: TradingTrackingMode;
  pairs: number;
  participants: number;
  durationHours: number;
  snapshotCadence?: TradingSnapshotCadence;
  expectedEventsPerHour?: number;
  scanIntervalMinutes?: number;
};

export type TrackingCostUnits = {
  snapshots: number;
  storageWrites: number;
  logScans: number;
  eventDecodes: number;
  leaderboardRebuilds: number;
};

const COST_CENTS = {
  snapshot: 5,
  storageWrite: 0.14335,
  logScan: 0.85,
  eventDecode: 0.271,
  leaderboardRebuild: 4,
};

function safePositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getSnapshotCount(durationHours: number, cadence: TradingSnapshotCadence) {
  if (cadence === "start_end") return 2;
  if (cadence === "daily") return Math.floor(durationHours / 24) + 2;
  return Math.floor(durationHours) + 1;
}

export function estimateTrackingCostCents(input: TrackingCostEstimateInput) {
  const pairs = Math.ceil(safePositive(input.pairs, 1));
  const participants = Math.ceil(Math.max(input.participants, 0));
  const durationHours = safePositive(input.durationHours, 1);

  const units: TrackingCostUnits =
    input.mode === "snapshot"
      ? {
          snapshots: getSnapshotCount(durationHours, input.snapshotCadence ?? "hourly"),
          storageWrites: getSnapshotCount(durationHours, input.snapshotCadence ?? "hourly") * participants,
          logScans: 0,
          eventDecodes: 0,
          leaderboardRebuilds: 1,
        }
      : {
          snapshots: 0,
          storageWrites: 0,
          logScans:
            Math.ceil((durationHours * 60) / safePositive(input.scanIntervalMinutes ?? 10, 10)) * pairs,
          eventDecodes: Math.ceil(durationHours * safePositive(input.expectedEventsPerHour ?? 25, 25)),
          leaderboardRebuilds: Math.ceil(durationHours),
        };

  const estimatedCostCents = Math.ceil(
    units.snapshots * COST_CENTS.snapshot +
      units.storageWrites * COST_CENTS.storageWrite +
      units.logScans * COST_CENTS.logScan +
      units.eventDecodes * COST_CENTS.eventDecode +
      units.leaderboardRebuilds * COST_CENTS.leaderboardRebuild
  );

  return {
    estimatedCostCents,
    units,
  };
}

export function deriveCostStatus(input: {
  currentCostCents: number;
  budgetCapCents: number;
}): TradingCostStatus {
  if (input.budgetCapCents <= 0) return "ok";
  if (input.currentCostCents >= input.budgetCapCents) return "capped";
  if (input.currentCostCents >= input.budgetCapCents * 0.8) return "near_cap";
  return "ok";
}
