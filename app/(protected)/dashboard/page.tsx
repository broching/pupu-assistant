"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { Mail, Send, BadgeCheck, Calendar } from "lucide-react";

import { useApiClient } from "@/app/utils/axiosClient";
import { useUser } from "@/app/context/userContext";
import { useSubscription } from "@/lib/subscription/client";
import { useRouter } from "next/navigation";

/* ------------------------------------
   Types
------------------------------------ */
type TelegramStatus = {
  connected: boolean;
  telegram_username?: string;
};

type GmailConnection = {
  id: string;
  email_address: string;
  connection_name: string | null;
  filter_name: string | null;
};

type CalendarStatus = {
  connected: boolean;
  email: string;
};

/* ------------------------------------
   Skeleton helpers
------------------------------------ */
function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export default function Dashboard() {
  const apiClient = useApiClient();
  const { user, session } = useUser();
  const { subscription } = useSubscription(session?.access_token);
  const router = useRouter();

  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>({
    connected: false,
  });
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    connected: false,
    email: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------
     Data fetchers
  ------------------------------------ */
  const checkTelegramLink = async () => {
    try {
      const res = await apiClient.get(
        `/api/telegram/check-link?userId=${user?.id}`
      );
      setTelegramStatus({
        connected: true,
        telegram_username: res.data.telegram_username,
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setTelegramStatus({ connected: false });
      } else {
        setError("Failed to check Telegram connection.");
      }
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await apiClient.get(
        `/api/google/gmail-connections?userId=${user?.id}`
      );
      setConnections(res.data.data || []);
    } catch {
      setError("Failed to load Gmail connections.");
    }
  };

  const checkCalendarLink = async () => {
    try {
      const res = await apiClient.get(
        `/api/google/calendar-connection?userId=${user?.id}`
      );
      setCalendarStatus({
        connected: res.data.data[0] ? true : false,
        email: res.data.data[0].email_address,
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setCalendarStatus({ connected: false, email: "" });
      } else {
        setError("Failed to check Calendar connection.");
      }
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    Promise.all([
      checkTelegramLink(),
      fetchConnections(),
      checkCalendarLink(),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  /* ------------------------------------
     Plan logic
  ------------------------------------ */
  const hasActivePlan =
    subscription?.status === "active" && subscription?.hasAccess;

  const planLabel = hasActivePlan
    ? subscription?.planName
    : "No active plan";

  /* ------------------------------------
     Render
  ------------------------------------ */
  if (!user) {
    return (
      <ContentLayout title="Dashboard">
        <div className="text-sm text-muted-foreground">
          Loading dashboard…
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Overview
          </h2>
          <p className="text-muted-foreground mt-1">
            Your integrations and subscription status
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Telegram */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Telegram Status
                </CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <CardSkeleton />
                ) : (
                  <>
                    <div
                      className={`text-2xl font-bold ${telegramStatus.connected
                        ? "text-green-600"
                        : "text-muted-foreground"
                        }`}
                    >
                      {telegramStatus.connected
                        ? "Connected"
                        : "Not connected"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bot integration
                    </p>
                  </>
                )}
              </CardContent>
            </div>
            <CardContent>
              <Button asChild size="sm" className="w-full" disabled={loading}>
                <Link href="/telegram">Manage Telegram</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Gmail */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Gmail Connections
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {connections.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Linked mailboxes
                    </p>
                  </>
                )}
              </CardContent>
            </div>
            <CardContent>
              <Button asChild size="sm" className="w-full" disabled={loading}>
                <Link href="/email">Manage Gmail</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Google Calendar
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <CardSkeleton />
                ) : (
                  <>
                    <div
                      className={`text-2xl font-bold ${calendarStatus.connected
                        ? "text-green-600"
                        : "text-muted-foreground"
                        }`}
                    >
                      {calendarStatus.connected
                        ? "Connected"
                        : "Not connected"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto event creation
                    </p>
                  </>
                )}
              </CardContent>
            </div>
            <CardContent>
              <Button asChild size="sm" className="w-full" disabled={loading}>
                <Link href="/calendar">Manage Calendar</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plan */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Plan
                </CardTitle>
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                {loading ? (
                  <CardSkeleton />
                ) : (
                  <>
                    <div
                      className={`text-2xl font-bold capitalize ${hasActivePlan
                        ? "text-foreground"
                        : "text-muted-foreground"
                        }`}
                    >
                      {planLabel}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasActivePlan
                        ? "Subscription tier"
                        : "No active subscription"}
                    </p>
                  </>
                )}
              </CardContent>
            </div>

            <CardContent>
              <Button asChild size="sm" className="w-full" disabled={loading}>
                <Link href="/billing">
                  {hasActivePlan ? "Manage billing" : "View plans"}
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
        {/* Google Calendar UI Embed */}
        <div className="mx-auto relative mt-6 rounded-xl overflow-hidden border bg-background shadow-sm w-full">

          {/* Iframe */}
          <iframe
            src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
              calendarStatus.email || ""
            )}&ctz=Asia/Singapore`}
            width="100%"
            height="600"
            className={`w-full transition-all duration-300 ${!calendarStatus.connected ? "blur-sm pointer-events-none select-none" : ""
              }`}
          />

          {/* Locked Overlay */}
          {!calendarStatus.connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm text-center p-6 space-y-4">

              <div className="text-lg font-semibold">
                Connect Google Calendar to Unlock
              </div>

              <p className="text-sm text-muted-foreground max-w-md">
                Link your Google Calendar to automatically create events from
                important emails with deadlines and meetings.
              </p>

              <Button
                onClick={() => router.push("/calendar")}
                className="mt-2"
              >
                Connect Calendar
              </Button>
            </div>
          )}
        </div>

      </div>
    </ContentLayout>
  );
}
