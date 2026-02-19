import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json(
                { error: "Authorization token required" },
                { status: 401 }
            );
        }

        const supabase = await createClientWithToken(token);
        const body = await req.json();

        const {
            filter_id,
            connection_id,
            user_facing_category,
            category,
            description,
        } = body;

        // 🔐 Validate required fields
        if (
            !filter_id ||
            !connection_id ||
            !user_facing_category ||
            !category ||
            !description
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 🔐 Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // 🚀 Insert (RLS ensures user isolation)
        const { data, error } = await supabase
            .from("custom_categories")
            .insert({
                user_id: user.id,
                filter_id,
                connection_id,
                user_facing_category,
                category,
                description,
                weight: 70
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json(
                { error: "Authorization token required" },
                { status: 401 }
            );
        }

        const supabase = await createClientWithToken(token);

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Optional query params
        const { searchParams } = new URL(req.url);
        const filter_id = searchParams.get("filter_id");
        const connection_id = searchParams.get("connection_id");

        let query = supabase
            .from("custom_categories")
            .select("*")
            .eq("user_id", user.id);

        if (filter_id) {
            query = query.eq("filter_id", filter_id);
        }

        if (connection_id) {
            query = query.eq("connection_id", connection_id);
        }

        const { data, error } = await query.order("created_at", {
            ascending: false,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


export async function PUT(req: Request) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json(
                { error: "Authorization token required" },
                { status: 401 }
            );
        }

        const supabase = await createClientWithToken(token);
        const body = await req.json();

        const { id, user_facing_category, category, description, weight } = body;

        // 🔐 Validate required fields
        if (!id) {
            return NextResponse.json(
                { error: "Missing category ID" },
                { status: 400 }
            );
        }

        // 🔐 Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Build the update object dynamically (only include fields sent)
        const updateData: Record<string, any> = {};
        if (user_facing_category !== undefined) updateData.user_facing_category = user_facing_category;
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (weight !== undefined) updateData.weight = weight;

        // 🚀 Update the row (RLS ensures only user's own rows are affected)
        const { data, error } = await supabase
            .from("custom_categories")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        // 🔑 Get token from Authorization header
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
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Parse the query parameter for the category id
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Delete the category row (RLS ensures user can only delete their own)
        const { data, error } = await supabase
            .from("custom_categories")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: "Custom category deleted", data });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
