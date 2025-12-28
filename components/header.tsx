'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { EnvVarWarning } from './env-var-warning';
import { ThemeSwitcher } from './theme-switcher';
import { AuthButton } from './auth-button';
import { hasEnvVars } from "@/lib/utils";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/userContext";
import { Menu } from 'lucide-react';

function Header() {
    const { user } = useUser();

    return (
        <nav className="w-full border-b border-b-foreground/10">
            
            <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5 h-16 text-sm relative">
                {/* Left: Logo */}
                <div className="flex gap-1 items-center font-semibold">
                    <Link className='flex items-center' href={"/"}>
                        <Image alt="Logo" width={40} height={40} src="/icons8-bear-80.png" />
                        <div className="text-lg">PuPu</div>
                    </Link>
                </div>

                {/* Middle: ThemeSwitcher (mobile only) */}
                <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
                    <ThemeSwitcher />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex gap-8 items-center font-semibold">
                    <Link href={"/about"}>About</Link>
                    <Link href={"/pricing"}>Pricing</Link>
                    <Link href={"/faqs"}>FAQs</Link>
                    <Link href={"/contact"}>Contact Us</Link>
                </div>

                {/* Right side (Desktop: Theme + Auth) */}
                <div className="hidden md:flex gap-1 items-center">
                    {!hasEnvVars ? <EnvVarWarning /> : <>
                        <ThemeSwitcher />
                        <AuthButton />
                    </>}
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
                            {/* Header in drawer */}
                            <SheetClose asChild>
                                <Link className='flex items-center gap-1 mb-4' href={"/"}>
                                    <Image alt="Logo" width={40} height={40} src="/icons8-bear-80.png" />
                                    <div className="text-lg font-semibold">PuPu</div>
                                </Link>
                            </SheetClose>

                            {/* Navigation Links */}
                            <div className="flex flex-col gap-4">
                                <SheetClose asChild>
                                    <Link href={"/about"} className="px-2 py-2 rounded hover:bg-gray-100">About</Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href={"/pricing"} className="px-2 py-2 rounded hover:bg-gray-100">Pricing</Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href={"/faqs"} className="px-2 py-2 rounded hover:bg-gray-100">FAQs</Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href={"/contact"} className="px-2 py-2 rounded hover:bg-gray-100">Contact Us</Link>
                                </SheetClose>
                            </div>

                            {/* Sign In / Sign Up Buttons */}
                            {!user && (
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
