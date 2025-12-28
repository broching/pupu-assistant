// app/api/pods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            console.log('test')
            return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
        }

        const supabase = await createClientWithToken(token);
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        console.log('id:', id)

        if (id) {
            // Get single pod by ID
            const { data: pod, error } = await supabase
                .from("pods")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error(error)
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            return NextResponse.json({ pod });
        } else {
            // Get all pods for the authenticated user (RLS will filter automatically)
            const { data: pods, error } = await supabase.from("pods").select("*");
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ pods });
        }
    } catch (err: any) {
        console.error("GET /pods error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const { name, type, description, user_id } = await req.json();

        if (!name || !type || !description || !user_id) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Insert pod. RLS will automatically associate with the current user
        const { data: pod, error } = await supabase
            .from("pods")
            .insert({ name, type, description, user_id, activated: "false" })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ pod }, { status: 201 });
    } catch (err: any) {
        console.error("POST /pods error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const body = await req.json();
        const { id, ...fieldsToUpdate } = body;

        if (!id) {
            return NextResponse.json({ error: "Pod ID is required" }, { status: 400 });
        }

        // Remove undefined or null fields
        const filteredFields: Record<string, any> = {};
        Object.keys(fieldsToUpdate).forEach((key) => {
            if (fieldsToUpdate[key] !== undefined && fieldsToUpdate[key] !== null) {
                filteredFields[key] = fieldsToUpdate[key];
            }
        });

        if (Object.keys(filteredFields).length === 0) {
            return NextResponse.json({ error: "At least one field is required to update" }, { status: 400 });
        }

        // Always update updated_at
        filteredFields.updated_at = new Date().toISOString();

        const { data: pod, error } = await supabase
            .from("pods")
            .update(filteredFields)
            .eq("id", id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ pod });
    } catch (err: any) {
        console.error("PUT /pods error:", err);
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

        if (!id) return NextResponse.json({ error: "Pod ID is required" }, { status: 400 });

        // First, delete all items related to this pod
        const { error: itemsError } = await supabase
            .from("property_pod_items")
            .delete()
            .eq("pod_id", id);

        if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

        // Then delete the pod itself
        const { data: podData, error: podError } = await supabase
            .from("pods")
            .delete()
            .eq("id", id);

        if (podError) return NextResponse.json({ error: podError.message }, { status: 500 });

        return NextResponse.json({ message: "Pod and all related items deleted successfully", data: podData });
    } catch (err: any) {
        console.error("DELETE /pods error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

