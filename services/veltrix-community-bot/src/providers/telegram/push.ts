import { getTelegramBot } from "./bot.js";

type PushMeta = {
  label: string;
  value: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

  const text = [
    params.eyebrow?.trim() ? `<b>${escapeHtml(params.eyebrow.trim())}</b>` : "<b>VELTRIX UPDATE</b>",
    `<b>${escapeHtml(params.title.trim())}</b>`,
    escapeHtml(params.body.trim()),
    ...(params.meta ?? [])
      .filter((item) => item.label.trim() && item.value.trim())
      .slice(0, 4)
      .map((item) => `<b>${escapeHtml(item.label.trim())}:</b> ${escapeHtml(item.value.trim())}`),
    params.campaignTitle?.trim()
      ? `<i>${escapeHtml(params.projectName?.trim() || "Veltrix")} • ${escapeHtml(
          params.campaignTitle.trim()
        )}</i>`
      : `<i>${escapeHtml(params.projectName?.trim() || "Veltrix")}</i>`,
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

  const message = params.imageUrl?.trim()
    ? await bot.telegram.sendPhoto(targetChatId, params.imageUrl.trim(), {
        caption: text,
        ...sharedOptions,
      })
    : await bot.telegram.sendMessage(targetChatId, text, sharedOptions);

  return {
    ok: true,
    chatId: String(message.chat.id),
    messageId: message.message_id,
  };
}
