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
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=denied`
      );
    }

    const { userId } = JSON.parse(
      Buffer.from(stateEncoded, "base64").toString("utf-8")
    );

    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=invalid_state`
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
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=no_email`
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
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=no_subscription`
      );
    }

    if (
      subscription.status === "canceled" ||
      subscription.status === "past_due"
    ) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=inactive_plan`
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
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=server`
      );
    }

    if (gmailLimit !== Infinity && (count ?? 0) >= gmailLimit) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=limit_reached`
      );
    }

    /* ----------------------------------------
       7️⃣ Upsert Gmail tokens (SAFE)
    ---------------------------------------- */
    const encryptedAccessToken = encrypt(tokens?.access_token ?? "")
    const encryptedRefreshToken = encrypt(tokens?.refresh_token ?? "")
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
        `${process.env.NEXT_PUBLIC_APP_URL}/account?error=server`
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

      const { data, error } = await supabase
        .from("user_gmail_tokens")
        .update(
          {
            watch_history_id: watchRes.data.historyId,
            watch_expiration: watchRes.data.expiration,
            updated_at: new Date().toISOString(),
          },
        )
        .eq("user_id", userId)
        .eq("email_address", email)
        .select("*");

      if (error) {
        console.error("Failed to update Gmail token:", error);
        // handle error or throw
      }

      // `data` is always an array of updated rows
      const updatedId = data?.[0]?.id;

      if (!updatedId) {
        throw new Error("Failed to get updated row id");
      }

      // create filter and link to connection

      const payload = {
        user_id: data?.[0]?.user_id,
        email_connection_id: updatedId,

        // Category Toggles
        toggle_financial: false,
        toggle_marketing: false,
        toggle_security: false,
        toggle_deadline: false,
        toggle_work: false,
        toggle_personal: false,
        toggle_legal: false,
        toggle_custom: false,

        // =========================
        // Financial
        // =========================
        financial_subscription_renewal: 50,
        financial_payment_receipt: 50,
        financial_refund_notice: 50,
        financial_invoice: 50,
        financial_failed_payment: 50,

        // =========================
        // Marketing
        // =========================
        marketing_newsletter: 50,
        marketing_promotion: 50,
        marketing_seasonal_campaign: 50,
        marketing_discount_offer: 50,
        marketing_product_update: 50,

        // =========================
        // Security (Expanded)
        // =========================
        security_alert: 50,
        security_login_alert: 50,
        security_mfa_change: 50,
        security_password_change: 50,
        security_suspicious_activity: 50,
        security_account_locked: 50,
        security_data_breach_notice: 50,
        security_permission_change: 50,
        security_recovery_email_change: 50,
        security_billing_fraud_alert: 50,

        // =========================
        // Deadline
        // =========================
        deadline_explicit_deadline: 50,
        deadline_event_invite: 50,
        deadline_subscription_cutoff: 50,
        deadline_billing_due_date: 50,

        // =========================
        // Work
        // =========================
        work_direct_message: 50,
        work_task_assigned: 50,
        work_deadline_or_approval: 50,
        work_client_communication: 50,
        work_meeting_request: 50,
        work_document_shared: 50,
        work_hr_or_management_notice: 50,
        work_system_or_access_issue: 50,

        // =========================
        // Personal (Redesigned)
        // =========================
        personal_family_related: 50,
        personal_medical_appointment: 50,
        personal_travel_booking: 50,
        personal_flight_or_trip_update: 50,
        personal_delivery_update: 50,
        personal_event_invite: 50,
        personal_social_notification: 50,

        // =========================
        // Legal & Government
        // =========================
        legal_contract_sent: 50,
        legal_contract_signed: 50,
        legal_terms_update: 50,
        legal_regulatory_notice: 50,
        legal_government_notice: 50,
        legal_tax_notice: 50,
        legal_court_notice: 50,
        legal_compliance_requirement: 50,

        custom_categories: {},
        min_score_for_telegram: 50
      };

      const { data: filterData, error: filterError } = await supabase
        .from("filters")
        .insert(payload)
        .select()
        .single();

      if (filterError) {
        return NextResponse.json({ error: filterError.message }, { status: 400 });
      }


      console.log('filter created successfully', filterData)

      // update gmail connections to insert the filter_id
      const { error: connectionError } = await supabase
        .from("user_gmail_tokens")
        .update(
          {
            filter_id: filterData.id
          },
        )
        .eq("user_id", userId)
        .eq("email_address", email)
        .select("*");

      if (connectionError) {
        console.error("Failed to update Gmail token with filterID:", connectionError);
        // handle error or throw
      }

      /* ----------------------------------------
        9️⃣ Redirect back to UI
      ---------------------------------------- */
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations/${updatedId}/edit?success=true`
      );


    } catch (watchErr) {
      // Never block OAuth success
      console.error("Failed to enable Gmail watch:", watchErr);
    }


  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/account?error=server`
    );
  }
}
