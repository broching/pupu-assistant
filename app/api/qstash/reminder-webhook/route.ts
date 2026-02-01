import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createClient } from "@/lib/supabase/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function handler(req: Request) {
  const body = await req.json();
  const { reminderId } = body as { reminderId?: string };

  if (!reminderId) {
    return new Response(
      JSON.stringify({ error: "reminderId required" }),
      { status: 400 }
    );
  }

  const supabase = await createClient({ useServiceRole: true });

  const { data: reminder, error: fetchError } = await supabase
    .from("scheduled_reminders")
    .select("id, user_id, chat_id, message_content, gmail_message_id, status")
    .eq("id", reminderId)
    .single();

  if (fetchError || !reminder) {
    console.error("Reminder not found:", reminderId, fetchError);
    return new Response(
      JSON.stringify({ error: "Reminder not found" }),
      { status: 404 }
    );
  }

  if (reminder.status !== "pending") {
    console.log("Reminder already processed:", reminderId, reminder.status);
    return new Response(
      JSON.stringify({ message: "Already processed" }),
      { status: 200 }
    );
  }

  // Update status to sent
  await supabase
    .from("scheduled_reminders")
    .update({
      status: "sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId);

  // Send reminder via Telegram with "Remind Me" action
  const payload = {
    chat_id: reminder.chat_id,
    text: `⏰ Reminder\n\n${reminder.message_content}`,
    parse_mode: "HTML" as const,
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚨Remind Me",
            callback_data: `remind_me:${reminder.gmail_message_id}`,
          },
        ],
      ],
    },
  };

  const telegramRes = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!telegramRes.ok) {
    const errData = await telegramRes.json();
    console.error("Telegram send error:", errData);
    return new Response(
      JSON.stringify({ error: "Failed to send Telegram" }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ success: true, reminderId }),
    { status: 200 }
  );
}

export const POST = verifySignatureAppRouter(handler);
