"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/app/context/userContext";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useUser(); // ✅ now inside component

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();

    router.push("/auth/login");
  };

  return <Button onClick={handleLogout}>Logout</Button>;
}
