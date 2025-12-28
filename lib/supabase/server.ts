import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient({ useServiceRole = false } = {}) {
  const cookieStore = await cookies();
  console.log("Supabase key starts with:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 5));

  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
