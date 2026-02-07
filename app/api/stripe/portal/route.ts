import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { getStripe } from "@/lib/stripe/config";
import { getAppBaseUrl } from "@/lib/utils/appUrl";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authClient = await createClientWithToken(token);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient({ useServiceRole: true });
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subRow?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const baseUrl = getAppBaseUrl();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
