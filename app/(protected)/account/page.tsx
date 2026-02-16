"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUser } from "@/app/context/userContext";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import LinkTelegramCard from "@/components/integrations/LinkTelegramRow";
import { useApiClient } from "../../utils/axiosClient";
import GmailCard from "@/components/integrations/GmailRow";
import CalenderCard from "@/components/integrations/CalendarRow";
import ConnectionsCard from "@/components/integrations/ConnectionsCard";
import { Edit2 } from "lucide-react";

type TelegramStatus = {
  connected: boolean;
  telegram_username?: string;
};

export default function AccountPage() {
  const { user, session, displayName, updateUser, isLoading: userLoading } = useUser();
  const [name, setName] = useState<string>("");
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

  // Initialize name once when displayName is loaded
  useEffect(() => {
    if (displayName !== undefined && displayName !== null) {
      setName(displayName);
    }
  }, [displayName]);

  const handleSave = async () => {
    if (!user || !name) return;
    setLoading(true);

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.id}`, // replace with proper token
        },
        body: JSON.stringify({
          id: user.id,
          name: name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      // Update context
      updateUser({
        user_metadata: {
          ...user.user_metadata,
          name: name,
        },
      });
      toast.success("Name updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  // Show loading until user context is ready and name is loaded
  if (userLoading) {
    return (
      <ContentLayout title="Account">
        <div className="max-w-3xl mx-auto mt-5 text-center text-muted-foreground">
          Loading account details...
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Account">
      <div className="max-w-4xl mx-auto mt-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>

            <Button onClick={handleSave} variant="outline" disabled={loading}>
              <Edit2></Edit2>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <ConnectionsCard />
    </ContentLayout>
  );
}
