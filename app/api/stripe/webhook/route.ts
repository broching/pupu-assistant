import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  console.log("🔔 Stripe webhook received");

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ Missing stripe-signature header");
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const stripe = getStripe();
    const secret = getStripeWebhookSecret();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      console.log("✅ Webhook signature verified", {
        eventId: event.id,
        eventType: event.type,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Webhook signature verification failed:", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = await createClient({ useServiceRole: true });

    console.log("➡️ Handling Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        console.log("🧾 checkout.session.completed received");

        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || !session.subscription || !session.customer) {
          console.warn("⚠️ Session is not a subscription checkout, skipping", {
            mode: session.mode,
            subscription: session.subscription,
            customer: session.customer,
          });
          break;
        }

        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error("❌ Missing user_id in checkout session metadata", { sessionId: session.id });
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log("Subscriptions from stripe object:", subscription);

        const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
        const priceId = subscription.items.data[0]?.price.id;
        const planName = priceId ? mapPriceIdToPlan(priceId) : null;

        // Compute current period end based on interval and billing_cycle_anchor
        const currentPeriodEnd = calculateCurrentPeriodEnd(subscription);

        console.log("📦 Subscription details", {
          userId,
          customerId,
          subscriptionId: subscription.id,
          priceId,
          planName,
          status: subscription.status,
          currentPeriodEnd,
        });

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan_name: planName,
            status: subscription.status,
            current_period_end: currentPeriodEnd,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        console.log("✅ Subscription upserted successfully", { userId, subscriptionId: subscription.id });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        console.log(`🔄 ${event.type} received`);

        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscriptions from stripe object:", subscription);

        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (!row) {
          console.warn("⚠️ No local subscription found, skipping update", { subscriptionId: subscription.id, customerId });
          break;
        }

        console.log("subscription status:", subscription.cancel_at_period_end, subscription.cancel_at, subscription.canceled_at, subscription.cancellation_details);

        const currentPeriodEnd = calculateCurrentPeriodEnd(subscription);

        const updateData: {
          status: string;
          current_period_end: string | null;
          cancel_at: string | null;
          cancel_at_period_end: boolean;
          trial_end: string | null;
          updated_at: string;
          plan_name?: "starter" | "plus" | "professional";
        } = {
          status: subscription.status,
          current_period_end: currentPeriodEnd,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        };

        const priceId = subscription.items.data[0]?.price.id;
        if (priceId) updateData.plan_name = mapPriceIdToPlan(priceId);

        console.log("📝 Updating subscription", { userId: row.user_id, subscriptionId: subscription.id, status: subscription.status, priceId });

        await supabase.from("subscriptions").update(updateData).eq("user_id", row.user_id);

        console.log("✅ Subscription updated successfully", { userId: row.user_id });
        break;
      }

      default:
        console.warn("🤷 Unhandled Stripe event type", { eventType: event.type, eventId: event.id });
        break;
    }

    console.log("🏁 Stripe webhook handled successfully", { eventId: event.id, eventType: event.type });
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("🔥 Stripe webhook fatal error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Map price IDs to plan names
function mapPriceIdToPlan(priceId: string | undefined): "starter" | "plus" | "professional" {
  const starter = process.env.STRIPE_PRICE_STARTER;
  const plus = process.env.STRIPE_PRICE_PLUS;
  const professional = process.env.STRIPE_PRICE_PROFESSIONAL;

  if (priceId === starter) return "starter";
  if (priceId === plus) return "plus";
  if (priceId === professional) return "professional";

  console.warn("⚠️ Unknown priceId, falling back to starter", { priceId });
  return "starter";
}

/**
 * Calculate the current period end date based on billing_cycle_anchor and plan interval
 */
function calculateCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  try {
    const plan = subscription.items.data[0]?.plan;
    if (!plan || !subscription.billing_cycle_anchor) return null;

    const intervalCount = plan.interval_count || 1;
    const anchorDate = subscription.billing_cycle_anchor * 1000; // Stripe timestamp to ms

    let nextDate = new Date(anchorDate);

    switch (plan.interval) {
      case "day":
        nextDate.setDate(nextDate.getDate() + intervalCount);
        break;
      case "week":
        nextDate.setDate(nextDate.getDate() + intervalCount * 7);
        break;
      case "month":
        nextDate.setMonth(nextDate.getMonth() + intervalCount);
        break;
      case "year":
        nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
        break;
      default:
        break;
    }

    return nextDate.toISOString();
  } catch (err) {
    console.error("❌ Error calculating current_period_end", err);
    return null;
  }
}
