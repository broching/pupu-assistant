"use client";

import { ReactNode } from "react";
import type { PlanName } from "@/lib/subscription/types";
import { useSubscription } from "@/lib/subscription/client";
import { useUser } from "@/app/context/userContext";

interface SubscriptionGuardProps {
  requiredPlan?: PlanName;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Gates premium content: render children only if the user has at least the required plan.
 * Use requiredPlan="starter" | "plus" | "professional" for paid tiers; omit for "has any access".
 */
export function SubscriptionGuard({
  requiredPlan,
  fallback = null,
  children,
}: SubscriptionGuardProps) {
  const { session } = useUser();
  const { subscription, loading, hasAccess, canAccessPlan } = useSubscription(
    () => session?.access_token ?? undefined
  );

  if (loading) return null;
  if (!session) return <>{fallback}</>;

  const allowed = requiredPlan
    ? canAccessPlan(requiredPlan)
    : hasAccess;

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
