// app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

// GET: fetch current user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

    const supabase = await createClientWithToken(token);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .single(); // RLS ensures it's the current user

    if (error) return NextResponse.json({ error: error.message }, { status: 401 });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("GET /user error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
// PUT: update current user
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

    const supabase = await createClientWithToken(token);
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(body)
      .eq('id', body.id)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("PUT /user error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE: delete current user
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });

    const supabase = await createClientWithToken(token);

    const { data, error } = await supabase
      .from("users")
      .delete()
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "User deleted successfully", data });
  } catch (err: any) {
    console.error("DELETE /user error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
