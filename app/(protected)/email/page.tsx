"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useUser } from "@/app/context/userContext";
import { useApiClient } from "../../utils/axiosClient";
import LinkTelegramCard from "@/components/integrations/telegramCard";
import GmailCard from "@/components/integrations/gmailCard";
import CalenderCard from "@/components/integrations/CalenderCard";

type TelegramStatus = {
  connected: boolean;
  telegram_username?: string;
};

export default function LinkGmailTelegramPage() {
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

  return (
    <ContentLayout title="Email">
      <GmailCard telegramConnected={telegramStatus?.connected} />
    </ContentLayout>
  );
}
