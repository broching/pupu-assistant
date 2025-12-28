'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useUser } from '@/app/context/userContext';
import { useBot } from '@/app/context/botContext';
import { toast } from 'sonner';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, CheckIcon, PopcornIcon } from "lucide-react"
import { useApiClient } from '../utils/axiosClient';
import ConnectCard from '@/components/settings/ConnectCard';
import NumberPreferenceCard from '@/components/settings/numberPreferenceCard';




export default function Page() {
    const { user } = useUser();
    const userId = user?.id;
    const apiClient = useApiClient();
    const [loading, setLoading] = useState(false);
    const {
        botActive,
        setBotActive,
        qr,
        connected,
        connectClient,
        checkConnection,
        disconnectClient,
    } = useBot();

    const handleEnableBot = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.post("/api/bot/updateBotStatus", {
                userId,
                bot_enabled: "true",
            });

            toast.success("Bot enabled successfully!");
            setBotActive(true); // optimistic update
            console.log("Bot enabled response:", data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to enable bot";
            toast.error(msg);
            console.error("Error enabling bot:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisableBot = async () => {
        setLoading(true);
        try {
            await disconnectClient();
            const { data } = await apiClient.post("/api/bot/updateBotStatus", {
                userId,
                bot_enabled: "false",
            });

            toast.success("Bot disabled successfully!");
            setBotActive(false); // optimistic update
            console.log("Bot disabled response:", data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to disable bot";
            toast.error(msg);
            console.error("Error disabling bot:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisableBotMount = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.post("/api/bot/updateBotStatus", {
                userId,
                bot_enabled: "false",
            });

            toast.warning("Whatsapp Code Not Scanned, Bot Disabled. Please Try Again.");
            setBotActive(false); // optimistic update
            console.log("Bot disabled response:", data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to disable bot";
            toast.error(msg);
            console.error("Error disabling bot:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectBot = async () => {
        if (!userId) return;
        await handleDisableBot();
    };


    const handleConnectBot = async () => {
        console.log('test')
        setLoading(true);
        try {
            await connectClient();
        } finally {
            setLoading(false);
        }
    };

    const handleCheckConnection = async () => {
        try {
            await checkConnection();
        } catch (err) {
            console.error("Failed to check bot:", err);
            toast.error("Failed to check bot connection");
        }
    };

    useEffect(() => {
        if (!botActive || !userId) return;
        handleConnectBot();
    }, [botActive, userId]);

    useEffect(() => {
        if (!botActive || !qr || connected) return;

        let attempts = 0;
        const maxAttempts = 15;

        const interval = setInterval(async () => {
            attempts += 1;
            try {
                await handleCheckConnection();

                // If connected, stop checking
                if (connected) {
                    clearInterval(interval);
                } else if (attempts >= maxAttempts) {
                    // If max attempts reached and still not connected, disable bot
                    clearInterval(interval);
                    console.warn("Max connection attempts reached, disabling bot...");
                    await handleDisableBotMount();
                }
            } catch (err) {
                console.error("Error checking connection:", err);
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    await handleDisableBotMount();
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [botActive, qr, connected]);


    return (
        <div className="max-w-7xl gap-10 mx-auto py-12 px-6 flex flex-col md:flex-row">
            <ConnectCard
                userId={userId}
                botActive={botActive}
                handleEnableBot={handleEnableBot}
                handleDisableBot={handleDisableBot}
                loading={loading}
                qr={qr}
                connected={connected}
                handleDisconnectBot
            />
            <NumberPreferenceCard

            />
        </div>
    );

}
