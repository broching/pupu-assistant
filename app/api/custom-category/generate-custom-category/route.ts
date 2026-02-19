import { generateCustomCategoryWithAI } from "@/lib/custom-category/generateCustomCategoryWithAi";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const supabase = await createClientWithToken(token);

    // Get authenticated user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { userInput } = body;
    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { error: "userInput is required and must be a string" },
        { status: 400 }
      );
    }

    // Call AI to generate custom category
    const aiResult = await generateCustomCategoryWithAI({ userInput });

    // Return AI result directly
    return NextResponse.json(aiResult);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
