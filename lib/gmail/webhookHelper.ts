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
import { CustomCategoryResult, EmailAnalysisResult, FilterConfig } from "../geminiAI/geminiSchemas";
import { UUID } from "crypto";
import { CATEGORIES } from "../constants/emailCategories";

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
    filter: FilterConfig,
    result: any,
    customCategory: any,
    categoryData: any,
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
                    result,
                    customCategory,
                });

                const finalScore = calculateFinalScore(analysis, filter, categoryData)

                // ==================================================
                // STEP 4: FINALIZE ROW
                // ==================================================
                const { data, error } = await supabase
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
                if (finalScore < filter.min_score_for_telegram) {
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
                if (analysis.emailAnalysis.calendarEvent?.start && analysis.emailAnalysis.calendarEvent.end) {
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

type CategoryDataItem = {
    id: string;
    user_id: string;
    filter_id: string;
    connection_id: string;
    user_facing_category: string;
    category: string;
    description: string;
    weight: number;
    created_at: string;
    updated_at: string;
};

export function calculateFinalScore(
    analysis: EmailAnalysisResult,
    filter: FilterConfig,
    categoryData: CategoryDataItem[]
): number {
    const { messageScore, categories } = analysis.emailAnalysis;

    console.log("=== Email Analysis ===");
    console.log("Message Score:", messageScore);
    console.log("Subcategories:", categories);
    console.log("Category Data:", categoryData);

    // Helper to get the value of a subcategory safely
    function getCategoryValue(cat: string): number {
        // @ts-ignore - filter has all subcategory keys
        let value = filter[cat];

        if (value === undefined || typeof value !== "number") {
            const dataItem = categoryData.find((data) => data.category === cat);
            if (dataItem) {
                value = dataItem.weight;
            }
        }

        // Fallback to 0 if still undefined
        return typeof value === "number" ? value : 0;
    }

    // 1️⃣ Message score contribution (5%)
    const messageWeight = 0.05;
    const messageScoreContribution = messageScore * messageWeight;
    console.log(
        `Message Contribution: ${messageScore} × ${messageWeight} = ${messageScoreContribution}`
    );

    // 2️⃣ Primary category contribution
    let primaryScore = 0;
    if (categories.primary.length > 0) {
        console.log("--- Primary Categories ---");
        let sumPrimary = 0;
        for (const cat of categories.primary) {
            const value = getCategoryValue(cat);
            sumPrimary += value;
            console.log(`Subcategory: ${cat}, value: ${value}`);
        }
        primaryScore = sumPrimary / categories.primary.length;
        console.log(
            `Primary Score Average: ${sumPrimary} ÷ ${categories.primary.length} = ${primaryScore}`
        );
    }

    // 3️⃣ Secondary category contribution
    let secondaryScore = 0;
    if (categories.secondary.length > 0) {
        console.log("--- Secondary Categories ---");
        let sumSecondary = 0;
        for (const cat of categories.secondary) {
            const value = getCategoryValue(cat);
            sumSecondary += value;
            console.log(`Subcategory: ${cat}, value: ${value}`);
        }
        const secondaryWeight = 0.25;
        secondaryScore = (sumSecondary / categories.secondary.length) * secondaryWeight;
        console.log(
            `Secondary Score (weighted): (${sumSecondary} ÷ ${categories.secondary.length}) × ${secondaryWeight} = ${secondaryScore}`
        );
    }

    // 4️⃣ Determine primary weight
    const primaryWeight = categories.secondary.length === 0 ? 0.95 : 0.75;
    console.log(`Primary Weight: ${primaryWeight}`);

    // 5️⃣ Compute final score
    const finalScore =
        messageScoreContribution + primaryScore * primaryWeight + secondaryScore;
    console.log(
        `Final Score: Message(${messageScoreContribution}) + Primary(${primaryScore} × ${primaryWeight} = ${primaryScore * primaryWeight
        }) + Secondary(${secondaryScore}) = ${finalScore}`
    );

    return Math.round(Math.min(finalScore, 100));
}


export async function constructFilterObject(filter: any, userId: string) {
    const filteredCategories: Record<string, string> = {};

    const categoryGroups: Record<string, string[]> = {
        financial: [
            "financial_subscription_renewal",
            "financial_payment_receipt",
            "financial_refund_notice",
            "financial_invoice",
            "financial_failed_payment",
        ],
        marketing: [
            "marketing_newsletter",
            "marketing_promotion",
            "marketing_seasonal_campaign",
            "marketing_discount_offer",
            "marketing_product_update",
        ],
        security: [
            "security_alert",
            "security_login_alert",
            "security_mfa_change",
            "security_password_change",
            "security_suspicious_activity",
            "security_account_locked",
            "security_data_breach_notice",
            "security_permission_change",
            "security_recovery_email_change",
            "security_billing_fraud_alert",
        ],
        deadline: [
            "deadline_explicit_deadline",
            "deadline_event_invite",
            "deadline_subscription_cutoff",
            "deadline_billing_due_date",
        ],
        work: [
            "work_direct_message",
            "work_task_assigned",
            "work_deadline_or_approval",
            "work_client_communication",
            "work_meeting_request",
            "work_document_shared",
            "work_hr_or_management_notice",
            "work_system_or_access_issue",
        ],
        personal: [
            "personal_family_related",
            "personal_medical_appointment",
            "personal_travel_booking",
            "personal_flight_or_trip_update",
            "personal_delivery_update",
            "personal_event_invite",
            "personal_social_notification",
        ],
        legal: [
            "legal_contract_sent",
            "legal_contract_signed",
            "legal_terms_update",
            "legal_regulatory_notice",
            "legal_government_notice",
            "legal_tax_notice",
            "legal_court_notice",
            "legal_compliance_requirement",
        ],
    };

    // Helper to get description from CATEGORIES
    function getDescription(key: string) {
        for (const group of CATEGORIES) {
            const sub = group.subcategories.find(s => s.key === key);
            if (sub) return sub.explanation;
        }
        return "";
    }

    // Iterate over each category group and include only toggled ones
    for (const group in categoryGroups) {
        const toggleKey = `toggle_${group}` as keyof typeof filter;

        if (filter[toggleKey]) {
            const fields = categoryGroups[group];
            for (const field of fields) {
                filteredCategories[field] = getDescription(field);
            }
        }
    }
    const result: Record<string, any> = {};
    // Merge filtered categories (with descriptions only)
    for (const key in filteredCategories) {
        result[key] = filteredCategories[key];
    }

    // Get custom categories
    let customCategory: any[] = [];
    const supabase = await createClient({ useServiceRole: true });
    const { data: categoryData, error } = await supabase
        .from("custom_categories")
        .select("*")
        .eq("user_id", userId)
        .eq("filter_id", filter.id);

    if (Array.isArray(categoryData) && categoryData.length > 0) {
        categoryData.forEach(element => {
            customCategory.push({
                category: element.category,
                description: element.description,
            });
        });
    }
    return { result, customCategory, categoryData };
}


