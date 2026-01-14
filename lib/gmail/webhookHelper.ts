// app/api/gmail/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { parseGmailMessage } from "@/lib/gmail/parseGmail";
import { formatEmailMessage } from "@/lib/telegram/formatTelegramMessage";
import { sendTelegramMessage } from "@/lib/telegram/sendTelegramMessage";

export async function getUserTokens(supabase: any, emailAddress: string) {
    const { data, error } = await supabase
        .from("user_gmail_tokens")
        .select("*")
        .eq("email_address", emailAddress)
        .single();

    if (error || !data) {
        throw new Error("User tokens not found");
    }

    return data;
}

export function createOAuthClient(userTokens: any, supabase: any) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        access_token: userTokens.access_token,
        refresh_token: userTokens.refresh_token,
    });

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
                .eq("email_address", userTokens.email_address);
        }
    });

    return google.gmail({
        version: "v1",
        auth: oauth2Client,
    });
}

export async function fetchGmailHistory(gmail: any, userTokens: any, supabase: any) {
    try {
        return await gmail.users.history.list({
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
            oauthError: data?.error,
            oauthDescription: data?.error_description,
            fullResponseData: data,
        });

        if (
            data?.error === "invalid_grant" ||
            data?.error_description?.includes("Invalid Credentials")
        ) {
            await supabase
                .from("user_gmail_tokens")
                .update({
                    status: "reauth_required",
                    updated_at: new Date().toISOString(),
                })
                .eq("email_address", userTokens.email_address);
        }

        throw new Error("Google API error");
    }
}

export async function processHistories(
    gmail: any,
    histories: any[],
    userTokens: any
) {
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
}