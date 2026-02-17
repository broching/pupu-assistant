
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 }
    );
  }

  const supabase = await createClientWithToken(token);
  const body = await req.json();

  // 🔐 Get authenticated user from token
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // Explicit payload mapping
  const payload = {
    user_id: user.id,
    filter_name: body.filter_name,
    email_connection_id: body.email_connection_id,
    notification_mode: body.notification_mode,
    watch_tags: body.watch_tags,
    ignore_tags: body.ignore_tags,

    // Financial / Payments
    financial_subscription_renewal: body.financial_subscription_renewal,
    financial_payment_receipt: body.financial_payment_receipt,
    financial_refund_notice: body.financial_refund_notice,
    financial_invoice: body.financial_invoice,
    financial_failed_payment: body.financial_failed_payment,

    // Marketing / Promotions
    marketing_newsletter: body.marketing_newsletter,
    marketing_promotion: body.marketing_promotion,
    marketing_seasonal_campaign: body.marketing_seasonal_campaign,
    marketing_discount_offer: body.marketing_discount_offer,
    marketing_product_update: body.marketing_product_update,

    // Security / Account
    security_alert: body.security_alert,
    security_login_alert: body.security_login_alert,
    security_mfa_change: body.security_mfa_change,

    // Deadlines / Important Dates
    deadline_explicit_deadline: body.deadline_explicit_deadline,
    deadline_event_invite: body.deadline_event_invite,
    deadline_subscription_cutoff: body.deadline_subscription_cutoff,
    deadline_billing_due_date: body.deadline_billing_due_date,

    // Operational / Notifications
    operational_system_update: body.operational_system_update,
    operational_service_outage: body.operational_service_outage,
    operational_delivery_status: body.operational_delivery_status,
    operational_support_ticket_update: body.operational_support_ticket_update,

    // Personal / Social
    personal_direct_message: body.personal_direct_message,
    personal_meeting_request: body.personal_meeting_request,
    personal_social_media_notification: body.personal_social_media_notification,
    personal_event_reminder: body.personal_event_reminder,

    // Miscellaneous / Other
    misc_survey_request: body.misc_survey_request,
    misc_feedback_request: body.misc_feedback_request,
    misc_legal_notice: body.misc_legal_notice,
    misc_internal_communication: body.misc_internal_communication,

    // Minimum Telegram score
    min_score_for_telegram: body.min_score_for_telegram
  };

  const { data, error } = await supabase
    .from("filters")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}


export async function GET(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 }
    );
  }

  const supabase = await createClientWithToken(token);

  // 🔐 Get authenticated user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("filters")
    .select("*")
    .eq("user_id", user.id) // ✅ explicit user scoping
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
