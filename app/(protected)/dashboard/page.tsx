"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { Mail, AlertTriangleIcon, Pencil } from "lucide-react";
import { FaUnlink } from "react-icons/fa";

import { useApiClient } from "@/app/utils/axiosClient";
import { useUser } from "@/app/context/userContext";
import { useSubscription } from "@/lib/subscription/client";
import OnboardingTour from "@/components/tutorial/OnBoardingTour";

type TelegramStatus = { connected: boolean; telegram_username?: string };
type GmailConnection = { id: string; email_address: string; connection_name: string | null; filter_name: string | null };
type CalendarStatus = { connected: boolean; email: string };
type EmailAIResponse = {
  id: string
  message_id: string
  message_status: "processing" | "completed" | "failed"
  message_score: number | null
  flagged_keywords: string[] | null
  created_at: string
}

export default function Dashboard() {
  const apiClient = useApiClient();
  const { user, session, tour, tourLoaded } = useUser();
  const { subscription } = useSubscription(session?.access_token);
  const router = useRouter();

  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>({ connected: false });
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({ connected: false, email: "" });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d")
  const [data, setData] = useState<EmailAIResponse[]>([])

  // Frontend pagination
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchData()
  }, [timeRange, user?.id])

  async function fetchData() {
    try {
      setLoading(true)
      setPage(1) // reset page on new filter

      const res = await apiClient.get(
        `/api/email-analytics?range=${timeRange}`
      )

      setData(res.data.data || [])
    } catch (err: any) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }
  // ---------- Stats (calculated from FULL dataset) ----------
  const totalJunk = data.filter((d) => (d.message_score ?? 0) < 40).length
  const totalImportant = data.filter((d) => (d.message_score ?? 0) >= 70).length
  /* ------------------------------------
     Data fetchers
  ------------------------------------ */
useEffect(() => {
  if (!user?.id) return;
  if (!tourLoaded) return; // 🔥 Wait until tour is finalized

  if (!tour) {
    router.push("/account");
    return;
  }

  setLoading(true);

  const checkTelegramLink = async () => {
    try {
      const res = await apiClient.get(`/api/telegram/check-link?userId=${user.id}`);
      setTelegramStatus({
        connected: true,
        telegram_username: res.data.telegram_username,
      });
    } catch {
      setTelegramStatus({ connected: false });
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await apiClient.get(`/api/google/gmail-connections?userId=${user.id}`);
      setConnections(res.data.data || []);
    } catch {
      setConnections([]);
    }
  };

  const checkCalendarLink = async () => {
    try {
      const res = await apiClient.get(`/api/google/calendar-connection?userId=${user.id}`);
      setCalendarStatus({
        connected: !!res.data.data[0],
        email: res.data.data[0]?.email_address || "",
      });
    } catch {
      setCalendarStatus({ connected: false, email: "" });
    }
  };

  Promise.all([
    checkTelegramLink(),
    fetchConnections(),
    checkCalendarLink(),
  ]).finally(() => setLoading(false));

}, [user?.id, tourLoaded, tour]);


  const hasActivePlan = subscription?.status === "active" && subscription?.hasAccess;

  const PLAN_GMAIL_LIMITS: Record<string, number> = { free_trial: 1, starter: 1, plus: 3, professional: Infinity };
  const planName = subscription?.planName ?? "free_trial";
  const gmailLimit = hasActivePlan ? PLAN_GMAIL_LIMITS[planName] : 0;

  const handleDisconnectGmail = async (email: string) => {
    if (!session?.access_token || !user?.id) return;
    try {
      setLoading(true);
      await apiClient.post("/api/auth/google/disconnect", { userId: user.id, email });
      setConnections((prev) => prev.filter((conn) => conn.email_address !== email));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const CardSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Warning Alerts */}
        <div className="space-y-4 max-w-2xl">
          {/* Telegram Alert */}
          {!telegramStatus.connected && (
            <Alert
              variant="default"
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-border shadow-sm p-3 gap-2"
              style={{
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
            >
              {/* Left: icon + title + description */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div className="flex flex-col">
                  <AlertTitle className="text-sm font-medium text-yellow-600">
                    Telegram Not Linked
                  </AlertTitle>
                  <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                    Link your Telegram account to get started and enable all features.
                  </p>
                </div>
              </div>

              {/* Right: CTA button */}
              <Button asChild size="sm" variant="outline" className="mt-2 sm:mt-0">
                <Link href="/account">Link Telegram</Link>
              </Button>
            </Alert>


          )}

          {/* Gmail Alert */}
          {hasActivePlan && connections.length === 0 && telegramStatus.connected && (
            <Alert variant="destructive" className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-sm font-medium text-yellow-600">
                  No Gmail Connections
                </AlertTitle>
              </div>
              <div className="mt-2 sm:mt-0">
                <Button asChild size="sm" variant="outline">
                  <Link href="/account">Connect Gmail</Link>
                </Button>
              </div>
            </Alert>
          )}
        </div>

        {/* Gmail Connections Table */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Gmail Connections</h3>
          <div className={`relative overflow-x-auto rounded-md border ${(!hasActivePlan || !telegramStatus.connected) ? "blur-sm pointer-events-none select-none" : ""}`}>
            <div className="grid grid-cols-12 gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-3">Connection Name</div>
              <div className="col-span-4">Email Address</div>
              <div className="col-span-3">Filter</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {connections.map((conn, idx) => (
              <div key={conn.id} className="grid grid-cols-12 gap-4 items-center px-4 py-3 text-sm border-b last:border-b-0">
                <div className="col-span-3 font-medium">{conn.connection_name || `Connection ${idx + 1}`}</div>
                <div className="col-span-4 flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {conn.email_address}</div>
                <div className="col-span-3 text-muted-foreground">{conn.filter_name || "Default"}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/integrations/${conn.id}/edit`)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDisconnectGmail(conn.email_address)} disabled={loading}><FaUnlink className="h-4 w-4 mr-1" /> Disconnect</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-2">
          <h3 className="text-lg font-medium">Email Analytics</h3>

          <Button asChild variant="secondary" size="sm" className="ml-2">
            <Link href="/email-analytics" className="text-center">
              View Full Email Analytics
            </Link>
          </Button>
        </div>


        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total Junk Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-500">{totalJunk}</p>
              <p className="text-sm text-muted-foreground">
                Emails with score below 40
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Important Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{totalImportant}</p>
              <p className="text-sm text-muted-foreground">
                Emails with score 70+
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Google Calendar Embed */}
        <h3 className="text-lg font-medium mb-3">Your Calendar</h3>
        <div className="mx-auto relative mt-6 rounded-xl overflow-hidden border bg-background shadow-sm w-full">
          <iframe
            src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarStatus.email || "")}&ctz=Asia/Singapore`}
            width="100%"
            height="600"
            className={`w-full transition-all duration-300 ${!calendarStatus.connected ? "blur-sm pointer-events-none select-none" : ""}`}
          />
          {!calendarStatus.connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm text-center p-6 space-y-4">
              <div className="text-lg font-semibold">Connect Google Calendar to Unlock</div>
              <p className="text-sm text-muted-foreground max-w-md">Link your Google Calendar to automatically create events from important emails with deadlines and meetings.</p>
              <Button onClick={() => router.push("/account")} className="mt-2">Connect Calendar</Button>
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
