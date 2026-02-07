/**
 * Server-only subscription helpers. Use in API routes and Server Components.
 */
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionRow, SubscriptionState, PlanName } from "./types";

const TRIAL_DAYS = 14;
const PLAN_HIERARCHY: PlanName[] = ["free_trial", "starter", "plus", "professional"];

export async function getSubscription(
  userId: string
): Promise<SubscriptionState | null> {
  const supabase = await createClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as SubscriptionRow;
  return rowToState(row);
}

function rowToState(row: SubscriptionRow): SubscriptionState {
  const now = new Date();
  const trialEnd = row.trial_end ? new Date(row.trial_end) : null;
  const currentPeriodEnd = row.current_period_end
    ? new Date(row.current_period_end)
    : null;

  const isTrialing =
    row.status === "trialing" && trialEnd !== null && trialEnd > now;
  const isActivePaid =
    (row.status === "active" || row.status === "trialing") &&
    row.plan_name !== "free_trial";
  const isActive =
    row.status === "active" ||
    isTrialing ||
    (row.status === "trialing" && row.plan_name === "free_trial" && trialEnd !== null && trialEnd > now);

  const hasAccess =
    row.status === "active" ||
    (row.status === "trialing" && (isTrialing || row.plan_name !== "free_trial")) ||
    (row.plan_name === "free_trial" && isTrialing);

  return {
    planName: row.plan_name,
    status: row.status,
    isTrialing,
    isActive:
      row.status === "active" ||
      (row.status === "trialing" && (isTrialing || isActivePaid)),
    trialEnd: row.trial_end,
    currentPeriodEnd: row.current_period_end,
    hasAccess,
    cancel_at: row.cancel_at
  };
}

/** Check if user has at least the required plan level (for gating features). */
export async function canAccessPlan(
  userId: string,
  requiredPlan: PlanName
): Promise<boolean> {
  const state = await getSubscription(userId);
  if (!state) return false;
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  const userIndex = PLAN_HIERARCHY.indexOf(state.planName);
  if (state.planName === "free_trial" && state.isTrialing)
    return requiredPlan === "free_trial";
  if (state.status === "canceled" || state.status === "past_due")
    return false;
  return userIndex >= requiredIndex;
}

export async function getSubscriptionRow(
  userId: string
): Promise<SubscriptionRow | null> {
  const supabase = await createClient({ useServiceRole: true });
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as SubscriptionRow | null;
}

export { TRIAL_DAYS, PLAN_HIERARCHY };
