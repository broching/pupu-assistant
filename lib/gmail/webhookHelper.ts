import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { parseGmailMessage } from "@/lib/gmail/parseGmail";
import { sendTelegramMessage } from "@/lib/telegram/sendTelegramMessage";
import { analyzeEmailWithAI } from "./analyzeEmailWithAi";
import { canAccessPlan } from "../subscription/server";
import { decrypt, safeDecrypt } from "../encryption/helper";
import { NextRequest } from "next/server";
import { calendar } from "googleapis/build/src/apis/calendar";
import { createServerClient } from "@supabase/ssr";
import { EmailAnalysisResult, FilterConfig } from "../geminiAI/geminiSchemas";

/* ------------------------------
   Helper: parse Pub/Sub payload
------------------------------ */
export async function parsePubSubPayload(req: NextRequest) {
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

export async function getUserTokens(supabase: Awaited<ReturnType<typeof createClient>>, emailAddress: string) {
    const { data, error } = await supabase
        .from("user_gmail_tokens")
        .select("*")
        .eq("email_address", emailAddress)
        .single();

    if (error || !data) {
        throw new Error("User tokens not found");
    }
    console.log(data)
    data.access_token = safeDecrypt(data.access_token)
    data.refresh_token = safeDecrypt(data.refresh_token)
    return data;
}

export async function getUserCalendarTokens(userId: string) {
    const supabase = await createClient({ useServiceRole: true });
    const { data, error } = await supabase
        .from("google_calendar_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        throw new Error("User tokens not found");
    }
    console.log(data)
    data.access_token = safeDecrypt(data.access_token)
    data.refresh_token = safeDecrypt(data.refresh_token)
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

export function createCalendarOauthClient(userTokens: any, supabase: any) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CALENDAR_CLIENT_ID,
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET
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
                .from("google_calendar_connections")
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq("email_address", userTokens.email_address);
        }
    });

    return oauth2Client;
}

export async function fetchGmailHistory(
    gmail: any,
    userTokens: any,
    supabase: any
) {
    const hasAccess = await canAccessPlan(userTokens.user_id, "free_trial");
    if (!hasAccess) {
        console.warn("🚫 fetchGmailHistory blocked — no subscription access", {
            userId: userTokens.user_id,
        });
        return { data: { history: [] } }; // soft stop
    }

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
    supabase: any,
    gmail: any,
    histories: any[],
    userTokens: any,
    filter: FilterConfig
) {
    const hasAccess = await canAccessPlan(userTokens.user_id, "free_trial");
    if (!hasAccess) {
        console.warn("🚫 processHistories blocked — subscription inactive", {
            userId: userTokens.user_id,
        });
        return;
    }

    for (const h of histories) {
        if (!h.messages) continue;

        for (const msg of h.messages) {
            let responseRowId: string | null = null;

            try {
                // ==================================================
                // STEP 0: ATOMIC CLAIM
                // ==================================================
                const { data: claim, error: claimError } = await supabase
                    .from("email_ai_responses")
                    .insert(
                        {
                            user_id: userTokens.user_id,
                            message_id: msg.id,
                            message_status: "processing",
                        },
                        {
                            onConflict: ["user_id", "message_id"],
                            ignoreDuplicates: true,
                        }
                    )
                    .select("id")
                    .maybeSingle();

                if (!claim) {
                    console.log(
                        `⚠️ Message ${msg.id} already claimed — skipping AI completely`
                    );
                    continue;
                }

                responseRowId = claim.id;

                // ==================================================
                // STEP 1: Fetch Gmail message
                // ==================================================
                const fullMessage = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id!,
                    format: "full",
                });

                const email = parseGmailMessage(fullMessage.data);

                // ==================================================
                // STEP 3: AI analysis (ONLY ONE CALL EVER)
                // ==================================================
                const analysis = await analyzeEmailWithAI({
                    sender: email.from,
                    subject: email.subject,
                    body: email.body,
                    filter,
                });

                const finalScore = calculateFinalScore(analysis, filter)
                console.log('filter score', filter.min_score_for_telegram)
                console.log('analysis result',analysis.emailAnalysis.messageScore, finalScore, analysis.emailAnalysis.categories)

                // ==================================================
                // STEP 4: FINALIZE ROW
                // ==================================================
                await supabase
                    .from("email_ai_responses")
                    .update({
                        message_status: "completed",
                        reply_message: analysis.emailAnalysis.replyMessage,
                        calendar: analysis.emailAnalysis.calendarEvent,
                        message_score: finalScore,
                        flagged_keywords: analysis.emailAnalysis.keywordsFlagged,
                        usage_tokens: analysis.usageTokens ?? null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", responseRowId);


                // ==================================================
                // STEP 5: Telegram
                // ==================================================
                if (finalScore < filter.min_score_for_telegram)
                {
                    console.log(`message skipped for telegram, score below treshold:${finalScore} < ${filter.min_score_for_telegram}`)
                    return
                }
                    const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${msg.id}`;
                    const replyUserMessage =
                        `${analysis.emailAnalysis.replyMessage}\n\nView in Gmail: ${gmailLink}`;
                    const datelineDate = analysis.emailAnalysis.datelineDate;

                    // Build inline keyboard dynamically
                    const inlineKeyboard: { text: string; callback_data: string }[][] = [
                        [
                            { text: "🚨Remind Me", callback_data: `remind_me:${msg.id}:dateline:${datelineDate}` },
                        ],
                    ];

                    // Add "Add to Calendar" button if calendarEvent exists
                    if (analysis.emailAnalysis.calendarEvent) {
                        const { summary, start, end } = analysis.emailAnalysis.calendarEvent;
                        // Optional: encode event as JSON for callback_data, or just a unique identifier
                        const calendarCallback = `add_calendar:${msg.id}`; // you can handle this callback separately
                        inlineKeyboard[0].push({ text: "📅 Add to Calendar", callback_data: calendarCallback });
                    }

                    await sendTelegramMessage(
                        userTokens.user_id,
                        replyUserMessage,
                        {
                            reply_markup: {
                                inline_keyboard: inlineKeyboard,
                            },
                        }
                    );

                    console.log(
                        `✅ Sent Telegram for message ${msg.id} ( score=${finalScore})`
                    );
                


            } catch (err) {
                console.error("❌ Failed to process message", {
                    messageId: msg.id,
                    error: err,
                });

                // ==================================================
                // STEP 6: Mark failure (VERY IMPORTANT)
                // ==================================================
                if (responseRowId) {
                    await supabase
                        .from("email_ai_responses")
                        .update({
                            message_status: "failed",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", responseRowId);
                }
            }
        }
    }
}



function extractEmailSignals(email: any) {
    return {
        isFirstTimeSender: false, // replace with real logic if needed
        isThreadReply: email.isThreadReply,
        hasDeadline: /\b(due|deadline|by\s+\d{1,2}|\d{1,2}\/\d{1,2})\b/i.test(email.body),
        isSubscription: /\b(invoice|payment|billing|subscription|renewal)\b/i.test(email.body),
    };
}





const WATCH_RENEW_BUFFER_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function ensureValidWatch({
    gmail,
    supabase,
    userTokens,
}: {
    gmail: any;
    supabase: any;
    userTokens: any;
}) {
    const hasAccess = await canAccessPlan(userTokens.user_id, "free_trial");
    if (!hasAccess) {
        console.warn("🚫 Watch renewal blocked — subscription inactive", {
            userId: userTokens.user_id,
        });
        return userTokens.watch_history_id;
    }

    const now = Date.now();
    const expiration = Number(userTokens.watch_expiration || 0);

    const isExpired = expiration <= now;
    const isExpiringSoon = expiration - now <= 24 * 60 * 60 * 1000;

    if (!isExpired && !isExpiringSoon) {
        return userTokens.watch_history_id;
    }

    try {
        const res = await gmail.users.watch({
            userId: "me",
            requestBody: {
                topicName: process.env.GOOGLE_PUBSUB_TOPIC!,
                labelIds: ["INBOX"],
            },
        });

        const { historyId, expiration: newExpiration } = res.data;

        await supabase
            .from("user_gmail_tokens")
            .update({
                watch_history_id: historyId,
                watch_expiration: Number(newExpiration),
                updated_at: new Date().toISOString(),
            })
            .eq("email_address", userTokens.email_address);

        return historyId;
    } catch (err) {
        throw err;
    }
}


export async function getUserFilter(userId: string, filterId: string) {
    const supabase = await createClient({ useServiceRole: true });

    if (!filterId || filterId === "default") {
        return null; // no filter assigned or using default
    }

    const { data: filter, error } = await supabase
        .from("filters")
        .select("*")
        .eq("id", filterId)
        .eq("user_id", userId) // ensure filter belongs to the user
        .single();

    if (error) {
        console.error("❌ Failed to fetch user filter", { userId, filterId, error });
        return null;
    }

    return filter;
}

/**
 * Calculate final score for an email based on AI score and filter weights
 */
export function calculateFinalScore(
  analysis: EmailAnalysisResult,
  filter: FilterConfig
): number {
  const { messageScore, categories } = analysis.emailAnalysis;

  // 1️⃣ Message score contribution (50%)
  const messageScoreContribution = messageScore * 0.5;

  // 2️⃣ Primary category contribution
  let primaryScore = 0;
  if (categories.primary.subcategory.length > 0) {
    const sumPrimary = categories.primary.subcategory.reduce((sum, subKey) => {
      // @ts-ignore - filter has all subcategory keys
      return sum + (filter[subKey] ?? 0);
    }, 0);

    const avgPrimary = sumPrimary / categories.primary.subcategory.length;
    primaryScore = avgPrimary;
  }

  // 3️⃣ Secondary category contribution
  let secondaryScore = 0;
  if (categories.secondary.length > 0) {
    let sumSecondary = 0;
    let countSecondary = 0;

    categories.secondary.forEach(sec => {
      sec.subcategory.forEach(subKey => {
        // @ts-ignore
        sumSecondary += filter[subKey] ?? 0;
        countSecondary++;
      });
    });

    if (countSecondary > 0) {
      secondaryScore = (sumSecondary / countSecondary) * 0.15;
    }
  }

  // 4️⃣ If no secondary categories, primary contribution is 50% instead of 35%
  const primaryWeight = categories.secondary.length === 0 ? 0.5 : 0.35;
  const secondaryWeight = categories.secondary.length === 0 ? 0 : 0.15;

  const finalScore =
    messageScoreContribution +
    primaryScore * primaryWeight +
    secondaryScore; // secondaryScore already multiplied by 0.15 above

  return Math.min(finalScore, 100); // cap at 100
}
