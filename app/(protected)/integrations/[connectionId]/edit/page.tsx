"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useApiClient } from "@/app/utils/axiosClient";
import { ArrowLeft, Info, Plus } from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { CATEGORIES } from "@/lib/constants/emailCategories";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
type CustomItem = { label: string; key: string; weight: number };
export default function EditIntegrationPage() {
    const router = useRouter();
    const params = useParams();
    const { connectionId } = params as { connectionId: string };
    const { user } = useUser();
    const apiClient = useApiClient();

    const [emailAddress, setEmailAddress] = useState("");
    const [filterId, setFilterId] = useState<string>("");

    const [weights, setWeights] = useState<Record<string, number>>({});
    const [minScore, setMinScore] = useState(50);

    const [toggles, setToggles] = useState<Record<string, boolean>>({
        toggle_financial: true,
        toggle_marketing: true,
        toggle_security: true,
        toggle_deadline: true,
        toggle_operational: true,
        toggle_personal: true,
        toggle_misc: true,
        toggle_custom: false,
    });
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [tooltipOpenKey, setTooltipOpenKey] = useState<string | null>(null);

    const CATEGORY_TOGGLE_MAP: Record<string, string> = {
        "Financial / Payments": "toggle_financial",
        "Marketing / Promotions": "toggle_marketing",
        "Security / Account": "toggle_security",
        "Deadlines / Important Dates": "toggle_deadline",
        "Operational / Notifications": "toggle_operational",
        "Personal / Social": "toggle_personal",
        "Miscellaneous / Other": "toggle_misc",
    };

    /* ------------------------------ */
    /* Fetch integration + filter     */
    /* ------------------------------ */
    useEffect(() => {
        if (!user?.id) return;

        const fetchData = async () => {
            try {
                const res = await apiClient.get(
                    `/api/google/gmail-connections/${connectionId}`
                );

                setEmailAddress(res.data.email_address || "");
                setFilterId(res.data.filter_id);

                await fetchFilter(res.data.filter_id);
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
        if (!id) return;

        setFilterLoading(true);
        try {
            const { data } = await apiClient.get(`/api/filter/${id}`);

            setMinScore(data.min_score_for_telegram ?? 50);

            const initWeights: Record<string, number> = {};
            CATEGORIES.forEach((cat) =>
                cat.subcategories.forEach((sub) => {
                    initWeights[sub.key] = data[sub.key] ?? 50;
                })
            );

            setWeights(initWeights);

            setToggles({
                toggle_financial: data.toggle_financial ?? true,
                toggle_marketing: data.toggle_marketing ?? true,
                toggle_security: data.toggle_security ?? true,
                toggle_deadline: data.toggle_deadline ?? true,
                toggle_operational: data.toggle_operational ?? true,
                toggle_personal: data.toggle_personal ?? true,
                toggle_misc: data.toggle_misc ?? true,
                toggle_custom: data.toggle_custom ?? false,
            });
            // load custom items
            setCustomItems(
                Object.entries(data.custom_categories || {}).map(([key, weight]) => ({
                    label: key,
                    key,
                    weight: Number(weight),
                })))
        } catch (err) {
            console.error(err);
            toast.error("Failed to load filter.");
        } finally {
            setFilterLoading(false);
        }
    };

    /* ------------------------------ */
    /* Save                            */
    /* ------------------------------ */
    const handleSave = async () => {
        if (!filterId) return;

        // Validate custom items
        for (const item of customItems) {
            if (!item.label.trim()) {
                toast.error("Custom labels cannot be empty");
                return;
            }
        }

        const customObj: Record<string, number> = {};
        customItems.forEach((item) => {
            customObj[item.label] = item.weight;
        });
        setSaving(true);
        try {
            await apiClient.put(`/api/filter/${filterId}`, {
                min_score_for_telegram: minScore,
                ...weights,
                ...toggles,
                custom_categories: customObj,
            });

            toast.success("Email settings updated successfully.");
            router.push("/account");
        } catch (err) {
            console.error(err);
            toast.error("Update failed.");
        } finally {
            setSaving(false);
        }
    };

    if (initialLoading)
        return <p className="text-center mt-10">Loading...</p>;

    return (
        <ContentLayout title="Edit Connection">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                }}
                className="max-w-6xl mx-auto space-y-6"
            >
                <Card className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-semibold">
                            Edit Gmail Connection
                        </h1>
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input value={emailAddress} disabled />
                    </div>

                    {/* Telegram Frequency */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Label>Telegram Frequency</Label>
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
                                    onValueChange={(value) => {
                                        const val = Array.isArray(value)
                                            ? value[0]
                                            : value;
                                        setMinScore(val);
                                    }}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground w-6 text-right">
                                {minScore}
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-sm">
                                        Set the minimum score an email must reach for
                                        Telegram notifications to be sent.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="text-sm font-medium text-muted-foreground">
                            Notification Frequency:{" "}
                            <span className="font-semibold">
                                {minScore <= 30
                                    ? "Frequent"
                                    : minScore <= 70
                                        ? "Moderate"
                                        : "Critical only"}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Category Controls */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">
                            What should we monitor?
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                            {CATEGORIES.map((cat) => {
                                const toggleKey = CATEGORY_TOGGLE_MAP[cat.name] as keyof typeof toggles;
                                const isEnabled = toggles[toggleKey];


                                return (
                                    <div
                                        key={cat.name}
                                        className="border rounded-xl p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">
                                                {cat.name}
                                            </p>

                                            {toggleKey && (
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) =>
                                                        setToggles((prev) => ({
                                                            ...prev,
                                                            [toggleKey]: checked,
                                                        }))
                                                    }
                                                />
                                            )}
                                        </div>

                                        {/* Subcategory sliders with smooth collapse animation */}
                                        <div
                                            className={`
                                                    overflow-hidden transition-all duration-300 ease-in-out
                                                    ${isEnabled ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"}
                                                `}
                                        >
                                            <div className="space-y-3 pb-1">
                                                {cat.subcategories.map((sub) => (
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
                                                                    setWeights((prev) => ({ ...prev, [sub.key]: val }));

                                                                    // Show tooltip for 5 seconds when slider is used
                                                                    setTooltipOpenKey(sub.key);
                                                                    setTimeout(() => setTooltipOpenKey((current) => (current === sub.key ? null : current)), 5000);
                                                                }}
                                                            />
                                                        </div>

                                                        <TooltipProvider>
                                                            <Tooltip
                                                                open={tooltipOpenKey === sub.key || undefined} // undefined lets hover trigger normal behavior
                                                                onOpenChange={() => { }} // we control programmatically for slider
                                                            >
                                                                <TooltipTrigger asChild>
                                                                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs text-sm">{sub.explanation}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                            {/* Custom Category Card */}
                            <div className="border rounded-xl p-4 space-y-3 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">Custom Categories</p>
                                    <Switch
                                        checked={toggles.toggle_custom}
                                        onCheckedChange={(checked) =>
                                            setToggles((prev) => ({ ...prev, toggle_custom: checked }))
                                        }
                                    />
                                </div>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${toggles.toggle_custom ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <div className="space-y-3 pb-1">
                                        {/* Add New Custom */}
                                        <button
                                            type="button"
                                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition"
                                            onClick={() =>
                                                setCustomItems((prev) => [
                                                    ...prev,
                                                    { label: "", key: crypto.randomUUID(), weight: 50 },
                                                ])
                                            }
                                        >
                                            <Plus className="w-4 h-4" /> Add Custom
                                        </button>
                                        {/* Existing custom items */}
                                        {customItems.map((item, index) => (
                                            <div key={item.key} className="flex items-center gap-2 text-sm">


                                                {/* Slider with number display */}
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                                                        <span className="ml-1">
                                                            <Input
                                                                placeholder="Custom Category"
                                                                value={item.label}
                                                                onChange={(e) =>
                                                                    setCustomItems((prev) => {
                                                                        const copy = [...prev];
                                                                        copy[index].label = e.target.value;
                                                                        return copy;
                                                                    })
                                                                }
                                                                className="flex-1"
                                                            />
                                                        </span>
                                                        <span>{item.weight}</span>
                                                    </div>
                                                    <Slider
                                                        value={[item.weight]}
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        onValueChange={(value) => {
                                                            const val = Array.isArray(value) ? value[0] : value;
                                                            setCustomItems((prev) => {
                                                                const copy = [...prev];
                                                                copy[index].weight = val;
                                                                return copy;
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <Button
                        type="submit"
                        variant="outline"
                        className="w-full"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </Card>
            </form>
        </ContentLayout>
    );
}
