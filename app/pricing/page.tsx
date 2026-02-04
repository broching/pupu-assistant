"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/app/context/userContext";
import type { PlanName } from "@/lib/subscription/types";
import { useSubscription } from "@/lib/subscription/client";
import PricingQnA from "@/components/qna/PricingQnA";

const PLANS = [
  {
    id: "free_trial" as PlanName,
    name: "Free Trial",
    price: "$0",
    period: "14 days",
    description: "Full access for 14 days, no payment required.",
    features: ["All features", "14-day trial", "No credit card"],
  },
  {
    id: "starter" as PlanName,
    name: "Starter",
    price: "$1.99",
    period: "/month",
    description: "For light usage.",
    features: ["Everything in Free", "Email notifications", "1 Gmail connection"],
  },
  {
    id: "plus" as PlanName,
    name: "Plus",
    price: "$4.99",
    period: "/month",
    description: "For regular use.",
    features: ["Everything in Starter", "Priority support", "3 Gmail connections"],
  },
  {
    id: "professional" as PlanName,
    name: "Professional",
    price: "$9.99",
    period: "/month",
    description: "For power users.",
    features: ["Everything in Plus", "Unlimited connections", "Advanced filters"],
  },
];

const PLAN_ORDER: PlanName[] = [
  "free_trial",
  "starter",
  "plus",
  "professional",
];

function TrialCountdown({ trialEnd }: { trialEnd: string }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    const end = new Date(trialEnd);

    const update = () => {
      const now = new Date();
      if (now >= end) {
        setLeft("Trial ended");
        return;
      }
      const d = Math.floor(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const h = Math.floor(
        ((end.getTime() - now.getTime()) %
          (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
      );
      setLeft(`${d}d ${h}h left`);
    };

    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [trialEnd]);

  return (
    <p className="text-sm text-muted-foreground">
      Trial ends in{" "}
      <span className="font-medium text-foreground">{left}</span>
    </p>
  );
}

export default function PricingPage() {
  const searchParams = useSearchParams();
  const { user, session } = useUser();
  const { subscription } = useSubscription(session?.access_token);

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription started. Thank you!");
    }
    if (searchParams.get("canceled") === "1") {
      toast.info("Checkout canceled.");
    }
  }, [searchParams]);

  /* ----------------------------------------
     Subscription state logic (CORRECT)
  ---------------------------------------- */

  const hasEverPaid =
    !!subscription?.planName && subscription.planName !== "free_trial";

  const isCanceledAndExpired =
    subscription?.status === "canceled" && !subscription?.hasAccess;

  const effectivePlan: PlanName | null =
    subscription?.hasAccess ? subscription.planName : null;

  const currentIndex =
    effectivePlan !== null ? PLAN_ORDER.indexOf(effectivePlan) : -1;

  const isCurrentPlan = (id: PlanName) => effectivePlan === id;

  /**
   * CRITICAL FIX:
   * Trial can only be "used" if the user is logged in
   */
  const trialAlreadyUsed =
    !!user &&
    !!subscription &&
    (subscription.planName !== "free_trial" ||
      subscription.status === "canceled");

  /* ----------------------------------------
     Stripe actions
  ---------------------------------------- */

  const handleCheckout = async (
    plan: "starter" | "plus" | "professional"
  ) => {
    if (!session?.access_token) {
      toast.error("Please sign in to subscribe.");
      return;
    }

    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    if (!session?.access_token) return;
    setPortalLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portal failed");

      window.location.href = data.url;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not open billing portal"
      );
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center" style={{ maxWidth: "100rem" }} >
      <div className="w-full mt-10">
        {/* =============================
           HEADER
        ============================== */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>

          {!hasEverPaid && (
            <p className="mt-2 text-muted-foreground">
              Start with a 14-day free trial. No credit card required.
            </p>
          )}

          {user && subscription && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Badge variant="secondary">
                Current plan:{" "}
                {effectivePlan
                  ? PLANS.find((p) => p.id === effectivePlan)?.name
                  : "No active plan"}
              </Badge>

              {isCanceledAndExpired && hasEverPaid && (
                <p className="text-sm text-muted-foreground">
                  Previously on{" "}
                  <span className="font-medium">
                    {PLANS.find((p) => p.id === subscription.planName)?.name}
                  </span>
                </p>
              )}

              {subscription.isTrialing && subscription.trialEnd && (
                <TrialCountdown trialEnd={subscription.trialEnd} />
              )}

              {effectivePlan && effectivePlan !== "free_trial" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? "Opening…" : "Manage Billing"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* =============================
           PLAN CARDS
        ============================== */}
        <div className="flex justify-center">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isPaid = plan.id !== "free_trial";

              const isUpgrade =
                isPaid &&
                currentIndex >= 0 &&
                PLAN_ORDER.indexOf(plan.id) > currentIndex;

              const isDowngrade =
                isPaid &&
                currentIndex >= 0 &&
                PLAN_ORDER.indexOf(plan.id) < currentIndex;

              return (
                <Card
                  key={plan.id}
                  className={
                    isCurrentPlan(plan.id)
                      ? "border-primary shadow-md"
                      : plan.id === "free_trial" && trialAlreadyUsed
                        ? "opacity-60"
                        : ""
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>

                      {isCurrentPlan(plan.id) && (
                        <Badge className="text-xs">Current</Badge>
                      )}

                      {plan.id === "free_trial" && trialAlreadyUsed && (
                        <Badge variant="outline" className="text-xs">
                          Used
                        </Badge>
                      )}
                    </div>

                    <CardDescription>{plan.description}</CardDescription>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="text-primary">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    {!user ? (
                      <Button asChild className="w-full">
                        <Link href="/auth/sign-up">Get started</Link>
                      </Button>
                    ) : plan.id === "free_trial" ? (
                      <Button className="w-full" disabled>
                        Trial already used
                      </Button>
                    ) : isCurrentPlan(plan.id) ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Current plan
                      </Button>
                    ) : isUpgrade ? (
                      <Button
                        className="w-full"
                        onClick={() =>
                          handleCheckout(
                            plan.id as "starter" | "plus" | "professional"
                          )
                        }
                        disabled={checkoutLoading !== null}
                      >
                        Upgrade
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handlePortal}
                        disabled={portalLoading}
                      >
                        Downgrade in portal
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() =>
                          handleCheckout(
                            plan.id as "starter" | "plus" | "professional"
                          )
                        }
                        disabled={checkoutLoading !== null}
                      >
                        Subscribe
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="gap mt-5">

        </div>
        <PricingQnA />
      </div>
    </div>
  );
}


