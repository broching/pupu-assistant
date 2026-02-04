/**
 * Server-only Stripe config. Do not import in client components.
 */
import Stripe from "stripe";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return key;
}

export function getStripe(): Stripe {
  return new Stripe(getStripeSecretKey());
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return secret;
}

/** Stripe Price IDs for each paid tier (create in Stripe Dashboard) */
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  plus: process.env.STRIPE_PRICE_PLUS!,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL!,
} as const;

export type PlanName = keyof typeof STRIPE_PRICE_IDS | "free_trial";

export const PLAN_ORDER: PlanName[] = ["free_trial", "starter", "plus", "professional"];

export function getPriceIdForPlan(plan: "starter" | "plus" | "professional"): string {
  const id = STRIPE_PRICE_IDS[plan];
  if (!id) throw new Error(`STRIPE_PRICE_${plan.toUpperCase()} is not set`);
  return id;
}
