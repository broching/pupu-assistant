"use client"; // MUST be the very first line

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/userContext";

interface ConnectGmailPageProps {
  searchParams?: { success?: string; error?: string };
}

export default function ConnectGmailPage({ searchParams }: ConnectGmailPageProps) {
  const { session } = useUser();

  const handleConnectGmail = () => {
    if (!session?.user?.id) {
      alert("You must be logged in first");
      return;
    }

    window.location.href = `/api/auth/google?userId=${session.user.id}`;
  };


  return (
    <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row gap-10 items-center justify-center">
      <div className="flex min-h-screen items-center justify-center w-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Connect your Gmail</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Gmail account to allow us to read incoming emails and
              notify you of important updates.
              <br />
              <strong>Read-only access.</strong>
            </p>

            {searchParams?.success && (
              <p className="text-sm text-green-600">
                Gmail connected successfully 🎉
              </p>
            )}

            {searchParams?.error && (
              <p className="text-sm text-red-600">
                Gmail connection failed.
              </p>
            )}

            <Button className="w-full" onClick={handleConnectGmail}>
              Connect Gmail
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-2">
              Secure Google OAuth • Gmail Read-only
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
