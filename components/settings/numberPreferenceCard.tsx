'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";
import { useUser } from '@/app/context/userContext';
import { useApiClient } from '@/app/utils/axiosClient';
import { toast } from 'sonner';

interface NumberItem {
    id: string | null;
    num: string;
}

interface PendingAction {
    type: 'add' | 'remove';
    num: string;
    mode: 'block' | 'allow';
    id?: string | null;
}

function NumberPreferenceCard() {
    const [mode, setMode] = useState<"block" | "allow">("block");
    const [blockNumbers, setBlockNumbers] = useState<NumberItem[]>([]);
    const [allowNumbers, setAllowNumbers] = useState<NumberItem[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { user, session } = useUser()
    const apiClient = useApiClient()

    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

    // Fetch user data for number_preference_mode
    useEffect(() => {
        if (!session) return;

        const fetchUserData = async () => {
            try {
                const { data } = await apiClient.get("/api/user");
                const userData = data?.user;
                if (!userData) return;
                setMode(userData.number_preference_mode === "allow" ? "allow" : "block");
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            }
        };
        fetchUserData();
    }, [session]);

    // Fetch number preferences
    useEffect(() => {
        if (!session || !user?.id) return;

        const fetchPreferences = async () => {
            try {
                const { data } = await apiClient.get("/api/number_preferences", {
                    params: { user_id: user.id },
                });
                const prefs = data?.preferences || [];

                setBlockNumbers(
                    prefs.filter((p: any) => p.mode === "block").map((p: any) => ({ id: p.id, num: p.phone_number }))
                );
                setAllowNumbers(
                    prefs.filter((p: any) => p.mode === "allow").map((p: any) => ({ id: p.id, num: p.phone_number }))
                );
            } catch (err) {
                console.error("Failed to fetch message preferences:", err);
            }
        };

        fetchPreferences();
    }, [session, user]);

    const handleAddNumber = () => {
        if (!inputValue.trim()) return;
        const clean = inputValue.trim();

        if (mode === "block" && !blockNumbers.some(n => n.num === clean)) {
            setBlockNumbers([...blockNumbers, { id: null, num: clean }]);
            setPendingActions([...pendingActions, { type: "add", num: clean, mode }]);
        } else if (mode === "allow" && !allowNumbers.some(n => n.num === clean)) {
            setAllowNumbers([...allowNumbers, { id: null, num: clean }]);
            setPendingActions([...pendingActions, { type: "add", num: clean, mode }]);
        }
        setInputValue("");
    };

    const handleRemoveNumber = (numObj: NumberItem) => {
        if (mode === "block") {
            setBlockNumbers(blockNumbers.filter(n => n.num !== numObj.num));
        } else {
            setAllowNumbers(allowNumbers.filter(n => n.num !== numObj.num));
        }
        setPendingActions([...pendingActions, { type: "remove", num: numObj.num, mode, id: numObj.id }]);
    };


    const handleSavePreferences = async () => {
        if (!user?.id) return;

        try {
            setIsSaving(true)
            // Save all number add/remove actions
            for (const action of pendingActions) {
                if (action.type === "add") {
                    const res = await apiClient.post("/api/number_preferences", {
                        user_id: user.id,
                        mode: action.mode,
                        phone_number: action.num,
                    });
                    const newId = res.data?.preference?.id;
                    if (action.mode === "block") {
                        setBlockNumbers(prev =>
                            prev.map(n => n.num === action.num ? { ...n, id: newId } : n)
                        );
                    } else {
                        setAllowNumbers(prev =>
                            prev.map(n => n.num === action.num ? { ...n, id: newId } : n)
                        );
                    }
                } else if (action.type === "remove") {
                    if (!action.id) continue;
                    await apiClient.delete(`/api/number_preferences?id=${action.id}`);
                }
            }

            // Clear pending actions
            setPendingActions([]);

            // Update user's number_preference_mode
            await apiClient.put("/api/user", {
                id: user?.id,
                number_preference_mode: mode
            });

            // Show success toast
            toast.success("Number Preferences saved successfully!");
        } catch (err) {
            console.error("Failed to save preferences:", err);
            toast.error("Failed to save number preferences. Please try again");
        }
        finally {
            setIsSaving(false);
        }
    };


    const numbers = mode === "block" ? blockNumbers : allowNumbers;

    return (
        <Card className="space-y-4 w-full">
            <CardHeader>
                <CardTitle>Block/Add Numbers</CardTitle>
                <CardDescription className="mt-2">
                    You can specify which numbers your bot should interact with.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Mode Selection */}
                <div>
                    <Label className="mb-2 block">Choose Mode</Label>
                    <RadioGroup value={mode} onValueChange={(val: "block" | "allow") => setMode(val)} className="flex gap-6">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="block" id="block" />
                            <Label htmlFor="block">Block these numbers</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="allow" id="allow" />
                            <Label htmlFor="allow">Only interact with these numbers</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Number Input */}
                <div>
                    <Label className="mb-2 block">Numbers for {mode === "block" ? "Block Mode" : "Allow Mode"}</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="+65 91234567"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNumber()}
                        />
                        <Button onClick={handleAddNumber}>Add</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Example: +65 91234567, +1 234567890</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {numbers.map(n => (
                            <Badge key={n.id || n.num} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                                {n.num}
                                <X className="h-4 w-4 cursor-pointer" onClick={() => handleRemoveNumber(n)} />
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Pending Actions */}
                {pendingActions.length > 0 && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 text-sm space-y-1">
                        <p className="font-medium">Pending Changes:</p>
                        <ul className="list-disc pl-5">
                            {pendingActions.map((a, idx) => (
                                <li key={idx}>
                                    {a.type === "add" ? `➕ Added ${a.num} to ${a.mode} list` : `❌ Removed ${a.num} from ${a.mode} list`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Summary */}
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                    {mode === "block" ? (
                        <p>✅ The bot will interact with <b>all numbers</b>, except the ones listed above.</p>
                    ) : (
                        <p>✅ The bot will <b>only interact</b> with the numbers listed above.</p>
                    )}
                </div>

                {/* Save Button */}
                <div>
                    <Button onClick={handleSavePreferences} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default NumberPreferenceCard;
