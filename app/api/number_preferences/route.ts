// app/api/message-preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

// GET: fetch preferences
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );

    const supabase = await createClientWithToken(token);
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const mode = url.searchParams.get("mode"); // optional ("block" | "allow")

    let query = supabase
      .from("number_preferences")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);
    if (mode) query = query.eq("mode", mode);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ preferences: data });
  } catch (err: any) {
    console.error("GET /number_preferences error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: add new preference
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );

    const supabase = await createClientWithToken(token);
    const body = await req.json();
    const { user_id, mode, phone_number } = body;

    if (!user_id || !mode || !phone_number) {
      return NextResponse.json(
        { error: "Required fields: user_id, mode, phone_number" },
        { status: 400 }
      );
    }

    const { data: pref, error } = await supabase
      .from("number_preferences")
      .insert({
        user_id,
        mode,
        phone_number,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ preference: pref }, { status: 201 });
  } catch (err: any) {
    console.error("POST /message-preferences error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: update a preference (e.g., change mode or number)
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );

    const supabase = await createClientWithToken(token);
    const body = await req.json();
    const { id, ...fieldsToUpdate } = body;

    if (!id) return NextResponse.json({ error: "Preference ID is required" }, { status: 400 });

    const filteredFields: Record<string, any> = {};
    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] !== undefined && fieldsToUpdate[key] !== null) {
        filteredFields[key] = fieldsToUpdate[key];
      }
    });

    if (Object.keys(filteredFields).length === 0) {
      return NextResponse.json(
        { error: "At least one field is required to update" },
        { status: 400 }
      );
    }

    const { data: pref, error } = await supabase
      .from("number_preferences")
      .update(filteredFields)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ preference: pref });
  } catch (err: any) {
    console.error("PUT /message-preferences error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: remove a preference
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );

    const supabase = await createClientWithToken(token);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Preference ID is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("number_preferences")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Preference deleted successfully", data });
  } catch (err: any) {
    console.error("DELETE /message-preferences error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
