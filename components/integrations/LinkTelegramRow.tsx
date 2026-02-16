"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Link2, AlertTriangleIcon } from "lucide-react";
import { FaTelegramPlane, FaUnlink } from "react-icons/fa";
import { User, Session } from "@supabase/supabase-js";
import { AxiosInstance } from "axios";

type TelegramStatus = {
  connected: boolean;
  telegram_username?: string;
};

interface LinkTelegramRowProps {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  telegramStatus: TelegramStatus;
  setTelegramStatus: React.Dispatch<React.SetStateAction<TelegramStatus>>;

  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;

  handleConnectTelegram: () => void;

  user: User | null;
  session: Session | null;
  apiClient: AxiosInstance;
}

export default function LinkTelegramRow({
  loading,
  setLoading,
  telegramStatus,
  setTelegramStatus,
  error,
  setError,
  handleConnectTelegram,
  user,
  session,
  apiClient
}: LinkTelegramRowProps) {

  const handleDisconnect = async () => {
    if (!telegramStatus.connected) {
      handleConnectTelegram();
      return;
    }

    if (!session?.access_token || !user?.id) {
      alert("You must be logged in first");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(`/api/telegram/link`, { userId: user.id });
      setTelegramStatus({ connected: false, telegram_username: undefined });
      setError(null);
    } catch (err: any) {
      console.error("Failed to disconnect Telegram", err);
      setError("Failed to disconnect Telegram. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 mt-1 gap-2 sm:gap-0">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <FaTelegramPlane className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Telegram</p>
          <p className="text-xs text-muted-foreground">
            Receive Gmail notifications instantly via Telegram.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : telegramStatus.connected ? (
          <>
            <div className="flex items-center gap-1 text-xs text-green-600 sm:mr-4">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {telegramStatus.telegram_username && <> @{telegramStatus.telegram_username}</>}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={handleDisconnect} className="flex items-center">
              <FaUnlink className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          </>
        ) : (
          <>
            {/* Alert text */}
            <div className="flex items-center gap-2 text-yellow-600 text-xs font-medium">
              <AlertTriangleIcon className="h-4 w-4" />
              <span>Please connect Telegram</span>
            </div>

            {/* Connect button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnectTelegram}
              className="flex items-center"
              id="connect-telegram-button"
            >
              <Link2 className="h-3 w-3 mr-1" />
              Connect
            </Button>
          </>
        )}
      </div>

      {/* Error message below the row */}
      {error && <p className="text-xs text-red-500 w-full mt-1">{error}</p>}
    </div>
  );
}
