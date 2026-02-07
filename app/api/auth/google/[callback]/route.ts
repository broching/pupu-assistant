import { NextRequest, NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { encrypt } from "@/lib/encryption/helper";

const GMAIL_LIMITS: Record<string, number> = {
  free_trial: 1,
  starter: 1,
  plus: 3,
  professional: Infinity,
};

export async function GET(req: NextRequest) {
  try {
    /* ----------------------------------------
       1️⃣ Parse OAuth params + state
    ---------------------------------------- */
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateEncoded = searchParams.get("state");

    if (!code || !stateEncoded) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=denied`
      );
    }

    const { userId } = JSON.parse(
      Buffer.from(stateEncoded, "base64").toString("utf-8")
    );

    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=invalid_state`
      );
    }

    /* ----------------------------------------
       2️⃣ Exchange OAuth code for tokens
    ---------------------------------------- */
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    /* ----------------------------------------
       3️⃣ Fetch Google account email
    ---------------------------------------- */
    const oauth2 = google.oauth2("v2");
    const { data: profile } = await oauth2.userinfo.get({
      auth: oauth2Client,
    });

    const email = profile.email;
    if (!email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=no_email`
      );
    }

    /* ----------------------------------------
       4️⃣ Create Supabase service-role client
    ---------------------------------------- */
    const supabase = await createClient({ useServiceRole: true });

    /* ----------------------------------------
       5️⃣ Fetch subscription (AUTHORITATIVE)
    ---------------------------------------- */
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan_name, status")
      .eq("user_id", userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=no_subscription`
      );
    }

    if (
      subscription.status === "canceled" ||
      subscription.status === "past_due"
    ) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=inactive_plan`
      );
    }

    const planName = subscription.plan_name;
    const gmailLimit = GMAIL_LIMITS[planName] ?? 1;

    /* ----------------------------------------
       6️⃣ Count existing Gmail connections
    ---------------------------------------- */
    const { count, error: countError } = await supabase
      .from("user_gmail_tokens")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("Failed to count Gmail connections:", countError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=server`
      );
    }

    if (gmailLimit !== Infinity && (count ?? 0) >= gmailLimit) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=limit_reached`
      );
    }

    /* ----------------------------------------
       7️⃣ Upsert Gmail tokens (SAFE)
    ---------------------------------------- */
    const encryptedAccessToken= encrypt(tokens?.access_token?? "")
    const encryptedRefreshToken = encrypt(tokens?.refresh_token?? "")
    const { error: tokenError } = await supabase
      .from("user_gmail_tokens")
      .upsert(
        {
          user_id: userId,
          email_address: email,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          scope: tokens.scope ?? null,
          token_type: tokens.token_type ?? null,
          expiry_date: tokens.expiry_date ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,email_address" }
      );

    if (tokenError) {
      console.error("Failed to upsert Gmail tokens:", tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=server`
      );
    }

    /* ----------------------------------------
       8️⃣ Enable Gmail watch (non-blocking)
    ---------------------------------------- */
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const watchRes = await gmail.users.watch({
        userId: "me",
        requestBody: {
          labelIds: ["INBOX"],
          topicName: process.env.GOOGLE_PUBSUB_TOPIC!,
        },
      });

      await supabase
        .from("user_gmail_tokens")
        .update({
          watch_history_id: watchRes.data.historyId,
          watch_expiration: watchRes.data.expiration,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("email_address", email);
    } catch (watchErr) {
      // Never block OAuth success
      console.error("Failed to enable Gmail watch:", watchErr);
    }

    /* ----------------------------------------
       9️⃣ Redirect back to UI
    ---------------------------------------- */
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?success=true`
    );
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=server`
    );
  }
}
