'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useApiClient } from '@/app/utils/axiosClient';
import { useUser } from '@/app/context/userContext';
import { ArrowLeft } from 'lucide-react';

function CreatePodPage() {
    const router = useRouter();
    const apiClient = useApiClient();
    const { user } = useUser()
    const userId = user?.id;
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validation
        if (!name.trim() || !type || !description.trim()) {
            toast.error('All fields are required.');
            return;
        }

        setLoading(true);

        try {
            let reqObj = { name, type, description, user_id: userId };
            console.log('reqObj', reqObj)
            const res = await apiClient.post('/api/pods', reqObj);

            toast.success('Pod created successfully!');
            router.push('/pods'); // Redirect back to pods page
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
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
            <Card style={{ backgroundColor: "var(--card)" }}>
                <CardHeader>
                    <CardTitle>Create New Pod</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create a pod to organize your items, making it easier to train and manage your bot.
                    </p>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="name">Pod Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter pod name"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="type">Pod Type</Label>
                            <Select value={type} onValueChange={(val) => setType(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select pod type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Property Listing">Property Listing</SelectItem>
                                    <SelectItem  disabled value="Insurance Policy">Insurance Policy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter a description"
                                rows={4}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Pod'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default CreatePodPage;
