'use client'
import React from 'react'
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';

type TelegramFrequencyCardProps = {
    minScore: number
    setMinScore: React.Dispatch<React.SetStateAction<number>>;
}

function TelegramFrequencyCard(props: TelegramFrequencyCardProps) {
    const {
        minScore,
        setMinScore
    } = props;
    return (

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
    )
}

export default TelegramFrequencyCard