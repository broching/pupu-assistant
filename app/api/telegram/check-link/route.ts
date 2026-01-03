import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "Missing userId" },
            { status: 400 }
        );
    }

    const supabase = await createClient({ useServiceRole: true });

    const { data, error } = await supabase
        .from("user_telegram_connections")
        .select("telegram_chat_id, telegram_username")
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        console.log("error from check link route:", error)
        return NextResponse.json(
            { error: "Telegram connection not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(
        {
            connected: true,
            telegram_chat_id: data.telegram_chat_id,
            telegram_username: data.telegram_username,
        },
        { status: 200 }
    );
}
