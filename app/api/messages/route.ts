// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const url = new URL(req.url);
        const userId = url.searchParams.get("user_id");
        const contactNumber = url.searchParams.get("contact_number"); // optional
        const limit = Number(url.searchParams.get("limit"));

        // Optional resolved filter
        const resolvedParam = url.searchParams.get("resolved"); // "true" | "false" | null
        let resolvedFilter: boolean | null = null;
        if (resolvedParam === "true") resolvedFilter = true;
        else if (resolvedParam === "false") resolvedFilter = false;

        // Build query
        let query = supabase
            .from("messages")
            .select("*")
            .order("timestamp", { ascending: false })

        if (userId) query = query.eq("user_id", userId);
        if (contactNumber) query = query.eq("contact_number", contactNumber);
        if (resolvedFilter !== null) query = query.eq("resolved", resolvedFilter);
        if ( limit ) query = query.limit(limit);

        const { data, error } = await query;

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ messages: data });
    } catch (err: any) {
        console.error("GET /messages error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

        const supabase = await createClientWithToken(token);
        const body = await req.json();
        const {
            user_id,
            contact_number,
            contact_name,
            body: messageBody,
            type,
            has_media,
            media_url,
            timestamp,
            score,
            urgency,
            insights,
            actions,
            resolved
        } = body;

        if (!user_id || !contact_number || !messageBody || !type) {
            return NextResponse.json({ error: "Required fields: user_id, contact_number, body, type" }, { status: 400 });
        }

        const { data: message, error } = await supabase
            .from("messages")
            .insert({
                user_id,
                contact_number,
                contact_name,
                body: messageBody,
                type,
                has_media: has_media ?? false,
                media_url: media_url ?? null,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                score: score ?? null,
                urgency: urgency ?? null,
                insights: insights ?? null,
                actions: actions ?? null,
                resolved: resolved ?? null
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ message }, { status: 201 });
    } catch (err: any) {
        console.error("POST /messages error:", err);
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

        if (!id) return NextResponse.json({ error: "Message ID is required" }, { status: 400 });

        const filteredFields: Record<string, any> = {};
        Object.keys(fieldsToUpdate).forEach((key) => {
            if (fieldsToUpdate[key] !== undefined && fieldsToUpdate[key] !== null) {
                filteredFields[key] = fieldsToUpdate[key];
            }
        });

        if (Object.keys(filteredFields).length === 0) {
            return NextResponse.json({ error: "At least one field is required to update" }, { status: 400 });
        }

        filteredFields.updated_at = new Date().toISOString();

        const { data: message, error } = await supabase
            .from("messages")
            .update(filteredFields)
            .eq("id", id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ message });
    } catch (err: any) {
        console.error("PUT /messages error:", err);
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

        if (!id) return NextResponse.json({ error: "Message ID is required" }, { status: 400 });

        const { data, error } = await supabase.from("messages").delete().eq("id", id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ message: "Message deleted successfully", data });
    } catch (err: any) {
        console.error("DELETE /messages error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
