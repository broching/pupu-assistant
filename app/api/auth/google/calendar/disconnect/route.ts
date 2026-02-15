import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { oauth2Client } from "@/lib/google";
import { decrypt } from "@/lib/encryption/helper";

export async function POST(req: NextRequest) {
  try {
    /* ------------------------------------
       1️⃣ Auth: Require user access token
    ------------------------------------ */
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const supabase = await createClientWithToken(token);

    /* ------------------------------------
       2️⃣ Parse request body
    ------------------------------------ */
    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
    }

    /* ------------------------------------
        Delete calendar connection
    ------------------------------------ */
    const { data, error: deleteError } = await supabase
      .from("google_calendar_connections")
      .delete()
      .eq("user_id", userId)
      .eq("email_address", email);

    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json(
        { error: "Failed to delete canlendar connection" },
        { status: 500 }
      );
    }

    console.log("Deleted calendar connection:", data);

    /* ------------------------------------
        Success
    ------------------------------------ */
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Disconnect calendar error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
