import { createClient } from "@/lib/supabase/server";
import { scheduleReminderViaQStash } from "@/lib/qstash/scheduleReminder";
import { getAppBaseUrl } from "@/lib/utils/appUrl";
import { sendByChatId, sendErrorByChatId } from "@/lib/telegram/sendByChatId";
import {
  formatFriendlyDate,
  formatFriendlyTime,
  formatDateForButton,
  buildCalendarDays,
  generateSuggestedDates,
} from "@/lib/telegram/dateUtils";

export type ActionParams = {
  data: string;
  chatId: number;
  telegramMessageId: number;
};

export async function handleTelegramAction(params: ActionParams): Promise<void> {
  const parts = params.data.split(":");
  const action = parts[0];
  const gmailMessageId = parts[1];
  const dateValue = parts[2];
  const datelineDate = parts[3];

  switch (action) {
    case "reply_manual":
      return handleManualReply(gmailMessageId, params.chatId);
    case "reply_ai":
      return handleAIReply(gmailMessageId, params.chatId);
    case "remind_me":
      return handleRemindMe(gmailMessageId, params.chatId, datelineDate ?? "");
    case "remind_set":
      return handleRemindSet(params.chatId, gmailMessageId, dateValue ?? "");
    case "remind_quick":
      return handleRemindQuick(params.chatId, gmailMessageId, dateValue ?? "");
    case "remind_custom":
      return handleRemindCustom(gmailMessageId, params.chatId);
    case "custom_date":
      return handleRemindSet(params.chatId, gmailMessageId, dateValue ?? "");
    case "noop":
      return;
    default:
      console.warn("Unknown Telegram action:", action);
  }
}

async function handleManualReply(messageId: string, chatId: number): Promise<void> {
  await sendByChatId(
    chatId,
    "✍️ Manual reply mode enabled.\n\nType your reply in the next message and I'll prepare it for sending."
  );
}

async function handleAIReply(messageId: string, chatId: number): Promise<void> {
  await sendByChatId(
    chatId,
    "🤖 AI reply generation coming up.\n\nI'll draft a response and ask you to confirm before sending."
  );
}

async function handleRemindMe(
  messageId: string,
  chatId: number,
  datelineDate: string
): Promise<void> {
  const suggestedDates = generateSuggestedDates(datelineDate);
  const aiSuggestedDates = suggestedDates.map((date) => ({
    label: formatDateForButton(date),
    value: date,
  }));

  await sendByChatId(chatId, "⏰ When should I remind you? ✨AI suggested", {
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
  });
}

export async function handleRemindSet(
  chatId: number,
  gmailMessageId: string,
  dateValue: string,
  timeValue?: string
): Promise<void> {
  const supabase = await createClient({ useServiceRole: true });

  const { data: connection, error: connError } = await supabase
    .from("user_telegram_connections")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (connError || !connection?.user_id) {
    await sendErrorByChatId(chatId, "Could not find your account.");
    return;
  }

  const userId = connection.user_id;

  const { data: emailResponse, error: emailError } = await supabase
    .from("email_ai_responses")
    .select("reply_message")
    .eq("user_id", userId)
    .eq("message_id", gmailMessageId)
    .single();

  if (emailError || !emailResponse?.reply_message) {
    await sendErrorByChatId(chatId, "Could not find the original message.");
    return;
  }

  const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${gmailMessageId}`;
  const messageContent = `${emailResponse.reply_message}\n\nView in Gmail: ${gmailLink}`;

  let scheduledAt: Date;
  if (timeValue) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    const utcHours = (hours - 8 + 24) % 24;
    scheduledAt = new Date(
      `${dateValue}T${utcHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00Z`
    );
  } else {
    scheduledAt = new Date(`${dateValue}T00:00:00Z`);
  }

  if (isNaN(scheduledAt.getTime())) {
    await sendErrorByChatId(chatId, "Invalid date format.");
    return;
  }

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
    await sendErrorByChatId(chatId, "Failed to save reminder.");
    return;
  }

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
    await sendErrorByChatId(chatId, "Failed to schedule reminder.");
    return;
  }

  const friendlyDate = formatFriendlyDate(dateValue);
  const friendlyTime = timeValue ? formatFriendlyTime(timeValue) : "8am";
  await sendByChatId(
    chatId,
    `Got it — I'll nudge you on ${friendlyDate} at ${friendlyTime} (SGT). You've got this 💪`,
    { parse_mode: "Markdown" }
  );
}

async function handleRemindQuick(
  chatId: number,
  gmailMessageId: string,
  delayValue: string
): Promise<void> {
  const days = delayValue === "1d" ? 1 : delayValue === "3d" ? 3 : 0;
  if (days === 0) {
    await sendErrorByChatId(chatId, "Invalid quick option.");
    return;
  }
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + days);
  const dateStr = scheduledAt.toISOString().slice(0, 10);
  await handleRemindSet(chatId, gmailMessageId, dateStr);
}

async function handleRemindCustom(
  gmailMessageId: string,
  chatId: number
): Promise<void> {
  const supabase = await createClient({ useServiceRole: true });

  const { data: connection } = await supabase
    .from("user_telegram_connections")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!connection?.user_id) {
    await sendErrorByChatId(chatId, "Could not find your account.");
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
  await sendByChatId(
    chatId,
    "⏰ When should I remind you?\n\nYou can type it naturally:\n• Feb 19\n• Feb 19 at 3pm\n• 2026-02-19 10:30\n• tomorrow or tmr\n\nOr simply choose a date below.\nIf you don't specify a time, I'll remind you at 8:00am (SG time).",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: calendarRows } }
  );
}
