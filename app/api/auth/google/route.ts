import { NextRequest, NextResponse } from "next/server";
import { oauth2Client, GMAIL_SCOPES } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Get userId from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required in query params" },
        { status: 400 }
      );
    }

    // 2️⃣ Generate Google OAuth URL with user.id in state
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // allows refresh_token
      prompt: "consent",      // forces consent every time
      scope: GMAIL_SCOPES,
      state: userId           // securely map tokens to this user
    });

    // 3️⃣ Redirect user to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Failed to generate Google OAuth URL:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
