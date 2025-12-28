import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("reached");

    const supabase = await createClient({ useServiceRole: true });
    const { email, password} = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if user already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found (this is OK)
      console.error("User check error:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already used, please log in" },
        { status: 409 }
      );
    }

    // 2️⃣ Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/protected`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3️⃣ Insert into users table
    if (data.user) {
      const { error: dbError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        subscription: "free",
      });

      if (dbError) {
        console.error("Error inserting user:", dbError);
        return NextResponse.json(
          { error: "Signup succeeded, but failed to create user record" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ user: data.user });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
