"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Mail, MessageCircle, CheckCircle } from "lucide-react";
import PricingQnA from "@/components/qna/PricingQnA";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen w-full">

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-gradient-to-br from-muted/70 to-muted/10">
        <h1 className="text-4xl sm:text-5xl font-bold max-w-3xl mb-6 mt-10">
          Your Gmail, Smarter and Faster
        </h1>
        <p className="text-lg sm:text-xl max-w-2xl mb-8">
          Get real-time notifications for important emails without leaving your messaging apps. Reduce inbox noise, stay focused, and never miss what matters.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
        <img
          src="/hero.png"
          alt="Gmail Assistant"
          width={1000}
          height={500}
          className="mt-12 rounded-xl shadow-lg"
        />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Gmail Assistant</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          <Card className="bg-gradient-to-br from-muted/70 to-muted/10">
            <CardHeader>
              <CardTitle>Real-Time Alerts</CardTitle>
              <CardDescription>Receive instant notifications when important emails arrive—via Telegram, WhatsApp, or other messaging apps.</CardDescription>
            </CardHeader>
            <CardContent>
              <img src="/feature1.jpg" alt="Real-Time Alerts" width={400} height={250} className="rounded-lg" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/70 to-muted/10">
            <CardHeader>
              <CardTitle>Reduce Inbox Noise</CardTitle>
              <CardDescription>Focus on what matters most. AI-powered filtering highlights important emails and suppresses distractions.</CardDescription>
            </CardHeader>
            <CardContent>
              <img src="/feature2.jpg" alt="Reduce Inbox Noise" width={400} height={250} className="rounded-lg" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/70 to-muted/10">
            <CardHeader>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>Read-only Gmail access. We don't store your actual email data and Your data stays safe with OAuth 2.0 and strict Supabase RLS rules.</CardDescription>
            </CardHeader>
            <CardContent>
              <img src="/feature3.jpg" alt="Secure & Private" width={400} height={250} className="rounded-lg" />
            </CardContent>
          </Card>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-muted/70 to-muted/10 text-center">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 max-w-5xl mx-auto">

          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-600 text-white">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">Connect Gmail</h3>
            <p>Securely connect one or more Gmail accounts via Google OAuth.</p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-600 text-white">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">Receive Notifications</h3>
            <p>Get real-time alerts for important emails on your preferred messaging app.</p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-purple-600 text-white">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">Stay Focused</h3>
            <p>Filter out noise, prioritize what matters, and manage Gmail connections anytime.</p>
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
