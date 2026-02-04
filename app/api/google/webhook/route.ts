// app/api/gmail/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { parseGmailMessage } from "@/lib/gmail/parseGmail";
import { formatEmailMessage } from "@/lib/telegram/formatTelegramMessage";
import { sendTelegramMessage } from "@/lib/telegram/sendTelegramMessage";
import { createOAuthClient, ensureValidWatch, fetchGmailHistory, getUserFilter, getUserTokens, processHistories } from "@/lib/gmail/webhookHelper";

/* ------------------------------
   Helper parse Pub Sub
------------------------------ */

async function parsePubSubPayload(req: NextRequest) {
    const body = await req.json();
    const message = body.message?.data;

    if (!message) {
        throw new Error("No Pub/Sub message");
    }

    try {
        const buff = Buffer.from(message, "base64");
        return JSON.parse(buff.toString("utf-8"));
    } catch {
        throw new Error("Invalid Pub/Sub message format");
    }
}


/* ------------------------------
   Webhook Handler
------------------------------ */

export async function POST(req: NextRequest) {
    try {
        // 1️⃣ Parse the Pub/Sub payload
        const data = await parsePubSubPayload(req);
        console.log("📩 Gmail push notification received", data);

        // 2️⃣ Get Supabase client and user tokens
        const supabase = await createClient({ useServiceRole: true });
        const userTokens = await getUserTokens(supabase, data.emailAddress);

        // 3️⃣ Create OAuth2 Gmail client
        const gmail = createOAuthClient(userTokens, supabase);

        // 4️⃣ Ensure the watch is valid (7-day renewal)
        const watchHistoryId = await ensureValidWatch({
            gmail,
            supabase,
            userTokens,
        });
        userTokens.watch_history_id = watchHistoryId;

        // 5️⃣ Fetch Gmail history
        const historyRes = await fetchGmailHistory(gmail, userTokens, supabase);
        const histories = historyRes.data.history ?? [];
        console.log(`📬 ${histories.length} new message(s)`, {
            userId: userTokens.user_id,
        });

        // 6️⃣ Update watch_history_id
        if (historyRes.data.historyId) {
            await supabase
                .from("user_gmail_tokens")
                .update({
                    watch_history_id: historyRes.data.historyId,
                    updated_at: new Date().toISOString(),
                })
                .eq("email_address", userTokens.email_address);
        }

        // 7️⃣ Fetch filters for this user and email
        let filter = await getUserFilter(userTokens.user_id, userTokens.filter_id);

        if (!filter) {
            console.log("ℹ️ Using default filter for user", userTokens.user_id);
            filter = { "filter_name": "Default filter", "notification_mode": "balanced", "watch_tags": ["invoice", "payment", "subscription", "receipt", "approval", "deadline", "contract", "meeting", "security", "verification", "promotion", "deal"], "ignore_tags": [], "enable_first_time_sender_alert": true, "enable_thread_reply_alert": true, "enable_deadline_alert": true, "enable_subscription_payment_alert": true}
        } else {
            console.log("✅ Loaded filter", filter.filter_name);
        }

        // 8️⃣ Process histories with the filters
        await processHistories(supabase, gmail, histories, userTokens, filter);

        return NextResponse.json({
            success: true,
            processedMessages: histories.length,
        });
    } catch (err: any) {
        console.error("❌ Webhook fatal error", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}
