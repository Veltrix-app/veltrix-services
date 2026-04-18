import { getTelegramBot } from "./bot.js";

type PushMeta = {
  label: string;
  value: string;
};

function normalizeComparableText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

export async function sendTelegramPush(params: {
  targetChatId: string;
  title: string;
  body: string;
  eyebrow?: string;
  projectName?: string;
  campaignTitle?: string;
  imageUrl?: string;
  meta?: PushMeta[];
  url?: string;
  buttonLabel?: string;
}) {
  const bot = getTelegramBot();

  if (!bot) {
    throw new Error("Telegram bot is not configured.");
  }

  const targetChatId = params.targetChatId.trim();
  if (!targetChatId) {
    throw new Error("Missing Telegram target chat id.");
  }

  const title = params.title.trim();
  const body = params.body.trim();
  const hasDistinctBody =
    body.length > 0 && normalizeComparableText(body) !== normalizeComparableText(title);
  const visibleMeta = (params.meta ?? [])
    .filter((item) => item.label.trim() && item.value.trim())
    .filter((item) => !isContextMeta(item.label))
    .slice(0, 4);

  const text = [
    params.eyebrow?.trim() ? `<b>${escapeHtml(params.eyebrow.trim())}</b>` : "<b>VELTRIX UPDATE</b>",
    `<b>${escapeHtml(title)}</b>`,
    ...(hasDistinctBody ? [escapeHtml(body)] : []),
    ...visibleMeta.map(
      (item) => `<b>${escapeHtml(item.label.trim())}:</b> ${escapeHtml(item.value.trim())}`
    ),
    `<i>${escapeHtml(formatContextLine(params.projectName, params.campaignTitle))}</i>`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const sharedOptions = {
    parse_mode: "HTML" as const,
    ...(params.url?.trim()
      ? {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: params.buttonLabel?.trim() || "Open in Veltrix",
                  url: params.url.trim(),
                },
              ],
            ],
          },
        }
      : {}),
  };

  const imageUrl = params.imageUrl?.trim() || "";

  let message;
  if (imageUrl) {
    try {
      message = await bot.telegram.sendPhoto(targetChatId, imageUrl, {
        caption: text,
        ...sharedOptions,
      });
    } catch {
      // Many CMS/website URLs look like image assets but resolve to HTML.
      // Fall back to a text push so delivery still succeeds.
      message = await bot.telegram.sendMessage(targetChatId, text, sharedOptions);
    }
  } else {
    message = await bot.telegram.sendMessage(targetChatId, text, sharedOptions);
  }

  return {
    ok: true,
    chatId: String(message.chat.id),
    messageId: message.message_id,
  };
}
