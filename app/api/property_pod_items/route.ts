// app/api/property-pod-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token)
            return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        const podId = url.searchParams.get("podId"); // get podId from query

        if (id) {
            // Get single property pod item
            const { data: item, error } = await supabase
                .from("property_pod_items")
                .select("*")
                .eq("id", id)
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 404 });
            return NextResponse.json({ item });
        } else {
            if (!podId)
                return NextResponse.json({ error: "podId query parameter required" }, { status: 400 });

            // Get all items for the specific pod
            const { data: items, error } = await supabase
                .from("property_pod_items")
                .select("*")
                .eq("pod_id", podId);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ items });
        }
    } catch (err: any) {
        console.error("GET /property_pod_items error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const body = await req.json();

        const requiredFields = [
            "user_id",
            "pod_id",
            "title",
            "address",
            "postal_code",
            "district",
            "region",
            "price",
            "property_type",
            "tenure",
            "size_sqft",
            "bedrooms",
            "bathrooms"
        ];

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ error: `Field "${field}" is required` }, { status: 400 });
            }
        }

        const { data: item, error } = await supabase
            .from("property_pod_items")
            .insert([body])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ item }, { status: 201 });
    } catch (err: any) {
        console.error("POST /property-pod-items error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const body = await req.json();

        if (!body.id) return NextResponse.json({ error: "Item ID is required" }, { status: 400 });

        const { data: item, error } = await supabase
            .from("property_pod_items")
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq("id", body.id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ item });
    } catch (err: any) {
        console.error("PUT /property-pod-items error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Item ID is required" }, { status: 400 });

        const { data, error } = await supabase.from("property_pod_items").delete().eq("id", id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ message: "Item deleted successfully", data });
    } catch (err: any) {
        console.error("DELETE /property-pod-items error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
