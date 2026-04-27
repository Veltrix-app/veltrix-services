import { supabaseAdmin } from "../../lib/supabase.js";
import { sendDiscordPush } from "../../providers/discord/push.js";
import { sendTelegramPush } from "../../providers/telegram/push.js";

export type CommunityProvider = "discord" | "telegram";
export type ProviderScope = "discord" | "telegram" | "both";

export type ProjectCommunityTarget = {
  integrationId: string;
  provider: CommunityProvider;
  targetChannelId?: string;
  targetThreadId?: string;
  targetChatId?: string;
};

export type ProjectCommunityMessage = {
  projectId: string;
  providerScope: ProviderScope;
  title: string;
  body: string;
  eyebrow?: string;
  projectName: string;
  campaignTitle?: string | null;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null;
  accentColor?: string | null;
  meta?: Array<{ label: string; value: string }>;
  url?: string | null;
  buttonLabel?: string | null;
};

export type ProjectCommunityDeliveryResult = {
  provider: CommunityProvider;
  integrationId: string;
  ok: boolean;
  error?: string;
};

export const appUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(/\/+$/, "");

export function getDefaultCommunityArtwork(kind: "campaign" | "quest" | "raid") {
  return `${appUrl}/community-push/defaults/${kind}.png`;
}

export async function loadProjectCommunityTargets(projectId: string, providerScope: ProviderScope) {
  const { data, error } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider, status, config")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"])
    .in("status", ["connected", "needs_attention"]);

  if (error) {
    throw new Error(error.message || "Failed to load project community targets.");
  }

  return ((data ?? []) as Array<{
    id: string;
    provider: CommunityProvider;
    config: Record<string, unknown> | null;
  }>)
    .filter((integration) => providerScope === "both" || integration.provider === providerScope)
    .map((integration): ProjectCommunityTarget | null => {
      const pushSettings =
        integration.config?.pushSettings && typeof integration.config.pushSettings === "object"
          ? (integration.config.pushSettings as Record<string, unknown>)
          : {};

      if (integration.provider === "discord") {
        const targetChannelId =
          typeof pushSettings.targetChannelId === "string"
            ? pushSettings.targetChannelId.trim()
            : "";
        const targetThreadId =
          typeof pushSettings.targetThreadId === "string"
            ? pushSettings.targetThreadId.trim()
            : "";

        return targetChannelId
          ? {
              integrationId: integration.id,
              provider: "discord",
              targetChannelId,
              targetThreadId,
            }
          : null;
      }

      const fallbackChatId =
        typeof integration.config?.chatId === "string" && integration.config.chatId.trim()
          ? integration.config.chatId.trim()
          : typeof integration.config?.groupId === "string"
            ? integration.config.groupId.trim()
            : "";
      const targetChatId =
        typeof pushSettings.targetChatId === "string" && pushSettings.targetChatId.trim()
          ? pushSettings.targetChatId.trim()
          : fallbackChatId;

      return targetChatId
        ? {
            integrationId: integration.id,
            provider: "telegram",
            targetChatId,
          }
        : null;
    })
    .filter((target): target is ProjectCommunityTarget => Boolean(target));
}

export async function dispatchProjectCommunityMessageWithResults(params: ProjectCommunityMessage) {
  const targets = await loadProjectCommunityTargets(params.projectId, params.providerScope);
  const deliveries: ProjectCommunityDeliveryResult[] = [];

  for (const target of targets) {
    try {
      if (target.provider === "discord" && target.targetChannelId) {
        await sendDiscordPush({
          targetChannelId: target.targetChannelId,
          targetThreadId: target.targetThreadId,
          title: params.title,
          body: params.body,
          eyebrow: params.eyebrow,
          projectName: params.projectName,
          campaignTitle: params.campaignTitle ?? undefined,
          imageUrl: params.imageUrl ?? undefined,
          accentColor: params.accentColor ?? undefined,
          meta: params.meta,
          url: params.url ?? undefined,
          buttonLabel: params.buttonLabel ?? undefined,
        });
        deliveries.push({ provider: "discord", integrationId: target.integrationId, ok: true });
        continue;
      }

      if (target.provider === "telegram" && target.targetChatId) {
        await sendTelegramPush({
          targetChatId: target.targetChatId,
          title: params.title,
          body: params.body,
          eyebrow: params.eyebrow,
          projectName: params.projectName,
          campaignTitle: params.campaignTitle ?? undefined,
          imageUrl: params.imageUrl ?? undefined,
          fallbackImageUrl: params.fallbackImageUrl ?? undefined,
          meta: params.meta,
          url: params.url ?? undefined,
          buttonLabel: params.buttonLabel ?? undefined,
        });
        deliveries.push({ provider: "telegram", integrationId: target.integrationId, ok: true });
      }
    } catch (error) {
      deliveries.push({
        provider: target.provider,
        integrationId: target.integrationId,
        ok: false,
        error: error instanceof Error ? error.message : "Delivery failed.",
      });
    }
  }

  return deliveries;
}

export async function dispatchProjectCommunityMessage(params: ProjectCommunityMessage) {
  const deliveries = await dispatchProjectCommunityMessageWithResults(params);
  return deliveries.filter((delivery) => delivery.ok).length;
}
