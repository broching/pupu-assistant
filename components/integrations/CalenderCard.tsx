"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from "@/components/ui/alert";
import {
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Trash2,
} from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { useApiClient } from "@/app/utils/axiosClient";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/subscription/client";
import { useTheme } from "next-themes";

type CalendarConnection = {
    id: string;
    email_address: string;
};

export default function CalendarCard() {
    const { session, user } = useUser();
    const apiClient = useApiClient();
    const router = useRouter();
    const { theme, resolvedTheme } = useTheme()

    const { subscription, loading: subscriptionLoading } =
        useSubscription(session?.access_token);

    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connection, setConnection] = useState<CalendarConnection[]>([]);
    const [error, setError] = useState<string | null>(null);

    const isActiveSubscription =
        subscription?.status === "active";

    const currentTheme = resolvedTheme === "dark" ? "dark" : "light";
    const calendarBgColor =
        currentTheme === "dark" ? "%23111111" : "%23ffffff";


    /* ------------------------------
       Fetch existing Calendar connection
    ------------------------------ */
    useEffect(() => {
        if (!user?.id) return;

        const fetchConnection = async () => {
            try {
                const res = await apiClient.get(
                    `/api/google/calendar-connection?userId=${user.id}`
                );
                setConnection(res.data.data || null);
            } catch (err) {
                console.error(err);
                setError("Failed to load Calendar connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchConnection();
    }, [user?.id]);

    /* ------------------------------
       Connect Calendar
    ------------------------------ */
    const handleConnectCalendar = () => {
        if (!session?.user?.id) {
            alert("You must be logged in first");
            return;
        }

        window.open(`/api/auth/google/calendar?userId=${session.user.id}`, "_self");
    };

    /* ------------------------------
       Disconnect Calendar
    ------------------------------ */
    const handleDisconnectCalendar = async () => {
        if (!session?.access_token || !user?.id) {
            alert("You must be logged in first");
            return;
        }

        try {
            setLoading(true);

            await apiClient.post("/api/auth/google/calendar/disconnect", {
                userId: user.id,
                email: user.email
            });

            setConnection([]);
        } catch (err) {
            console.error(err);
            setError("Failed to disconnect Calendar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto bg-gradient-to-br from-muted/40 to-transparent mb-10">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        2
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div>
                        <CardTitle className="text-xl">
                            Connect Google Calendar
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Enable one-click event creation from email notifications
                        </p>
                    </div>
                </div>

            </CardHeader>

            {!collapsed && (
                <CardContent className="space-y-6">
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Connect your Google Calendar to instantly create
                            calendar events directly from important emails.
                        </p>
                    </div>

                    {/* Loading */}
                    {(loading || subscriptionLoading) && (
                        <Alert className="w-full md:w-[50%]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertTitle>Loading</AlertTitle>
                            <AlertDescription>
                                Checking Calendar connection.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Connected */}
                    {!loading && connection.length > 0 && (
                        <>
                            <Alert className="w-full md:w-[50%] text-green-800">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <AlertTitle>Calendar Connected</AlertTitle>
                                <AlertDescription>
                                    Connected as {connection[0].email_address}
                                </AlertDescription>
                            </Alert>

                            {/* Google Calendar UI Embed */}
                            <div className="w-full mt-6 rounded-xl overflow-hidden border bg-background shadow-sm">
                                <iframe
                                    src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
                                        connection[0].email_address
                                    )}&ctz=Asia/Singapore
                                    &bgcolor=${calendarBgColor}`}
                                    width="100%"
                                    height="600"

                                />
                            </div>
                        </>
                    )}


                    {/* Not connected */}
                    {!loading && (connection.length === 0) && !error && (
                        <Alert className="w-full md:w-[50%] text-yellow-800">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <AlertTitle>No Calendar Connected</AlertTitle>
                            <AlertDescription>
                                Connect your Google Calendar to enable
                                one-click event creation.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive" className="w-full md:w-[50%]">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* CTA */}
                    {connection.length === 0 ? (
                        <Button
                            className="w-full max-w-xs"
                            onClick={handleConnectCalendar}
                            disabled={!isActiveSubscription}
                        >
                            Connect Google Calendar
                        </Button>
                    ) : (
                        <Button
                            className="w-full max-w-xs"
                            onClick={handleDisconnectCalendar}
                            disabled={loading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Disconnect Calendar
                        </Button>
                    )}

                    {!isActiveSubscription && (
                        <Alert className="w-full md:w-[60%] text-yellow-800">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <AlertTitle>Subscription required</AlertTitle>
                            <AlertDescription>
                                Upgrade to a paid plan to enable Calendar
                                integrations.
                                <div className="mt-3">
                                    <Button
                                        size="sm"
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                        onClick={() => router.push("/billing")}
                                    >
                                        Upgrade plan
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                        Secure Google OAuth • Event write access only • No email
                        modification
                    </p>
                </CardContent>
            )}
        </Card>
    );
}
