const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export type SendByChatIdOptions = {
  parse_mode?: "Markdown" | "HTML";
  reply_markup?: { inline_keyboard: unknown[] };
};

export async function sendByChatId(
  chatId: number,
  text: string,
  options?: SendByChatIdOptions
): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(options?.parse_mode && { parse_mode: options.parse_mode }),
      ...(options?.reply_markup && { reply_markup: options.reply_markup }),
    }),
  });
}

export async function sendErrorByChatId(chatId: number, message: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `❌ ${message}`,
    }),
  });
}
