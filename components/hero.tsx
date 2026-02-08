import Image from "next/image";
import { NextLogo } from "./next-logo";
import { SupabaseLogo } from "./supabase-logo";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-1 justify-center items-center">
        <Image alt="Logo" width={80} height={80} src="/panda.png" />
      </div>
      <h1 className="sr-only">AI Bot For Property Agents</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        The Best Bot To Save time on chats, so you can do the important work.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
