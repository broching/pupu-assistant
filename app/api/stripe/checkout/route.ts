import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { getStripe, getPriceIdForPlan } from "@/lib/stripe/config";
import { getAppBaseUrl } from "@/lib/utils/appUrl";

type CheckoutBody = {
  priceId?: string;
  plan?: "starter" | "plus" | "professional";
  url_from?: "billing" | "pricing"; // new field
};

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

    const body = (await req.json()) as CheckoutBody;
    const plan = body.plan;
    const priceId =
      body.priceId ?? (plan ? getPriceIdForPlan(plan) : undefined);

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing priceId or plan" },
        { status: 400 }
      );
    }

    const urlFrom = body.url_from ?? "pricing"; // default to pricing
    const baseUrl = getAppBaseUrl();

    // Set success and cancel URLs depending on where checkout was initiated
    const successUrl =
      urlFrom === "billing"
        ? `${baseUrl}/billing`
        : `${baseUrl}/pricing?success=1`;

    const cancelUrl =
      urlFrom === "billing"
        ? `${baseUrl}/billing`
        : `${baseUrl}/pricing?canceled=1`;

    const supabase = await createClient({ useServiceRole: true });
    const stripe = getStripe();

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const sessionParams: {
      mode: "subscription";
      line_items: { price: string; quantity: number }[];
      success_url: string;
      cancel_url: string;
      customer_email?: string;
      customer?: string;
      subscription_data?: { trial_period_days?: number };
      metadata?: { user_id: string };
    } = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id },
    };

    if (subRow?.stripe_customer_id) {
      sessionParams.customer = subRow.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email ?? undefined;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
