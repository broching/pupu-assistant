import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Expect userId passed from frontend
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connect-telegram?error=missing_user`
    );
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    throw new Error("TELEGRAM_BOT_USERNAME not set");
  }

  // Telegram deep link
  const telegramUrl = `https://t.me/${botUsername}?start=${encodeURIComponent(
    userId
  )}`;

  return NextResponse.redirect(telegramUrl);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId } = body;
  console.log('userID:', userId)

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const supabase = await createClientWithToken();

  // 1️⃣ Delete Telegram connection
  const { data, error } = await supabase
    .from("user_telegram_connections")
    .delete()
    .eq("user_id", userId);

  console.log("Supabase delete response:", { data, error });

  if (error) {
    return NextResponse.json(
      { error: "Failed to disconnect Telegram", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, deleted: data });
}

