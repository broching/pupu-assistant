"use client";
import Masonry from "react-masonry-css";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useApiClient } from "@/app/utils/axiosClient";
import { ArrowLeft, Check, Info, Pencil, Trash2 } from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { CATEGORIES } from "@/lib/constants/emailCategories";
import CategoriesGrid from "@/components/integrations/CategoriesGrid";
import TelegramFrequencyCard from "@/components/integrations/TelegramFrequencyCard";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CustomItem = { id: string; label: string; key: string; weight: number; description: string; };

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
        toggle_work: true,
        toggle_personal: true,
        toggle_legal: true,
        toggle_custom: false,
    });

    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    const [customRuleInput, setCustomRuleInput] = useState("");
    const [generatingRule, setGeneratingRule] = useState(false);

    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [tooltipOpenKey, setTooltipOpenKey] = useState<string | null>(null);

    const CATEGORY_TOGGLE_MAP: Record<string, string> = {
        "Financial / Payments": "toggle_financial",
        "Marketing / Promotions": "toggle_marketing",
        "Security / Account": "toggle_security",
        "Deadlines / Important Dates": "toggle_deadline",
        "Work / Professional": "toggle_work",
        "Personal / Social": "toggle_personal",
        "Legal / Compliance": "toggle_legal",
    };

    const breakpointColumnsObj = {
        default: 2,
        768: 1,
    };
    type GenerationState = "idle" | "generating" | "preview";

    const [generationState, setGenerationState] =
        useState<GenerationState>("idle");

    const [generatedRule, setGeneratedRule] = useState<{
        category: string;
        userFacingCategory: string;
        description: string;
    } | null>(null);


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
                toggle_work: data.toggle_work ?? true,
                toggle_personal: data.toggle_personal ?? true,
                toggle_legal: data.toggle_legal ?? true,
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load filter.");
        } finally {
            setFilterLoading(false);
        }
    };

    /* ------------------------------ */
    /* Generate Custom Rule (AI)      */
    /* ------------------------------ */
    const handleGenerateCustomRule = async () => {
        if (!customRuleInput.trim()) {
            toast.error("Please describe what you'd like us to monitor.");
            return;
        }

        try {
            setGenerationState("generating");

            const { data } = await apiClient.post(
                "/api/custom-category/generate-custom-category",
                { userInput: customRuleInput }
            );

            setGeneratedRule({
                category: data.category,
                userFacingCategory: data.user_facing_category,
                description: data.description,
            });

            setGenerationState("preview");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate custom rule.");
            setGenerationState("idle");
        }
    };

    const handleConfirmRule = async () => {
        if (!generatedRule || !filterId || !emailAddress) return;

        try {
            const res = await apiClient.post("/api/custom-category", {
                filter_id: filterId,
                connection_id: connectionId, // from useParams()
                category: generatedRule.category,
                user_facing_category: generatedRule.userFacingCategory,
                description: generatedRule.description,
            });
            setCustomItems((prev) => [
                ...prev,
                {
                    id: res.data.id,
                    key: generatedRule.category,
                    label: generatedRule.userFacingCategory,
                    description: generatedRule.description,
                    weight: res.data.weight, // default weight
                },
            ]);

            setToggles((prev) => ({
                ...prev,
                toggle_custom: true,
            }));

            toast.success("Custom monitoring rule added successfully.");

            setGeneratedRule(null);
            setCustomRuleInput("");
            setGenerationState("idle");
        } catch (err) {
            console.error(err);
            toast.error("Failed to confirm custom rule.");
        }
    };


    const handleEditRule = () => {
        if (!generatedRule) return;

        setCustomRuleInput(generatedRule.description);
        setGenerationState("idle");
    };

    const handleCancelRule = () => {
        setGeneratedRule(null);
        setCustomRuleInput("");
        setGenerationState("idle");
    };


    /* ------------------------------ */
    /* Save                            */
    /* ------------------------------ */
    const handleSave = async () => {
        if (!filterId) return;

        for (const item of customItems) {
            if (!item.label.trim()) {
                toast.error("Custom labels cannot be empty");
                return;
            }
        }

        setSaving(true);
        try {
            await apiClient.put(`/api/filter/${filterId}`, {
                min_score_for_telegram: minScore,
                ...weights,
                ...toggles,
            });
            // 2️⃣ Update custom categories individually
            for (const item of customItems) {
                await apiClient.put(`/api/custom-category`, {
                    id: item.id,          // key is the UUID from Supabase
                    weight: item.weight,
                });
            }
            toast.success("Email settings updated successfully.");
            router.push("/account");
        } catch (err) {
            console.error(err);
            toast.error("Update failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCustomCategory = async (sub: CustomItem) => {
        try {
            // Optimistically remove the item from UI
            setCustomItems((prev) => prev.filter((item) => item.key !== sub.key));

            // Call the DELETE API
            await apiClient.delete(`/api/custom-category?id=${sub.id}`);

            toast.success(`"${sub.label}" was successfully deleted.`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete custom monitoring.");
            // Optional: Revert removal if you want
            // setCustomItems(prev => [...prev, sub]);
        }
    };


    useEffect(() => {
        if (!user?.id || !connectionId) return;

        const fetchCustomCategories = async () => {
            try {
                const { data } = await apiClient.get(`/api/custom-category?connection_id=${connectionId}`);
                if (data?.length) {
                    const mappedItems: CustomItem[] = data.map((item: any) => ({
                        id: item.id,
                        label: item.user_facing_category,
                        key: item.category,
                        description: item.description,
                        weight: item.weight ?? 70,
                    }));
                    setCustomItems(mappedItems);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load custom categories.");
            }
        };

        fetchCustomCategories();
    }, [user?.id, connectionId]);

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
                        <button
                            type="button"
                            onClick={() => router.push("/account")}
                        >
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

                    <TelegramFrequencyCard
                        minScore={minScore}
                        setMinScore={setMinScore}
                    />

                    <Separator />

                    {/* What should we monitor */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold mb-1">
                                What should we monitor?
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Tell us what you want to monitor, Pupu AI will do the rest.
                            </p>
                        </div>

                        {/* AI Custom Rule Input */}
                        <Card className="p-4 mb-6 space-y-4 transition-all duration-300">
                            {generationState === "idle" && (
                                <>
                                    <div className="space-y-2">

                                        <Textarea
                                            value={customRuleInput}
                                            onChange={(e) =>
                                                setCustomRuleInput(e.target.value)
                                            }
                                            rows={5}
                                            className="resize-none"
                                            placeholder={`• Alert me when my American Express credit card bill is due within 5 days`}
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleGenerateCustomRule}
                                        className="w-full"
                                    >
                                        Generate With Pupu AI
                                    </Button>
                                </>
                            )}

                            {generationState === "generating" && (
                                <div className="text-center py-6 animate-pulse">
                                    <p className="text-lg font-medium">
                                        Generating your smart monitoring rule...
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Please don’t close this browser. Pupu is crafting
                                        something tailored just for you.
                                    </p>
                                </div>
                            )}

                            {generationState === "preview" && generatedRule && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="bg-muted rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Pupu
                                        </p>

                                        <p className="leading-relaxed">
                                            Hi {user?.user_metadata.name || "there"} 👋
                                        </p>

                                        <p className="mt-2 leading-relaxed">
                                            You’d like to monitor emails related to{" "}
                                            <strong>{generatedRule.userFacingCategory}</strong>.
                                        </p>

                                        <p className="mt-2 leading-relaxed">
                                            I'll notify you about{" "}
                                            <strong>{generatedRule.description}</strong>.
                                        </p>

                                        <p className="mt-3 leading-relaxed">
                                            Once you confirm, I’ll start monitoring this rule for you.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            onClick={handleConfirmRule}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span className="hidden sm:inline ml-2">Confirm</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="default"
                                            onClick={handleEditRule}
                                            className="flex-1"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span className="hidden sm:inline ml-2">Edit</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleCancelRule}
                                            className="flex-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="hidden sm:inline ml-2">Cancel</span>
                                        </Button>
                                    </div>


                                </div>
                            )}
                            {customItems?.length > 0 && (
                                <div className="space-y-6 mt-4">
                                    <h3 className="text-lg font-semibold">Your Custom Monitoring Rules</h3>
                                    {customItems.map((sub) => (
                                        <div key={sub.key} className="space-y-1">
                                            {/* Top row: label + tooltip + weight */}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1">
                                                    <span>{sub.label}</span>
                                                    <TooltipProvider>
                                                        <Tooltip
                                                            open={tooltipOpenKey === sub.key || undefined}
                                                            onOpenChange={() => { }}
                                                        >
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs text-sm">
                                                                {sub.description}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>

                                                {/* Weight number far right */}
                                                <span className="font-medium mr-1">{sub.weight}</span>
                                            </div>

                                            {/* Bottom row: slider + delete icon */}
                                            <div className="flex items-center gap-2">
                                                <Slider
                                                    className="flex-1"
                                                    value={[sub.weight ?? 70]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={(value) => {
                                                        const val = Array.isArray(value) ? value[0] : value;
                                                        setCustomItems((prev) =>
                                                            prev.map((item) =>
                                                                item.key === sub.key ? { ...item, weight: val } : item
                                                            )
                                                        );
                                                        setTooltipOpenKey(sub.key);
                                                        setTimeout(
                                                            () =>
                                                                setTooltipOpenKey((current) =>
                                                                    current === sub.key ? null : current
                                                                ),
                                                            2000
                                                        );
                                                    }}
                                                />

                                                {/* Delete icon far right */}
                                                <Trash2
                                                    className="h-5 w-5 text-destructive cursor-pointer"
                                                    onClick={() => handleDeleteCustomCategory(sub)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}


                        </Card>
                        <div className="mb-4 mt-8">
                            <h2 className="text-xl font-semibold mb-1">
                                Don’t know what to monitor?
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                These rules are pre-defined by our system and can serve as a starting point if you don’t want to create your own custom AI rules.
                            </p>
                        </div>
                        <CategoriesGrid
                            initialLoading={initialLoading}
                            breakpointColumnsObj={breakpointColumnsObj}
                            CATEGORY_TOGGLE_MAP={CATEGORY_TOGGLE_MAP}
                            toggles={toggles}
                            setToggles={setToggles}
                            weights={weights}
                            setWeights={setWeights}
                            tooltipOpenKey={tooltipOpenKey}
                            setTooltipOpenKey={setTooltipOpenKey}
                        />
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
