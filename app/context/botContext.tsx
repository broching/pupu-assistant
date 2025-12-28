"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useUser } from "./userContext";
import { useApiClientServer } from "../utils/serverClient";

interface BotContextType {
    botActive: boolean;
    qr: string | null;
    connected: boolean;
    isChecking: boolean;
    setBotActive: (active: boolean) => void;
    connectClient: () => Promise<void>;
    checkConnection: () => Promise<void>;
    disconnectClient: () => Promise<void>;
    checkBotStatus: () => Promise<void>;
}

const BotContext = createContext<BotContextType | null>(null);

export const BotProvider = ({ children }: { children: ReactNode }) => {
    const { user, session } = useUser();
    const userId = user?.id;

    const [botActive, setBotActive] = useState(false);
    const [qr, setQr] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const serverApiClient = useApiClientServer();

    const checkBotStatus = async () => {
        console.log('reach')
        if (!userId || !session) return;

        setIsChecking(true);
        try {
            const res = await fetch("/api/user", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const data = await res.json();
            const isActive = data.user?.bot_enabled === true || data.user?.bot_enabled === "true";
            setBotActive(isActive);
        } catch (err) {
            console.error("Failed to check bot status:", err);
        } finally {
            setIsChecking(false);
        }
    };

    const connectClient = async () => {
        if (!userId || !session) return;
        console.log('reached');
        try {
            const res = await serverApiClient.get(`/ws/connectClient?userId=${userId}`)

            const data = await res.data;
            console.log(data);

            if (data.qr) {
                toast.info("Scan the QR code to connect your WhatsApp bot.");
                setQr(data.qr);
                setConnected(false);
            } else if (data.connected) {
                toast.success("Whatsapp Bot is connected!");
                setQr(null);
                setConnected(true);
            }
        } catch (err) {
            console.error("Failed to connect bot:", err);
            toast.error("Failed to connect bot");
        }
    };


    const checkConnection = async () => {
        console.log("checking if connected...")
        try {
            const res = await serverApiClient.get(`/ws/checkConnection?userId=${userId}`);
            const data = await res.data;
            console.log("connection check data:", data);

            if (data.connected) {
                setQr(null);
                setConnected(true);
            } else if (!data.connected) {
                console.log('not connected yet. Waiting for user to scan')
            }
        } catch (err) {
            console.error("Failed to check bot:", err);
            toast.error("Failed to check bot");
        }
    }

    const disconnectClient = async () => {
        if (!userId || !session) return;

        try {
            const res = await serverApiClient.get(`/ws/disconnect/${userId}`)
            const data = await res.data;

            if (data.success) {
                setBotActive(false);
                setQr(null);
                setConnected(false);
                toast.success('You have Disconnected Your Whatsapp Bot!')
            } else {
                toast.error(data.message || "Failed to disconnect bot");
            }

            console.log("Disconnect response:", data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to disconnect bot";
            toast.error(msg);
            console.error("Error disconnecting bot:", err);
        }
    };


    useEffect(() => {
        checkBotStatus();
    }, [userId, session]);

    return (
        <BotContext.Provider
            value={{
                botActive,
                qr,
                connected,
                isChecking,
                setBotActive,
                connectClient,
                disconnectClient,
                checkBotStatus,
                checkConnection,
            }}
        >
            {children}
        </BotContext.Provider>
    );
};

export const useBot = (): BotContextType => {
    const context = useContext(BotContext);
    if (!context) throw new Error("useBot must be used within a BotProvider");
    return context;
};
