import { Client } from "@upstash/qstash";

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
});

/**
 * Schedule a reminder via QStash. Uses notBefore for exact delivery time.
 * @returns QStash message ID for tracking
 */
export async function scheduleReminderViaQStash(
  reminderId: string,
  scheduledAt: Date,
  webhookUrl: string
): Promise<string> {
  const notBeforeSeconds = Math.floor(scheduledAt.getTime() / 1000);

  const result = await client.publishJSON({
    url: webhookUrl,
    body: { reminderId },
    notBefore: notBeforeSeconds,
  });

  return result.messageId;
}
