"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from "@/components/ui/alert";
import {
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Mail,
} from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { useApiClient } from "@/app/utils/axiosClient";
import { FaTelegram, FaTelegramPlane } from "react-icons/fa";
import { useRouter } from "next/navigation";


type TelegramStatus = {
    connected: boolean;
    telegram_username?: string;
};

interface LinkTelegramCardProps {
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

    telegramStatus: TelegramStatus;
    setTelegramStatus: React.Dispatch<React.SetStateAction<TelegramStatus>>;

    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;

    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

    polling: boolean;

    handleConnectTelegram: () => void;
}


export default function LinkTelegramCard({
    loading,
    setLoading,
    telegramStatus,
    setTelegramStatus,
    error,
    setError,
    collapsed,
    setCollapsed,
    polling,
    handleConnectTelegram,
}: LinkTelegramCardProps) {

    const { session, user } = useUser();
    const apiClient = useApiClient();
    const router = useRouter();

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 flex justify-center">
            <Card className="w-full max-w-6xl bg-gradient-to-br from-muted/40 to-transparent">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-4">

                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <FaTelegramPlane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">
                                Connect Telegram
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Required to receive Gmail notifications
                            </p>
                        </div>
                    </div>


                </CardHeader>

                {!collapsed && (
                    <CardContent className="space-y-6">
                        {/* Explanation */}
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                We use Telegram to deliver your Gmail notifications instantly.
                                Important emails will be sent directly to your Telegram chat.
                                This is a one-time setup and messages are only sent to your own
                                Telegram account.
                            </p>


                        </div>

                        {/* Alerts */}
                        <div className="grid w-full items-start gap-4">
                            {loading && (
                                <Alert className="w-full md:w-[50%]">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <AlertTitle>Checking Telegram connection</AlertTitle>
                                    <AlertDescription>
                                        Please wait while we verify your status.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {!loading && telegramStatus.connected && (
                                <Alert className="w-full md:w-[50%] text-green-800">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <AlertTitle>Telegram Connected</AlertTitle>
                                    <AlertDescription>
                                        Connected
                                        {telegramStatus.telegram_username && (
                                            <> as @{telegramStatus.telegram_username}</>
                                        )}. You’ll receive Gmail notifications here.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {!loading && !telegramStatus.connected && !error && (
                                <Alert className="w-full md:w-[50%] text-yellow-800">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <AlertTitle>Telegram Not Connected</AlertTitle>
                                    <AlertDescription>
                                        Connect Telegram to start receiving Gmail notifications.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {error && (
                                <Alert
                                    variant="destructive"
                                    className="w-full md:w-[50%]"
                                >
                                    <AlertCircle className="h-5 w-5" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* CTA */}
                        <Button
                            className="w-full"
                            style={{ maxWidth: "200px" }}
                            onClick={async () => {
                                if (!telegramStatus.connected) {
                                    // Connect
                                    handleConnectTelegram();
                                    return;
                                }

                                // Disconnect Telegram
                                if (!session?.access_token || !user?.id) {
                                    alert("You must be logged in first");
                                    return;
                                }

                                try {
                                    setLoading(true);

                                    // Call backend disconnect endpoint
                                    const res = await apiClient.post(`/api/telegram/link`, {
                                        userId: user.id,
                                    });
                                    console.log('res', res)

                                    // Update state
                                    setTelegramStatus({ connected: false, telegram_username: undefined });
                                    setError(null);
                                } catch (err: any) {
                                    console.error("Failed to disconnect Telegram", err);
                                    setError("Failed to disconnect Telegram. Please try again.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            {telegramStatus.connected ? "Disconnect Telegram" : "Connect Telegram"}
                        </Button>



                        <p className="text-xs text-muted-foreground text-center">
                            Opens Telegram • Starts bot automatically
                        </p>
                        {/* Onboarding Guidance Section */}
                        <div className="pt-6 border-t border-border space-y-4">
                            {/* Block Gmail if NOT connected */}
                            {!telegramStatus.connected && !loading && (
                                <>
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Telegram Required</AlertTitle>
                                        <AlertDescription>
                                            You cannot add Gmail connections until Telegram
                                            is linked. Please connect Telegram first.
                                        </AlertDescription>
                                    </Alert>

                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        disabled
                                    >
                                        Connect Telegram to Enable Gmail Setup
                                    </Button>
                                </>
                            )}

                            {/* If Connected → Next Step */}
                            {telegramStatus.connected && (
                                <div className="rounded-lg border border-black/10 bg-muted/30 p-5 space-y-4">
                                    <CardTitle className="text-lg">
                                        Next Step: Connect Your Google Calendar
                                    </CardTitle>

                                    <div className="text-sm text-muted-foreground space-y-2">
                                        <p>
                                            Connect your Google Calendar so we can automatically create events
                                            from important emails that contain deadlines, meetings, or time-sensitive tasks.
                                        </p>

                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Detect important emails with dates or deadlines</li>
                                            <li>Automatically create calendar events for you</li>
                                            <li>Keep your schedule organized without manual copying</li>
                                        </ul>

                                        <p>
                                            When an important email includes a date or deadline, Pupu can
                                            instantly add it to your Google Calendar — saving you time and
                                            ensuring you never miss critical events.
                                        </p>
                                    </div>

                                    <Button
                                        style={{ width: "15rem" }}
                                        onClick={() => router.push("/calendar")}
                                    >
                                        Continue to Calendar Setup
                                    </Button>
                                </div>
                            )}

                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
