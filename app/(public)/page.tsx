"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Mail, MessageCircle, CheckCircle } from "lucide-react";
import PricingQnA from "@/components/qna/PricingQnA";
import { useRouter } from "next/navigation";
import FeaturesSection from "@/components/FeaturesSection";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col min-h-screen w-full">

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-gradient-to-br from-muted/70 to-muted/10">
        <h1 className="text-4xl sm:text-5xl font-bold max-w-3xl mb-6 mt-10">
          Get Instant Alerts for Important Emails
        </h1>
        <p className="text-lg sm:text-xl max-w-2xl mb-8">
          Pupu monitors your email inbox and sends real-time notifications to Telegram and other messaging apps.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            Get Started
          </Button>

          <Button variant="outline" size="lg" onClick={() => router.push("/pricing")}>
            View Plans
          </Button>
        </div>

        <img
          src="/hero.png"
          alt="Gmail Assistant"
          width={750}
          height={300}
          className="mt-12 rounded-xl shadow-lg"
        />
      </section>
      <FeaturesSection />


      {/* Integrations / Social Proof */}
      <section className="py-16 px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
            Works with the tools you already use
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect your inbox and receive notifications instantly on your preferred messaging platforms.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-10 opacity-70">
            <img src="/logos/gmail.svg" alt="Gmail" className="h-10 grayscale hover:grayscale-0 transition" />
            <img src="/logos/telegram.svg" alt="Telegram" className="h-10 grayscale hover:grayscale-0 transition" />
            <img src="/logos/stripe.svg" alt="Stripe" className="h-10 grayscale hover:grayscale-0 transition" />
            <img src="/logos/supabase.svg" alt="Supabase" className="h-10 grayscale hover:grayscale-0 transition" />
          </div>

        </div>
      </section>

      {/* Pricing & QnA */}
      <section id="qna" className="mt-5 mb-20">
        <PricingQnA />
      </section>

    </main>
  );
}
