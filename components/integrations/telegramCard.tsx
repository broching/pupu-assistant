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

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 flex justify-center">
            <Card className="w-full max-w-6xl">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                            1
                        </div>

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


                    {/* Chevron */}
                    <button
                        onClick={() => setCollapsed((v) => !v)}
                        className="text-muted-foreground hover:text-foreground transition"
                    >
                        {collapsed ? (
                            <ChevronDown className="h-5 w-5" />
                        ) : (
                            <ChevronUp className="h-5 w-5" />
                        )}
                    </button>
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
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
