import type { DiscordRankRule, DiscordRankSource } from "./community.js";

export type DiscordRankSnapshot = {
  globalXp: number;
  projectXp: number;
  walletVerified: boolean;
  globalTrust?: number;
  trust?: number;
};

export type DiscordRankProgress = {
  rule: DiscordRankRule;
  currentValue: number;
  gap: number;
};

const DISPLAY_SOURCE_ORDER: DiscordRankSource[] = [
  "wallet_verified",
  "project_xp",
  "global_xp",
  "trust",
];

export function getDiscordRankSignalValue(
  snapshot: DiscordRankSnapshot,
  sourceType: DiscordRankSource
) {
  if (sourceType === "global_xp") {
    return snapshot.globalXp;
  }

  if (sourceType === "trust") {
    return typeof snapshot.trust === "number"
      ? snapshot.trust
      : typeof snapshot.globalTrust === "number"
        ? snapshot.globalTrust
        : 50;
  }

  if (sourceType === "wallet_verified") {
    return snapshot.walletVerified ? 1 : 0;
  }

  return snapshot.projectXp;
}

export function formatDiscordRankSourceLabel(sourceType: DiscordRankSource) {
  if (sourceType === "global_xp") return "Global XP";
  if (sourceType === "trust") return "Trust";
  if (sourceType === "wallet_verified") return "Verified Wallet";
  return "Project XP";
}

export function doesDiscordRankRuleMatch(
  snapshot: DiscordRankSnapshot,
  rule: DiscordRankRule
) {
  const currentValue = getDiscordRankSignalValue(snapshot, rule.sourceType);
  const threshold = rule.sourceType === "wallet_verified" ? Math.max(1, rule.threshold) : rule.threshold;
  return currentValue >= threshold;
}

export function sortDiscordRankRulesForDisplay(rules: DiscordRankRule[]) {
  return [...rules].sort((left, right) => {
    const sourceDelta =
      DISPLAY_SOURCE_ORDER.indexOf(left.sourceType) - DISPLAY_SOURCE_ORDER.indexOf(right.sourceType);

    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    if (left.threshold !== right.threshold) {
      return left.threshold - right.threshold;
    }

    return left.label.localeCompare(right.label);
  });
}

export function getMatchedDiscordRankRules(
  snapshot: DiscordRankSnapshot,
  rules: DiscordRankRule[]
) {
  return sortDiscordRankRulesForDisplay(rules).filter((rule) => doesDiscordRankRuleMatch(snapshot, rule));
}

export function findNextDiscordRankRule(
  snapshot: DiscordRankSnapshot,
  rules: DiscordRankRule[],
  sourceType?: DiscordRankSource
): DiscordRankProgress | null {
  const candidates = sortDiscordRankRulesForDisplay(rules)
    .filter((rule) => (sourceType ? rule.sourceType === sourceType : true))
    .map((rule) => {
      const currentValue = getDiscordRankSignalValue(snapshot, rule.sourceType);
      const threshold = rule.sourceType === "wallet_verified" ? Math.max(1, rule.threshold) : rule.threshold;
      return {
        rule,
        currentValue,
        gap: Math.max(0, threshold - currentValue),
      };
    })
    .filter((candidate) => candidate.gap > 0)
    .sort((left, right) => {
      if (left.gap !== right.gap) {
        return left.gap - right.gap;
      }

      if (left.rule.threshold !== right.rule.threshold) {
        return left.rule.threshold - right.rule.threshold;
      }

      return left.rule.label.localeCompare(right.rule.label);
    });

  return candidates[0] ?? null;
}
