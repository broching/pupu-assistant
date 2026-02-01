import { createClient } from "@/lib/supabase/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 }
    );
  }

  const supabaseAuth = await createClientWithToken(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { reminderId } = await params;
  if (!reminderId) {
    return NextResponse.json(
      { error: "reminderId is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient({ useServiceRole: true });

  const { data, error } = await supabase
    .from("scheduled_reminders")
    .select("*")
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Reminder not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 }
    );
  }

  const supabaseAuth = await createClientWithToken(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { reminderId } = await params;
  if (!reminderId) {
    return NextResponse.json(
      { error: "reminderId is required" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const supabase = await createClient({ useServiceRole: true });

  const { data, error } = await supabase
    .from("scheduled_reminders")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 }
    );
  }

  const supabaseAuth = await createClientWithToken(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { reminderId } = await params;
  if (!reminderId) {
    return NextResponse.json(
      { error: "reminderId is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient({ useServiceRole: true });

  const { error } = await supabase
    .from("scheduled_reminders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
