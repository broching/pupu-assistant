"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Calendar, AlertTriangleIcon, Link2 } from "lucide-react";
import { FaUnlink } from "react-icons/fa";
import { User, Session } from "@supabase/supabase-js";
import { AxiosInstance } from "axios";
import { useSubscription } from "@/lib/subscription/client";

type CalendarConnection = {
  id: string;
  email_address: string;
};

interface CalendarRowProps {
  session: Session | null;
  user: User | null;
  apiClient: AxiosInstance;
}

export default function CalendarRow({ session, user, apiClient }: CalendarRowProps) {
  const { subscription, loading: subscriptionLoading } = useSubscription(session?.access_token);

  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<CalendarConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isActiveSubscription = subscription?.status === "active";

  /* Fetch existing Calendar connection */
  useEffect(() => {
    if (!user?.id) return;

    const fetchConnection = async () => {
      try {
        const res = await apiClient.get(`/api/google/calendar-connection?userId=${user.id}`);
        setConnection(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load Calendar connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchConnection();
  }, [user?.id]);

  const handleConnectCalendar = () => {
    if (!session?.user?.id) {
      alert("You must be logged in first");
      return;
    }
    window.open(`/api/auth/google/calendar?userId=${session.user.id}`, "_self");
  };

  const handleDisconnectCalendar = async () => {
    if (!session?.access_token || !user?.id) {
      alert("You must be logged in first");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/api/auth/google/calendar/disconnect", {
        userId: user.id,
        email: user.email,
      });
      setConnection([]);
    } catch (err) {
      console.error(err);
      setError("Failed to disconnect Calendar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2 sm:gap-0">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Google Calendar</p>
          <p className="text-xs text-muted-foreground">
            Create events from important emails
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {loading || subscriptionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : connection.length > 0 ? (
          <>
            <div className="flex items-center gap-1 text-xs text-green-600 sm:mr-4">
              <CheckCircle2 className="h-4 w-4" />
              <span>{connection[0].email_address}</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleDisconnectCalendar} className="flex items-center">
              <FaUnlink className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          </>
        ) : (
          <>
            {/* Conditional Alert */}
            { !isActiveSubscription ? (
              <div className="flex items-center gap-2 text-yellow-600 text-xs font-medium">
                <AlertTriangleIcon className="h-4 w-4" />
                <span>Upgrade to a paid plan</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600 text-xs font-medium">
                <AlertTriangleIcon className="h-4 w-4" />
                <span>Please connect Calendar</span>
              </div>
            )}

            {/* Connect button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnectCalendar}
              disabled={!isActiveSubscription}
              className="flex items-center"
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
