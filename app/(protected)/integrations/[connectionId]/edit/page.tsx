"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useApiClient } from "@/app/utils/axiosClient";
import { ArrowLeft, Info } from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { CATEGORIES } from "@/lib/constants/emailCategories";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

type Filter = {
    id: string;
    filter_name: string;
};

export default function EditIntegrationPage() {
    const router = useRouter();
    const params = useParams();
    const { connectionId } = params as { connectionId: string };
    const { user } = useUser();
    const apiClient = useApiClient();

    const [connectionName, setConnectionName] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [filterId, setFilterId] = useState<string>("create-new");
    const [filters, setFilters] = useState<Filter[]>([]);

    const [name, setName] = useState("");
    const [notificationMode, setNotificationMode] = useState("balanced");

    const [watchTags, setWatchTags] = useState<string[]>([]);
    const [watchInput, setWatchInput] = useState("");

    const [ignoreTags, setIgnoreTags] = useState<string[]>([]);
    const [ignoreInput, setIgnoreInput] = useState("");

    const [weights, setWeights] = useState<Record<string, number>>({});
    const [minScore, setMinScore] = useState(50);

    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);

    /* ------------------------------ */
    /* Fetch integration + filters    */
    /* ------------------------------ */
    useEffect(() => {
        console.log('reached')
        if (!user?.id) return;

        const fetchData = async () => {
            try {
                const filtersRes = await apiClient.get("/api/filter");
                setFilters(filtersRes.data || []);

                const res = await apiClient.get(`/api/google/gmail-connections/${connectionId}`);

                setConnectionName(res.data.connection_name || "");
                setEmailAddress(res.data.email_address || "");

                console.log('connectionID', res.data)

                if (!res.data.filter_id) {
                    setFilterId("create-new");
                    fetchFilter("create-new");
                    setWatchTags([
                        "invoice", "payment", "subscription", "receipt", "approval", "deadline", "contract", "meeting", "security", "verification"
                    ])
                } else {
                    setFilterId(res.data.filter_id);
                    await fetchFilter(res.data.filter_id);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load integration.");
                router.back();
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [user?.id, connectionId]);

    /* ------------------------------ */
    /* Fetch filter details           */
    /* ------------------------------ */
    const fetchFilter = async (id: string) => {
        if (id === "default" || id === "create-new") {
            setName(id === "default" ? "Default" : "");
            setNotificationMode("balanced");
            setWatchTags([]);
            setIgnoreTags([]);
            setMinScore(50);

            const initWeights: Record<string, number> = {};
            CATEGORIES.forEach(cat =>
                cat.subcategories.forEach(sub => {
                    initWeights[sub.key] = 50;
                })
            );
            setWeights(initWeights);
            return;
        }

        setFilterLoading(true);
        try {
            const { data } = await apiClient.get(`/api/filter/${id}`);

            setName(data.filter_name);
            setNotificationMode(data.notification_mode);
            setWatchTags(data.watch_tags ?? []);
            setIgnoreTags(data.ignore_tags ?? []);
            setMinScore(data.min_score_for_telegram ?? 50);

            const initWeights: Record<string, number> = {};
            CATEGORIES.forEach(cat =>
                cat.subcategories.forEach(sub => {
                    initWeights[sub.key] = data[sub.key] ?? 50;
                })
            );
            setWeights(initWeights);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load filter.");
        } finally {
            setFilterLoading(false);
        }
    };

    /* ------------------------------ */
    /* Save integration + filter      */
    /* ------------------------------ */
    const handleSave = async () => {
        if (!connectionName.trim()) {
            toast.error("Connection name required.");
            return;
        }
        if (!name.trim()) {
            toast.error("Filter name required.");
            return;
        }

        setSaving(true);
        try {
            let newFilterId = filterId;
            if (filterId === "create-new") {
                const filterRes = await apiClient.post("/api/filter", {
                    filter_name: name,
                    notification_mode: notificationMode,
                    watch_tags: watchTags,
                    ignore_tags: ignoreTags,
                    min_score_for_telegram: minScore,
                    ...weights,
                });
                newFilterId = filterRes.data.id;
                console.log("filter res:", filterRes, newFilterId)

                await apiClient.put(`/api/google/gmail-connections/${connectionId}`, {
                    filter_id: newFilterId,
                    connection_name: connectionName.trim(),
                    filter_name: name
                });
            } else {
                await apiClient.put(`/api/google/gmail-connections/${connectionId}`, {
                    filter_id: filterId,
                    connection_name: connectionName.trim(),
                    filter_name: name
                });

                await apiClient.put(`/api/filter/${filterId}`, {
                    filter_name: name,
                    notification_mode: notificationMode,
                    watch_tags: watchTags,
                    ignore_tags: ignoreTags,
                    min_score_for_telegram: minScore,
                    ...weights,
                });
            }

            toast.success("Integration updated successfully.");
            router.push('/account');
        } catch (err) {
            console.error(err);
            toast.error("Update failed.");
        } finally {
            setSaving(false);
        }
    };

    if (initialLoading) return <p className="text-center mt-10">Loading...</p>;

    return (
        <ContentLayout title="Integrations">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="max-w-6xl mx-auto space-y-6">
                <Card className="p-6 space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-semibold">Edit Gmail Integration</h1>
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input value={emailAddress} disabled />
                    </div>

                    <div className="space-y-2">
                        <Label>Connection Name</Label>
                        <Input value={connectionName} onChange={(e) => setConnectionName(e.target.value)} required />
                    </div>

                    {/* Filter select + CTA */}
                    <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10 w-full">

                        {/* Left: Filter Select */}
                        <div className="flex items-end gap-3 w-full md:w-auto">
                            <div className="space-y-2 w-full md:w-6/12">
                                <Label>Filter</Label>
                                <Select
                                    value={filterId}
                                    onValueChange={async (val) => {
                                        setFilterId(val);
                                        await fetchFilter(val);
                                    }}
                                >
                                    <SelectTrigger className="w-full md:w-[250px]">
                                        <span className="truncate block w-full">
                                            <SelectValue />
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="create-new">Create New</SelectItem>
                                        {filters.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.filter_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Right: Helper CTA */}
                        <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground md:ml-6 w-full md:w-auto">
                            <span>Don’t see the filter you want?</span>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full md:w-auto"
                                onClick={() => setFilterId("create-new")}
                            >
                                Create a new filter
                            </Button>
                        </div>

                    </div>

                    <Separator />

                    {/* Filter Editor */}
                    <fieldset disabled={filterId === "default" || filterLoading} className="space-y-6">

                        {/* Filter Name */}
                        <div className="space-y-2">
                            <Label>Filter Name <span className="text-destructive">*</span></Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2">
                                <Label>Telegram Threshold</Label>
                                <span className="text-xs text-muted-foreground ml-3 hidden sm:inline">
                                    Lower → more notifications, Higher → only critical
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-3/4">
                                    <Slider
                                        value={[minScore]}
                                        min={0}
                                        max={100}
                                        step={1}
                                        onValueChange={(value: number | number[]) => {
                                            const val = Array.isArray(value) ? value[0] : value;
                                            setMinScore(val);
                                        }}
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground w-6 text-right">{minScore}</div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-sm">
                                            Set the minimum score an email must reach for Telegram notifications to be sent.
                                            Higher values reduce notifications to only the most important emails.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="mt-1 text-sm font-medium text-muted-foreground">
                                Notification Frequency:{" "}
                                <span className="font-semibold">
                                    {minScore <= 30 ? "Frequent" : minScore <= 70 ? "Moderate" : "Critical only"}
                                </span>
                            </div>
                        </div>


                        {/* Watch Tags */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Watch Tags</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-sm">
                                            These are keywords that the AI should watch out for in incoming emails.
                                            Emails containing these keywords will have higher importance scores.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <TagInput
                                placeholder="Type a keyword and press Enter"
                                tags={watchTags}
                                value={watchInput}
                                onValueChange={setWatchInput}
                                onAddTag={tag => setWatchTags([...watchTags, tag])}
                                onRemoveTag={tag => setWatchTags(watchTags.filter(t => t !== tag))}
                            />
                        </div>

                        {/* Ignore Tags */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Ignore Tags</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-sm">
                                            These are keywords that the AI should ignore when calculating the email score.
                                            Emails containing these keywords will be considered less important.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <TagInput
                                placeholder="Type a keyword and press Enter"
                                tags={ignoreTags}
                                value={ignoreInput}
                                onValueChange={setIgnoreInput}
                                onAddTag={tag => setIgnoreTags([...ignoreTags, tag])}
                                onRemoveTag={tag => setIgnoreTags(ignoreTags.filter(t => t !== tag))}
                            />
                        </div>


                        <Separator />

                        {/* Importance Levels */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Importance Levels</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.name} className="space-y-2">
                                        <p className="font-medium">{cat.name}</p>
                                        {cat.subcategories.map(sub => (
                                            <div key={sub.key} className="flex items-center gap-2 text-sm">
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span>{sub.label}</span>
                                                        <span>{weights[sub.key]}</span>
                                                    </div>
                                                    <Slider
                                                        className="mt-1"
                                                        value={[weights[sub.key] ?? 50]}
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        onValueChange={(value) => {
                                                            const val = Array.isArray(value) ? value[0] : value;
                                                            setWeights(prev => ({ ...prev, [sub.key]: val }));
                                                        }}
                                                    />
                                                </div>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs text-sm">
                                                            {sub.explanation}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </fieldset>

                    <Button type="submit" variant="outline" className="w-full" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>

                </Card>
            </form>
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
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
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
