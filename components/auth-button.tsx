'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { useUser } from "@/app/context/userContext";

export function AuthButton() {
  const { user, displayName, session } = useUser();

  return (user && session?.access_token) ? (
    <div className="flex items-center gap-4">
      <span className="hidden md:inline">Hey, {displayName}!</span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
