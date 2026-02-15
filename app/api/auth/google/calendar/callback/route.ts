import { NextRequest, NextResponse } from "next/server";
import { calenderOauth2Client, oauth2Client } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { encrypt } from "@/lib/encryption/helper";

export async function GET(req: NextRequest) {
  console.log("🔵 Calendar OAuth callback hit");

  try {
    /* ----------------------------------------
       1️⃣ Parse OAuth params + state
    ---------------------------------------- */
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateEncoded = searchParams.get("state");

    console.log("➡️ Query params received:", {
      hasCode: !!code,
      hasState: !!stateEncoded,
    });

    if (!code || !stateEncoded) {
      console.warn("❌ Missing code or state");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=calendar_denied`
      );
    }

    const decodedState = Buffer.from(stateEncoded, "base64").toString("utf-8");
    console.log("➡️ Decoded state:", decodedState);

    const { userId } = JSON.parse(decodedState);

    console.log("➡️ Extracted userId:", userId);

    if (!userId) {
      console.warn("❌ Invalid state payload");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=invalid_state`
      );
    }

    /* ----------------------------------------
       2️⃣ Exchange OAuth code for tokens
    ---------------------------------------- */
    console.log("🔄 Exchanging code for tokens...");

    const { tokens } = await calenderOauth2Client.getToken(code);

    console.log("✅ Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      scope: tokens.scope,
      expiry: tokens.expiry_date,
    });

    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.warn("❌ Missing required tokens");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=calendar_tokens`
      );
    }

    /* ----------------------------------------
       3️⃣ Fetch Google account email
    ---------------------------------------- */
    console.log("🔄 Fetching Google profile...");

    const oauth2 = google.oauth2("v2");

    const { data: profile } = await oauth2.userinfo.get({
      auth: oauth2Client,
    });

    console.log("✅ Google profile:", profile);

    const email = profile.email;

    if (!email) {
      console.warn("❌ No email returned from Google");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=no_email`
      );
    }

    /* ----------------------------------------
       4️⃣ Create Supabase service-role client
    ---------------------------------------- */
    console.log("🔄 Creating Supabase service role client...");
    const supabase = await createClient({ useServiceRole: true });

    /* ----------------------------------------
       5️⃣ Fetch subscription
    ---------------------------------------- */
    console.log("🔄 Checking subscription for user:", userId);

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan_name, status")
      .eq("user_id", userId)
      .single();

    console.log("➡️ Subscription result:", { subscription, subError });

    if (subError || !subscription) {
      console.warn("❌ No subscription found");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=no_subscription`
      );
    }

    if (
      subscription.status === "canceled" ||
      subscription.status === "past_due"
    ) {
      console.warn("❌ Subscription inactive:", subscription.status);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=inactive_plan`
      );
    }

    /* ----------------------------------------
       6️⃣ Encrypt tokens
    ---------------------------------------- */
    console.log("🔐 Encrypting tokens...");
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    /* ----------------------------------------
       7️⃣ Upsert calendar connection
    ---------------------------------------- */
    console.log("💾 Upserting calendar connection...");

    const { error: dbError } = await supabase
      .from("google_calendar_connections")
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
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("❌ DB upsert error:", dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=server`
      );
    }

    console.log("✅ Calendar connection stored successfully");

    /* ----------------------------------------
       8️⃣ Redirect back
    ---------------------------------------- */
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?calendar=connected`
    );
  } catch (err: any) {
    console.error("🔥 Calendar OAuth callback error:");
    console.error("Message:", err?.message);
    console.error("Code:", err?.code);
    console.error("Status:", err?.status);

    if (err?.response) {
      console.error("Google response status:", err.response.status);
      console.error("Google response data:", err.response.data);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=calendar_failed`
    );
  }
}
