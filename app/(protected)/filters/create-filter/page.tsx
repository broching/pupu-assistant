"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { useApiClient } from "@/app/utils/axiosClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES } from "@/lib/constants/emailCategories";

export default function SmartNotificationRulesPage() {
    const [name, setName] = useState<string>("");
    const [notificationMode, setNotificationMode] = useState("balanced");
    const [watchTags, setWatchTags] = useState<string[]>([
        "invoice", "payment", "subscription", "receipt", "approval", "deadline", "contract", "meeting", "security", "verification"
    ]);
    const [watchInput, setWatchInput] = useState("");
    const [ignoreTags, setIgnoreTags] = useState<string[]>([]);
    const [ignoreInput, setIgnoreInput] = useState("");

    // Single state object for all weights
    const [weights, setWeights] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        CATEGORIES.forEach(cat => cat.subcategories.forEach(sub => { initial[sub.key] = 50; }));
        return initial;
    });

    const [minScore, setMinScore] = useState(50);
    const [loading, setLoading] = useState(false);

    const apiClient = useApiClient();
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        if (!name.trim()) return;

        const payload = {
            filter_name: name.trim(),
            notification_mode: notificationMode,
            watch_tags: watchTags,
            ignore_tags: ignoreTags,
            min_score_for_telegram: minScore,
            ...weights
        };

        try {
            console.log("payload", payload);
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
        <ContentLayout title="Smart Notification Rules">
            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
                <Card className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-semibold">Smart Notification Filter</h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control which emails are important enough for the AI to notify you about.
                    </p>

                    {/* Filter Name */}
                    <div className="space-y-2 mt-4">
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

                    {/* Telegram Threshold */}
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

                    {/* Watch / Ignore Tags */}
                    <TagInput
                        placeholder="Type a keyword and press Enter"
                        tags={watchTags}
                        value={watchInput}
                        onValueChange={setWatchInput}
                        onAddTag={tag => setWatchTags([...watchTags, tag])}
                        onRemoveTag={tag => setWatchTags(watchTags.filter(t => t !== tag))}
                    />

                    <TagInput
                        placeholder="Type a keyword and press Enter"
                        tags={ignoreTags}
                        value={ignoreInput}
                        onValueChange={setIgnoreInput}
                        onAddTag={tag => setIgnoreTags([...ignoreTags, tag])}
                        onRemoveTag={tag => setIgnoreTags(ignoreTags.filter(t => t !== tag))}
                    />

                    <Separator />

                    {/* Weights Sliders */}
                    <div>
                        <h2 className="text-xl font-bold">Importance Levels</h2>
                        <p className="mb-4 text-sm text-muted-foreground mt-1">
                            Adjust how much each type of email matters to you based on categories.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CATEGORIES.map(cat => (
                                <div key={cat.name} className="space-y-2">
                                    <p className="font-medium text-[17px]">{cat.name}</p>
                                    {cat.subcategories.map(sub => (
                                        <div key={sub.key} className="flex items-center gap-2 text-[13px]">
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span>{sub.label}</span>
                                                    <span className="mb-1">{weights[sub.key]}</span>
                                                </div>
                                                <Slider
                                                    value={[weights[sub.key]]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={(value: number | number[]) => {
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

                    <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                        Save Filter
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
