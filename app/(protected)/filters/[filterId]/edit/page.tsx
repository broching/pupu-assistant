"use client";

import { useEffect, useState } from "react";
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
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/app/context/userContext";

export default function EditNotificationFilterPage() {
    const router = useRouter();
    const params = useParams();
    const filterId = params?.filterId;

    const apiClient = useApiClient();

    const [name, setName] = useState("");
    const [notificationMode, setNotificationMode] = useState("balanced");

    const [watchTags, setWatchTags] = useState<string[]>([]);
    const [watchInput, setWatchInput] = useState("");

    const [ignoreTags, setIgnoreTags] = useState<string[]>([]);
    const [ignoreInput, setIgnoreInput] = useState("");

    const [firstTimeSender, setFirstTimeSender] = useState(true);
    const [threadReply, setThreadReply] = useState(true);
    const [deadlineAlert, setDeadlineAlert] = useState(true);
    const [subscriptionAlert, setSubscriptionAlert] = useState(true);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const { user, session } = useUser();

    /* ----------------------- */
    /* Fetch existing filter   */
    /* ----------------------- */
    useEffect(() => {
        if (!user?.id) return;

        const fetchFilter = async () => {
            try {
                const { data } = await apiClient.get(`/api/filter/${filterId}`);

                setName(data.filter_name);
                setNotificationMode(data.notification_mode);
                setWatchTags(data.watch_tags ?? []);
                setIgnoreTags(data.ignore_tags ?? []);

                setFirstTimeSender(data.enable_first_time_sender_alert);
                setThreadReply(data.enable_thread_reply_alert);
                setDeadlineAlert(data.enable_deadline_alert);
                setSubscriptionAlert(data.enable_subscription_payment_alert);
            } catch (err) {
                toast.error("Failed to load filter");
                console.error(err);
                router.push("/filters");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchFilter();
    }, [filterId, user?.id]);

    /* ----------------------- */
    /* Update filter           */
    /* ----------------------- */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);

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

        try {
            await apiClient.put(`/api/filter/${filterId}`, payload);
            toast.success("Filter updated successfully");
            router.push("/filters");
        } catch (err) {
            toast.error("Failed to update filter");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (initialLoading) {
        return <p className="text-center mt-10">Loading filter…</p>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <Card>
                <CardContent className="space-y-6 p-6">
                    {/* Header */}
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
                                Edit Notification Filter
                            </h1>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Update how the AI decides which emails are important.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label>
                                Filter Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Notification Mode */}
                        <div className="space-y-2">
                            <Label>Notification Frequency</Label>
                            <Select
                                value={notificationMode}
                                onValueChange={setNotificationMode}
                            >
                                <SelectTrigger>
                                    <SelectValue />
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
                                description="Notify me when someone replies"
                                checked={threadReply}
                                onChange={setThreadReply}
                            />

                            <ToggleRow
                                label="Deadline detection"
                                description="Notify me about deadlines"
                                checked={deadlineAlert}
                                onChange={setDeadlineAlert}
                            />

                            <ToggleRow
                                label="Subscriptions & recurring payments"
                                description="Notify me about recurring charges"
                                checked={subscriptionAlert}
                                onChange={setSubscriptionAlert}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            Update Filter
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

/* ----------------------- */
/* Shared Components      */
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
