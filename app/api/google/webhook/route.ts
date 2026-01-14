// app/api/gmail/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { parseGmailMessage } from "@/lib/gmail/parseGmail";
import { formatEmailMessage } from "@/lib/telegram/formatTelegramMessage";
import { sendTelegramMessage } from "@/lib/telegram/sendTelegramMessage";
import { createOAuthClient, fetchGmailHistory, getUserTokens, processHistories } from "@/lib/gmail/webhookHelper";

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
        const data = await parsePubSubPayload(req);
        console.log("📩 Gmail push notification received", data);

        const supabase = await createClient({ useServiceRole: true });
        const userTokens = await getUserTokens(supabase, data.emailAddress);

        if (!userTokens.watch_history_id) {
            console.warn("⚠️ No watch_history_id found", {
                userId: userTokens.user_id,
            });
            return NextResponse.json({ success: true, skipped: true });
        }

        const gmail = createOAuthClient(userTokens, supabase);
        const historyRes = await fetchGmailHistory(
            gmail,
            userTokens,
            supabase
        );

        const histories = historyRes.data.history ?? [];
        console.log(`📬 ${histories.length} new message(s)`, {
            userId: userTokens.user_id,
        });

        if (historyRes.data.historyId) {
            await supabase
                .from("user_gmail_tokens")
                .update({
                    watch_history_id: historyRes.data.historyId,
                    updated_at: new Date().toISOString(),
                })
                .eq("email_address", userTokens.email_address);
        }

        await processHistories(gmail, histories, userTokens);

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
