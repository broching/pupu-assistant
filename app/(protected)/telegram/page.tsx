"use client";

import React, { useEffect, useState } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useUser } from "@/app/context/userContext";
import { useApiClient } from "../../utils/axiosClient";
import LinkTelegramCard from "@/components/integrations/telegramCard";

type TelegramStatus = {
  connected: boolean;
  telegram_username?: string;
};

export default function TelegramPage() {
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
    <ContentLayout title="Telegram">
      <LinkTelegramCard
        loading={loading}
        setLoading={setLoading}
        telegramStatus={telegramStatus}
        setTelegramStatus={setTelegramStatus}
        error={error}
        setError={setError}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        polling={polling}
        handleConnectTelegram={handleConnectTelegram}
      />
    </ContentLayout>
  );
}
