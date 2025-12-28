import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bot_enabled, userId } = body;

        if (bot_enabled === undefined || !userId) {
            return NextResponse.json({ error: "bot_enabled and userId are required" }, { status: 400 });
        }

        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        // Create a server-side Supabase client
        const supabase = await createClientWithToken(token);
        console.log('bot enabled:', bot_enabled, userId)
        // Update the botEnabled status for the given user

        const { data: insertedUser, error: dbError } = await supabase
            .from('users')
            .update({ bot_enabled: bot_enabled })
            .eq('id', userId)
            .select()
        console.log("Supabase response:", { insertedUser, dbError });

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 401 });
        }

        return NextResponse.json({
            message: "Bot status updated successfully",
            user: insertedUser || null, // return the updated user row
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
