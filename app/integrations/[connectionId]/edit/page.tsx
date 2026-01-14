"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { useApiClient } from "@/app/utils/axiosClient";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { Switch } from "@/components/ui/switch";

type Filter = {
    id: string;
    filter_name: string;
    notification_mode: string;
    watch_tags: string[];
    ignore_tags: string[];
    enable_first_time_sender_alert: boolean;
    enable_thread_reply_alert: boolean;
    enable_deadline_alert: boolean;
    enable_subscription_payment_alert: boolean;
};

export default function EditIntegrationPage() {
    const router = useRouter();
    const params = useParams();
    const { connectionId } = params as { connectionId: string };
    const { user } = useUser();
    const apiClient = useApiClient();

    const [connectionName, setConnectionName] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [filterId, setFilterId] = useState<string>("default");
    const [filters, setFilters] = useState<Filter[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);

    // Filter form state
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

    const [initialLoading, setInitialLoading] = useState(true);

    /* ------------------------------
       Fetch integration and filters
    ------------------------------ */
    useEffect(() => {
        if (!user?.id) return;

        const fetchData = async () => {
            try {
                // Get all filters for user
                const filtersRes = await apiClient.get("/api/filter");
                setFilters(filtersRes.data || []);

                // Get integration details
                const res = await apiClient.get(`/api/google/gmail-connections/${connectionId}`);
                setConnectionName(res.data.connection_name || "");
                setEmailAddress(res.data.email_address || "");
                setFilterId(res.data.filter_id || "default");

                // Fetch filter if not default
                if (res.data.filter_id && res.data.filter_id !== "default") {
                    await fetchFilter(res.data.filter_id);
                } else {
                    setName("Default");
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load integration or filters.");
                router.back();
            } finally {
                setInitialLoading(false);
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id, connectionId]);

    /* ------------------------------
       Fetch filter by ID
    ------------------------------ */
    const fetchFilter = async (id: string) => {
        if (id === "default") {
            setName("Default");
            setNotificationMode("balanced");
            setWatchTags([]);
            setIgnoreTags([]);
            setFirstTimeSender(true);
            setThreadReply(true);
            setDeadlineAlert(true);
            setSubscriptionAlert(true);
            return;
        }

        setFilterLoading(true);
        try {
            const res = await apiClient.get(`/api/filter/${id}`);
            setName(res.data.filter_name);
            setNotificationMode(res.data.notification_mode);
            setWatchTags(res.data.watch_tags || []);
            setIgnoreTags(res.data.ignore_tags || []);
            setFirstTimeSender(res.data.enable_first_time_sender_alert);
            setThreadReply(res.data.enable_thread_reply_alert);
            setDeadlineAlert(res.data.enable_deadline_alert);
            setSubscriptionAlert(res.data.enable_subscription_payment_alert);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load filter details.");
        } finally {
            setFilterLoading(false);
        }
    };

    /* ------------------------------
       Handle save integration + filter
    ------------------------------ */
    const handleSave = async () => {
        if (!connectionName.trim()) {
            toast.error("Connection name cannot be empty.");
            return;
        }

        setSaving(true);
        try {
            // 1️⃣ Update integration
            const integrationPayload = {
                connection_name: connectionName.trim(),
                filter_id: filterId === "default" ? null : filterId,
                filter_name: filterId === "default"
                    ? "Default"
                    : filters.find(f => f.id === filterId)?.filter_name || "Default"

            };

            const integrationRes = await apiClient.put(
                `/api/google/gmail-connections/${connectionId}`,
                integrationPayload
            );

            // 2️⃣ If filter is not default, update filter
            if (filterId !== "default") {
                const filterPayload = {
                    filter_name: name,
                    notification_mode: notificationMode,
                    watch_tags: watchTags,
                    ignore_tags: ignoreTags,
                    enable_first_time_sender_alert: firstTimeSender,
                    enable_thread_reply_alert: threadReply,
                    enable_deadline_alert: deadlineAlert,
                    enable_subscription_payment_alert: subscriptionAlert,
                };

                await apiClient.put(`/api/filter/${filterId}`, filterPayload);
            }

            // ✅ Only if both succeed
            toast.success("Connection and filter updated successfully!");
            router.back();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update connection or filter.");
        } finally {
            setSaving(false);
        }
    };


    if (initialLoading) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-6">
            <Card className="p-8">
                <CardContent className="space-y-6">
                    {/* Header */}
                    <div className="space-y-1 mt-5">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>

                            <h1 className="text-2xl font-semibold">Edit Gmail Integration</h1>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Update the connection details for your Gmail account.
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className="space-y-6"
                    >
                        {/* Email (read-only) */}
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input value={emailAddress} disabled />
                        </div>

                        {/* Connection Name */}
                        <div className="space-y-2">
                            <Label>Connection Name</Label>
                            <Input
                                placeholder="Work Gmail, Personal, etc."
                                value={connectionName}
                                onChange={(e) => setConnectionName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Filter Select */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                            {/* Left: Filter dropdown */}
                            <div className="md:col-span-2 space-y-2">
                                <Label>Filter</Label>
                                <Select
                                    value={filterId}
                                    onValueChange={async (val) => {
                                        setFilterId(val);
                                        await fetchFilter(val);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">
                                            Default (System Basic filter)
                                        </SelectItem>
                                        {filters.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.filter_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Right: Helper CTA */}
                            <div className="text-sm text-muted-foreground">
                                <span>Don’t see the filter you want?</span>
                                <Button
                                    type="button"
                                    onClick={() => router.push("/filters/create-filter")}
                                    className="text-left font-medium mt-2"
                                >
                                    Create a new filter
                                </Button>
                            </div>
                        </div>


                        {/* Filter Form */}
                        <fieldset disabled={filterId === "default" || filterLoading}>
                            {/* Name */}
                            <div className="space-y-2">
                                <Label>
                                    Filter Name <span className="text-destructive">*</span>
                                </Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>

                            {/* Notification Mode */}
                            <div className="space-y-2">
                                <Label>Notification Frequency</Label>
                                <Select value={notificationMode} onValueChange={setNotificationMode}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="minimal">Minimal (only critical emails)</SelectItem>
                                        <SelectItem value="balanced">Balanced (recommended)</SelectItem>
                                        <SelectItem value="aggressive">Aggressive (notify more often)</SelectItem>
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
                                    onAddTag={(tag) => setWatchTags([...watchTags, tag])}
                                    onRemoveTag={(tag) => setWatchTags(watchTags.filter((t) => t !== tag))}
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
                                    onAddTag={(tag) => setIgnoreTags([...ignoreTags, tag])}
                                    onRemoveTag={(tag) => setIgnoreTags(ignoreTags.filter((t) => t !== tag))}
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
                        </fieldset>

                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
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
    onRemoveTag,
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
                {tags.map((tag) => (
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
                onChange={(e) => onValueChange(e.target.value)}
                onKeyDown={(e) => {
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
    onChange,
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
