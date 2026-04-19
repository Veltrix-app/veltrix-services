import { Markup, Telegraf } from "telegraf";
import { env } from "../../config/env.js";
import { loadCaptainByProviderIdentity } from "../../core/community/captains.js";
import { loadCommunityJourneyPrompt } from "../../core/community/journeys.js";
import { buildCommunityJourneyDeepLinks } from "../../core/community/automation-links.js";
import {
  loadTelegramIdentitySnapshot,
  loadTelegramIntegrationContextByChatId,
  loadTelegramLeaderboard,
  loadTelegramMissionBoard,
  loadTelegramRaidBoard,
} from "./community.js";

const appUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(
  /\/+$/,
  ""
);

let telegramBot: Telegraf | null = null;
let handlersRegistered = false;
let telegramBotLaunched = false;

function getChatId(ctx: { chat?: { id?: number | string } }) {
  return ctx.chat?.id ? String(ctx.chat.id) : "";
}

function buildProjectButtons(buttons: Array<{ label: string; url: string | null | undefined }>) {
  const validButtons = buttons.filter((button) => button.url).slice(0, 4);
  if (validButtons.length === 0) {
    return undefined;
  }

  return Markup.inlineKeyboard(
    validButtons.map((button) => [Markup.button.url(button.label, button.url!)])
  );
}

function formatJourneyLabel(lane: "onboarding" | "active" | "comeback") {
  return lane === "onboarding"
    ? "Onboarding rail"
    : lane === "comeback"
      ? "Comeback rail"
      : "Community Home";
}

function formatLeaderboard(entries: Awaited<ReturnType<typeof loadTelegramLeaderboard>>) {
  if (entries.length === 0) {
    return "No linked contributors are on this board yet.";
  }

  return entries
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.displayName} — ${entry.xp} XP | L${entry.level} | Trust ${entry.trust}`
    )
    .join("\n");
}

function formatMissionBoard(board: Awaited<ReturnType<typeof loadTelegramMissionBoard>>) {
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

function formatRaidBoard(raids: Awaited<ReturnType<typeof loadTelegramRaidBoard>>) {
  if (raids.length === 0) {
    return "No live raids are active for this project right now.";
  }

  return raids
    .map((raid, index) => `${index + 1}. ${raid.title} (+${raid.reward_xp ?? 0} XP)`)
    .join("\n");
}

async function resolveCommunityContext(ctx: any) {
  const chatId = getChatId(ctx);
  if (!chatId) {
    await ctx.reply("This command needs to run inside a Telegram group or chat mapped in Veltrix.");
    return null;
  }

  const context = await loadTelegramIntegrationContextByChatId(chatId);
  if (!context) {
    await ctx.reply("This Telegram chat is not mapped to a Veltrix project yet.");
    return null;
  }

  if (!context.settings.commandsEnabled) {
    await ctx.reply(
      "Telegram community commands are disabled for this project right now. Enable them in the Veltrix portal first."
    );
    return null;
  }

  return context;
}

function registerTelegramCommandHandlers(bot: Telegraf) {
  if (handlersRegistered) {
    return;
  }

  bot.start(async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;
    const links = buildCommunityJourneyDeepLinks(context.projectId, "onboarding");

    await ctx.reply(
      `Veltrix is live for ${context.projectName}. Use /link, /profile, /missions, /leaderboard, /raid or /captain to work this community rail.`,
      buildProjectButtons([
        { label: "Open onboarding rail", url: links.onboardingUrl },
        { label: "Open Veltrix profile", url: `${appUrl}/profile` },
      ])
    );
  });

  bot.command("link", async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;
    const links = buildCommunityJourneyDeepLinks(context.projectId, "onboarding");

    await ctx.reply(
      `Link into ${context.projectName} so this chat can use your live Veltrix profile for community ranks, captain rails, leaderboards and the right onboarding journey.`,
      buildProjectButtons([
        { label: "Open onboarding rail", url: links.onboardingUrl },
        { label: "Open Veltrix profile", url: `${appUrl}/profile` },
      ])
    );
  });

  bot.command("profile", async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;

    const snapshot = await loadTelegramIdentitySnapshot(String(ctx.from.id), context.projectId);
    if (!snapshot) {
      await ctx.reply("Your Telegram account is not linked to Veltrix yet. Use /link first.");
      return;
    }
    const journeyPrompt = await loadCommunityJourneyPrompt({
      projectId: context.projectId,
      authUserId: snapshot.authUserId,
    });
    const captain = await loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "telegram",
      providerUserId: String(ctx.from.id),
    });
    const links =
      journeyPrompt?.urls ?? buildCommunityJourneyDeepLinks(context.projectId, "active");

    await ctx.reply(
      [
        `${snapshot.profileUsername} loadout`,
        `Project: ${context.projectName}`,
        `Project XP: ${snapshot.projectXp} | L${snapshot.projectLevel} | Trust ${snapshot.projectTrust}`,
        `Global XP: ${snapshot.globalXp} | L${snapshot.globalLevel} | Trust ${snapshot.globalTrust}`,
        `Missions: ${snapshot.projectQuestsCompleted} quests | ${snapshot.projectRaidsCompleted} raids`,
        `Wallet: ${snapshot.walletVerified ? "Verified" : "Missing"}`,
        `Lane: ${journeyPrompt ? formatJourneyLabel(journeyPrompt.lane) : "Community Home"}`,
        `Next unlock: ${journeyPrompt?.nextUnlockLabel ?? "Keep your community lane moving."}`,
      ].join("\n"),
      buildProjectButtons([
        {
          label: journeyPrompt ? `Open ${formatJourneyLabel(journeyPrompt.lane)}` : "Open Community Home",
          url: links.primaryUrl,
        },
        { label: "Open full profile", url: `${appUrl}/profile` },
        { label: "Captain workspace", url: captain ? links.captainWorkspaceUrl : null },
      ])
    );
  });

  bot.command("missions", async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;

    const board = await loadTelegramMissionBoard(context.projectId);
    await ctx.reply(
      `${context.projectName} mission board\n\n${formatMissionBoard(board)}`,
      buildProjectButtons([
        {
          label: "Open Community Home",
          url: buildCommunityJourneyDeepLinks(context.projectId, "active").communityUrl,
        },
      ])
    );
  });

  bot.command("leaderboard", async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;

    const entries = await loadTelegramLeaderboard({
      projectId: context.projectId,
      period: "weekly",
      limit: 10,
    });
    const captain = await loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "telegram",
      providerUserId: String(ctx.from.id),
    });
    const links = buildCommunityJourneyDeepLinks(context.projectId, "active");

    await ctx.reply(
      `${context.projectName} weekly leaderboard\n\n${formatLeaderboard(entries)}`,
      buildProjectButtons([
        { label: "Open Community Home", url: links.communityUrl },
        { label: "Captain workspace", url: captain ? links.captainWorkspaceUrl : null },
      ])
    );
  });

  bot.command("raid", async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;

    const raids = await loadTelegramRaidBoard(context.projectId);
    const captain = await loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "telegram",
      providerUserId: String(ctx.from.id),
    });
    const links = buildCommunityJourneyDeepLinks(context.projectId, "active");
    await ctx.reply(
      `${context.projectName} raid rail\n\n${formatRaidBoard(raids)}`,
      buildProjectButtons([
        { label: "Open Community Home", url: links.communityUrl },
        { label: "Captain workspace", url: captain ? links.captainWorkspaceUrl : null },
      ])
    );
  });

  bot.command("captain", async (ctx) => {
    const context = await resolveCommunityContext(ctx);
    if (!context) return;

    const captain = await loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "telegram",
      providerUserId: String(ctx.from.id),
    });

    if (!captain) {
      await ctx.reply(
        "You do not have an active captain seat for this project. Project owners can assign captains in Community OS."
      );
      return;
    }

    const links = buildCommunityJourneyDeepLinks(context.projectId, "active");
    await ctx.reply(
      [
        `${context.projectName} captain workspace`,
        `Role: ${captain.role}`,
        `Permissions: ${captain.permissions.length > 0 ? captain.permissions.join(", ") : "No scoped permissions"}`,
        "Use the project-private workspace for queue execution, blockers and recent outcomes.",
      ].join("\n"),
      buildProjectButtons([
        { label: "Open captain workspace", url: links.captainWorkspaceUrl },
        { label: "Open Community Home", url: links.communityUrl },
      ])
    );
  });

  bot.catch((error) => {
    console.error("[telegram] command handler failed", error);
  });

  handlersRegistered = true;
}

export function createTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return null;
  }

  if (telegramBot) {
    return telegramBot;
  }

  telegramBot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
  registerTelegramCommandHandlers(telegramBot);

  return telegramBot;
}

export async function launchTelegramBot() {
  const bot = createTelegramBot();
  if (!bot || telegramBotLaunched) {
    return bot;
  }

  await bot.telegram.setMyCommands([
    { command: "link", description: "Link your Telegram identity with Veltrix" },
    { command: "profile", description: "Show your live Veltrix community profile" },
    { command: "missions", description: "Show the live project mission board" },
    { command: "leaderboard", description: "Show the current weekly leaderboard" },
    { command: "raid", description: "Show the live raid rail" },
    { command: "captain", description: "Open your project captain workspace" },
  ]);

  await bot.launch();
  telegramBotLaunched = true;
  return bot;
}

export function getTelegramBot() {
  return telegramBot;
}
