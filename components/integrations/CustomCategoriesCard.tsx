"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Check, Pencil, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useApiClient } from "@/app/utils/axiosClient";

export type CustomItem = {
    id: string;
    key: string;
    label: string;
    description: string;
    weight: number;
};

type Props = {
    generationState: "idle" | "generating" | "preview";

    customRuleInput: string;
    setCustomRuleInput: React.Dispatch<React.SetStateAction<string>>;

    customItems: CustomItem[];
    setCustomItems: React.Dispatch<React.SetStateAction<CustomItem[]>>;

    tooltipOpenKey: string | null;
    setTooltipOpenKey: (key: string | null) => void;

    generatedRule?: {
        userFacingCategory: string;
        description: string;
    } | null;

    userName?: string;

    handleGenerateCustomRule: () => Promise<void>;
    handleConfirmRule: () => void;
    handleEditRule: () => void;
    handleCancelRule?: () => void; // optional
};

export default function CustomCategoriesCard({
    generationState,
    customRuleInput,
    setCustomRuleInput,
    customItems,
    setCustomItems,
    tooltipOpenKey,
    setTooltipOpenKey,
    generatedRule,
    userName,
    handleGenerateCustomRule,
    handleConfirmRule,
    handleEditRule,
    handleCancelRule,
}: Props) {
    const apiClient = useApiClient();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CustomItem | null>(
        null
    );

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;

        try {
            // Remove from state
            setCustomItems((prev) =>
                prev.filter((item) => item.key !== categoryToDelete.key)
            );

            // Call API to delete
            await apiClient.delete(`/api/custom-category?id=${categoryToDelete.id}`);

            toast.success(`"${categoryToDelete.label}" deleted successfully.`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete custom monitoring.");
        } finally {
            setDeleteModalOpen(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <Card className="p-4 mb-6 space-y-4 transition-all duration-300">
            {/* AI Custom Rule Input */}
            {generationState === "idle" && (
                <>
                    <Textarea
                        value={customRuleInput}
                        onChange={(e) => setCustomRuleInput(e.target.value)}
                        rows={5}
                        className="resize-none"
                        placeholder={`• Alert me when my American Express credit card bill is due within 5 days`}
                    />
                    <Button
                        type="button"
                        onClick={handleGenerateCustomRule}
                        className="w-full"
                    >
                        Generate With Pupu AI
                    </Button>
                </>
            )}

            {/* Generating */}
            {generationState === "generating" && (
                <div className="text-center py-6 animate-pulse">
                    <p className="text-lg font-medium">
                        Generating your smart monitoring rule...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Please don’t close this browser. Pupu is crafting something
                        tailored just for you.
                    </p>
                </div>
            )}

            {/* Preview */}
            {generationState === "preview" && generatedRule && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">Pupu</p>
                        <p className="leading-relaxed">
                            Hi {userName || "there"} 👋
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
                        {handleCancelRule && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleCancelRule}
                                className="flex-1"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline ml-2">Cancel</span>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Items */}
            {customItems.length > 0 && (
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
                                        setTimeout(() => setTooltipOpenKey(tooltipOpenKey === sub.key ? null : tooltipOpenKey), 2000);
                                    }}
                                />
                                <Trash2
                                    className="h-5 w-5 text-destructive cursor-pointer"
                                    onClick={() => {
                                        setCategoryToDelete(sub);
                                        setDeleteModalOpen(true);
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {categoryToDelete?.label} check?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{categoryToDelete?.label}"? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
