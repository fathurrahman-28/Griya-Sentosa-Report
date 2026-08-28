const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = (method: string) => `https://api.telegram.org/bot${TOKEN}/${method}`;

export async function tgSendMessage(chatId: string, text: string, replyMarkup?: any) {
  if (!TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN belum diset — pesan tidak terkirim:", text);
    return null;
  }
  const res = await fetch(API("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup: replyMarkup,
    }),
  });
  return res.json();
}

export async function tgEditMessage(chatId: string, messageId: number | string, text: string, replyMarkup?: any) {
  if (!TOKEN) return null;
  const res = await fetch(API("editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "Markdown",
      reply_markup: replyMarkup,
    }),
  });
  return res.json();
}

export async function tgAnswerCallback(callbackQueryId: string, text?: string) {
  if (!TOKEN) return null;
  return fetch(API("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export function confirmKeyboard(draftId: number) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Konfirmasi", callback_data: `draft_confirm:${draftId}` },
        { text: "❌ Batal", callback_data: `draft_cancel:${draftId}` },
      ],
    ],
  };
}

export function approvalKeyboard(entryId: number) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Setujui", callback_data: `entry_approve:${entryId}` },
        { text: "❌ Tolak", callback_data: `entry_reject:${entryId}` },
      ],
    ],
  };
}
