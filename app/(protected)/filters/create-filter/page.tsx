"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useApiClient } from "@/app/utils/axiosClient";
import { toast } from "sonner";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";

/**
 * User-facing name:
 * "Smart Notification Rules"
 *
 * Purpose:
 * Defines how the AI decides whether an email
 * is important enough to notify the user.
 */

export default function SmartNotificationRulesPage() {
    const [name, setName] = useState<string>("");

    const [notificationMode, setNotificationMode] = useState("balanced");

    const [watchTags, setWatchTags] = useState<string[]>([
        "invoice",
        "payment",
        "subscription",
        "receipt",
        "approval",
        "deadline",
        "contract",
        "meeting",
        "security",
        "verification"
    ]);
    const [watchInput, setWatchInput] = useState("");

    const [ignoreTags, setIgnoreTags] = useState<string[]>([]);
    const [ignoreInput, setIgnoreInput] = useState("");

    const [firstTimeSender, setFirstTimeSender] = useState(true);
    const [threadReply, setThreadReply] = useState(true);
    const [deadlineAlert, setDeadlineAlert] = useState(true);
    const [subscriptionAlert, setSubscriptionAlert] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const apiClient = useApiClient();


    async function handleSubmit(e: React.FormEvent) {
        setLoading(true)
        e.preventDefault();

        if (!name.trim()) return;

        const payload = {
            filter_name: name.trim(),
            notification_mode: notificationMode,
            watch_tags: watchTags,
            ignore_tags: ignoreTags,
            enable_first_time_sender_alert: firstTimeSender,
            enable_thread_reply_alert: threadReply,
            enable_deadline_alert: deadlineAlert,
            enable_subscription_payment_alert: subscriptionAlert
        };

        console.log("Filters payload:", payload);
        try {
            const { data } = await apiClient.post("/api/filter", payload);
            router.push("/filters");
            toast.success("Filter Created Successfully!");
            console.log("Created Filter Response:", data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to Create Filter";
            toast.error(msg);
            console.error("Error Creating Filter:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ContentLayout title="Filter">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardContent className="space-y-6 p-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>

                                <h1 className="text-xl font-semibold">
                                    Smart Notification Filter
                                </h1>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Control which emails are important enough for the AI to notify you about.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name (required) */}
                            <div className="space-y-2">
                                <Label>
                                    Filter Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="e.g. Work Emails, Billing Alerts"
                                    value={name}
                                    required
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            {/* Notification Mode */}
                            <div className="space-y-2">
                                <Label>Notification Frequency</Label>
                                <Select value={notificationMode} onValueChange={setNotificationMode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="minimal">
                                            Minimal (only critical emails)
                                        </SelectItem>
                                        <SelectItem value="balanced">
                                            Balanced (recommended)
                                        </SelectItem>
                                        <SelectItem value="aggressive">
                                            Aggressive (notify more often)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Watch Tags */}
                            <div className="space-y-2">
                                <Label>Important Keywords</Label>
                                <TagInput
                                    placeholder="Type a keyword and press Enter"
                                    tags={watchTags}
                                    value={watchInput}
                                    onValueChange={setWatchInput}
                                    onAddTag={tag => setWatchTags([...watchTags, tag])}
                                    onRemoveTag={tag =>
                                        setWatchTags(watchTags.filter(t => t !== tag))
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Emails containing these keywords are more likely to trigger notifications.
                                </p>
                            </div>

                            {/* Ignore Tags */}
                            <div className="space-y-2">
                                <Label>Ignored Keywords</Label>
                                <TagInput
                                    placeholder="Type a keyword and press Enter"
                                    tags={ignoreTags}
                                    value={ignoreInput}
                                    onValueChange={setIgnoreInput}
                                    onAddTag={tag => setIgnoreTags([...ignoreTags, tag])}
                                    onRemoveTag={tag =>
                                        setIgnoreTags(ignoreTags.filter(t => t !== tag))
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Emails containing these keywords are less likely to notify you.
                                </p>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4">
                                <ToggleRow
                                    label="First-time sender alerts"
                                    description="Notify me when someone emails me for the first time"
                                    checked={firstTimeSender}
                                    onChange={setFirstTimeSender}
                                />

                                <ToggleRow
                                    label="Thread reply alerts"
                                    description="Notify me when someone replies to an existing conversation"
                                    checked={threadReply}
                                    onChange={setThreadReply}
                                />

                                <ToggleRow
                                    label="Deadline detection"
                                    description="Notify me when emails mention deadlines or due dates"
                                    checked={deadlineAlert}
                                    onChange={setDeadlineAlert}
                                />

                                <ToggleRow
                                    label="Subscriptions & recurring payments"
                                    description="Notify me about subscription charges, renewals, or ongoing payments"
                                    checked={subscriptionAlert}
                                    onChange={setSubscriptionAlert}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                Save Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ContentLayout>
    );
}

/* ----------------------- */
/* Tag Input Component    */
/* ----------------------- */

function TagInput({
    tags,
    value,
    placeholder,
    onValueChange,
    onAddTag,
    onRemoveTag
}: {
    tags: string[];
    value: string;
    placeholder?: string;
    onValueChange: (v: string) => void;
    onAddTag: (tag: string) => void;
    onRemoveTag: (tag: string) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => onRemoveTag(tag)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            <Input
                placeholder={placeholder}
                value={value}
                onChange={e => onValueChange(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter" && value.trim()) {
                        e.preventDefault();
                        onAddTag(value.trim());
                        onValueChange("");
                    }
                }}
            />
        </div>

    );
}

/* ----------------------- */
/* Toggle Row Component   */
/* ----------------------- */

function ToggleRow({
    label,
    description,
    checked,
    onChange
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
