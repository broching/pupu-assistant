"use client";
import Masonry from "react-masonry-css";
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

type CategoriesGridProps = {
  initialLoading: boolean;
  breakpointColumnsObj: { [key: string]: number };
  CATEGORY_TOGGLE_MAP: Record<string, string>;

  toggles: Record<string, boolean>;
  setToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  weights: Record<string, number>;
  setWeights: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  tooltipOpenKey: string | null;
  setTooltipOpenKey: React.Dispatch<React.SetStateAction<string | null>>;
};


export default function CategoriesGrid({
  initialLoading,
  breakpointColumnsObj,
  CATEGORY_TOGGLE_MAP,
  toggles,
  setToggles,
  weights,
  setWeights,
  tooltipOpenKey,
  setTooltipOpenKey,
}: CategoriesGridProps) {


    if (initialLoading)
        return <p className="text-center mt-10">Loading...</p>;

    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex gap-6"
            columnClassName="flex flex-col gap-6"
        >
            {CATEGORIES.map((cat) => {
                const toggleKey = CATEGORY_TOGGLE_MAP[cat.name] as keyof typeof toggles;
                const isEnabled = toggleKey ? toggles[toggleKey] : true;

                return (
                    <div key={cat.name} className="border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">{cat.name}</p>
                            {toggleKey && (
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) =>
                                        setToggles((prev: any) => ({ ...prev, [toggleKey]: checked }))
                                    }
                                />
                            )}
                        </div>

                        {/* Subcategories */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isEnabled ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"
                                }`}
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
                                                    setWeights((prev: any) => ({ ...prev, [sub.key]: val }));
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
                                        </div>

                                        <TooltipProvider>
                                            <Tooltip
                                                open={tooltipOpenKey === sub.key || undefined}
                                                onOpenChange={() => { }}
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
        </Masonry>
    )
}