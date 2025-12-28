'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/app/context/userContext';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, FolderOpen, BookOpen } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useApiClient } from '../utils/axiosClient';

interface Pod {
    id: string;
    name: string;
    type: string;
    description: string;
    activated: string;
}

function PodPage() {
    const { session } = useUser();
    const [pods, setPods] = useState<Pod[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePod, setActivePod] = useState<Pod | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletePodId, setDeletePodId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [activateLoading, setActivateLoading] = useState(false);
    const [deactivatePod, setDeactivatePod] = useState<Pod | null>(null);
    const [deactivateLoading, setDeactivateLoading] = useState(false);
    const apiClient = useApiClient(); // <- added

    useEffect(() => {
        if (!session?.access_token) return;

        const fetchPods = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/api/pods`);
                setPods(res.data.pods || []);
            } catch (err: any) {
                console.error('Error fetching pods:', err);
                toast.error(err?.response?.data?.error || 'Failed to load pods');
            } finally {
                setLoading(false);
            }
        };

        fetchPods();
    }, [session]);

    const handleActivate = (pod: Pod) => {
        setActivePod(pod);
        setIsModalOpen(true);
    };

    const confirmActivate = async () => {
        if (!activePod) return;
        try {
            setActivateLoading(true)
            let reqObj = activePod;
            reqObj.activated = "true"
            await apiClient.put('/api/pods', reqObj);
            toast.success('Pod activated successfully!');
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || 'Failed to activate pod');
        } finally {
            setIsModalOpen(false);
            setActivePod(null);
            setActivateLoading(false)
        }
    };
    const handleDeletePod = async () => {
        if (!deletePodId) return;

        setDeleteLoading(true);
        try {
            await apiClient.delete(`/api/pods?id=${deletePodId}`);
            toast.success('Pod deleted successfully!');
            setPods((prev) => prev.filter((pod) => pod.id !== deletePodId));
            setDeletePodId(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || 'Failed to delete pod');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeactivate = (pod: Pod) => {
        setDeactivatePod(pod);
    };

    const confirmDeactivate = async () => {
        if (!deactivatePod) return;

        try {
            setDeactivateLoading(true);
            let reqObj = { ...deactivatePod, activated: "false" };
            await apiClient.put('/api/pods', reqObj);
            toast.success('Pod deactivated successfully!');
            // Update state locally
            setPods((prev) =>
                prev.map((p) =>
                    p.id === deactivatePod.id ? { ...p, activated: "false" } : p
                )
            );
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || 'Failed to deactivate pod');
        } finally {
            setDeactivatePod(null);
            setDeactivateLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Your Pods</h1>
                    <div className="space-y-6 mt-6">
                        {/* Step 1 */}
                        <div className="flex items-start space-x-4">
                            <div className="flex flex-col items-center">
                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white">
                                    1
                                </div>
                                <div className="flex-1 w-px bg-gray-300 dark:bg-gray-700 mt-1"></div>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                                    <PlusCircle className="w-5 h-5 " />
                                    <span>Create a Pod</span>
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Click the <b>Add Pod</b> button to create a new pod. Give it a name, select a type, and provide a description.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start space-x-4">
                            <div className="flex flex-col items-center">
                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white">
                                    2
                                </div>
                                <div className="flex-1 w-px bg-gray-300 dark:bg-gray-700 mt-1"></div>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                                    <FolderOpen className="w-5 h-5" />
                                    <span>View Pod & Add Items</span>
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Click on a pod card to open it. Then add items to the pod that your bot will learn from.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start space-x-4">
                            <div className="flex flex-col items-center">
                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white">
                                    3
                                </div>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span>Train Your Bot</span>
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    After adding items, your bot will learn from them. Activate your pod so your bot can use its content to respond intelligently.  </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-strong" />
                </div>
            </div>

            <div className="flex items-center justify-between mb-6 mt-8">
                {/* Pods Selected Display */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Activated Pods:
                    </span>
                    <div className="flex items-center space-x-1">
                        {pods.filter((pod) => pod.activated === "true").length === 0 ? (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                None
                            </span>
                        ) : (
                            pods
                                .filter((pod) => pod.activated === "true")
                                .map((pod) => (
                                    <span
                                        key={pod.id}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                                    >
                                        {pod.name}
                                    </span>
                                ))
                        )}
                    </div>
                </div>

                {/* Add Pod Button */}
                <Link href="/pods/createPod">
                    <Button>Add Pod</Button>
                </Link>
            </div>

            {loading ? (
                <p>Loading pods...</p>
            ) : (
                <ScrollArea className="h-[70vh] mt-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pods.length === 0 ? (
                            <p>No pods found. Create one to get started!</p>
                        ) : (
                            pods.map((pod) => (
                                <Card
                                    key={pod.id}
                                    className="transform transition-transform duration-200 hover:scale-105 hover:shadow-xl relative"
                                    style={{ backgroundColor: 'var(--card)' }}
                                >
                                    {pod.activated === "true" && (
                                        <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                            Active
                                        </span>
                                    )}
                                    {pod.activated === "false" && (
                                        <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                                            Not Active
                                        </span>
                                    )}
                                    <CardHeader>
                                        <CardTitle>{pod.name}</CardTitle>
                                        <CardDescription>{pod.type}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p>{pod.description}</p>
                                    </CardContent>
                                    <div className="flex justify-between gap-2 p-4 pt-0">
                                        {/* Delete button */}
                                        <Dialog
                                            open={deletePodId === pod.id}
                                            onOpenChange={(open) => !open && setDeletePodId(null)}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeletePodId(pod.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Delete Pod: {pod.name}</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to delete this pod? All related items will also be deleted. This action cannot be undone.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setDeletePodId(null)}>Cancel</Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleDeletePod}
                                                        disabled={deleteLoading}
                                                    >
                                                        {deleteLoading ? 'Deleting...' : 'Delete'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Right side buttons */}
                                        <div className="flex gap-2">
                                            <Link href={`/pods/edit/${pod.id}`}>
                                                <Button size="sm" variant="outline">Edit</Button>
                                            </Link>
                                            {pod.activated === "true" ? (
                                                <Button size="sm" variant="default" onClick={() => handleDeactivate(pod)}>
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => handleActivate(pod)}>Activate</Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                            ))
                        )}
                    </div>
                </ScrollArea>
            )}

            {/* Activate Pod Confirmation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate Pod</DialogTitle>
                        <DialogDescription>Are you sure you want to activate this pod?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={confirmActivate}
                            disabled={activateLoading}
                        >
                            {activateLoading ? 'Activating...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Deactivate Modal */}
            <Dialog open={!!deactivatePod} onOpenChange={(open) => !open && setDeactivatePod(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate Pod</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate this pod? It will no longer be used by your bot.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeactivatePod(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeactivate}
                            disabled={deactivateLoading}
                        >
                            {deactivateLoading ? 'Deactivating...' : 'Deactivate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default PodPage;
