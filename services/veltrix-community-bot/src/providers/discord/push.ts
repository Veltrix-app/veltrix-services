import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ColorResolvable,
} from "discord.js";
import { getDiscordClient } from "./client.js";

type PushMeta = {
  label: string;
  value: string;
};

function normalizeComparableText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function toDiscordColor(input?: string) {
  const normalized = input?.trim();
  if (!normalized) {
    return 0xc6ff2e as ColorResolvable;
  }

  const hex = normalized.startsWith("#") ? normalized.slice(1) : normalized;
  return /^[0-9a-fA-F]{6}$/.test(hex)
    ? (Number.parseInt(hex, 16) as ColorResolvable)
    : (0xc6ff2e as ColorResolvable);
}

function isContextMeta(label: string) {
  const normalized = label.trim().toLowerCase();
  return normalized === "project" || normalized === "campaign" || normalized === "track";
}

function formatContextLine(projectName?: string, campaignTitle?: string) {
  const project = projectName?.trim() || "Veltrix";
  const campaign = campaignTitle?.trim() || "";
  return campaign ? `${project} | ${campaign}` : project;
}

export async function sendDiscordPush(params: {
  targetChannelId: string;
  targetThreadId?: string;
  title: string;
  body: string;
  eyebrow?: string;
  projectName?: string;
  campaignTitle?: string;
  imageUrl?: string;
  accentColor?: string;
  meta?: PushMeta[];
  url?: string;
  buttonLabel?: string;
}) {
  const client = getDiscordClient();

  if (!client) {
    throw new Error("Discord bot is not configured.");
  }

  if (!client.isReady()) {
    throw new Error("Discord bot is not connected yet.");
  }

  const targetId = params.targetThreadId?.trim() || params.targetChannelId.trim();
  if (!targetId) {
    throw new Error("Missing Discord target channel/thread id.");
  }

  const channel = await client.channels.fetch(targetId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Discord target channel could not be resolved as a text channel.");
  }

  if (!("send" in channel) || typeof channel.send !== "function") {
    throw new Error("Discord target does not support sending messages.");
  }

  const title = params.title.trim();
  const body = params.body.trim();
  const hasDistinctBody =
    body.length > 0 && normalizeComparableText(body) !== normalizeComparableText(title);
  const visibleMeta = (params.meta ?? [])
    .filter((item) => item.label.trim() && item.value.trim())
    .filter((item) => !isContextMeta(item.label))
    .slice(0, 4);

  const embed = new EmbedBuilder()
    .setColor(toDiscordColor(params.accentColor))
    .setAuthor({
      name: params.eyebrow?.trim() || "VELTRIX UPDATE",
    })
    .setTitle(title)
    .setFooter({
      text: formatContextLine(params.projectName, params.campaignTitle),
    })
    .addFields(
      ...visibleMeta.map((item) => ({
        name: item.label.trim(),
        value: item.value.trim(),
        inline: true,
      }))
    );

  if (hasDistinctBody) {
    embed.setDescription(body);
  }

  if (params.imageUrl?.trim()) {
    embed.setImage(params.imageUrl.trim());
  }

  const message = await channel.send({
    embeds: [embed],
    ...(params.url?.trim()
      ? {
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(params.buttonLabel?.trim() || "Open in Veltrix")
                .setURL(params.url.trim())
            ),
          ],
        }
      : {}),
  });

  return {
    ok: true,
    channelId: channel.id,
    channelType: channel.type,
    messageId: message.id,
  };
}
