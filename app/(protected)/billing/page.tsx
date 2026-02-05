"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "../../context/userContext";
import { useSubscription } from "@/lib/subscription/client";
import { ContentLayout } from "@/components/admin-panel/content-layout";

const PLANS = [
    {
        id: "starter",
        name: "Starter",
        price: "$1.99 / month",
        description: "For individuals getting started",
        features: ["Basic access", "Email support"],
    },
    {
        id: "plus",
        name: "Plus",
        price: "$4.99 / month",
        description: "For growing users",
        features: ["Everything in Starter", "Priority support"],
    },
    {
        id: "professional",
        name: "Professional",
        price: "$9.99 / month",
        description: "For power users & teams",
        features: ["Everything in Plus", "Advanced features"],
    },
];

export default function BillingPage() {
    const { session } = useUser();
    const { subscription, loading } = useSubscription(session?.access_token);

    const [portalLoading, setPortalLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    /* ----------------------------------------
       Billing state logic (IMPORTANT)
    ---------------------------------------- */

    const hasEverPaid =
        !!subscription?.planName &&
        subscription.planName !== "free_trial";

    const isCanceledAndExpired =
        subscription?.status === "canceled" && !subscription?.hasAccess;

    const effectivePlan = subscription?.hasAccess
        ? subscription.planName
        : isCanceledAndExpired && hasEverPaid
            ? null
            : "free_trial";

    /* ----------------------------------------
       Stripe actions
    ---------------------------------------- */

    const handlePortal = async () => {
        if (!session?.access_token) return;
        setPortalLoading(true);

        try {
            const res = await fetch("/api/stripe/portal", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
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
            toast.error(
                e instanceof Error ? e.message : "Checkout failed"
            );
        } finally {
            setCheckoutLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="container py-20 text-center text-muted-foreground">
                Loading billing details…
            </div>
        );
    }

    return (
        <ContentLayout title="Billing">
            <div className="container py-20 flex justify-center">
                <div className="w-full max-w-5xl space-y-8">

                    {/* =============================
                   CURRENT PLAN
                ============================== */}
                    <Card className="relative overflow-hidden text-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-transparent" />

                        <CardHeader className="relative space-y-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Current Plan
                            </CardTitle>

                            <div className="text-3xl font-bold capitalize tracking-tight">
                                {effectivePlan
                                    ? effectivePlan.replace("_", " ")
                                    : "No active plan"}
                            </div>

                            <div className="flex justify-center">
                                <Badge
                                    className={
                                        subscription?.status === "active"
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                            : subscription?.status === "trialing"
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                                : subscription?.status === "canceled"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                    : "bg-muted text-muted-foreground"
                                    }
                                >
                                    {effectivePlan
                                        ? subscription?.status
                                        : "inactive"}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="relative space-y-3">
                            {effectivePlan && (
                                subscription?.cancel_at ? (
                                    <p className="text-sm text-muted-foreground">
                                        Cancels on{" "}
                                        <span className="font-medium text-foreground">
                                            {new Date(
                                                subscription.cancel_at
                                            ).toLocaleDateString()}
                                        </span>
                                    </p>
                                ) : subscription?.currentPeriodEnd ? (
                                    <p className="text-sm text-muted-foreground">
                                        Renews on{" "}
                                        <span className="font-medium text-foreground">
                                            {new Date(
                                                subscription.currentPeriodEnd
                                            ).toLocaleDateString()}
                                        </span>
                                    </p>
                                ) : null
                            )}

                            {isCanceledAndExpired && hasEverPaid && (
                                <p className="text-xs text-muted-foreground">
                                    Previously on{" "}
                                    <span className="font-medium capitalize">
                                        {subscription?.planName.replace("_", " ")}
                                    </span>
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* =============================
                   PLANS
                ============================== */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">
                                Choose a plan
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            {PLANS.map((plan) => {
                                const isCurrent =
                                    effectivePlan === plan.id;

                                return (
                                    <Card
                                        key={plan.id}
                                        className={`relative ${isCurrent
                                            ? "border-primary"
                                            : "border-border"
                                            }`}
                                    >
                                        <CardContent className="p-5 space-y-4 text-center">
                                            {isCurrent && (
                                                <Badge className="absolute top-3 right-3">
                                                    Current
                                                </Badge>
                                            )}

                                            <h3 className="text-lg font-semibold">
                                                {plan.name}
                                            </h3>

                                            <p className="text-2xl font-bold">
                                                {plan.price}
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                {plan.description}
                                            </p>

                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                {plan.features.map((f) => (
                                                    <li key={f}>• {f}</li>
                                                ))}
                                            </ul>

                                            <Button
                                                className="w-full"
                                                variant={
                                                    isCurrent
                                                        ? "secondary"
                                                        : "default"
                                                }
                                                disabled={
                                                    isCurrent ||
                                                    checkoutLoading === plan.id
                                                }
                                                onClick={() =>
                                                    handleCheckout(
                                                        plan.id as
                                                        | "starter"
                                                        | "plus"
                                                        | "professional"
                                                    )
                                                }
                                            >
                                                {isCurrent
                                                    ? "Current Plan"
                                                    : checkoutLoading === plan.id
                                                        ? "Redirecting…"
                                                        : hasEverPaid
                                                            ? "Resubscribe"
                                                            : "Upgrade"}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* =============================
                   STRIPE PORTAL
                ============================== */}
                    <Card>
                        <CardContent className="py-6 flex flex-col items-center gap-3">
                            <p className="text-sm text-muted-foreground text-center">
                                Update payment method, view invoices, or cancel your
                                subscription via Stripe.
                            </p>

                            <Button
                                size="lg"
                                onClick={handlePortal}
                                disabled={portalLoading}
                                className="w-full max-w-sm"
                            >
                                {portalLoading
                                    ? "Opening billing portal…"
                                    : "Manage Billing"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ContentLayout>
    );
}
