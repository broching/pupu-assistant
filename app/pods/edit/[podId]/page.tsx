'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useApiClient } from '@/app/utils/axiosClient';
import { useUser } from '@/app/context/userContext';
import { ArrowLeft, Plus } from 'lucide-react';
import TopPodEditCard from '@/components/common/topPodEditCard';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
} from "@/components/ui/table";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

function EditPodPage() {
    const router = useRouter();
    const { podId } = useParams();
    const apiClient = useApiClient();
    const { user, session } = useUser();

    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const [items, setItems] = useState<any[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);

    // Delete modal state
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch pod data on mount
    useEffect(() => {
        if (!podId || !session?.access_token) return;

        const fetchPod = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/api/pods?id=${podId}`);
                const pod = res.data.pod;
                setName(pod.name);
                setType(pod.type);
                setDescription(pod.description);
            } catch (err: any) {
                console.error(err);
                toast.error(err?.response?.data?.error || 'Failed to load pod');
            } finally {
                setLoading(false);
            }
        };

        fetchPod();
    }, [podId, session?.access_token]);

    // Fetch pod items
    useEffect(() => {
        if (!podId || !session?.access_token) return;

        const fetchItems = async () => {
            setItemsLoading(true);
            try {
                const res = await apiClient.get(`/api/property_pod_items?podId=${podId}`);
                setItems(res.data.items || []);
            } catch (err: any) {
                console.error(err);
                toast.error(err?.response?.data?.error || 'Failed to load pod items');
            } finally {
                setItemsLoading(false);
            }
        };

        fetchItems();
    }, [podId, session?.access_token]);

    // Pod update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !description.trim()) {
            toast.error('Name and description are required.');
            return;
        }

        setLoading(true);
        try {
            const reqObj = { id: podId, name, type, description };
            await apiClient.put('/api/pods', reqObj);
            toast.success('Pod updated successfully!');
            router.push('/pods');
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || 'Failed to update pod');
        } finally {
            setLoading(false);
        }
    };

    // Delete item
    const handleDeleteItem = async (itemId: string) => {
        setDeleteLoading(true);
        try {
            await apiClient.delete(`/api/property_pod_items?id=${itemId}`);
            toast.success('Item deleted successfully!');
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            setDeleteItemId(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || 'Failed to delete item');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center"
                onClick={() => router.push('/pods')}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pods
            </Button>

            {/* Top Pod Edit Card */}
            <TopPodEditCard
                handleSubmit={handleSubmit}
                name={name}
                setName={setName}
                type={type}
                description={description}
                setDescription={setDescription}
                loading={loading}
            />

            {/* Pod Items Card */}
            <Card style={{ backgroundColor: "var(--card)" }}>
                <CardHeader className="flex justify-between items-start gap-1">
                    <div>
                        <CardTitle className="text-left">Pod Items</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Update your pod items. This is what the bot will learn from.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => router.push(`/pods/edit/${podId}/createItem`)}
                        className="flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Item
                    </Button>
                </CardHeader>

                <CardContent>
                    {itemsLoading ? (
                        <p>Loading items...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="border-r border-darkgray-300">Actions</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Postal Code</TableHead>
                                    <TableHead>District</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Property Type</TableHead>
                                    <TableHead>Tenure</TableHead>
                                    <TableHead>Size (sqft)</TableHead>
                                    <TableHead>Bedrooms</TableHead>
                                    <TableHead>Bathrooms</TableHead>
                                    <TableHead>Unit Number</TableHead>
                                    <TableHead>Floor Level</TableHead>
                                    <TableHead>Furnishing</TableHead>
                                    <TableHead>Available From</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Developer</TableHead>
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Year Built</TableHead>
                                    <TableHead>MRT Info</TableHead>
                                    <TableHead>Verified Listing</TableHead>
                                    <TableHead>Listing URL</TableHead>
                                    <TableHead>Listing Type</TableHead>
                                    <TableHead>Facilities</TableHead>
                                    <TableHead>Restrictions</TableHead>
                                    <TableHead>Nearby Buildings</TableHead>
                                    <TableHead>Listing Status</TableHead>
                                    <TableHead>Lease Term</TableHead>
                                    <TableHead>Maintenance Fee</TableHead>
                                    <TableHead>Extra Information</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={32} className="text-left text-muted-foreground">
                                            No items yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="border-r border-darkgray-300">
                                                <Button
                                                    size="sm"
                                                    className="mr-2 bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => router.push(`/pods/edit/${podId}/editItem/${item.id}`)}
                                                >
                                                    Edit
                                                </Button>

                                                <Dialog open={deleteItemId === item.id} onOpenChange={(open) => !open && setDeleteItemId(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="destructive" onClick={() => setDeleteItemId(item.id)}>
                                                            Delete
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Confirm Delete</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to delete this item? This action cannot be undone.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="ghost" onClick={() => setDeleteItemId(null)}>Cancel</Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                disabled={deleteLoading}
                                                            >
                                                                {deleteLoading ? 'Deleting...' : 'Delete'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>

                                            <TableCell>{item.title}</TableCell>
                                            <TableCell>{item.address}</TableCell>
                                            <TableCell>{item.postal_code}</TableCell>
                                            <TableCell>{item.district}</TableCell>
                                            <TableCell>{item.region}</TableCell>
                                            <TableCell>{item.price}</TableCell>
                                            <TableCell>{item.property_type}</TableCell>
                                            <TableCell>{item.tenure}</TableCell>
                                            <TableCell>{item.size_sqft}</TableCell>
                                            <TableCell>{item.bedrooms}</TableCell>
                                            <TableCell>{item.bathrooms}</TableCell>
                                            <TableCell>{item.unit_number}</TableCell>
                                            <TableCell>{item.floor_level || '-'}</TableCell>
                                            <TableCell>{item.furnishing || '-'}</TableCell>
                                            <TableCell>{item.available_from || '-'}</TableCell>
                                            <TableCell>{item.description || '-'}</TableCell>
                                            <TableCell>{item.developer || '-'}</TableCell>
                                            <TableCell>{item.project_name || '-'}</TableCell>
                                            <TableCell>{item.year_built || '-'}</TableCell>
                                            <TableCell>{item.mrt_info || '-'}</TableCell>
                                            <TableCell>{item.verified_listing ? 'Yes' : 'No'}</TableCell>
                                            <TableCell>
                                                {item.listing_url ? (
                                                    <a href={item.listing_url} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                                                        Link
                                                    </a>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{item.listing_type || '-'}</TableCell>
                                            <TableCell>{item.facilities?.join(", ") || '-'}</TableCell>
                                            <TableCell>{item.restrictions || '-'}</TableCell>
                                            <TableCell>{item.nearby_buildings?.join(", ") || '-'}</TableCell>
                                            <TableCell>{item.listing_status || '-'}</TableCell>
                                            <TableCell>{item.lease_term || '-'}</TableCell>
                                            <TableCell>{item.maintenance_fee || '-'}</TableCell>
                                            <TableCell>{item.extra_information || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

            </Card>
        </div>
    );
}

export default EditPodPage;
