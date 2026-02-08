"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { EnvVarWarning } from "./env-var-warning";
import { AuthButton } from "./auth-button";
import { hasEnvVars } from "@/lib/utils";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/userContext";
import { Menu } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { DialogTitle } from "@radix-ui/react-dialog";

function Header() {
    const { user, session } = useUser();

    // Scroll to a section by id
    const handleScroll = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-black shadow-sm mb-5">
            <div
                className="mx-auto flex justify-between items-center h-16 text-sm relative"
                style={{ width: "92%" }}
            >
                {/* Left: Logo + Dashboard */}
                <div className="flex items-center gap-2 font-semibold">
                    <Link href="/" className="flex items-center gap-1">
                        <Image alt="Logo" width={40} height={40} src="/panda.png" />
                        <span className="text-lg">PuPu</span>
                    </Link>

                    {user && session?.access_token && (
                        <Link href="/dashboard">
                            <Button size="sm" variant="outline">
                                Dashboard
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Middle: Page Links */}
                <div className="hidden md:flex gap-8 items-center font-semibold">
                    <button onClick={() => handleScroll("features")}>Features</button>
                    <button onClick={() => handleScroll("qna")}>FAQ</button>
                    <button onClick={() => handleScroll("qna")}>Pricing</button>
                </div>

                {/* Right: Theme + Auth */}
                <div className="hidden md:flex gap-2 items-center">
                    {!hasEnvVars ? (
                        <EnvVarWarning />
                    ) : (
                        <>
                            <ModeToggle />
                            <AuthButton />
                        </>
                    )}
                </div>

                {/* Mobile Drawer */}
                <div className="md:hidden flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu />
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="right" className="w-64 flex flex-col p-5 gap-6">
                            {/* Drawer Header */}
                            <SheetClose asChild>
                                <Link className="flex items-center gap-1 mb-4" href="/">
                                    <Image alt="Logo" width={40} height={40} src="/panda.png" />
                                    <div className="text-lg font-semibold">PuPu</div>
                                </Link>
                            </SheetClose>

                            {/* Page Links */}
                            <div className="flex flex-col gap-4">
                                <SheetClose asChild>
                                    <button onClick={() => handleScroll("features")} className="px-2 py-2 rounded">
                                        Features
                                    </button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <button onClick={() => handleScroll("qna")} className="px-2 py-2 rounded">
                                        FAQ
                                    </button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <button className="px-2 py-2 rounded">
                                        <Link href="/pricing">Pricing</Link>
                                    </button>
                                </SheetClose>
                                {user && session?.access_token && (
                                    <SheetClose asChild>
                                        <Button className="px-2 py-2 rounded rounded">
                                            <Link href="/dashboard">
                                                Dashboard
                                            </Link>
                                        </Button>

                                    </SheetClose>
                                )}
                            </div>

                            {/* Sign In / Sign Up */}
                            {!user && !session?.access_token && (
                                <div className="flex flex-col gap-2">
                                    <SheetClose asChild>
                                        <Link href="/auth/login">
                                            <Button variant="outline" className="w-full">
                                                Sign In
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Link href="/auth/sign-up">
                                            <Button variant="default" className="w-full">
                                                Sign Up
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                </div>
                            )}
                        </SheetContent>
                        <DialogTitle></DialogTitle>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}

export default Header;
