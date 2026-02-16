"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useUser } from "@/app/context/userContext";
import LinkTelegramCard from "@/components/integrations/LinkTelegramRow";
import GmailCard from "@/components/integrations/GmailRow";
import CalenderCard from "@/components/integrations/CalendarRow";
import { useApiClient } from "@/app/utils/axiosClient";
import { Card, CardTitle } from "../ui/card";
import LinkTelegramRow from "@/components/integrations/LinkTelegramRow";
import CalendarRow from "@/components/integrations/CalendarRow";
import GmailRow from "@/components/integrations/GmailRow";
import { Separator } from "../ui/separator";

type TelegramStatus = {
    connected: boolean;
    telegram_username?: string;
};

export default function ConnectionsCard() {
    const { session, user } = useUser();
    const apiClient = useApiClient();

    const [loading, setLoading] = useState(true);
    const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>({
        connected: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [polling, setPolling] = useState(false);

    /* ------------------------------
       Check Telegram connection
    ------------------------------ */
    useEffect(() => {
        if (!user?.id) return;

        const checkTelegramLink = async () => {
            try {
                const res = await apiClient.get(
                    `/api/telegram/check-link?userId=${user.id}`
                );

                setTelegramStatus({
                    connected: true,
                    telegram_username: res.data.telegram_username,
                });
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setTelegramStatus({ connected: false });
                } else {
                    console.error(err);
                    setError("Failed to check Telegram connection.");
                }
            } finally {
                setLoading(false);
            }
        };

        checkTelegramLink();
    }, [user?.id]);

    /* ------------------------------
       Connect Telegram
    ------------------------------ */
    const handleConnectTelegram = () => {
        if (!session?.access_token) {
            alert("You must be logged in first");
            return;
        }

        const telegramUrl = `/api/telegram/link?userId=${user?.id}`;
        window.open(telegramUrl, "_blank");
        setPolling(true);
    };

    /* ------------------------------
       Poll for Telegram connection
    ------------------------------ */
    useEffect(() => {
        if (!polling || !user?.id) return;

        const interval = setInterval(async () => {
            try {
                const res = await apiClient.get(
                    `/api/telegram/check-link?userId=${user.id}`
                );

                if (res.data.telegram_username) {
                    // Telegram connected
                    setTelegramStatus({
                        connected: true,
                        telegram_username: res.data.telegram_username,
                    });
                    setError(null);

                    // Stop polling
                    setPolling(false);
                    clearInterval(interval);
                }
            } catch (err: any) {
                if (err.response?.status === 404) {
                    // Not connected yet — do nothing
                } else {
                    console.error("Polling error:", err);
                    setError("Failed to check Telegram connection.");
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [polling, user?.id]);

    return (
        <Card className="bg-card text-card-foreground rounded-xl shadow-sm max-w-4xl mt-10 mx-auto">

            {/* Rows */}
            <LinkTelegramRow
                loading={loading}
                setLoading={setLoading}
                telegramStatus={telegramStatus}
                setTelegramStatus={setTelegramStatus}
                error={error}
                setError={setError}
                handleConnectTelegram={handleConnectTelegram}
                user={user}
                session={session}
                apiClient={apiClient}
            />
            <Separator className="mx-auto my-2" style={{ width: "95%" }} />
            <CalendarRow session={session} user={user} apiClient={apiClient} />
            <Separator className="mx-auto my-2" style={{ width: "95%" }} />
            <GmailRow telegramConnected={telegramStatus.connected}/>
        </Card>


    );
}
