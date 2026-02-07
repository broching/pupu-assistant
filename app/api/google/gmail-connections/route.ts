// app/api/gmail/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
        }

        const supabase = await createClientWithToken(token);
        const url = new URL(req.url);
        const id = url.searchParams.get("userId");

        if (id) {
            // Get single pod by ID
            const { data, error } = await supabase
                .from("user_gmail_tokens")
                .select("*")
                .eq("user_id", id);

            if (error) {
                console.error(error)
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            console.log("data", data)
            return NextResponse.json({ data });
        }
    } catch (err: any) {
        console.error("GET /gmail-connections error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
