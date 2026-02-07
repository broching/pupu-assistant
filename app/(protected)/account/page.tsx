"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUser } from "@/app/context/userContext";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function AccountPage() {
  const { user, displayName, updateUser, isLoading: userLoading } = useUser();
  const [name, setName] = useState<string | null>(displayName);
  const [loading, setLoading] = useState(false);

  // Initialize name from user context once

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
  if (userLoading || name === null) {
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
      <div className="max-w-3xl mx-auto mt-5 space-y-6 inset-0 bg-gradient-to-br from-muted/40 to-transparent">
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

            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
