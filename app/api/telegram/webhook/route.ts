import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleTelegramAction, handleRemindSet } from "./actions";
import { parseUserDate } from "@/lib/telegram/dateUtils";
import { sendByChatId } from "@/lib/telegram/sendByChatId";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function answerCallbackQuery(callbackQueryId: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient({ useServiceRole: true });

    // -----------------------------
    // 1️⃣ Handle callback queries
    // -----------------------------
    if (body.callback_query) {
      const cq = body.callback_query;
      await answerCallbackQuery(cq.id);
      await handleTelegramAction({
        data: cq.data,
        chatId: cq.message.chat.id,
        telegramMessageId: cq.message.message_id,
      });
      return NextResponse.json({ ok: true });
    }

    // -----------------------------
    // 2️⃣ Ignore non-message updates
    // -----------------------------
    if (!body.message) return NextResponse.json({ ok: true });

    const message = body.message;
    const chatId = message.chat.id;
    const username = message.chat.username ?? null;
    const text: string = (message.text ?? "").trim();

    // -----------------------------
    // 3️⃣ Handle /start first
    // -----------------------------
    if (text.startsWith("/start")) {
      // Try to get userId from space or query
      let userId: string | null = null;
      const parts = text.split(" ");
      if (parts.length > 1 && parts[1].trim()) {
        userId = parts[1].trim();
      } else if (text.includes("?")) {
        try {
          const query = new URLSearchParams(text.split("?")[1]);
          const id = query.get("userId");
          if (id) userId = id;
        } catch (err) {
          console.error("Failed to parse /start query params", err);
        }
      }

      if (!userId) {
        console.warn("Telegram /start called without userId", chatId);
        return NextResponse.json({ ok: true });
      }

      await supabase.from("user_telegram_connections").upsert(
        {
          user_id: userId,
          telegram_chat_id: chatId,
          telegram_username: username,
        },
        { onConflict: "user_id" }
      );

      await sendByChatId(
        chatId,
        "✅ Telegram connected successfully! You will now receive Gmail updates."
      );

      return NextResponse.json({ ok: true });
    }

    // -----------------------------
    // 4️⃣ Handle pending custom reminders
    // -----------------------------
    const { data: pending } = await supabase
      .from("pending_custom_reminders")
      .select("gmail_message_id")
      .eq("chat_id", chatId)
      .single();

    if (pending && text) {
      const parsed = parseUserDate(text);
      if (parsed) {
        await supabase
          .from("pending_custom_reminders")
          .delete()
          .eq("chat_id", chatId);
        await handleRemindSet(
          chatId,
          pending.gmail_message_id,
          parsed.date,
          parsed.time
        );
      } else {
        await sendByChatId(
          chatId,
          [
            "I couldn't quite catch that date.",
            "Try something like *Feb 19*, *Feb 19 at 3pm*, or *2026-02-19 10:30* — or pick a day from the calendar above.",
          ].join("\n\n"),
          { parse_mode: "Markdown" }
        );
      }
      return NextResponse.json({ ok: true });
    }

    // -----------------------------
    // 5️⃣ Ignore other messages
    // -----------------------------
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
