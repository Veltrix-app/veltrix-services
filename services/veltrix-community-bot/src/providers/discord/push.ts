import { getDiscordClient } from "./client.js";

export async function sendDiscordPush(params: {
  targetChannelId: string;
  targetThreadId?: string;
  title: string;
  body: string;
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

  const lines = [`**${params.title.trim()}**`, params.body.trim()];

  if (params.url?.trim()) {
    lines.push(`${params.buttonLabel?.trim() || "Open in Veltrix"}: ${params.url.trim()}`);
  }

  const message = await channel.send({
    content: lines.filter(Boolean).join("\n\n"),
  });

  return {
    ok: true,
    channelId: channel.id,
    channelType: channel.type,
    messageId: message.id,
  };
}
