import { NextRequest, NextResponse } from "next/server";
import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { getSubscription } from "@/lib/subscription/server";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = await createClientWithToken(token);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getSubscription(user.id);
    if (!state) {
      return NextResponse.json({
        planName: "free_trial",
        status: "trialing",
        isTrialing: false,
        isActive: false,
        trialEnd: null,
        currentPeriodEnd: null,
        hasAccess: false,
      });
    }
    return NextResponse.json(state);
  } catch (err) {
    console.error("Subscription fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
