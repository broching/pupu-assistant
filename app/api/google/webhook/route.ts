// app/api/gmail/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    createOAuthClient,
    ensureValidWatch,
    fetchGmailHistory,
    getUserFilter,
    getUserTokens,
    processHistories,
} from "@/lib/gmail/webhookHelper";
import { canAccessPlan } from "@/lib/subscription/server";

/* ------------------------------
   Helper: parse Pub/Sub payload
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
        // 1️⃣ Parse Pub/Sub payload
        const data = await parsePubSubPayload(req);
        console.log("📩 Gmail push notification received", data);

        // 2️⃣ Create Supabase service client
        const supabase = await createClient({ useServiceRole: true });

        // 3️⃣ Resolve user tokens
        const userTokens = await getUserTokens(supabase, data.emailAddress);

        // 4️⃣ 🔐 PAYMENT GATE — free_trial minimum
        const hasAccess = await canAccessPlan(userTokens.user_id, "free_trial");

        if (!hasAccess) {
            console.warn("🚫 Subscription access denied", {
                userId: userTokens.user_id,
                email: userTokens.email_address,
            });

            // IMPORTANT: return 200 so Pub/Sub does NOT retry
            return NextResponse.json({
                success: false,
                reason: "subscription_inactive",
                status: 200
            });
        }

        // 5️⃣ Create OAuth Gmail client
        const gmail = createOAuthClient(userTokens, supabase);

        // 6️⃣ Ensure Gmail watch is valid
        const watchHistoryId = await ensureValidWatch({
            gmail,
            supabase,
            userTokens,
        });
        userTokens.watch_history_id = watchHistoryId;

        // 7️⃣ Fetch Gmail history
        const historyRes = await fetchGmailHistory(gmail, userTokens, supabase);
        const histories = historyRes.data.history ?? [];

        console.log(`📬 ${histories.length} new message(s)`, {
            userId: userTokens.user_id,
        });

        // 8️⃣ Persist latest history ID
        if (historyRes.data.historyId) {
            await supabase
                .from("user_gmail_tokens")
                .update({
                    watch_history_id: historyRes.data.historyId,
                    updated_at: new Date().toISOString(),
                })
                .eq("email_address", userTokens.email_address);
        }

        // 9️⃣ Load user filter (or default)
        let filter = await getUserFilter(
            userTokens.user_id,
            userTokens.filter_id
        );

        if (!filter) {
            console.log("ℹ️ Using default filter for user", userTokens.user_id);
            filter = {
                filter_name: "Default filter",
                notification_mode: "balanced",
                watch_tags: [
                    "invoice",
                    "payment",
                    "subscription",
                    "receipt",
                    "approval",
                    "deadline",
                    "contract",
                    "meeting",
                    "security",
                    "verification",
                    "promotion",
                    "deal",
                ],
                ignore_tags: [],
                enable_first_time_sender_alert: true,
                enable_thread_reply_alert: true,
                enable_deadline_alert: true,
                enable_subscription_payment_alert: true,
            };
        } else {
            console.log("✅ Loaded filter", filter.filter_name);
        }

        // 🔟 Process histories (AI + DB + Telegram)
        await processHistories(
            supabase,
            gmail,
            histories,
            userTokens,
            filter
        );

        return NextResponse.json({
            success: true,
            processedMessages: histories.length,
        });
    } catch (err: any) {
        console.error("❌ Webhook fatal error", err);

        // Still return 200 to avoid Pub/Sub retries
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 200 }
        );
    }
}
