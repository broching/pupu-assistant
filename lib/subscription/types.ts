export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "past_due";

export type PlanName =
  | "free_trial"
  | "starter"
  | "plus"
  | "professional";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: PlanName;
  status: SubscriptionStatus;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  cancel_at: string | null;
}

export interface SubscriptionState {
  planName: PlanName;
  status: SubscriptionStatus;
  isTrialing: boolean;
  isActive: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  /** True if user has access to paid features (trialing or active paid plan) */
  hasAccess: boolean;
  cancel_at: string | null;
}
