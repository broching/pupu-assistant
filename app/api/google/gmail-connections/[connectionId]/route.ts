import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

export async function GET(req: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
    try {
        // ✅ Await params (App Router requirement)
        const { connectionId } = await params;

        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
        }

        const supabase = await createClientWithToken(token);

        // 🔐 Get authenticated user
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        if (!connectionId) {
            return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
        }

        // Fetch the single Gmail connection for the user
        const { data, error } = await supabase
            .from("user_gmail_tokens")
            .select("*")
            .eq("id", connectionId)
            .eq("user_id", user.id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (err: any) {
        console.error("GET /gmail-connections/[connectionId] error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ connectionId: string }> }
) {
    try {
        // ✅ Await params
        const { connectionId } = await params;

        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
        }

        const supabase = await createClientWithToken(token);

        // 🔐 Get authenticated user
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        if (!connectionId) {
            return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
        }

        const body = await req.json();
        const {  filter_id } = body;


        // Update the Gmail connection
        const { data, error } = await supabase
            .from("user_gmail_tokens")
            .update({
                filter_id: filter_id || null,// null if default
            })
            .eq("id", connectionId)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error || !data) {
            return NextResponse.json({ error: error?.message || "Failed to update connection" }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("PUT /gmail-connections/[connectionId] error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}