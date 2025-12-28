import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    return new Response("test", {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

}
