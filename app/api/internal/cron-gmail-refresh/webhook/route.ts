import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { decrypt } from "@/lib/encryption/helper";

/* ------------------------------
   QStash Cron Webhook Handler
------------------------------ */
export async function POST(req: NextRequest) {
    try {
        // 1️⃣ Read raw body as text
        const body = await req.text();

        // 2️⃣ Verify QStash signature
        const signature = req.headers.get("upstash-signature");
        if (!signature) {
            return NextResponse.json({ error: "Missing Upstash-Signature header" }, { status: 400 });
        }

        const receiver = new Receiver({
            currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
            nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
        });

        const expectedUrl = "https://kolten-precloacal-tempie.ngrok-free.dev/api/internal/cron-gmail-refresh/webhook";
        const isValid = await receiver.verify({ body, signature, url: expectedUrl });
        if (!isValid) {
            console.error("❌ Invalid QStash signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        console.log("✅ Verified QStash webhook:");

        // 4️⃣ Initialize Supabase
        const supabase = await createClient({ useServiceRole: true });

        // 5️⃣ Fetch all active subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("status", "active");

        if (subError) {
            console.error("Failed to fetch subscriptions:", subError);
            return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log("No active subscriptions found.");
            return NextResponse.json({ message: "No active subscriptions" });
        }

        // 6️⃣ Loop through each active user
        for (const sub of subscriptions) {
            const userId = sub.user_id;

            // Fetch Gmail connections for this user
            const { data: gmailConnections, error: gmailError } = await supabase
                .from("user_gmail_tokens")
                .select("*")
                .eq("user_id", userId);

            if (gmailError) {
                console.error(`Failed to fetch Gmail tokens for user ${userId}:`, gmailError);
                continue; // skip this user
            }

            if (!gmailConnections || gmailConnections.length === 0) {
                console.log(`No Gmail connections for user ${userId}`);
                continue;
            }

            // Loop through each Gmail connection
            for (const gmailToken of gmailConnections) {
                try {
                    // Decrypt tokens
                    const access_token = decrypt(gmailToken.access_token);
                    const refresh_token = decrypt(gmailToken.refresh_token);

                    // Set OAuth credentials
                    oauth2Client.setCredentials({
                        access_token,
                        refresh_token,
                        scope: gmailToken.scope,
                        token_type: gmailToken.token_type,
                        expiry_date: gmailToken.expiry_date,
                    });

                    // Re-enable Gmail watch
                    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
                    await gmail.users.watch({
                        userId: "me",
                        requestBody: {
                            labelIds: ["INBOX"],
                            topicName: process.env.GOOGLE_PUBSUB_TOPIC!, // Your Pub/Sub topic for Gmail push notifications
                        },
                    });

                    console.log(`✅ Gmail watch re-enabled for ${gmailToken.email_address}`);
                } catch (err) {
                    console.error(`Failed to enable watch for ${gmailToken.email_address}:`, err);
                }
            }
        }

        return NextResponse.json({ message: "Gmail watches refreshed for all active users" });
    } catch (err) {
        console.error("❌ Error handling QStash webhook:", err);
        return NextResponse.json({ error: "Failed to handle webhook" }, { status: 500 });
    }
}
