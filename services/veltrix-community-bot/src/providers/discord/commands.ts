import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
  loadDiscordRaidRail,
  type DiscordIdentitySnapshot,
  type DiscordLeaderboardPeriod,
  type DiscordLeaderboardScope,
  type DiscordRankRule,
} from "./community.js";
import {
  findNextDiscordRankRule,
  formatDiscordRankSourceLabel,
  getMatchedDiscordRankRules,
  sortDiscordRankRulesForDisplay,
} from "./ranks.js";

const appUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(
  /\/+$/,
  ""
);

function formatMetricLabel(label: string, value: string) {
  return `${label}: ${value}`;
}

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

function formatLeaderboardLines(entries: Awaited<ReturnType<typeof loadDiscordLeaderboard>>) {
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

function formatPeriodLabel(period: DiscordLeaderboardPeriod) {
  if (period === "all_time") return "All-time";
  if (period === "monthly") return "Monthly";
  return "Weekly";
}

function formatScopeLabel(scope: DiscordLeaderboardScope) {
  return scope === "global" ? "Global" : "Project";
}

function formatRaidLines(entries: Awaited<ReturnType<typeof loadDiscordRaidRail>>) {
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

async function replyCommandsDisabled(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    ephemeral: true,
    content:
      "Community commands are disabled for this Discord server right now. Enable them in the Veltrix portal first.",
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
        "This Discord server is not mapped to a Veltrix project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!context.settings.commandsEnabled) {
    await replyCommandsDisabled(interaction);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`Link into ${context.projectName}`)
    .setDescription(
      "Connect your Veltrix profile so this server can sync ranks, leaderboard placement and future raid operations."
    )
    .addFields(
      { name: "Project", value: context.projectName, inline: true },
      { name: "System", value: "Discord identity link", inline: true }
    );

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Open Veltrix profile")
          .setURL(`${appUrl}/profile`)
      ),
    ],
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
        "This Discord server is not mapped to a Veltrix project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!context.settings.commandsEnabled) {
    await replyCommandsDisabled(interaction);
    return;
  }

  const snapshot = await loadDiscordIdentitySnapshot(interaction.user.id, context.projectId);
  if (!snapshot) {
    await interaction.reply({
      ephemeral: true,
      content: "Your Discord account is not linked to Veltrix yet. Use `/link` first.",
    });
    return;
  }

  const matchedRules = getMatchedDiscordRankRules(buildRankSnapshot(snapshot), context.rankRules);
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
          formatMetricLabel("XP", String(snapshot.globalXp)),
          formatMetricLabel("Level", String(snapshot.globalLevel)),
          formatMetricLabel("Trust", String(snapshot.globalTrust)),
        ].join("\n"),
        inline: true,
      },
      {
        name: context.projectName,
        value: [
          formatMetricLabel("XP", String(snapshot.projectXp)),
          formatMetricLabel("Level", String(snapshot.projectLevel)),
          formatMetricLabel("Trust", String(snapshot.projectTrust)),
        ].join("\n"),
        inline: true,
      },
      {
        name: "Identity",
        value: [
          formatMetricLabel("Wallet", snapshot.walletVerified ? "Verified" : "Missing"),
          formatMetricLabel("Discord", snapshot.discordUsername),
          formatMetricLabel("Ranks", matchedRules.length > 0 ? String(matchedRules.length) : "0"),
        ].join("\n"),
        inline: false,
      },
      {
        name: "Community rail",
        value: [
          formatMetricLabel(
            "Active",
            matchedRules.length > 0
              ? matchedRules.map((rule) => rule.label).join(", ")
              : "No live roles yet"
          ),
          formatMetricLabel(
            "Next unlock",
            formatNextUnlockLine(snapshot, context.rankRules, context.settings.rankSource)
          ),
          formatMetricLabel(
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
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Open full profile")
          .setURL(`${appUrl}/profile`)
      ),
    ],
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
        "This Discord server is not mapped to a Veltrix project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!context.settings.commandsEnabled) {
    await replyCommandsDisabled(interaction);
    return;
  }

  const snapshot = await loadDiscordIdentitySnapshot(interaction.user.id, context.projectId);
  if (!snapshot) {
    await interaction.reply({
      ephemeral: true,
      content: "Your Discord account is not linked to Veltrix yet. Use `/link` first.",
    });
    return;
  }

  const matchedRules = getMatchedDiscordRankRules(buildRankSnapshot(snapshot), context.rankRules);
  const sortedRules = sortDiscordRankRulesForDisplay(context.rankRules);
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
          formatMetricLabel("Project XP", String(snapshot.projectXp)),
          formatMetricLabel("Global XP", String(snapshot.globalXp)),
          formatMetricLabel("Trust", String(snapshot.globalTrust)),
          formatMetricLabel("Wallet", snapshot.walletVerified ? "Verified" : "Missing"),
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
        "This Discord server is not mapped to a Veltrix project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!context.settings.commandsEnabled) {
    await replyCommandsDisabled(interaction);
    return;
  }

  if (!context.settings.leaderboardEnabled) {
    await interaction.reply({
      ephemeral: true,
      content:
        "Leaderboards are disabled for this Discord server right now. Enable them in the Veltrix portal first.",
    });
    return;
  }

  await interaction.deferReply();

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
    .setTitle(`${context.projectName} ${formatPeriodLabel(period)} leaderboard`)
    .setDescription(formatLeaderboardLines(entries))
    .addFields(
      { name: "Scope", value: formatScopeLabel(scope), inline: true },
      { name: "Window", value: formatPeriodLabel(period), inline: true },
      { name: "Top", value: String(limit), inline: true }
    )
    .setFooter({
      text: `${context.projectName} community rail`,
    });

  await interaction.editReply({
    embeds: [embed],
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
        "This Discord server is not mapped to a Veltrix project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!context.settings.commandsEnabled) {
    await replyCommandsDisabled(interaction);
    return;
  }

  if (!context.settings.raidOpsEnabled) {
    await interaction.reply({
      ephemeral: true,
      content:
        "Raid ops are disabled for this Discord server right now. Enable them in the Veltrix portal first.",
    });
    return;
  }

  const raids = await loadDiscordRaidRail(context.projectId);
  const embed = new EmbedBuilder()
    .setColor(0xc6ff2e)
    .setTitle(`${context.projectName} raid rail`)
    .setDescription(formatRaidLines(raids))
    .setFooter({
      text: `${context.projectName} community raid ops`,
    });

  await interaction.reply({
    ephemeral: true,
    embeds: [embed],
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

  if (interaction.commandName === "leaderboard") {
    await handleLeaderboardCommand(interaction);
    return;
  }

  if (interaction.commandName === "raid") {
    await handleRaidCommand(interaction);
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

  const commandBuilders = [
    new SlashCommandBuilder()
      .setName("link")
      .setDescription("Open your Veltrix profile so you can link this Discord identity."),
    new SlashCommandBuilder()
      .setName("profile")
      .setDescription("Show your live Veltrix profile snapshot for this community."),
    new SlashCommandBuilder()
      .setName("rank")
      .setDescription("Show your app-side Discord rank matches for this community."),
    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("Show the live community leaderboard from Veltrix data.")
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
    new SlashCommandBuilder()
      .setName("raid")
      .setDescription("Show the live raid rail for this project community."),
  ];

  let guildsEnabled = 0;
  let guildsCleared = 0;

  for (const context of uniqueGuildContexts.values()) {
    const payload = context.settings.commandsEnabled
      ? commandBuilders.map((builder) => builder.toJSON())
      : [];
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
