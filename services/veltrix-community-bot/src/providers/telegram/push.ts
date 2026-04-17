import { getTelegramBot } from "./bot.js";

export async function sendTelegramPush(params: {
  targetChatId: string;
  title: string;
  body: string;
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

  const text = [`*${params.title.trim()}*`, params.body.trim()].filter(Boolean).join("\n\n");

  const message = await bot.telegram.sendMessage(targetChatId, text, {
    parse_mode: "Markdown",
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
  });

  return {
    ok: true,
    chatId: String(message.chat.id),
    messageId: message.message_id,
  };
}
