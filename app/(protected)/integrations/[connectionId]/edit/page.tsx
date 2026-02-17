"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useApiClient } from "@/app/utils/axiosClient";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/app/context/userContext";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { CATEGORIES } from "@/lib/constants/emailCategories";

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
    const [filterId, setFilterId] = useState<string>("default");
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
    /* Fetch integration + filters   */
    /* ------------------------------ */
    useEffect(() => {
        if (!user?.id) return;

        const fetchData = async () => {
            try {
                const filtersRes = await apiClient.get("/api/filter");
                setFilters(filtersRes.data || []);

                const res = await apiClient.get(`/api/google/gmail-connections/${connectionId}`);

                setConnectionName(res.data.connection_name || "");
                setEmailAddress(res.data.email_address || "");
                setFilterId(res.data.filter_id || "default");

                if (res.data.filter_id) {
                    await fetchFilter(res.data.filter_id);
                } else {
                    await fetchFilter("default");
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
    /* Fetch filter details          */
    /* ------------------------------ */
    const fetchFilter = async (id: string) => {
        if (id === "default") {
            setName("Default");
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
    /* Save integration + filter     */
    /* ------------------------------ */
    const handleSave = async () => {
        if (!connectionName.trim()) {
            toast.error("Connection name required.");
            return;
        }

        setSaving(true);

        try {
            await apiClient.put(
                `/api/google/gmail-connections/${connectionId}`,
                {
                    connection_name: connectionName.trim(),
                    filter_id: filterId === "default" ? null : filterId
                }
            );

            if (filterId !== "default") {
                await apiClient.put(`/api/filter/${filterId}`, {
                    filter_name: name,
                    notification_mode: notificationMode,
                    watch_tags: watchTags,
                    ignore_tags: ignoreTags,
                    min_score_for_telegram: minScore,
                    ...weights
                });
            }

            toast.success("Integration updated successfully.");
            router.back();
        } catch (err) {
            console.error(err);
            toast.error("Update failed.");
        } finally {
            setSaving(false);
        }
    };

    if (initialLoading) {
        return <p className="text-center mt-10">Loading...</p>;
    }

    return (
        <ContentLayout title="Integrations">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="max-w-6xl mx-auto space-y-6">
                <Card className="p-6 space-y-6">

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

                    <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10 w-full">

                        {/* Left: Filter Select */}
                        <div className="flex items-end gap-3">
                            <div className="space-y-2">
                                <Label>Filter</Label>
                                <Select
                                    value={filterId}
                                    onValueChange={async (val) => {
                                        setFilterId(val);
                                        await fetchFilter(val);
                                    }}
                                >
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default</SelectItem>
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
                        <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground md:ml-6">
                            <span>Don’t see the filter you want?</span>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full md:w-auto"
                                onClick={() => router.push("/filters/create-filter")}
                            >
                                Create a new filter
                            </Button>
                        </div>


                    </div>



                    <Separator />

                    {/* Filter Editor */}
                    <fieldset disabled={filterId === "default" || filterLoading} className="space-y-6">

                        <div className="space-y-2">
                            <Label>Filter Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Telegram Threshold</Label>
                            <Slider
                                value={[minScore]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => {
                                    const val = Array.isArray(value) ? value[0] : value;
                                    setMinScore(val);
                                }}
                            />
                            <p className="text-sm text-muted-foreground">
                                {minScore <= 30 ? "Frequent" : minScore <= 70 ? "Moderate" : "Critical only"}
                            </p>
                        </div>

                        <Separator />

                        <div>
                            <h2 className="text-lg font-semibold mb-3">Importance Levels</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.name} className="space-y-2">
                                        <p className="font-medium">{cat.name}</p>
                                        {cat.subcategories.map(sub => (
                                            <div key={sub.key}>
                                                <div className="flex justify-between text-sm">
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
