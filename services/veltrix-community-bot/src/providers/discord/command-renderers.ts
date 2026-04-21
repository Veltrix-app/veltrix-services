import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type APIEmbedField,
} from "discord.js";
import type {
  DiscordLeaderboardEntry,
  DiscordLeaderboardPeriod,
  DiscordLeaderboardScope,
  DiscordMissionBoard,
  DiscordRaidRailEntry,
} from "./community.js";

export function formatDiscordMetricLabel(label: string, value: string) {
  return `${label}: ${value}`;
}

export function formatDiscordJourneyLabel(lane: "onboarding" | "active" | "comeback") {
  return lane === "onboarding"
    ? "Onboarding rail"
    : lane === "comeback"
      ? "Comeback rail"
      : "Community Home";
}

export function buildDiscordCommunityButtons(
  buttons: Array<{ label: string; url: string | null | undefined }>
) {
  const validButtons = buttons
    .filter((button) => button.url)
    .slice(0, 5)
    .map((button) =>
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(button.label).setURL(button.url!)
    );

  if (validButtons.length === 0) {
    return [] as Array<ActionRowBuilder<ButtonBuilder>>;
  }

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(validButtons)];
}

export function formatDiscordLeaderboardLines(entries: DiscordLeaderboardEntry[]) {
  if (entries.length === 0) {
    return "No linked contributors are on this board yet.";
  }

  return entries
    .map(
      (entry, index) =>
        `**${index + 1}.** ${entry.displayName} - ${entry.xp} XP | L${entry.level} | Trust ${entry.trust}`
    )
    .join("\n");
}

export function formatDiscordLeaderboardPeriodLabel(period: DiscordLeaderboardPeriod) {
  if (period === "all_time") return "All-time";
  if (period === "monthly") return "Monthly";
  return "Weekly";
}

export function formatDiscordLeaderboardScopeLabel(scope: DiscordLeaderboardScope) {
  return scope === "global" ? "Global" : "Project";
}

export function formatDiscordRaidLines(entries: DiscordRaidRailEntry[]) {
  if (entries.length === 0) {
    return "No live raids are active for this community right now.";
  }

  return entries
    .map(
      (entry, index) =>
        `**${index + 1}.** ${entry.title} - +${entry.rewardXp} XP${entry.shortDescription ? ` | ${entry.shortDescription}` : ""}`
    )
    .join("\n");
}

export function buildDiscordMissionFields(board: DiscordMissionBoard): APIEmbedField[] {
  return [
    {
      name: "Campaigns",
      value:
        board.campaigns.length > 0
          ? board.campaigns.map((item) => item.title).join("\n")
          : "No live campaigns right now.",
      inline: false,
    },
    {
      name: "Quest lane",
      value:
        board.quests.length > 0
          ? board.quests.map((item) => `${item.title} (+${item.xp} XP)`).join("\n")
          : "No live quests right now.",
      inline: false,
    },
    {
      name: "Reward drops",
      value:
        board.rewards.length > 0
          ? board.rewards.map((item) => `${item.title} (${item.cost} XP)`).join("\n")
          : "No live reward drops right now.",
      inline: false,
    },
  ];
}
