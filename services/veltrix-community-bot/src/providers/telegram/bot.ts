import { Telegraf } from "telegraf";
import { env } from "../../config/env.js";
import { loadCaptainByProviderIdentity } from "../../core/community/captains.js";
import { buildCommunityCommandLinks } from "../../core/community/command-links.js";
import {
  areCommunityCommandDeepLinksEnabled,
  buildDisabledCommandMessage,
  type CommunityCommandKey,
  isCommunityCommandEnabled,
} from "../../core/community/command-scopes.js";
import {
  formatManualRaidCommandResult,
  parseTelegramNewRaidCommand,
} from "../../core/raids/manual-raid-command.js";
import { loadCommunityJourneyPrompt } from "../../core/community/journeys.js";
import { loadProjectCommunityOutcomeSummary } from "../../core/community/outcomes.js";
import { createManualLiveRaidFromXPost } from "../../jobs/create-manual-live-raid.js";
import {
  loadTelegramIdentitySnapshot,
  loadTelegramIntegrationContextByChatId,
  loadTelegramIntegrationContexts,
  loadTelegramLeaderboard,
  loadTelegramMissionBoard,
  loadTelegramRaidBoard,
} from "./community.js";
import {
  buildTelegramProjectButtons,
  formatTelegramJourneyLabel,
  formatTelegramLeaderboard,
  formatTelegramMissionBoard,
  formatTelegramRaidBoard,
} from "./message-renderers.js";

let telegramBot: Telegraf | null = null;
let handlersRegistered = false;
let telegramBotLaunched = false;

function buildTelegramCommandPayload(settings: {
  commandsEnabled: boolean;
  missionCommandsEnabled: boolean;
  captainCommandsEnabled: boolean;
  leaderboardEnabled: boolean;
  raidOpsEnabled: boolean;
  captainsEnabled: boolean;
}) {
  if (!settings.commandsEnabled) {
    return [] as Array<{ command: string; description: string }>;
  }

  return [
    { command: "link", description: "Link your Telegram identity with VYNTRO" },
    { command: "profile", description: "Show your live VYNTRO community profile" },
    ...(settings.missionCommandsEnabled
      ? [{ command: "missions", description: "Show the live project mission board" }]
      : []),
    ...(settings.leaderboardEnabled
      ? [{ command: "leaderboard", description: "Show the current weekly leaderboard" }]
      : []),
    ...(settings.raidOpsEnabled
      ? [
          { command: "raid", description: "Show the live raid rail" },
          { command: "newraid", description: "Create a live raid from an X post URL" },
        ]
      : []),
    ...(settings.captainsEnabled && settings.captainCommandsEnabled
      ? [{ command: "captain", description: "Open your project captain workspace" }]
      : []),
  ];
}

function getChatId(ctx: { chat?: { id?: number | string } }) {
  return ctx.chat?.id ? String(ctx.chat.id) : "";
}

function listEnabledTelegramCommands(settings: {
  missionCommandsEnabled: boolean;
  captainCommandsEnabled: boolean;
  leaderboardEnabled: boolean;
  raidOpsEnabled: boolean;
  captainsEnabled: boolean;
}) {
  const commands = ["/link", "/profile"];

  if (settings.missionCommandsEnabled) {
    commands.push("/missions");
  }
  if (settings.leaderboardEnabled) {
    commands.push("/leaderboard");
  }
  if (settings.raidOpsEnabled) {
    commands.push("/raid", "/newraid");
  }
  if (settings.captainsEnabled && settings.captainCommandsEnabled) {
    commands.push("/captain");
  }

  return commands;
}

async function resolveCommunityContext(ctx: any, command?: CommunityCommandKey) {
  const chatId = getChatId(ctx);
  if (!chatId) {
    await ctx.reply("This command needs to run inside a Telegram group or chat mapped in VYNTRO.");
    return null;
  }

  const context = await loadTelegramIntegrationContextByChatId(chatId);
  if (!context) {
    await ctx.reply("This Telegram chat is not mapped to a VYNTRO project yet.");
    return null;
  }

  if (!context.settings.commandsEnabled) {
    await ctx.reply(
      "Telegram community commands are disabled for this project right now. Enable them in the VYNTRO portal first."
    );
    return null;
  }

  if (
    command &&
    !isCommunityCommandEnabled({
      command,
      platform: "telegram",
      settings: context.settings,
    })
  ) {
    await ctx.reply(buildDisabledCommandMessage(command));
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

    const links = buildCommunityCommandLinks({
      projectId: context.projectId,
      lane: "onboarding",
      deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
    });
    const enabledCommands = listEnabledTelegramCommands(context.settings);

    await ctx.reply(
      `VYNTRO is live for ${context.projectName}. Available commands: ${enabledCommands.join(", ")}.`,
      buildTelegramProjectButtons([
        { label: "Open onboarding rail", url: links.onboardingUrl },
        { label: "Open VYNTRO profile", url: links.profileUrl },
      ])
    );
  });

  bot.command("link", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "link");
    if (!context) return;

    const links = buildCommunityCommandLinks({
      projectId: context.projectId,
      lane: "onboarding",
      deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
    });

    await ctx.reply(
      `Link into ${context.projectName} so this chat can use your live VYNTRO profile for community ranks, captain rails, leaderboards and the right onboarding journey.`,
      buildTelegramProjectButtons([
        { label: "Open onboarding rail", url: links.onboardingUrl },
        { label: "Open VYNTRO profile", url: links.profileUrl },
      ])
    );
  });

  bot.command("profile", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "profile");
    if (!context) return;

    const providerUserId = String(ctx.from?.id ?? "");
    const snapshot = await loadTelegramIdentitySnapshot(providerUserId, context.projectId);
    if (!snapshot) {
      await ctx.reply("Your Telegram account is not linked to VYNTRO yet. Use /link first.");
      return;
    }

    const journeyPrompt = await loadCommunityJourneyPrompt({
      projectId: context.projectId,
      authUserId: snapshot.authUserId,
    });
    const captain = await loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "telegram",
      providerUserId,
    });
    const links = buildCommunityCommandLinks({
      projectId: context.projectId,
      lane: journeyPrompt?.lane ?? "active",
      deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
    });

    await ctx.reply(
      [
        `${snapshot.profileUsername} loadout`,
        `Project: ${context.projectName}`,
        `Project XP: ${snapshot.projectXp} | L${snapshot.projectLevel} | Trust ${snapshot.projectTrust}`,
        `Global XP: ${snapshot.globalXp} | L${snapshot.globalLevel} | Trust ${snapshot.globalTrust}`,
        `Missions: ${snapshot.projectQuestsCompleted} quests | ${snapshot.projectRaidsCompleted} raids`,
        `Wallet: ${snapshot.walletVerified ? "Verified" : "Missing"}`,
        `Lane: ${journeyPrompt ? formatTelegramJourneyLabel(journeyPrompt.lane) : "Community Home"}`,
        `Next unlock: ${journeyPrompt?.nextUnlockLabel ?? "Keep your community lane moving."}`,
      ].join("\n"),
      buildTelegramProjectButtons([
        {
          label: journeyPrompt ? `Open ${formatTelegramJourneyLabel(journeyPrompt.lane)}` : "Open Community Home",
          url: links.primaryUrl,
        },
        { label: "Open full profile", url: links.profileUrl },
        {
          label: "Captain workspace",
          url:
            captain &&
            isCommunityCommandEnabled({
              command: "captain",
              platform: "telegram",
              settings: context.settings,
            })
              ? links.captainWorkspaceUrl
              : null,
        },
      ])
    );
  });

  bot.command("missions", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "missions");
    if (!context) return;

    const providerUserId = String(ctx.from?.id ?? "");
    const [board, snapshot, captain] = await Promise.all([
      loadTelegramMissionBoard(context.projectId),
      loadTelegramIdentitySnapshot(providerUserId, context.projectId),
      loadCaptainByProviderIdentity({
        projectId: context.projectId,
        provider: "telegram",
        providerUserId,
      }),
    ]);
    const journeyPrompt = snapshot
      ? await loadCommunityJourneyPrompt({
          projectId: context.projectId,
          authUserId: snapshot.authUserId,
        })
      : null;
    const links = buildCommunityCommandLinks({
      projectId: context.projectId,
      lane: journeyPrompt?.lane ?? "active",
      deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
    });

    await ctx.reply(
      `${context.projectName} mission board\n\n${formatTelegramMissionBoard(board)}`,
      buildTelegramProjectButtons([
        {
          label: journeyPrompt ? `Open ${formatTelegramJourneyLabel(journeyPrompt.lane)}` : "Open Community Home",
          url: links.primaryUrl,
        },
        { label: "Open reward rail", url: links.rewardsUrl },
        {
          label: "Captain workspace",
          url:
            captain &&
            isCommunityCommandEnabled({
              command: "captain",
              platform: "telegram",
              settings: context.settings,
            })
              ? links.captainWorkspaceUrl
              : null,
        },
      ])
    );
  });

  bot.command("leaderboard", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "leaderboard");
    if (!context) return;

    const providerUserId = String(ctx.from?.id ?? "");
    const [entries, captain] = await Promise.all([
      loadTelegramLeaderboard({
        projectId: context.projectId,
        period: "weekly",
        limit: 10,
      }),
      loadCaptainByProviderIdentity({
        projectId: context.projectId,
        provider: "telegram",
        providerUserId,
      }),
    ]);
    const links = buildCommunityCommandLinks({
      projectId: context.projectId,
      lane: "active",
      deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
    });

    await ctx.reply(
      `${context.projectName} weekly leaderboard\n\n${formatTelegramLeaderboard(entries)}`,
      buildTelegramProjectButtons([
        { label: "Open Community Home", url: links.communityUrl },
        { label: "Open reward rail", url: links.rewardsUrl },
        {
          label: "Captain workspace",
          url:
            captain &&
            isCommunityCommandEnabled({
              command: "captain",
              platform: "telegram",
              settings: context.settings,
            })
              ? links.captainWorkspaceUrl
              : null,
        },
      ])
    );
  });

  bot.command("raid", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "raid");
    if (!context) return;

    const providerUserId = String(ctx.from?.id ?? "");
    const [raids, captain] = await Promise.all([
      loadTelegramRaidBoard(context.projectId),
      loadCaptainByProviderIdentity({
        projectId: context.projectId,
        provider: "telegram",
        providerUserId,
      }),
    ]);
    const links = buildCommunityCommandLinks({
      projectId: context.projectId,
      lane: "active",
      deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
    });

    await ctx.reply(
      `${context.projectName} raid rail\n\n${formatTelegramRaidBoard(raids)}`,
      buildTelegramProjectButtons([
        { label: "Open Community Home", url: links.communityUrl },
        { label: "Open mission rail", url: links.missionsUrl },
        {
          label: "Captain workspace",
          url:
            captain &&
            isCommunityCommandEnabled({
              command: "captain",
              platform: "telegram",
              settings: context.settings,
            })
              ? links.captainWorkspaceUrl
              : null,
        },
      ])
    );
  });

  bot.command("newraid", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "newraid");
    if (!context) return;

    const parsed = parseTelegramNewRaidCommand(ctx.message?.text ?? "");
    if (!parsed.ok) {
      await ctx.reply("Usage: /newraid https://x.com/project/status/123 xp=50 duration=24h");
      return;
    }

    const providerUserId = String(ctx.from?.id ?? "");
    const result = await createManualLiveRaidFromXPost({
      projectId: context.projectId,
      xUrl: parsed.url,
      actorProvider: "telegram",
      actorProviderUserId: providerUserId,
      overrides: parsed.overrides,
    });

    if (result.status === "skipped") {
      await ctx.reply("That X post is already linked to a VYNTRO raid for this project.");
      return;
    }

    await ctx.reply(
      formatManualRaidCommandResult({
        raidUrl: result.raidUrl,
        deliveries: result.deliveries,
      })
    );
  });

  bot.command("captain", async (ctx) => {
    const context = await resolveCommunityContext(ctx, "captain");
    if (!context) return;

    const providerUserId = String(ctx.from?.id ?? "");
    const captain = await loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "telegram",
      providerUserId,
    });

    if (!captain) {
      await ctx.reply(
        "You do not have an active captain seat for this project. Project owners can assign captains in Community OS."
      );
      return;
    }

    const [links, outcomeSummary] = await Promise.all([
      Promise.resolve(
        buildCommunityCommandLinks({
          projectId: context.projectId,
          lane: "active",
          deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
        })
      ),
      loadProjectCommunityOutcomeSummary(context.projectId),
    ]);

    await ctx.reply(
      [
        `${context.projectName} captain workspace`,
        `Role: ${captain.role}`,
        `Permissions: ${captain.permissions.length > 0 ? captain.permissions.join(", ") : "No scoped permissions"}`,
        `Actionable: ${outcomeSummary.captain.actionableQueueCount} | Blocked: ${outcomeSummary.captain.blockedQueueCount} | Escalated: ${outcomeSummary.captain.escalatedQueueCount}`,
        "Use the project-private workspace for queue execution, blockers and recent outcomes.",
      ].join("\n"),
      buildTelegramProjectButtons([
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
    { command: "link", description: "Link your Telegram identity with VYNTRO" },
    { command: "profile", description: "Show your live VYNTRO community profile" },
    { command: "missions", description: "Show the live project mission board" },
    { command: "leaderboard", description: "Show the current weekly leaderboard" },
    { command: "raid", description: "Show the live raid rail" },
    { command: "newraid", description: "Create a live raid from an X post URL" },
    { command: "captain", description: "Open your project captain workspace" },
  ]);

  await bot.launch();
  const contexts = await loadTelegramIntegrationContexts();
  let chatsSynced = 0;
  let chatsCleared = 0;

  for (const context of contexts) {
    const chatId = Number(context.chatId);
    if (!Number.isFinite(chatId)) {
      continue;
    }

    const payload = buildTelegramCommandPayload(context.settings);
    await bot.telegram.setMyCommands(payload, {
      scope: {
        type: "chat",
        chat_id: chatId,
      },
    });

    if (payload.length > 0) {
      chatsSynced += 1;
    } else {
      chatsCleared += 1;
    }
  }

  telegramBotLaunched = true;
  console.log(
    `[telegram] synced commands for ${contexts.length} chat(s); enabled=${chatsSynced} cleared=${chatsCleared}`
  );
  return bot;
}

export function getTelegramBot() {
  return telegramBot;
}
