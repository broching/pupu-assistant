"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useUser } from "@/app/context/userContext";
import Link from "next/link";
import { User, LogOut } from "lucide-react";

export default function ProtectedHeader() {
  const { user, logout } = useUser();

  return (
    <header className="w-full flex items-center justify-between px-12 py-3 bg-theme-card-hex">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/panda.png"
            alt="Pupu Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-lg font-bold text-theme-text">PuPu</span>
        </Link>
      </div>

      {/* Right: Theme + Profile */}
      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full p-2 border border-theme-border-01 hover:ring-1 hover:ring-theme-fg-4"
            >
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {/* User email */}
            <DropdownMenuItem disabled>
              <span className="text-sm font-medium">{user?.email || "user@example.com"}</span>
            </DropdownMenuItem>

            {/* Divider */}
            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex items-center justify-between"
            >
              Logout
              <LogOut className="w-4 h-4 ml-2" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
