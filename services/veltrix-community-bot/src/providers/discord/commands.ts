import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  Interaction,
  SlashCommandBuilder,
} from "discord.js";
import {
  loadDiscordIdentitySnapshot,
  loadDiscordIntegrationContextByGuildId,
  loadDiscordIntegrationContexts,
  loadDiscordLeaderboard,
  loadDiscordMissionBoard,
  loadDiscordRaidRail,
  type DiscordIdentitySnapshot,
  type DiscordLeaderboardPeriod,
  type DiscordLeaderboardScope,
  type DiscordRankRule,
} from "./community.js";
import { loadCaptainByProviderIdentity } from "../../core/community/captains.js";
import { loadCommunityJourneyPrompt } from "../../core/community/journeys.js";
import { loadProjectCommunityOutcomeSummary } from "../../core/community/outcomes.js";
import { buildCommunityCommandLinks } from "../../core/community/command-links.js";
import {
  areCommunityCommandDeepLinksEnabled,
  buildDisabledCommandMessage,
  type CommunityCommandKey,
  isCommunityCommandEnabled,
} from "../../core/community/command-scopes.js";
import { formatManualRaidCommandResult } from "../../core/raids/manual-raid-command.js";
import {
  buildDiscordCommunityButtons,
  buildDiscordMissionFields,
  formatDiscordJourneyLabel,
  formatDiscordLeaderboardLines,
  formatDiscordLeaderboardPeriodLabel,
  formatDiscordLeaderboardScopeLabel,
  formatDiscordMetricLabel,
  formatDiscordRaidLines,
} from "./command-renderers.js";
import {
  findNextDiscordRankRule,
  formatDiscordRankSourceLabel,
  getMatchedDiscordRankRules,
  sortDiscordRankRulesForDisplay,
} from "./ranks.js";
import { createManualLiveRaidFromXPost } from "../../jobs/create-manual-live-raid.js";

function buildRankSnapshot(snapshot: DiscordIdentitySnapshot) {
  return {
    globalXp: snapshot.globalXp,
    projectXp: snapshot.projectXp,
    globalTrust: snapshot.globalTrust,
    walletVerified: snapshot.walletVerified,
  };
}

function formatRankList(rules: DiscordRankRule[]) {
  if (rules.length === 0) {
    return "No live community ranks yet.";
  }

  return rules
    .map((rule) => `**${rule.label}** (${formatDiscordRankSourceLabel(rule.sourceType)})`)
    .join("\n");
}

function formatNextUnlockLine(
  snapshot: DiscordIdentitySnapshot,
  rules: DiscordRankRule[],
  preferredSource: DiscordRankRule["sourceType"]
) {
  const rankSnapshot = buildRankSnapshot(snapshot);
  const preferredNextRule = findNextDiscordRankRule(rankSnapshot, rules, preferredSource);
  const nextRule = preferredNextRule ?? findNextDiscordRankRule(rankSnapshot, rules);

  if (!nextRule) {
    return "You have already cleared every configured community rank.";
  }

  if (nextRule.rule.sourceType === "wallet_verified") {
    return `${nextRule.rule.label} on ${formatDiscordRankSourceLabel(nextRule.rule.sourceType)} is your next unlock.`;
  }

  return `${nextRule.rule.label} on ${formatDiscordRankSourceLabel(nextRule.rule.sourceType)} in ${nextRule.gap} more points.`;
}

function formatRankRuleStatus(snapshot: DiscordIdentitySnapshot, rule: DiscordRankRule) {
  const rankSnapshot = buildRankSnapshot(snapshot);
  const currentValue =
    rule.sourceType === "global_xp"
      ? rankSnapshot.globalXp
      : rule.sourceType === "trust"
        ? rankSnapshot.globalTrust ?? 50
        : rule.sourceType === "wallet_verified"
          ? rankSnapshot.walletVerified
            ? 1
            : 0
          : rankSnapshot.projectXp;
  const target = rule.sourceType === "wallet_verified" ? Math.max(1, rule.threshold) : rule.threshold;
  const matched = currentValue >= target;
  const currentLabel =
    rule.sourceType === "wallet_verified"
      ? rankSnapshot.walletVerified
        ? "verified"
        : "missing"
      : `${currentValue}/${target}`;
  const gapLabel = matched || rule.sourceType === "wallet_verified" ? "" : ` | ${target - currentValue} to go`;

  return `${matched ? "[LIVE]" : "[LOCKED]"} ${rule.label} - ${formatDiscordRankSourceLabel(rule.sourceType)} (${currentLabel}${gapLabel})`;
}

async function replyCommandDisabled(
  interaction: ChatInputCommandInteraction,
  command: CommunityCommandKey
) {
  await interaction.reply({
    ephemeral: true,
    content: buildDisabledCommandMessage(command),
  });
}

async function handleLinkCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!isCommunityCommandEnabled({ command: "link", platform: "discord", settings: context.settings })) {
    await replyCommandDisabled(interaction, "link");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`Link into ${context.projectName}`)
    .setDescription(
      "Connect your VYNTRO profile so this server can sync ranks, captain rails, leaderboard placement and the right onboarding journey."
    )
    .addFields(
      { name: "Project", value: context.projectName, inline: true },
      { name: "System", value: "Discord identity link", inline: true },
      { name: "Next rail", value: "Onboarding rail", inline: true }
    );
  const links = buildCommunityCommandLinks({
    projectId: context.projectId,
    lane: "onboarding",
    deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
  });

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      { label: "Open onboarding rail", url: links.onboardingUrl },
      { label: "Open VYNTRO profile", url: links.profileUrl },
    ]),
  });
}

async function handleProfileCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!isCommunityCommandEnabled({ command: "profile", platform: "discord", settings: context.settings })) {
    await replyCommandDisabled(interaction, "profile");
    return;
  }

  const snapshot = await loadDiscordIdentitySnapshot(interaction.user.id, context.projectId);
  if (!snapshot) {
    await interaction.reply({
      ephemeral: true,
      content: "Your Discord account is not linked to VYNTRO yet. Use `/link` first.",
    });
    return;
  }

  const matchedRules = getMatchedDiscordRankRules(buildRankSnapshot(snapshot), context.rankRules);
  const journeyPrompt = await loadCommunityJourneyPrompt({
    projectId: context.projectId,
    authUserId: snapshot.authUserId,
  });
  const captain = await loadCaptainByProviderIdentity({
    projectId: context.projectId,
    provider: "discord",
    providerUserId: interaction.user.id,
  });
  const links = buildCommunityCommandLinks({
    projectId: context.projectId,
    lane: journeyPrompt?.lane ?? "active",
    deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
  });
  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${snapshot.profileUsername} loadout`)
    .setDescription(
      `Live profile rail for **${context.projectName}**. This is the identity snapshot the community bot uses for ranks and leaderboard placement.`
    )
    .addFields(
      {
        name: "Global",
        value: [
           formatDiscordMetricLabel("XP", String(snapshot.globalXp)),
           formatDiscordMetricLabel("Level", String(snapshot.globalLevel)),
           formatDiscordMetricLabel("Trust", String(snapshot.globalTrust)),
        ].join("\n"),
        inline: true,
      },
      {
        name: context.projectName,
        value: [
           formatDiscordMetricLabel("XP", String(snapshot.projectXp)),
           formatDiscordMetricLabel("Level", String(snapshot.projectLevel)),
           formatDiscordMetricLabel("Trust", String(snapshot.projectTrust)),
        ].join("\n"),
        inline: true,
      },
      {
        name: "Identity",
        value: [
           formatDiscordMetricLabel("Wallet", snapshot.walletVerified ? "Verified" : "Missing"),
           formatDiscordMetricLabel("Discord", snapshot.discordUsername),
           formatDiscordMetricLabel("Ranks", matchedRules.length > 0 ? String(matchedRules.length) : "0"),
        ].join("\n"),
        inline: false,
      },
      {
        name: "Community rail",
        value: [
           formatDiscordMetricLabel(
             "Lane",
             journeyPrompt ? formatDiscordJourneyLabel(journeyPrompt.lane) : "Community Home"
           ),
           formatDiscordMetricLabel(
             "Active",
            matchedRules.length > 0
              ? matchedRules.map((rule) => rule.label).join(", ")
              : "No live roles yet"
          ),
           formatDiscordMetricLabel(
             "Next unlock",
            journeyPrompt?.nextUnlockLabel ??
              formatNextUnlockLine(snapshot, context.rankRules, context.settings.rankSource)
          ),
           formatDiscordMetricLabel(
             "Mission record",
            `${snapshot.projectQuestsCompleted} quests | ${snapshot.projectRaidsCompleted} raids`
          ),
        ].join("\n"),
        inline: false,
      }
    );

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      {
        label: journeyPrompt ? `Open ${formatDiscordJourneyLabel(journeyPrompt.lane)}` : "Open Community Home",
        url: links.primaryUrl,
      },
      { label: "Open full profile", url: links.profileUrl },
      {
        label: "Captain workspace",
        url:
          captain &&
          isCommunityCommandEnabled({ command: "captain", platform: "discord", settings: context.settings })
            ? links.captainWorkspaceUrl
            : null,
      },
    ]),
  });
}

async function handleRankCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!isCommunityCommandEnabled({ command: "rank", platform: "discord", settings: context.settings })) {
    await replyCommandDisabled(interaction, "rank");
    return;
  }

  const snapshot = await loadDiscordIdentitySnapshot(interaction.user.id, context.projectId);
  if (!snapshot) {
    await interaction.reply({
      ephemeral: true,
      content: "Your Discord account is not linked to VYNTRO yet. Use `/link` first.",
    });
    return;
  }

  const matchedRules = getMatchedDiscordRankRules(buildRankSnapshot(snapshot), context.rankRules);
  const sortedRules = sortDiscordRankRulesForDisplay(context.rankRules);
  const journeyPrompt = await loadCommunityJourneyPrompt({
    projectId: context.projectId,
    authUserId: snapshot.authUserId,
  });
  const captain = await loadCaptainByProviderIdentity({
    projectId: context.projectId,
    provider: "discord",
    providerUserId: interaction.user.id,
  });
  const links = buildCommunityCommandLinks({
    projectId: context.projectId,
    lane: journeyPrompt?.lane ?? "active",
    deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
  });
  const ruleLines =
    sortedRules.length > 0
      ? sortedRules.map((rule) => formatRankRuleStatus(snapshot, rule)).join("\n")
      : "No Discord rank rules are configured for this server yet.";
  const nextUnlockLine = formatNextUnlockLine(
    snapshot,
    context.rankRules,
    context.settings.rankSource
  );

  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${context.projectName} rank sync`)
    .setDescription(
      "These are the current app-side rank rules and whether your live profile qualifies for them."
    )
    .addFields(
      {
        name: "Current sources",
        value: [
           formatDiscordMetricLabel("Project XP", String(snapshot.projectXp)),
           formatDiscordMetricLabel("Global XP", String(snapshot.globalXp)),
           formatDiscordMetricLabel("Trust", String(snapshot.globalTrust)),
           formatDiscordMetricLabel("Wallet", snapshot.walletVerified ? "Verified" : "Missing"),
        ].join("\n"),
        inline: false,
      },
      {
        name: "Active community ranks",
        value: formatRankList(matchedRules),
        inline: false,
      },
      {
        name: "Next unlock",
        value: nextUnlockLine,
        inline: false,
      },
      {
        name: "Rank ladder",
        value: ruleLines,
        inline: false,
      }
    );

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      {
        label: journeyPrompt ? `Open ${formatDiscordJourneyLabel(journeyPrompt.lane)}` : "Open Community Home",
        url: links.primaryUrl,
      },
      {
        label: "Captain workspace",
        url:
          captain &&
          isCommunityCommandEnabled({ command: "captain", platform: "discord", settings: context.settings })
            ? links.captainWorkspaceUrl
            : null,
      },
    ]),
  });
}

async function handleLeaderboardCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (
    !isCommunityCommandEnabled({
      command: "leaderboard",
      platform: "discord",
      settings: context.settings,
    })
  ) {
    await replyCommandDisabled(interaction, "leaderboard");
    return;
  }

  await interaction.deferReply();
  const captain = await loadCaptainByProviderIdentity({
    projectId: context.projectId,
    provider: "discord",
    providerUserId: interaction.user.id,
  });
  const links = buildCommunityCommandLinks({
    projectId: context.projectId,
    lane: "active",
    deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
  });

  const scope = (interaction.options.getString("scope") ??
    context.settings.leaderboardScope) as DiscordLeaderboardScope;
  const period = (interaction.options.getString("period") ??
    context.settings.leaderboardPeriod) as DiscordLeaderboardPeriod;
  const limit = Math.max(
    3,
    Math.min(
      15,
      interaction.options.getInteger("limit") ?? context.settings.leaderboardTopN
    )
  );
  const entries = await loadDiscordLeaderboard({
    projectId: context.projectId,
    scope,
    period,
    limit,
  });

  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${context.projectName} ${formatDiscordLeaderboardPeriodLabel(period)} leaderboard`)
    .setDescription(formatDiscordLeaderboardLines(entries))
    .addFields(
      { name: "Scope", value: formatDiscordLeaderboardScopeLabel(scope), inline: true },
      { name: "Window", value: formatDiscordLeaderboardPeriodLabel(period), inline: true },
      { name: "Top", value: String(limit), inline: true }
    )
    .setFooter({
      text: `${context.projectName} community rail`,
    });

  await interaction.editReply({
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      { label: "Open Community Home", url: links.communityUrl },
      { label: "Open reward rail", url: links.rewardsUrl },
      {
        label: "Captain workspace",
        url:
          captain &&
          isCommunityCommandEnabled({ command: "captain", platform: "discord", settings: context.settings })
            ? links.captainWorkspaceUrl
            : null,
      },
    ]),
  });
}

async function handleMissionsCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (
    !isCommunityCommandEnabled({
      command: "missions",
      platform: "discord",
      settings: context.settings,
    })
  ) {
    await replyCommandDisabled(interaction, "missions");
    return;
  }

  const [board, snapshot, captain] = await Promise.all([
    loadDiscordMissionBoard(context.projectId),
    loadDiscordIdentitySnapshot(interaction.user.id, context.projectId),
    loadCaptainByProviderIdentity({
      projectId: context.projectId,
      provider: "discord",
      providerUserId: interaction.user.id,
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

  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${context.projectName} mission board`)
    .setDescription(
      snapshot
        ? `Live mission rail for **${context.projectName}**. Follow the current quest lane, reward drops and active campaign pressure.`
        : `Live mission rail for **${context.projectName}**. Link your profile to unlock the right lane and personalized next action.`
    )
    .addFields(...buildDiscordMissionFields(board))
    .setFooter({
      text: snapshot
        ? `Current lane: ${journeyPrompt ? formatDiscordJourneyLabel(journeyPrompt.lane) : "Community Home"}`
        : "Link with /link for personalized rails",
    });

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      {
        label: journeyPrompt ? `Open ${formatDiscordJourneyLabel(journeyPrompt.lane)}` : "Open Community Home",
        url: links.primaryUrl,
      },
      { label: "Open reward rail", url: links.rewardsUrl },
      {
        label: "Captain workspace",
        url:
          captain &&
          isCommunityCommandEnabled({ command: "captain", platform: "discord", settings: context.settings })
            ? links.captainWorkspaceUrl
            : null,
      },
    ]),
  });
}

async function handleRaidCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (
    !isCommunityCommandEnabled({ command: "raid", platform: "discord", settings: context.settings })
  ) {
    await replyCommandDisabled(interaction, "raid");
    return;
  }

  const raids = await loadDiscordRaidRail(context.projectId);
  const captain = await loadCaptainByProviderIdentity({
    projectId: context.projectId,
    provider: "discord",
    providerUserId: interaction.user.id,
  });
  const links = buildCommunityCommandLinks({
    projectId: context.projectId,
    lane: "active",
    deepLinksEnabled: areCommunityCommandDeepLinksEnabled(context.settings),
  });
  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${context.projectName} raid rail`)
    .setDescription(formatDiscordRaidLines(raids))
    .setFooter({
      text: `${context.projectName} community raid ops`,
    });

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      { label: "Open Community Home", url: links.communityUrl },
      { label: "Open mission rail", url: links.missionsUrl },
      {
        label: "Captain workspace",
        url:
          captain &&
          isCommunityCommandEnabled({ command: "captain", platform: "discord", settings: context.settings })
            ? links.captainWorkspaceUrl
            : null,
      },
    ]),
  });
}

async function handleNewRaidCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (
    !isCommunityCommandEnabled({
      command: "newraid",
      platform: "discord",
      settings: context.settings,
    })
  ) {
    await replyCommandDisabled(interaction, "newraid");
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const result = await createManualLiveRaidFromXPost({
    projectId: context.projectId,
    xUrl: interaction.options.getString("url", true),
    actorProvider: "discord",
    actorProviderUserId: interaction.user.id,
    overrides: {
      xp: interaction.options.getInteger("xp")?.toString(),
      duration: interaction.options.getString("duration") ?? undefined,
      campaign: interaction.options.getString("campaign") ?? undefined,
      button: interaction.options.getString("button") ?? undefined,
    },
    allowUnfetchedFallback: true,
  });

  if (result.status === "skipped") {
    await interaction.editReply("That X post is already linked to a VYNTRO raid for this project.");
    return;
  }

  await interaction.editReply(
    formatManualRaidCommandResult({
      raidUrl: result.raidUrl,
      deliveries: result.deliveries,
    })
  );
}

async function handleCaptainCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content:
        "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (
    !isCommunityCommandEnabled({
      command: "captain",
      platform: "discord",
      settings: context.settings,
    })
  ) {
    await replyCommandDisabled(interaction, "captain");
    return;
  }

  const captain = await loadCaptainByProviderIdentity({
    projectId: context.projectId,
    provider: "discord",
    providerUserId: interaction.user.id,
  });

  if (!captain) {
    await interaction.reply({
      ephemeral: true,
      content:
        "You do not have an active captain seat for this project. Project owners can assign captains in Community OS.",
    });
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
  const permissionLabel = captain.permissions.length > 0 ? captain.permissions.join(", ") : "No scoped permissions";

  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${context.projectName} captain workspace`)
    .setDescription("Your captain rail is project-private and meant for run-now execution, blocked items and recent outcomes.")
    .addFields(
      { name: "Role", value: captain.role, inline: true },
      { name: "Status", value: "Active", inline: true },
      { name: "Permissions", value: permissionLabel, inline: false },
      {
        name: "Queue posture",
        value: [
          formatDiscordMetricLabel("Actionable", String(outcomeSummary.captain.actionableQueueCount)),
          formatDiscordMetricLabel("Blocked", String(outcomeSummary.captain.blockedQueueCount)),
          formatDiscordMetricLabel("Escalated", String(outcomeSummary.captain.escalatedQueueCount)),
        ].join("\n"),
        inline: false,
      }
    );

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: buildDiscordCommunityButtons([
      {
        label: "Open captain workspace",
        url: links.captainWorkspaceUrl,
      },
      { label: "Open Community Home", url: links.communityUrl },
    ]),
  });
}

async function handleChatCommand(interaction: ChatInputCommandInteraction) {
  if (interaction.commandName === "link") {
    await handleLinkCommand(interaction);
    return;
  }

  if (interaction.commandName === "profile") {
    await handleProfileCommand(interaction);
    return;
  }

  if (interaction.commandName === "rank") {
    await handleRankCommand(interaction);
    return;
  }

  if (interaction.commandName === "missions") {
    await handleMissionsCommand(interaction);
    return;
  }

  if (interaction.commandName === "leaderboard") {
    await handleLeaderboardCommand(interaction);
    return;
  }

  if (interaction.commandName === "raid") {
    await handleRaidCommand(interaction);
    return;
  }

  if (interaction.commandName === "newraid") {
    await handleNewRaidCommand(interaction);
    return;
  }

  if (interaction.commandName === "captain") {
    await handleCaptainCommand(interaction);
  }
}

export async function syncDiscordGuildCommands(
  client: Client,
  filters?: { projectId?: string; integrationId?: string; guildId?: string }
) {
  if (!client.application) {
    return {
      ok: true,
      guildsProcessed: 0,
      guildsEnabled: 0,
      guildsCleared: 0,
    };
  }

  const contexts = await loadDiscordIntegrationContexts(filters);
  const uniqueGuildContexts = new Map<string, Awaited<typeof contexts>[number]>();
  for (const context of contexts) {
    if (!uniqueGuildContexts.has(context.guildId)) {
      uniqueGuildContexts.set(context.guildId, context);
    }
  }

  let guildsEnabled = 0;
  let guildsCleared = 0;

  for (const context of uniqueGuildContexts.values()) {
    const commandBuilders = context.settings.commandsEnabled
      ? [
          new SlashCommandBuilder()
            .setName("link")
            .setDescription("Open your VYNTRO profile so you can link this Discord identity."),
          new SlashCommandBuilder()
            .setName("profile")
            .setDescription("Show your live VYNTRO profile snapshot for this community."),
          new SlashCommandBuilder()
            .setName("rank")
            .setDescription("Show your app-side Discord rank matches for this community."),
          ...(context.settings.missionCommandsEnabled
            ? [
                new SlashCommandBuilder()
                  .setName("missions")
                  .setDescription("Show the live mission board for this community."),
              ]
            : []),
          ...(context.settings.leaderboardEnabled
            ? [
                new SlashCommandBuilder()
                  .setName("leaderboard")
                  .setDescription("Show the live community leaderboard from VYNTRO data.")
                  .addStringOption((option) =>
                    option
                      .setName("scope")
                      .setDescription("Choose project-only or global ranking.")
                      .addChoices(
                        { name: "Project", value: "project" },
                        { name: "Global", value: "global" }
                      )
                  )
                  .addStringOption((option) =>
                    option
                      .setName("period")
                      .setDescription("Choose the leaderboard window.")
                      .addChoices(
                        { name: "Weekly", value: "weekly" },
                        { name: "Monthly", value: "monthly" },
                        { name: "All-time", value: "all_time" }
                      )
                  )
                  .addIntegerOption((option) =>
                    option
                      .setName("limit")
                      .setDescription("How many entries to show.")
                      .setMinValue(3)
                      .setMaxValue(15)
                  ),
              ]
            : []),
          ...(context.settings.raidOpsEnabled
            ? [
                new SlashCommandBuilder()
                  .setName("raid")
                  .setDescription("Show the live raid rail for this project community."),
                new SlashCommandBuilder()
                  .setName("newraid")
                  .setDescription("Create a live VYNTRO raid from an X post URL.")
                  .addStringOption((option) =>
                    option
                      .setName("url")
                      .setDescription("The X post URL to turn into a live raid.")
                      .setRequired(true)
                  )
                  .addIntegerOption((option) =>
                    option
                      .setName("xp")
                      .setDescription("Optional XP override, capped by VYNTRO policy.")
                      .setMinValue(10)
                      .setMaxValue(100)
                  )
                  .addStringOption((option) =>
                    option
                      .setName("duration")
                      .setDescription("Optional duration such as 30m, 2h or 1d.")
                  )
                  .addStringOption((option) =>
                    option
                      .setName("campaign")
                      .setDescription("Optional campaign slug or id.")
                  )
                  .addStringOption((option) =>
                    option
                      .setName("button")
                      .setDescription("Optional CTA label.")
                  ),
              ]
            : []),
          ...(context.settings.captainsEnabled && context.settings.captainCommandsEnabled
            ? [
                new SlashCommandBuilder()
                  .setName("captain")
                  .setDescription("Open your captain workspace for this project."),
              ]
            : []),
        ]
      : [];
    const payload = commandBuilders.map((builder) => builder.toJSON());
    await client.application.commands.set(payload, context.guildId);
    if (context.settings.commandsEnabled) {
      guildsEnabled += 1;
    } else {
      guildsCleared += 1;
    }
  }

  return {
    ok: true,
    guildsProcessed: uniqueGuildContexts.size,
    guildsEnabled,
    guildsCleared,
  };
}

export function registerDiscordCommandHandlers(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    try {
      await handleChatCommand(interaction);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Discord command handling failed unexpectedly.";

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: message,
        }).catch(() => null);
        return;
      }

      await interaction.reply({
        ephemeral: true,
        content: message,
      }).catch(() => null);
    }
  });
}
