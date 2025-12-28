'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useApiClient } from '@/app/utils/axiosClient';
import { useUser } from '@/app/context/userContext';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TagInput from '@/components/common/MultiSelectCustomValueInput';

function EditItemPage() {
    const router = useRouter();
    const { podId, itemId } = useParams(); // Expect URL like /pods/edit/[podId]/editItem/[itemId]
    const apiClient = useApiClient();
    const { user, session } = useUser();
    const userId = user?.id;

    // form
    const [form, setForm] = useState<{
        title: string;
        address: string;
        postal_code: string;
        district: string;
        region: string;
        price: string;
        property_type: string;
        tenure: string;
        size_sqft: string;
        bedrooms: string;
        bathrooms: string;
        unit_number: string;
        description: string;
        furnishing: string;
        available_from: string;
        developer: string;
        project_name: string;
        year_built: string;
        mrt_info: string;
        verified_listing: boolean;
        listing_url: string;
        listing_type: string;
        facilities: string[];       // <-- explicitly typed
        restrictions: string;
        nearby_buildings: string[]; // <-- explicitly typed
        listing_status: string;
        lease_term: string;
        maintenance_fee: string;
        extra_information: string;
    }>({
        title: "",
        address: "",
        postal_code: "",
        district: "",
        region: "",
        price: "",
        property_type: "",
        tenure: "",
        size_sqft: "",
        bedrooms: "",
        bathrooms: "",
        unit_number: "",
        description: "",
        furnishing: "",
        available_from: "",
        developer: "",
        project_name: "",
        year_built: "",
        mrt_info: "",
        verified_listing: false,
        listing_url: "",
        listing_type: "",
        facilities: [],       // now correctly typed as string[]
        restrictions: "",
        nearby_buildings: [], // now correctly typed as string[]
        listing_status: "available",
        lease_term: "",
        maintenance_fee: "",
        extra_information: "",
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!itemId) return;

        const fetchItem = async () => {
            if (!itemId || !session?.access_token) return; // wait for token
            setFetching(true);
            try {
                const res = await apiClient.get(`/api/property_pod_items?id=${itemId}`);
                const item = res.data.item;

                if (item) {
                    setForm({
                        title: item.title || "",
                        address: item.address || "",
                        postal_code: item.postal_code || "",
                        district: item.district || "",
                        region: item.region || "",
                        price: item.price ? String(item.price) : "",
                        property_type: item.property_type || "",
                        tenure: item.tenure || "",
                        size_sqft: item.size_sqft ? String(item.size_sqft) : "",
                        bedrooms: item.bedrooms ? String(item.bedrooms) : "",
                        bathrooms: item.bathrooms ? String(item.bathrooms) : "",
                        unit_number: item.unit_number || "",
                        description: item.description || "",
                        furnishing: item.furnishing || "",
                        available_from: item.available_from || "",
                        developer: item.developer || "",
                        project_name: item.project_name || "",
                        year_built: item.year_built ? String(item.year_built) : "",
                        mrt_info: item.mrt_info || "",
                        verified_listing: item.verified_listing || false,
                        listing_url: item.listing_url || "",
                        listing_type: item.listing_type || "",
                        facilities: Array.isArray(item.facilities) ? item.facilities : [],
                        restrictions: item.restrictions || "",
                        nearby_buildings: Array.isArray(item.nearby_buildings) ? item.nearby_buildings : [],
                        listing_status: item.listing_status || "available",
                        lease_term: item.lease_term || "",
                        maintenance_fee: item.maintenance_fee ? String(item.maintenance_fee) : "",
                        extra_information: item.extra_information || "",
                    });
                }
            } catch (err: any) {
                console.error(err);
                toast.error(err?.response?.data?.error || "Failed to fetch item");
            } finally {
                setFetching(false);
            }
        };

        fetchItem();
    }, [itemId, session?.access_token]);


    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (
            !form.title.trim() ||
            !form.address.trim() ||
            !form.postal_code.trim() ||
            !form.district.trim() ||
            !form.region.trim() ||
            !form.price ||
            !form.property_type.trim() ||
            !form.tenure.trim() ||
            !form.size_sqft ||
            !form.bedrooms ||
            !form.bathrooms ||
            !form.unit_number.trim() ||
            !form.description.trim()
        ) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setLoading(true);

        try {
            const reqObj = {
                id: itemId,
                user_id: userId,
                pod_id: podId,

                // Required fields
                title: form.title,
                address: form.address,
                postal_code: form.postal_code,
                district: form.district,
                region: form.region,
                price: parseFloat(form.price),
                property_type: form.property_type,
                tenure: form.tenure,
                size_sqft: parseFloat(form.size_sqft),
                bedrooms: parseInt(form.bedrooms),
                bathrooms: parseInt(form.bathrooms),
                unit_number: form.unit_number,
                description: form.description,

                // Optional fields
                furnishing: form.furnishing || null,
                available_from: form.available_from || null,
                developer: form.developer || null,
                project_name: form.project_name || null,
                year_built: form.year_built ? parseInt(form.year_built) : null,
                mrt_info: form.mrt_info || null,
                verified_listing: form.verified_listing,
                listing_url: form.listing_url || null,

                // New fields
                listing_type: form.listing_type || null,
                facilities: form.facilities || [],
                restrictions: form.restrictions || null,
                nearby_buildings: form.nearby_buildings || [],
                listing_status: form.listing_status || "available",
                lease_term: form.lease_term || null,
                maintenance_fee: form.maintenance_fee ? parseFloat(form.maintenance_fee) : null,
                extra_information: form.extra_information || null,
            };

            await apiClient.put("/api/property_pod_items", reqObj);

            toast.success("Item updated successfully!");
            router.push(`/pods/edit/${podId}`);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Failed to update item");
        } finally {
            setLoading(false);
        }
    };


    if (fetching) return <p>Loading item...</p>;

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center mb-4"
                onClick={() => router.push(`/pods/edit/${podId}`)}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pod
            </Button>

            <Card style={{ backgroundColor: 'var(--card)' }}>
                <CardHeader>
                    <CardTitle>Edit Pod Item</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Update this item. Changes will reflect in your pod and what the bot learns.
                    </p>
                </CardHeader>

                <CardContent>
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        {/* Required fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Enter item title"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="unit_number">Unit Number *</Label>
                                <Input
                                    id="unit_number"
                                    value={form.unit_number}
                                    onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                                    placeholder="e.g., #12-34"
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder="Enter property address"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="listing_type">Listing Type *</Label>
                                <Select
                                    value={form.listing_type}
                                    onValueChange={(value) => setForm({ ...form, listing_type: value })}
                                >
                                    <SelectTrigger id="listing_type" className="w-full">
                                        <SelectValue placeholder="Select listing type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sale">Sale</SelectItem>
                                        <SelectItem value="Rent">Rent</SelectItem>
                                        <SelectItem value="Lease">Lease</SelectItem>
                                        <SelectItem value="Short-Term Rent">Short-Term Rent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                            <div>
                                <Label htmlFor="postal_code">Postal Code *</Label>
                                <Input
                                    id="postal_code"
                                    value={form.postal_code}
                                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                                    placeholder="123456"
                                    required
                                    type='number'
                                    onKeyDown={(e) => {
                                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <Label htmlFor="district">District *</Label>
                                <Input
                                    id="district"
                                    value={form.district}
                                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                                    placeholder="Enter district"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="region">Region *</Label>
                                <Select
                                    value={form.region}
                                    onValueChange={(value) => setForm({ ...form, region: value })}
                                    required
                                >
                                    <SelectTrigger id="region" className="w-full">
                                        <SelectValue placeholder="Select a region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Central">Central</SelectItem>
                                        <SelectItem value="East">East</SelectItem>
                                        <SelectItem value="North">North</SelectItem>
                                        <SelectItem value="North-East">North-East</SelectItem>
                                        <SelectItem value="West">West</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                            <div>
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    placeholder="Enter price in SGD"
                                    required
                                    onKeyDown={(e) => {
                                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <Label htmlFor="property_type">Property Type *</Label>
                                <Select
                                    value={form.property_type}
                                    onValueChange={(value) => setForm({ ...form, property_type: value })}
                                    required
                                >
                                    <SelectTrigger id="property_type" className="w-full">
                                        <SelectValue placeholder="Select property type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Condo">Condo</SelectItem>
                                        <SelectItem value="HDB">HDB</SelectItem>
                                        <SelectItem value="Landed">Landed</SelectItem>
                                        <SelectItem value="Executive Condo">Executive Condo</SelectItem>
                                        <SelectItem value="Commercial">Commercial</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="tenure">Tenure *</Label>
                                <Select
                                    value={form.tenure}
                                    onValueChange={(value) => setForm({ ...form, tenure: value })}
                                    required
                                >
                                    <SelectTrigger id="tenure" className="w-full">
                                        <SelectValue placeholder="Select tenure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Freehold">Freehold</SelectItem>
                                        <SelectItem value="99-year lease">99-year lease</SelectItem>
                                        <SelectItem value="999-year lease">999-year lease</SelectItem>
                                        <SelectItem value="9999-year lease">9999-year lease</SelectItem>
                                        <SelectItem value="103-year lease">103-year lease</SelectItem>
                                        <SelectItem value="92-year lease">92-year lease</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                            <div>
                                <Label htmlFor="size_sqft">Size (sqft) *</Label>
                                <Input
                                    id="size_sqft"
                                    type="number"
                                    value={form.size_sqft}
                                    onChange={(e) => setForm({ ...form, size_sqft: e.target.value })}
                                    placeholder="e.g., 850"
                                    required
                                    onKeyDown={(e) => {
                                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <Label htmlFor="bedrooms">Bedrooms *</Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    value={form.bedrooms}
                                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                                    placeholder="e.g., 2"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="bathrooms">Bathrooms *</Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    value={form.bathrooms}
                                    onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                                    placeholder="e.g., 2"
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Enter property description"
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>


                        {/* Extra Info Section */}
                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                                Extra Information (Optional)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Furnishing</Label>
                                    <Input
                                        name="furnishing"
                                        value={form.furnishing}
                                        onChange={handleChange}
                                        placeholder="Fully Furnished / Partial"
                                    />
                                </div>
                                <div>
                                    <Label>Available From</Label>
                                    <Input
                                        name="available_from"
                                        type="date"
                                        value={form.available_from}
                                        onChange={handleChange}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </div>

                                <div>
                                    <Label>Year Built</Label>
                                    <Input
                                        type="number"
                                        name="year_built"
                                        value={form.year_built}
                                        onChange={handleChange}
                                        placeholder="2015"
                                    />
                                </div>
                                <div>
                                    <Label>Developer</Label>
                                    <Input
                                        name="developer"
                                        value={form.developer}
                                        onChange={handleChange}
                                        placeholder="Developer Name"
                                    />
                                </div>
                                <div>
                                    <Label>Project Name</Label>
                                    <Input
                                        name="project_name"
                                        value={form.project_name}
                                        onChange={handleChange}
                                        placeholder="Project Name"
                                    />
                                </div>
                                <div>
                                    <Label>MRT Info</Label>
                                    <Input
                                        name="mrt_info"
                                        value={form.mrt_info}
                                        onChange={handleChange}
                                        placeholder="Near Clementi MRT"
                                    />
                                </div>
                                <div>
                                    <TagInput
                                        label="Facilities"
                                        value={form.facilities}
                                        onChange={(val) => setForm({ ...form, facilities: val })}
                                        exampleTag="e.g., Pool"
                                        placeholder="Type a facility and press Enter"
                                    />
                                </div>
                                <div>
                                    <TagInput
                                        label="Nearby Buildings"
                                        value={form.nearby_buildings}
                                        onChange={(val) => setForm({ ...form, nearby_buildings: val })}
                                        exampleTag="e.g., ION Orchard"
                                        placeholder="Type a building and press Enter"
                                    />
                                </div>
                                <div>
                                    <Label>Maintenance Fee/month</Label>
                                    <Input
                                        name="maintenance_fee"
                                        value={form.maintenance_fee}
                                        onChange={handleChange}
                                        placeholder="250"
                                        type="number"
                                        onKeyDown={(e) => {
                                            if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label>Listing URL</Label>
                                    <Input
                                        name="listing_url"
                                        value={form.listing_url}
                                        onChange={handleChange}
                                        placeholder="https://example.com/listing"
                                    />
                                </div>

                                <div>
                                    <Label>Lease Term</Label>
                                    <Input
                                        name="lease_term"
                                        value={form.lease_term}
                                        onChange={handleChange}
                                        placeholder="1 year minimum"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        id="verifiedListing"
                                        type="checkbox"
                                        checked={form.verified_listing}
                                        onChange={(e) =>
                                            setForm({ ...form, verified_listing: e.target.checked })
                                        }
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="verifiedListing" className="cursor-pointer">
                                        Verified Listing
                                    </Label>
                                </div>

                            </div>
                            <div>
                                <Label>Restrictions</Label>
                                <Input
                                    name="restrictions"
                                    value={form.restrictions}
                                    onChange={handleChange}
                                    placeholder="No Dogs/ No Smoking"
                                />
                            </div>
                            <div className="mt-4">
                                <Label>Extra Information</Label>
                                <Textarea
                                    name="extra_information"
                                    value={form.extra_information}
                                    onChange={handleChange}
                                    placeholder="Write more details about the property that we may have missed out..."
                                />
                            </div>


                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? 'updating...' : 'Update Item'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default EditItemPage;
