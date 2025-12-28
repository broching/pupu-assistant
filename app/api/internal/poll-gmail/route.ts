import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server"; // service role client

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // These are passed from the cron/master function
    const supabaseUserId = searchParams.get("userId"); // your internal user ID
    if (!supabaseUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1️⃣ Create Supabase client
    const supabase = await createClient({ useServiceRole: true });

    // 2️⃣ Fetch Gmail tokens & history for this user
    const { data: userTokens, error } = await supabase
      .from("user_gmail_tokens")
      .select("*")
      .eq("user_id", supabaseUserId)
      .single();

    if (error || !userTokens) {
      return NextResponse.json({ error: "User tokens not found" }, { status: 404 });
    }

    // 3️⃣ Set up Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // 4️⃣ Use historyId to fetch incremental changes
    const historyId = userTokens.watch_history_id;
    if (!historyId) {
      console.warn("No historyId found for user, skipping polling");
      return NextResponse.json({ success: false, message: "No historyId" });
    }

    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"], // only new messages
      labelId: "INBOX",
    });

    const histories = historyRes.data.history ?? [];
    console.log(`Found ${histories.length} new message(s)`);

    // 5️⃣ Update historyId to the latest one returned
    if (historyRes.data.historyId) {
      await supabase
        .from("user_gmail_tokens")
        .update({ watch_history_id: historyRes.data.historyId, updated_at: new Date().toISOString() })
        .eq("user_id", supabaseUserId);
    }
for (const h of histories) {
  if (!h.messages) continue;
  for (const msg of h.messages) {
    const messageRes = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "raw", // full raw content
    });

    const messageData = messageRes.data;
    console.log("Full raw message:", messageData);

    if (messageData.raw) {
      // Decode Base64 to readable string
      const buff = Buffer.from(messageData.raw, "base64url");
      const emailText = buff.toString("utf-8");
      console.log("Decoded email content:\n", emailText);
    }

    // Optional: still extract headers if needed
    // const headers = messageData.payload?.headers;
    // console.log("Headers:", headers);

    // TODO: send to Telegram or any notification service
  }
}

    return NextResponse.json({ success: true, newMessages: histories.length });
  } catch (err) {
    console.error("Error polling Gmail:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
