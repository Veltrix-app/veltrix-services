import { getDiscordClient } from "../providers/discord/client.js";
import {
  loadDiscordIntegrationContexts,
  loadDiscordLeaderboard,
  markDiscordLeaderboardPostedAt,
  type DiscordIntegrationContext,
  type DiscordLeaderboardCadence,
} from "../providers/discord/community.js";
import { createPlatformAudit, createPlatformIncident } from "../core/platform/operation-events.js";
import { sendDiscordPush } from "../providers/discord/push.js";

type PostCommunityLeaderboardsOptions = {
  projectId?: string;
  integrationId?: string;
  force?: boolean;
};

type PostCommunityLeaderboardsResult = {
  ok: true;
  integrationsProcessed: number;
  postsDelivered: number;
  skippedIntegrations: Array<{
    integrationId: string;
    reason: string;
  }>;
};

function isCadenceDue(cadence: DiscordLeaderboardCadence, lastPostedAt: string | null) {
  if (cadence === "manual") {
    return false;
  }

  if (!lastPostedAt) {
    return true;
  }

  const elapsedMs = Date.now() - new Date(lastPostedAt).getTime();
  const requiredMs = cadence === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return elapsedMs >= requiredMs;
}

function buildLeaderboardBody(
  entries: Awaited<ReturnType<typeof loadDiscordLeaderboard>>,
  projectName: string
) {
  if (entries.length === 0) {
    return `No linked contributors are on the ${projectName} board yet.`;
  }

  return entries
    .map(
      (entry, index) =>
        `**${index + 1}.** ${entry.displayName} — ${entry.xp} XP · L${entry.level} · Trust ${entry.trust}`
    )
    .join("\n");
}

function formatPeriod(period: DiscordIntegrationContext["settings"]["leaderboardPeriod"]) {
  if (period === "all_time") return "ALL-TIME";
  if (period === "monthly") return "MONTHLY";
  return "WEEKLY";
}

async function deliverDiscordLeaderboard(
  context: DiscordIntegrationContext,
  force: boolean
) {
  if (!context.settings.leaderboardEnabled) {
    return { delivered: false, reason: "Leaderboard posting disabled." };
  }

  if (
    !force &&
    !isCadenceDue(
      context.settings.leaderboardCadence,
      context.settings.lastLeaderboardPostedAt
    )
  ) {
    return { delivered: false, reason: "Leaderboard cadence is not due yet." };
  }

  const targetChannelId =
    context.settings.leaderboardTargetChannelId || context.pushTargetChannelId;
  if (!targetChannelId) {
    return { delivered: false, reason: "No leaderboard target channel is configured." };
  }

  const entries = await loadDiscordLeaderboard({
    projectId: context.projectId,
    scope: context.settings.leaderboardScope,
    period: context.settings.leaderboardPeriod,
    limit: context.settings.leaderboardTopN,
  });

  try {
    await sendDiscordPush({
      targetChannelId,
      title: `${context.projectName} ${formatPeriod(context.settings.leaderboardPeriod)} leaderboard`,
      body: buildLeaderboardBody(entries, context.projectName),
      eyebrow: "COMMUNITY LEADERBOARD",
      projectName: context.projectName,
      campaignTitle: "Community rail",
      meta: [
        {
          label: "Scope",
          value: context.settings.leaderboardScope === "global" ? "Global" : "Project",
        },
        {
          label: "Window",
          value:
            context.settings.leaderboardPeriod === "all_time"
              ? "All-time"
              : context.settings.leaderboardPeriod === "monthly"
                ? "Monthly"
                : "Weekly",
        },
        {
          label: "Top",
          value: String(context.settings.leaderboardTopN),
        },
      ],
    });

    await createPlatformAudit({
      projectId: context.projectId,
      objectType: "automation",
      objectId: `leaderboard:${context.integrationId}`,
      actionType: "published",
      metadata: {
        source: "post-community-leaderboards",
        integrationId: context.integrationId,
        cadence: context.settings.leaderboardCadence,
      },
    }).catch(() => null);
  } catch (error) {
    await createPlatformIncident({
      projectId: context.projectId,
      objectType: "automation",
      objectId: `leaderboard:${context.integrationId}`,
      sourceType: "job",
      severity: "warning",
      title: "Community leaderboard delivery failed",
      summary:
        error instanceof Error ? error.message : "Community leaderboard post failed.",
      metadata: {
        source: "post-community-leaderboards",
        integrationId: context.integrationId,
      },
    }).catch(() => null);
    throw error;
  }

  await markDiscordLeaderboardPostedAt(context.integrationId);

  return { delivered: true as const };
}

export async function postCommunityLeaderboards(
  options: PostCommunityLeaderboardsOptions = {}
): Promise<PostCommunityLeaderboardsResult> {
  const client = getDiscordClient();
  if (!client || !client.isReady()) {
    throw new Error("Discord bot is not connected yet.");
  }

  const contexts = await loadDiscordIntegrationContexts({
    projectId: options.projectId,
    integrationId: options.integrationId,
  });
  const eligibleContexts = contexts.filter((context) => context.guildId);

  let postsDelivered = 0;
  const skippedIntegrations: PostCommunityLeaderboardsResult["skippedIntegrations"] = [];

  for (const context of eligibleContexts) {
    try {
      const result = await deliverDiscordLeaderboard(context, options.force === true);
      if (result.delivered) {
        postsDelivered += 1;
      } else {
        skippedIntegrations.push({
          integrationId: context.integrationId,
          reason: result.reason,
        });
      }
    } catch (error) {
      skippedIntegrations.push({
        integrationId: context.integrationId,
        reason: error instanceof Error ? error.message : "Community leaderboard post failed.",
      });
    }
  }

  return {
    ok: true,
    integrationsProcessed: eligibleContexts.length,
    postsDelivered,
    skippedIntegrations,
  };
}
