// app/api/gmail/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { parseGmailMessage } from "@/lib/gmail/parseGmail";
import { formatEmailMessage } from "@/lib/telegram/formatTelegramMessage";
import { sendTelegramMessage } from "@/lib/telegram/sendTelegramMessage";

export async function POST(req: NextRequest) {
    try {
        /* ------------------------------
           Parse Pub/Sub payload
        ------------------------------ */
        const body = await req.json();
        const message = body.message?.data;

        if (!message) {
            console.error("❌ Webhook error: No Pub/Sub message");
            return NextResponse.json({ error: "No message" }, { status: 400 });
        }

        let data: any;
        try {
            const buff = Buffer.from(message, "base64");
            data = JSON.parse(buff.toString("utf-8"));
        } catch (err) {
            console.error("❌ Failed to parse Pub/Sub message", err);
            return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
        }

        console.log("📩 Gmail push notification received", data);

        /* ------------------------------
           Fetch user OAuth tokens
        ------------------------------ */
        const supabase = await createClient({ useServiceRole: true });

        const { data: userTokens, error: tokenError } = await supabase
            .from("user_gmail_tokens")
            .select("*")
            .eq("email_address", data.emailAddress)
            .single();

        if (tokenError || !userTokens) {
            console.error("❌ User tokens not found", {
                email: data.emailAddress,
                error: tokenError,
            });
            return NextResponse.json({ error: "User tokens not found" }, { status: 404 });
        }

        /* ------------------------------
           OAuth2 client (CRITICAL FIX)
        ------------------------------ */
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: userTokens.access_token,
            refresh_token: userTokens.refresh_token,
        });

        // Persist refreshed tokens
        oauth2Client.on("tokens", async (tokens) => {
            console.log("🔄 OAuth tokens refreshed", {
                userId: userTokens.user_id,
                hasAccessToken: !!tokens.access_token,
                hasRefreshToken: !!tokens.refresh_token,
            });

            const updates: any = {};

            if (tokens.access_token) updates.access_token = tokens.access_token;
            if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token;

            if (Object.keys(updates).length > 0) {
                await supabase
                    .from("user_gmail_tokens")
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("email_address", userTokens.email_address)
;
            }
        });

        const gmail = google.gmail({
            version: "v1",
            auth: oauth2Client,
        });

        /* ------------------------------
           Validate historyId
        ------------------------------ */
        if (!userTokens.watch_history_id) {
            console.warn("⚠️ No watch_history_id found", {
                userId: userTokens.user_id,
            });
            return NextResponse.json({ success: true, skipped: true });
        }

        /* ------------------------------
           Fetch Gmail history
        ------------------------------ */
        let historyRes;

        try {
            historyRes = await gmail.users.history.list({
                userId: "me",
                startHistoryId: userTokens.watch_history_id,
                historyTypes: ["messageAdded"],
                labelId: "INBOX",
            });
        } catch (gmailErr: any) {
            const res = gmailErr?.response;
            const data = res?.data;

            console.error("❌ Google API call failed", {
                userId: userTokens.user_id,
                httpStatus: res?.status,
                oauthError: typeof data?.error === "string" ? data?.error : undefined,
                oauthDescription: data?.error_description,
                gmailError: typeof data?.error === "object" ? data?.error : undefined,
                fullResponseData: data,
            });

            // Refresh token revoked or invalid
            if (
                data?.error === "invalid_grant" ||
                data?.error_description?.includes("Invalid Credentials")
            ) {
                console.error("🚨 Refresh token revoked — reauth required", {
                    userId: userTokens.user_id,
                });

                await supabase
                    .from("user_gmail_tokens")
                    .update({
                        status: "reauth_required",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("email_address", userTokens.email_address)
;
            }

            return NextResponse.json(
                { error: "Google API error", details: data },
                { status: 500 }
            );
        }

        /* ------------------------------
           Process new messages
        ------------------------------ */
        const histories = historyRes.data.history ?? [];
        console.log(`📬 ${histories.length} new message(s)`, {
            userId: userTokens.user_id,
        });

        // Update historyId for next webhook
        if (historyRes.data.historyId) {
            await supabase
                .from("user_gmail_tokens")
                .update({
                    watch_history_id: historyRes.data.historyId,
                    updated_at: new Date().toISOString(),
                })
                .eq("email_address", userTokens.email_address)
;
        }

        for (const h of histories) {
            if (!h.messages) continue;

            for (const msg of h.messages) {
                try {
                    const fullMessage = await gmail.users.messages.get({
                        userId: "me",
                        id: msg.id!,
                        format: "full",
                    });

                    const email = parseGmailMessage(fullMessage.data);
                    const telegramText = formatEmailMessage(email);

                    await sendTelegramMessage(userTokens.user_id, telegramText);
                } catch (err) {
                    console.error("❌ Failed to process message", {
                        messageId: msg.id,
                        error: err,
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            processedMessages: histories.length,
        });
    } catch (err) {
        console.error("❌ Webhook fatal error", err);
        return NextResponse.json(
            { error: "Server error", details: err instanceof Error ? err.message : err },
            { status: 500 }
        );
    }
}
