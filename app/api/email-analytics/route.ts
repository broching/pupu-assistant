import { createClientWithToken } from "@/lib/supabase/clientWithToken"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return NextResponse.json(
            { error: "Authorization token required" },
            { status: 401 }
        );
    }
    const supabase = await createClientWithToken(token)

    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") ?? "7d"

    let days = 7
    if (range === "1d") days = 1
    if (range === "30d") days = 30
    if (range === "90d") days = 90

    const date = new Date()
    date.setDate(date.getDate() - days)

    const { data, error } = await supabase
        .from("email_ai_responses")
        .select(
            "id, message_id, message_status, message_score, flagged_keywords, created_at"
        )
        .gte("created_at", date.toISOString())
        .order("created_at", { ascending: false })

    if (error) {
        return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
}
