import { NextRequest, NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google";
import { createClient } from "@/lib/supabase/server"; // service role client
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Get Google OAuth code and userId from state
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-gmail?error=denied`
      );
    }

    // 2️⃣ Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("OAuth tokens received:", tokens);

    // 3️⃣ Create Supabase service-role client
    const supabase = await createClient({ useServiceRole: true });

    // 4️⃣ Upsert Gmail tokens (user may or may not exist yet)
    const { error: tokenError } = await supabase
      .from("user_gmail_tokens")
      .upsert(
        {
          user_id: userId,
          access_token: tokens.access_token ?? null,
          refresh_token: tokens.refresh_token ?? null,
          scope: tokens.scope ?? null,
          token_type: tokens.token_type ?? null,
          expiry_date: tokens.expiry_date ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (tokenError) {
      console.error("Failed to upsert Gmail tokens:", tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-gmail?error=server`
      );
    }

    // 5️⃣ Enable Gmail watch
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const watchRes = await gmail.users.watch({
        userId: "me",
        requestBody: {
          labelIds: ["INBOX"],
          topicName: process.env.GOOGLE_PUBSUB_TOPIC!,
        },
      });

      console.log("Gmail watch enabled:", watchRes.data);

      // 6️⃣ Persist watch metadata (CRITICAL)
      await supabase
        .from("user_gmail_tokens")
        .update({
          watch_history_id: watchRes.data.historyId,
          watch_expiration: watchRes.data.expiration, // ms timestamp
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } catch (watchErr) {
      // Do NOT block OAuth success
      console.error("Failed to enable Gmail watch:", watchErr);
    }

    // 7️⃣ Redirect back to UI
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connect-gmail?success=true`
    );
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connect-gmail?error=server`
    );
  }
}
