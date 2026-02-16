"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, Loader2, Pencil, Trash2, AlertTriangleIcon, Link2 } from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { useApiClient } from "@/app/utils/axiosClient";
import { useRouter } from "next/navigation";
import { PlanName } from "@/lib/stripe/config";
import { useSubscription } from "@/lib/subscription/client";
import { FaUnlink } from "react-icons/fa";

type GmailConnection = {
  id: string;
  email_address: string;
  connection_name: string | null;
  filter_name: string | null;
};

type GmailRowProps = {
  telegramConnected?: boolean; // optional, defaults to true
};

const PLAN_GMAIL_LIMITS: Record<PlanName, number> = {
  free_trial: 1,
  starter: 1,
  plus: 3,
  professional: Infinity,
};

export default function GmailRow({ telegramConnected = true }: GmailRowProps) {
  const { session, user } = useUser();
  const apiClient = useApiClient();
  const router = useRouter();
  const { subscription, loading: subscriptionLoading } = useSubscription(session?.access_token);

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const planName: PlanName = subscription?.planName ?? "free_trial";
  const isActiveSubscription = subscription?.status === "active";
  const gmailLimit = (isActiveSubscription || subscription?.planName === "free_trial") ? PLAN_GMAIL_LIMITS[planName] : 0;
  const reachedLimit = gmailLimit !== Infinity && connections.length >= gmailLimit;

  /* Fetch Gmail connections */
  useEffect(() => {
    if (!user?.id) return;
    const fetchConnections = async () => {
      try {
        const res = await apiClient.get(`/api/google/gmail-connections?userId=${user.id}`);
        setConnections(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load Gmail connections.");
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [user?.id]);

  /* Connect Gmail */
  const handleConnectGmail = () => {
    if (reachedLimit || gmailLimit === 0) return;
    if (!session?.user?.id) {
      alert("You must be logged in first");
      return;
    }
    window.open(`/api/auth/google?userId=${session.user.id}`, "_self");
  };

  /* Disconnect Gmail */
  const handleDisconnectGmail = async (email: string) => {
    if (!session?.access_token || !user?.id) {
      alert("You must be logged in first");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/api/auth/google/disconnect", { userId: user.id, email });
      setConnections((prev) => prev.filter((conn) => conn.email_address !== email));
    } catch (err) {
      console.error(err);
      setError("Failed to disconnect Gmail account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col border-b last:border-b-0 px-4 py-4 space-y-3 relative">

      {/* Header + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Gmail</p>
            <p className="text-xs text-muted-foreground">
              Connect Gmail accounts to read and process emails automatically
            </p>
          </div>
        </div>

        {/* Alert / Subscription message + Connect Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          {/* Subscription check */}
          {(!isActiveSubscription && !subscriptionLoading && subscription?.planName !== "free_trial") && (
            <div className="flex items-center gap-2 text-yellow-600 text-xs font-medium">
              <AlertTriangleIcon className="h-4 w-4" />
              <span>Upgrade to a paid plan</span>
            </div>
          )}

          {/* Telegram check if subscription active */}
          {(isActiveSubscription || subscription?.planName === "free_trial") && !telegramConnected && (
            <div className="flex items-center gap-2 text-yellow-600 text-xs font-medium">
              <AlertTriangleIcon className="h-4 w-4" />
              <span>Connect Telegram first</span>
            </div>
          )}

          {/* Connect Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleConnectGmail}
            disabled={subscriptionLoading || (!isActiveSubscription && subscription?.planName !== "free_trial") || !telegramConnected || reachedLimit || gmailLimit === 0}
            className="flex items-center"
            id="connect-gmail-button"
          >
            <Link2 className="h-3 w-3 mr-1" />
            Connect
          </Button>
        </div>
      </div>

      {/* Status messages */}
      {loading || subscriptionLoading ? (
        <div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking Gmail connections...
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      ) : null}

      {/* Connections Table */}
      <div className="relative overflow-x-auto mt-3">
        <div
          className={`min-w-[600px] rounded-md border
            ${((!isActiveSubscription && subscription?.planName !== "free_trial") || !telegramConnected) ? 'blur-sm pointer-events-none select-none' : ''}`}
        >
          <div className="grid grid-cols-12 gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-3">Connection Name</div>
            <div className="col-span-4">Email address</div>
            <div className="col-span-3">Filter</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {connections.map((conn, index) => (
            <div
              key={conn.id}
              className={`grid grid-cols-12 gap-4 items-center px-4 py-3 text-sm border-b last:border-b-0
                ${!isActiveSubscription ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}`}
            >
              <div className="col-span-3 font-medium">{conn.connection_name || `Connection ${index + 1}`}</div>
              <div className="col-span-4 text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {conn.email_address}
              </div>
              <div className="col-span-3 text-muted-foreground">{conn.filter_name || "Default"}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`integrations/${conn.id}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDisconnectGmail(conn.email_address)}
                  disabled={loading}
                >
                  <FaUnlink className="h-4 w-4 mr-1" /> Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Overlay if subscription inactive or Telegram not connected */}
        {((!isActiveSubscription && subscription?.planName !== "free_trial") || !telegramConnected) && (
          <>

            {(!isActiveSubscription && subscription?.planName !== "free_trial") ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm text-center p-6 space-y-4">
                <div className="text-md font-semibold ">
                  Upgrade to a paid plan to enable Gmail integrations
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm text-center p-6 space-y-4">
                <div className="text-md font-semibold">
                  Please connect Telegram to enable Gmail integrations
                </div>
              </div>

            )}

          </>
        )}
      </div>

    </div>
  );
}
