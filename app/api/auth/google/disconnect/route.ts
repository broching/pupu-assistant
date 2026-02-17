import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { oauth2Client } from "@/lib/google";
import { decrypt, safeDecrypt } from "@/lib/encryption/helper";

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
       3️⃣ Fetch Gmail token row
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

    if (!gmailToken.access_token || !gmailToken.refresh_token) {
      console.warn(`Gmail tokens missing for userId=${userId}, email=${email}`);
    }

    /* ------------------------------------
       4️⃣ Decrypt tokens (only if present)
    ------------------------------------ */
    let decryptedAccessToken: string | undefined;
    let decryptedRefreshToken: string | undefined;

    try {
      decryptedAccessToken = gmailToken.access_token ? safeDecrypt(gmailToken.access_token) : undefined;
      decryptedRefreshToken = gmailToken.refresh_token ? safeDecrypt(gmailToken.refresh_token) : undefined;
    } catch (decryptErr) {
      console.error("Failed to decrypt Gmail tokens:", decryptErr);
      return NextResponse.json(
        { error: "Failed to decrypt Gmail tokens" },
        { status: 500 }
      );
    }

    /* ------------------------------------
       5️⃣ Create OAuth client for THIS mailbox
    ------------------------------------ */
    oauth2Client.setCredentials({
      access_token: decryptedAccessToken,
      refresh_token: decryptedRefreshToken,
      scope: gmailToken.scope,
      token_type: gmailToken.token_type,
      expiry_date: gmailToken.expiry_date,
    });

    /* ------------------------------------
       6️⃣ Disable Gmail watch (optional)
    ------------------------------------ */
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      await gmail.users.stop({ userId: "me" });
      console.log(`Gmail watch stopped for ${email}`);
    } catch (watchErr) {
      console.error("Failed to stop Gmail watch:", watchErr);
    }

    /* ------------------------------------
       7️⃣ Delete Gmail connection
    ------------------------------------ */
    const { data, error: deleteError } = await supabase
      .from("user_gmail_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("email_address", email);

    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json(
        { error: "Failed to delete Gmail connection" },
        { status: 500 }
      );
    }
    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json(
        { error: "Failed to delete Gmail connection" },
        { status: 500 }
      );
    }
    console.log("Deleted Gmail connection:", data);

    /* ------------------------------------
    8 Delete filter connection
    ------------------------------------ */

    // If no filter_id, skip delete entirely
    if (!gmailToken?.filter_id) {
      console.log("No filter connection found — skipping delete");
    } else {
      const { error } = await supabase
        .from("filters")
        .delete()
        .eq("user_id", userId)
        .eq("id", gmailToken.filter_id);

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Failed to delete filter connection" },
          { status: 500 }
        );
      }

      console.log("Deleted filter (if existed)");
    }


    /* ------------------------------------
       8️⃣ Success
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
