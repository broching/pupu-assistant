
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 }
    );
  }

  const supabase = await createClientWithToken(token);
  const body = await req.json();

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

  const { data, error } = await supabase
    .from("filters")
    .insert({
      user_id: user.id, // ✅ derived, not trusted
      filter_name: body.filter_name,
      email_connection_id: body.email_connection_id,
      notification_mode: body.notification_mode,
      watch_tags: body.watch_tags,
      ignore_tags: body.ignore_tags,
      enable_first_time_sender_alert:
        body.enable_first_time_sender_alert,
      enable_thread_reply_alert: body.enable_thread_reply_alert,
      enable_deadline_alert: body.enable_deadline_alert,
      enable_subscription_payment_alert:
        body.enable_subscription_payment_alert
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function GET(req: Request) {
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

  const { data, error } = await supabase
    .from("filters")
    .select("*")
    .eq("user_id", user.id) // ✅ explicit user scoping
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
