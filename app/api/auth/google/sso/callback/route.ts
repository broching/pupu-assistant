import { createClientWithToken } from "@/lib/supabase/clientWithToken";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 1️⃣ Create SSR client (cookie-based)
  const supabase = await createClientWithToken();

  // 2️⃣ Exchange OAuth code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    console.error("OAuth exchange failed:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { user, session } = data;

  // 3️⃣ Create a client AUTHENTICATED as the user
  const authedSupabase = await createClientWithToken(session.access_token);

  // 4️⃣ Check if user already exists
  const { data: existingUser, error: checkError } = await authedSupabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("User lookup error:", checkError);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 5️⃣ Insert user + trial if new
  if (!existingUser) {
    const { error: userInsertError } = await authedSupabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        subscription: "free",
      });

    if (userInsertError) {
      console.error("User insert error:", userInsertError);
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: subError } = await authedSupabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_name: "free_trial",
        status: "trialing",
        trial_end: trialEnd.toISOString(),
      });

    if (subError) {
      console.error("Trial insert error:", subError);
    }
  }

  // 6️⃣ Redirect after success
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
