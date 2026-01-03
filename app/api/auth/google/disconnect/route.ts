import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { oauth2Client } from "@/lib/google";

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
       3️⃣ Fetch Gmail token row (ONE email)
    ------------------------------------ */
    const { data: rows, error: fetchError } = await supabase
      .from("user_gmail_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("email_address", email)
      .limit(1);

    if (fetchError || !rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Gmail connection not found" },
        { status: 404 }
      );
    }

    const gmailToken = rows[0];

    /* ------------------------------------
       4️⃣ Create OAuth client for THIS mailbox
    ------------------------------------ */
    oauth2Client.setCredentials({
      access_token: gmailToken.access_token,
      refresh_token: gmailToken.refresh_token,
      scope: gmailToken.scope,
      token_type: gmailToken.token_type,
      expiry_date: gmailToken.expiry_date,
    });

    /* ------------------------------------
       5️⃣ Disable Gmail watch (THIS EMAIL ONLY)
    ------------------------------------ */
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      await gmail.users.stop({
        userId: "me",
      });

      console.log(`Gmail watch stopped for ${email}`);
    } catch (watchErr) {
      // Log but DO NOT block deletion
      console.error("Failed to stop Gmail watch:", watchErr);
    }

    /* ------------------------------------
       6️⃣ Delete ONLY this Gmail connection
    ------------------------------------ */
    const {data, error: deleteError } = await supabase
      .from("user_gmail_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("email_address", email);

    console.log("delete data:",data)
    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json(
        { error: "Failed to delete Gmail connection" },
        { status: 500 }
      );
    }

    /* ------------------------------------
       7️⃣ Success
    ------------------------------------ */
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Disconnect Gmail error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
