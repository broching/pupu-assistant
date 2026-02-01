import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scheduleReminderViaQStash } from "@/lib/qstash/scheduleReminder";
import { getAppBaseUrl } from "@/lib/utils/appUrl";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ==================================================
// POST: Telegram Webhook
// ==================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ==================================================
    // 1️⃣ Handle inline button actions
    // ==================================================
    if (body.callback_query) {
      const cq = body.callback_query;
      const data: string = cq.data;
      const chatId = cq.message.chat.id;
      const telegramMessageId = cq.message.message_id;

      // 🔴 MUST acknowledge callback_query
      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: cq.id,
        }),
      });

      await handleTelegramAction({
        data,
        chatId,
        telegramMessageId,
      });

      return NextResponse.json({ ok: true });
    }

    // ==================================================
    // 2️⃣ Handle normal messages
    // ==================================================
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    const chatId = message.chat.id;
    const username = message.chat.username ?? null;
    const text: string = (message.text ?? "").trim();

    // 2a. Check for pending custom reminder (user replying with a date)
    const supabase = await createClient({ useServiceRole: true });
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
        await handleRemindSet(chatId, pending.gmail_message_id, parsed.date, parsed.time);
      } else {
        await sendTelegramToChat(chatId, [
          "I couldn’t quite catch that date.",
          "Try something like *Feb 19*, *Feb 19 at 3pm*, or *2026-02-19 10:30* — or pick a day from the calendar above.",
        ].join("\n\n"), "Markdown");
      }
      return NextResponse.json({ ok: true });
    }

    // 2b. /start only
    if (!text.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    const parts = text.split(" ");
    const userId = parts[1];

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from("user_telegram_connections")
      .upsert(
        {
          user_id: userId,
          telegram_chat_id: chatId,
          telegram_username: username,
        },
        { onConflict: "user_id" }
      );

    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Telegram connected successfully! You will now receive Gmail updates.",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

// ==================================================
// GET: Not allowed
// ==================================================
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

// ==================================================
// Action Router
// ==================================================
async function handleTelegramAction(params: {
  data: string;
  chatId: number;
  telegramMessageId: number;
}) {
  const parts = params.data.split(":");
  const action = parts[0];
  const gmailMessageId = parts[1];
  const dateValue = parts[2]; // for remind_set (YYYY-MM-DD) or remind_quick (1d, 3d)
  const datelineDate = parts[3];
  console.log("log parts:", parts, "params:", params)
  switch (action) {
    case "reply_manual":
      return handleManualReply(gmailMessageId, params.chatId);

    case "reply_ai":
      return handleAIReply(gmailMessageId, params.chatId);

    case "remind_me":
      return handleRemindMe(gmailMessageId, params.chatId, datelineDate);

    case "remind_set":
      return handleRemindSet(params.chatId, gmailMessageId, dateValue ?? "");

    case "remind_quick":
      return handleRemindQuick(params.chatId, gmailMessageId, dateValue ?? "");

    case "remind_custom":
      return handleRemindCustom(gmailMessageId, params.chatId);

    case "custom_date":
      return handleRemindSet(params.chatId, gmailMessageId, dateValue ?? "");

    case "noop":
      return; // Header buttons, no action

    default:
      console.warn("Unknown Telegram action:", action);
  }
}

// ==================================================
// ✍️ Manual Reply Mode
// ==================================================
async function handleManualReply(messageId: string, chatId: number) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text:
        "✍️ Manual reply mode enabled.\n\n" +
        "Type your reply in the next message and I’ll prepare it for sending.",
    }),
  });
}

// ==================================================
// 🤖 AI Reply (placeholder)
// ==================================================
async function handleAIReply(messageId: string, chatId: number) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text:
        "🤖 AI reply generation coming up.\n\n" +
        "I’ll draft a response and ask you to confirm before sending.",
    }),
  });
}

// ==================================================
// ⏰ Remind Me
// ==================================================
async function handleRemindMe(messageId: string, chatId: number, datelineDate: string) {
  const suggestedDates = generateSuggestedDates(datelineDate);
  console.log("suggestedDates:", suggestedDates)
  const aiSuggestedDates = suggestedDates.map((date) => ({
    label: formatDateForButton(date),
    value: date,
  }));
  

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "⏰ When should I remind you? ✨AI suggested",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            ...aiSuggestedDates.map((d) => ({
              text: d.label,
              callback_data: `remind_set:${messageId}:${d.value}`,
            })),
            { text: "📅 Custom", callback_data: `remind_custom:${messageId}` },
          ],
        ],
      },
    }),
  });
}

// ==================================================
// ⏰ Remind Set / Remind Quick — store + schedule via QStash
// ==================================================
async function handleRemindSet(
  chatId: number,
  gmailMessageId: string,
  dateValue: string,
  timeValue?: string // HH:MM format, defaults to 8am Singapore (00:00 UTC)
) {
  const supabase = await createClient({ useServiceRole: true });

  // 1. Resolve user_id from chat_id
  const { data: connection, error: connError } = await supabase
    .from("user_telegram_connections")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (connError || !connection?.user_id) {
    await sendTelegramError(chatId, "Could not find your account.");
    return;
  }

  const userId = connection.user_id;

  // 2. Fetch message content from email_ai_responses
  const { data: emailResponse, error: emailError } = await supabase
    .from("email_ai_responses")
    .select("reply_message")
    .eq("user_id", userId)
    .eq("message_id", gmailMessageId)
    .single();

  if (emailError || !emailResponse?.reply_message) {
    await sendTelegramError(chatId, "Could not find the original message.");
    return;
  }

  const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${gmailMessageId}`;
  const messageContent = `${emailResponse.reply_message}\n\nView in Gmail: ${gmailLink}`;

  // 3. Parse scheduled date/time — default 8am Singapore time (UTC+8 = 00:00 UTC)
  let scheduledAt: Date;
  if (timeValue) {
    // Convert Singapore time (UTC+8) to UTC
    const [hours, minutes] = timeValue.split(":").map(Number);
    const utcHours = (hours - 8 + 24) % 24; // SGT to UTC
    scheduledAt = new Date(`${dateValue}T${utcHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00Z`);
  } else {
    // Default: 8am Singapore = 00:00 UTC
    scheduledAt = new Date(`${dateValue}T00:00:00Z`);
  }
  if (isNaN(scheduledAt.getTime())) {
    await sendTelegramError(chatId, "Invalid date format.");
    return;
  }

  // 4. Insert into scheduled_reminders
  const { data: reminder, error: insertError } = await supabase
    .from("scheduled_reminders")
    .insert({
      user_id: userId,
      chat_id: chatId,
      gmail_message_id: gmailMessageId,
      message_content: messageContent,
      status: "pending",
      scheduled_at: scheduledAt.toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !reminder?.id) {
    console.error("scheduled_reminders insert error:", insertError);
    await sendTelegramError(chatId, "Failed to save reminder.");
    return;
  }

  // 5. Schedule via QStash
  const webhookUrl = `${getAppBaseUrl()}/api/qstash/reminder-webhook`;
  try {
    const qstashMessageId = await scheduleReminderViaQStash(
      reminder.id,
      scheduledAt,
      webhookUrl
    );

    await supabase
      .from("scheduled_reminders")
      .update({
        qstash_message_id: qstashMessageId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reminder.id);
  } catch (err) {
    console.error("QStash schedule error:", err);
    await sendTelegramError(chatId, "Failed to schedule reminder.");
    return;
  }

  const friendlyDate = formatFriendlyDate(dateValue);
  const friendlyTime = timeValue ? formatFriendlyTime(timeValue) : "8am";
  await sendTelegramToChat(
    chatId,
    `Got it — I'll nudge you on ${friendlyDate} at ${friendlyTime} (SGT). You've got this 💪`,
    "Markdown"
  );
}

async function handleRemindQuick(
  chatId: number,
  gmailMessageId: string,
  delayValue: string
) {
  const days = delayValue === "1d" ? 1 : delayValue === "3d" ? 3 : 0;
  if (days === 0) {
    await sendTelegramError(chatId, "Invalid quick option.");
    return;
  }

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + days);
  const dateStr = scheduledAt.toISOString().slice(0, 10);

  await handleRemindSet(chatId, gmailMessageId, dateStr);
}

async function handleRemindCustom(gmailMessageId: string, chatId: number) {
  const supabase = await createClient({ useServiceRole: true });

  const { data: connection } = await supabase
    .from("user_telegram_connections")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!connection?.user_id) {
    await sendTelegramError(chatId, "Could not find your account.");
    return;
  }

  await supabase.from("pending_custom_reminders").upsert(
    {
      chat_id: chatId,
      user_id: connection.user_id,
      gmail_message_id: gmailMessageId,
    },
    { onConflict: "chat_id" }
  );

  const calendarRows = buildCalendarDays(15, gmailMessageId);

  await sendTelegramToChat(
    chatId,
    "⏰ When should I remind you?\n\nYou can type it naturally:\n• Feb 19\n• Feb 19 at 3pm\n• 2026-02-19 10:30\n• tommorow or tmr\n\nOr simply choose a date below.\nIf you don’t specify a time, I’ll remind you at 8:00am (SG time).",
    "Markdown",
    {
      reply_markup: {
        inline_keyboard: calendarRows,
      },
    }
  );
}

async function sendTelegramError(chatId: number, message: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `❌ ${message}`,
    }),
  });
}

async function sendTelegramToChat(
  chatId: number,
  text: string,
  parse_mode?: "Markdown" | "HTML",
  options?: { reply_markup?: { inline_keyboard: unknown[] } }
) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(parse_mode && { parse_mode }),
      ...(options?.reply_markup && { reply_markup: options.reply_markup }),
    }),
  });
}

/**
 * Parse user input into { date: YYYY-MM-DD, time?: HH:MM } or null.
 * Handles "Feb 19", "2026-02-19", "tomorrow", "Feb 19 at 3pm", "Feb 19 10:30", etc.
 */
function parseUserDate(input: string): { date: string; time?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
    // ─────────────── Handle tomorrow / tmr ───────────────
    if (trimmed === "tomorrow" || trimmed === "tmr") {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      return { date: d.toISOString().slice(0, 10) };
    }

  // Check for time component (e.g. "at 3pm", "10:30", "3:00pm")
  const timePatterns = [
    /\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i, // "at 3pm", "at 10:30am"
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,               // "10:30", "3:00pm"
    /(\d{1,2})\s*(am|pm)/i,                        // "3pm", "10am"
  ];

  let extractedTime: string | undefined;
  let dateOnly = trimmed;

  for (const pattern of timePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = (match[3] || "").toLowerCase();

      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;

      extractedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      dateOnly = trimmed.replace(pattern, "").replace(/\s+/g, " ").trim();
      break;
    }
  }

  const dateLower = dateOnly.toLowerCase();

  // Handle "tomorrow"
  if (dateLower === "tomorrow") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: d.toISOString().slice(0, 10), time: extractedTime };
  }

  // Handle "today"
  if (dateLower === "today") {
    return { date: today.toISOString().slice(0, 10), time: extractedTime };
  }

  // Try DD/MM/YYYY
  const ddmmyyyy = dateOnly.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    const d = new Date(iso + "T00:00:00Z");
    if (!isNaN(d.getTime())) {
      return { date: iso, time: extractedTime };
    }
  }

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const d = new Date(dateOnly + "T00:00:00Z");
    if (!isNaN(d.getTime())) {
      return { date: dateOnly, time: extractedTime };
    }
  }

  // Try natural date like "Feb 19", "February 19", "19 Feb", "Feb 19 2026"
  const monthNames: { [key: string]: number } = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  // "Feb 19" or "Feb 19 2026"
  const mdy = dateLower.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (mdy) {
    const monthNum = monthNames[mdy[1]];
    if (monthNum !== undefined) {
      const day = parseInt(mdy[2], 10);
      const year = mdy[3] ? parseInt(mdy[3], 10) : today.getFullYear();
      const iso = `${year}-${(monthNum + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const d = new Date(iso + "T00:00:00Z");
      if (!isNaN(d.getTime())) {
        return { date: iso, time: extractedTime };
      }
    }
  }

  // "19 Feb" or "19 Feb 2026"
  const dmy = dateLower.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  if (dmy) {
    const monthNum = monthNames[dmy[2]];
    if (monthNum !== undefined) {
      const day = parseInt(dmy[1], 10);
      const year = dmy[3] ? parseInt(dmy[3], 10) : today.getFullYear();
      const iso = `${year}-${(monthNum + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const d = new Date(iso + "T00:00:00Z");
      if (!isNaN(d.getTime())) {
        return { date: iso, time: extractedTime };
      }
    }
  }

  return null;
}

/** Format YYYY-MM-DD as "Feb 19" for human-friendly messages. */
function formatFriendlyDate(dateValue: string): string {
  const d = new Date(dateValue + "T12:00:00Z");
  if (isNaN(d.getTime())) return dateValue;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Format HH:MM as "3pm", "10:30am" for human-friendly messages. */
function formatFriendlyTime(timeValue: string): string {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  if (minutes === 0) {
    return `${h12}${ampm}`;
  }
  return `${h12}:${minutes.toString().padStart(2, "0")}${ampm}`;
}

/** Build inline keyboard rows for the next N days (e.g. 14). Each row has up to 7 days. */
function buildCalendarDays(
  daysCount: number,
  messageId: string
): { text: string; callback_data: string }[][] {
  const rows: { text: string; callback_data: string }[][] = [];

  // Start from tomorrow
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 2);

  // Always 3 rows
  const rowsCount = 3;
  const buttonsPerRow = Math.ceil(daysCount / rowsCount);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);

    const dateStr = d.toISOString().slice(0, 10);
    const label = formatFriendlyDate(dateStr);

    const btn = {
      text: label,
      callback_data: `custom_date:${messageId}:${dateStr}`,
    };

    const rowIndex = Math.floor(i / buttonsPerRow);
    if (!rows[rowIndex]) rows[rowIndex] = [];
    rows[rowIndex].push(btn);
  }

  return rows.slice(0, 3);
}


function generateSuggestedDates(datelineDate: string): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: Date[] = [];

  // Always include tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  results.push(tomorrow);

  const base = new Date(datelineDate + "T00:00:00Z");

  // ─────────────────────────────────────────────
  // Primary: dates BEFORE dateline (within 1 week)
  // ─────────────────────────────────────────────
  if (!isNaN(base.getTime())) {
    const offsets = [3, 5, 7];

    for (const daysBefore of offsets) {
      const d = new Date(base);
      d.setDate(d.getDate() - daysBefore);

      if (d > today) {
        results.push(d);
      }
    }
  }

  // ─────────────────────────────────────────────
  // Fallback: fill with +2 day gaps
  // ─────────────────────────────────────────────
  let gap = 3;
  while (results.length < 3) {
    const d = new Date(today);
    d.setDate(d.getDate() + gap);
    results.push(d);
    gap += 2;
  }

  // ─────────────────────────────────────────────
  // Normalize: unique, sort, limit to 3
  // ─────────────────────────────────────────────
  return Array.from(
    new Map(results.map(d => [d.toISOString().slice(0, 10), d])).values()
  )
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, 3)
    .map(d => d.toISOString().slice(0, 10));
}



function formatDateForButton(dateISO: string): string {
  const d = new Date(dateISO + "T12:00:00Z");
  if (isNaN(d.getTime())) return dateISO;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
