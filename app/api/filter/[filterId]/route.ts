import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: any }
) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json(
            { error: "Authorization token required" },
            { status: 401 }
        );
    }

    const supabase = await createClientWithToken(token);

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

    const { filterId } = await params;

    if (!filterId) {
        return NextResponse.json(
            { error: "filterId is required" },
            { status: 400 }
        );
    }

    // 🔒 RLS-safe: filter by BOTH id and user_id
    const { data, error } = await supabase
        .from("filters")
        .select("*")
        .eq("id", filterId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        return NextResponse.json(
            { error: "Filter not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ filterId: string }> }
) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json(
            { error: "Authorization token required" },
            { status: 401 }
        );
    }

    const supabase = await createClientWithToken(token);
    const body = await req.json();

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

    // ✅ Await params (required in App Router)
    const { filterId } = await params;

    if (!filterId) {
        return NextResponse.json(
            { error: "filterId is required" },
            { status: 400 }
        );
    }

    // Explicit payload mapping
    const payload = {
        user_id: user.id,
        email_connection_id: body.email_connection_id,

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

        // Boolean toggles for main categories
        toggle_financial: body.toggle_financial,
        toggle_marketing: body.toggle_marketing,
        toggle_security: body.toggle_security,
        toggle_deadline: body.toggle_deadline,
        toggle_operational: body.toggle_operational,
        toggle_personal: body.toggle_personal,
        toggle_misc: body.toggle_misc,
        toggle_custom: body.toggle_custom,

        // Custom categories (JSON object)
        custom_categories: body.custom_categories, // should be an object like { birthday: 80, message_from_mom: 100 }

        // Minimum Telegram score
        min_score_for_telegram: body.min_score_for_telegram,
    };


    const { data, error } = await supabase
        .from("filters")
        .update(
            payload
        )
        .eq("id", filterId)
        .eq("user_id", user.id) // 🔒 RLS + ownership
        .select()
        .single();

    if (error || !data) {
        console.log('error', error)
        return NextResponse.json(
            { error: "Filter not found or update failed" },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ filterId: string }> }
) {
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

    // ✅ Await params (App Router requirement)
    const { filterId } = await params;

    if (!filterId) {
        return NextResponse.json(
            { error: "filterId is required" },
            { status: 400 }
        );
    }

    const { error } = await supabase
        .from("filters")
        .delete()
        .eq("id", filterId)
        .eq("user_id", user.id); // 🔒 ownership check

    if (error) {
        return NextResponse.json(
            { error: "Failed to delete filter" },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}