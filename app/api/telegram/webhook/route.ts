import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ignore non-message updates
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    const chatId = message.chat.id;
    const username = message.chat.username ?? null;
    const text: string = message.text ?? "";

    // Only handle /start
    if (!text.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    // /start <payload>
    const parts = text.split(" ");
    const userId = parts[1];

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    // Use service role (Telegram is not authenticated)
    const supabase = await createClient({ useServiceRole: true });

    // Upsert Telegram connection
    const { error } = await supabase
      .from("user_telegram_connections")
      .upsert(
        {
          user_id: userId,
          telegram_chat_id: chatId,
          telegram_username: username,
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Telegram upsert error:", error);
    }

    // Optional: reply to user
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ Telegram connected successfully! You will now receive Gmail updates.",
        }),
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}


// Optional: respond with 405 for other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}