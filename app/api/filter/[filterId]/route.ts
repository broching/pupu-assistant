import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: any }
) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json(
            { error: "Authorization token required" },
            { status: 401 }
        );
    }

    const supabase = await createClientWithToken(token);

    // 🔐 Get authenticated user from token
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 }
        );
    }

    const { filterId } = await params;

    if (!filterId) {
        return NextResponse.json(
            { error: "filterId is required" },
            { status: 400 }
        );
    }

    // 🔒 RLS-safe: filter by BOTH id and user_id
    const { data, error } = await supabase
        .from("filters")
        .select("*")
        .eq("id", filterId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        return NextResponse.json(
            { error: "Filter not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ filterId: string }> }
) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json(
            { error: "Authorization token required" },
            { status: 401 }
        );
    }

    const supabase = await createClientWithToken(token);
    const body = await req.json();

    // 🔐 Get authenticated user
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 }
        );
    }

    // ✅ Await params (required in App Router)
    const { filterId } = await params;

    if (!filterId) {
        return NextResponse.json(
            { error: "filterId is required" },
            { status: 400 }
        );
    }

    // Dynamically build payload
    // Keep mandatory fields and any toggles
    const payload = {
        user_id: user.id,
        ...body, // dynamically include all other keys
    };

    const { data, error } = await supabase
        .from("filters")
        .update(payload)
        .eq("id", filterId)
        .eq("user_id", user.id) // 🔒 RLS + ownership
        .select()
        .single();

    if (error || !data) {
        console.log("error", error);
        return NextResponse.json(
            { error: "Filter not found or update failed" },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
}


export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ filterId: string }> }
) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json(
            { error: "Authorization token required" },
            { status: 401 }
        );
    }

    const supabase = await createClientWithToken(token);

    // 🔐 Get authenticated user
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 }
        );
    }

    // ✅ Await params (App Router requirement)
    const { filterId } = await params;

    if (!filterId) {
        return NextResponse.json(
            { error: "filterId is required" },
            { status: 400 }
        );
    }

    const { error } = await supabase
        .from("filters")
        .delete()
        .eq("id", filterId)
        .eq("user_id", user.id); // 🔒 ownership check

    if (error) {
        return NextResponse.json(
            { error: "Failed to delete filter" },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}