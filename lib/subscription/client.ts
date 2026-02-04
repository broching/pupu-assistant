"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionState, PlanName } from "./types";

const PLAN_ORDER: PlanName[] = ["free_trial", "starter", "plus", "professional"];

export function useSubscription(getAccessToken: string | undefined) {
  const [state, setState] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    const token = getAccessToken;
    if (!token) {
      setState(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setState(null);
        return;
      }
      const data = (await res.json()) as SubscriptionState;
      setState(data);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasAccess = state?.hasAccess ?? false;
  const canAccessPlan = useCallback(
    (requiredPlan: PlanName) => {
      if (!state) return false;
      const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
      const userIndex = PLAN_ORDER.indexOf(state.planName);
      if (state.status === "canceled" || state.status === "past_due")
        return requiredPlan === "free_trial";
      return userIndex >= requiredIndex;
    },
    [state]
  );

  return {
    subscription: state,
    loading,
    hasAccess,
    canAccessPlan,
    refetch: fetchSubscription,
  };
}
