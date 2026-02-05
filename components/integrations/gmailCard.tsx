"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { useApiClient } from "@/app/utils/axiosClient";
import { useRouter } from "next/navigation";

type GmailConnection = {
  id: string;
  email_address: string;
  connection_name: string | null;
  filter_name: string | null; // Added filter name for display
};

export default function GmailCard() {
  const { session, user } = useUser();
  const apiClient = useApiClient();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------
     Fetch existing Gmail connections
  ------------------------------ */
  useEffect(() => {
    if (!user?.id) return;

    const fetchConnections = async () => {
      try {
        const res = await apiClient.get(
          `/api/google/gmail-connections?userId=${user.id}`
        );
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

  /* ------------------------------
     Connect Gmail
  ------------------------------ */
  const handleConnectGmail = () => {
    if (!session?.user?.id) {
      alert("You must be logged in first");
      return;
    }

    window.open(`/api/auth/google?userId=${session.user.id}`, "_self");
  };

  /* ------------------------------
     Disconnect Gmail
  ------------------------------ */
  const handleDisconnectGmail = async (email: string) => {
    if (!session?.access_token || !user?.id) {
      alert("You must be logged in first");
      return;
    }
    try {
      setLoading(true);

      await apiClient.post("/api/auth/google/disconnect", {
        userId: user.id,
        email,
      });

      setConnections((prev) =>
        prev.filter((conn) => conn.email_address !== email)
      );
    } catch (err) {
      console.error(err);
      setError("Failed to disconnect Gmail account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto bg-gradient-to-br from-muted/40 to-transparent">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
            {connections.length}
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <CardTitle className="text-xl">Connect Gmail</CardTitle>
            <p className="text-sm text-muted-foreground">
              You can connect more than one Gmail account
            </p>
          </div>
        </div>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition"
        >
          {collapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="grid w-full items-start gap-4">
            {loading && (
              <Alert className="w-full md:w-[50%]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading Gmail connections</AlertTitle>
                <AlertDescription>
                  Checking linked Gmail accounts.
                </AlertDescription>
              </Alert>
            )}

            {!loading && connections.length > 0 && (
              <Alert className="w-full md:w-[50%] text-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle>Gmail Connected</AlertTitle>
                <AlertDescription>
                  {connections.length} Gmail account
                  {connections.length > 1 ? "s" : ""} connected.
                </AlertDescription>
              </Alert>
            )}

            {!loading && connections.length === 0 && !error && (
              <Alert className="w-full md:w-[50%] text-yellow-800">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <AlertTitle>No Gmail Connected</AlertTitle>
                <AlertDescription>
                  Connect at least one Gmail account to continue.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="w-full md:w-[50%]">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Table-style connections */}
          {connections.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Connected Gmail accounts</p>

              <div className="rounded-md border">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-3">Connection Name</div>
                  <div className="col-span-4">Email address</div>
                  <div className="col-span-3">Filter</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Rows */}
                {connections.map((conn, index) => (
                  <div
                    key={conn.id}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-3 text-sm border-b last:border-b-0"
                  >
                    <div className="col-span-3 font-medium">
                      {conn.connection_name || `Connection ${index + 1}`}
                    </div>

                    <div className="col-span-4 text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {conn.email_address}
                    </div>

                    <div className="col-span-3 text-muted-foreground">
                      {conn.filter_name || "Default"}
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`integrations/${conn.id}/edit`);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnectGmail(conn.email_address)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            className="w-full"
            style={{ maxWidth: "200px" }}
            onClick={handleConnectGmail}
          >
            Add Gmail Account
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Secure Google OAuth • Gmail Read-only • Multiple accounts supported
          </p>
        </CardContent>
      )}
    </Card>
  );
}
