// lib/telegram/sendTelegramMessage.ts
import { createClient } from "@/lib/supabase/server";

export async function sendTelegramMessage(
  userId: string,
  message: string
) {
  try {
    const supabase = await createClient({ useServiceRole: true });

    // 1️⃣ Get user's Telegram chat_id
    const { data, error } = await supabase
      .from("user_telegram_connections")
      .select("telegram_chat_id")
      .eq("user_id", userId)
      .single();

    if (error || !data?.telegram_chat_id) {
      console.error("Telegram chat_id not found for user:", userId, error);
      return { success: false, error: "Chat ID not found" };
    }

    const chatId = data.telegram_chat_id;

    // 2️⃣ Send message via Telegram API
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML", // optional
        }),
      }
    );

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok) {
      console.error("Telegram API error:", telegramData);
      return { success: false, error: telegramData };
    }

    console.log("Telegram message sent to user:", userId);

    return { success: true };
  } catch (err) {
    console.error("sendTelegramMessage error:", err);
    return { success: false, error: err };
  }
}
