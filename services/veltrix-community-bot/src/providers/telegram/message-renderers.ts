import { Markup } from "telegraf";
import type {
  TelegramLeaderboardEntry,
  TelegramMissionBoard,
} from "./community.js";

export function buildTelegramProjectButtons(
  buttons: Array<{ label: string; url: string | null | undefined }>
) {
  const validButtons = buttons.filter((button) => button.url).slice(0, 4);
  if (validButtons.length === 0) {
    return undefined;
  }

  return Markup.inlineKeyboard(
    validButtons.map((button) => [Markup.button.url(button.label, button.url!)])
  );
}

export function formatTelegramJourneyLabel(lane: "onboarding" | "active" | "comeback") {
  return lane === "onboarding"
    ? "Onboarding rail"
    : lane === "comeback"
      ? "Comeback rail"
      : "Community Home";
}

export function formatTelegramLeaderboard(entries: TelegramLeaderboardEntry[]) {
  if (entries.length === 0) {
    return "No linked contributors are on this board yet.";
  }

  return entries
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.displayName} - ${entry.xp} XP | L${entry.level} | Trust ${entry.trust}`
    )
    .join("\n");
}

export function formatTelegramMissionBoard(board: TelegramMissionBoard) {
  return [
    board.campaigns.length
      ? `Campaigns: ${board.campaigns.map((item) => item.title).join(" | ")}`
      : "Campaigns: none live right now",
    board.quests.length
      ? `Quests: ${board.quests.map((item) => `${item.title} (+${item.xp ?? 0} XP)`).join(" | ")}`
      : "Quests: none live right now",
    board.rewards.length
      ? `Rewards: ${board.rewards.map((item) => `${item.title} (${item.cost ?? 0} XP)`).join(" | ")}`
      : "Rewards: no live drops yet",
  ].join("\n");
}

export function formatTelegramRaidBoard(
  raids: Array<{ id: string; title: string; reward_xp: number | null }>
) {
  if (raids.length === 0) {
    return "No live raids are active for this project right now.";
  }

  return raids
    .map((raid, index) => `${index + 1}. ${raid.title} (+${raid.reward_xp ?? 0} XP)`)
    .join("\n");
}
