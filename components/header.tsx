'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { EnvVarWarning } from './env-var-warning';
import { AuthButton } from './auth-button';
import { hasEnvVars } from "@/lib/utils";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/userContext";
import { Menu } from 'lucide-react';
import { ModeToggle } from './mode-toggle';

function Header() {
    const { user, session } = useUser();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-black shadow-sm mb-5">
            <div
                className="mx-auto flex justify-between items-center h-16 text-sm relative"
                style={{ width: "92%" }}
            >

                {/* ---------------- Left: Logo + PuPu ---------------- */}
                <div className="flex items-center gap-2 font-semibold">
                    <Link href="/" className="flex items-center gap-1">
                        <Image alt="Logo" width={40} height={40} src="/panda.png" />
                        <span className="text-lg">PuPu</span>
                    </Link>

                    {/* Dashboard button (only if signed in) */}
                    {user && session?.access_token && (
                        <Link href="/dashboard">
                            <Button size="sm" variant="outline">Dashboard</Button>
                        </Link>
                    )}
                </div>

                {/* ---------------- Middle: Page Links ---------------- */}
                <div className="hidden md:flex gap-8 items-center font-semibold">
                    <Link href="/about">About</Link>
                    <Link href="/pricing">Pricing</Link>
                    <Link href="/contact">Contact Us</Link>
                </div>

                {/* ---------------- Right: Theme + Auth ---------------- */}
                <div className="hidden md:flex gap-2 items-center">
                    {!hasEnvVars ? <EnvVarWarning /> : <>
                        <ModeToggle />
                        <AuthButton />
                    </>}
                </div>

                {/* ---------------- Mobile Drawer ---------------- */}
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
                                <Link className='flex items-center gap-1 mb-4' href="/">
                                    <Image alt="Logo" width={40} height={40} src="/panda.png" />
                                    <div className="text-lg font-semibold">PuPu</div>
                                </Link>
                            </SheetClose>

                            {/* Page Links */}
                            <div className="flex flex-col gap-4">
                                <SheetClose asChild>
                                    <Link href="/pricing" className="px-2 py-2 rounded hover:bg-gray-100">Pricing</Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/contact" className="px-2 py-2 rounded hover:bg-gray-100">Contact Us</Link>
                                </SheetClose>
                                {user && session?.access_token && (
                                    <SheetClose asChild>
                                        <Link href="/dashboard" className="px-2 py-2 rounded hover:bg-gray-100">Dashboard</Link>
                                    </SheetClose>
                                )}
                            </div>

                            {/* Sign In / Sign Up Buttons */}
                            {!user && !session?.access_token && (
                                <div className="flex flex-col gap-2">
                                    <SheetClose asChild>
                                        <Link href="/auth/login">
                                            <Button variant="outline" className="w-full">Sign In</Button>
                                        </Link>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Link href="/auth/sign-up">
                                            <Button variant="default" className="w-full">Sign Up</Button>
                                        </Link>
                                    </SheetClose>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}

export default Header;
