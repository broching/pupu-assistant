"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import PricingQnA from "@/components/qna/PricingQnA";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen w-full">

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-gradient-to-br from-muted/70 to-muted/10">
        <h1 className="text-4xl sm:text-5xl font-bold max-w-3xl mb-6">
          Build AI-powered apps faster than ever
        </h1>
        <p className="text-lg sm:text-xl max-w-2xl mb-8">
          Start building smarter, faster, and more efficiently with modern tools and integrations.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
        <img
          src="https://placehold.co/600x400"
          alt="Hero Image"
          width={600}
          height={400}
          className="mt-12 rounded-xl shadow-lg"
        />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          <Card className="bg-gradient-to-br from-muted/70 to-muted/10">
            <CardHeader>
              <CardTitle>Fast Integration</CardTitle>
              <CardDescription>Connect your stack in minutes and start automating tasks seamlessly.</CardDescription>
            </CardHeader>
            <CardContent>
              <img src="https://placehold.co/400x250" alt="Feature 1" width={400} height={250} className="rounded-lg" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/70 to-muted/10">
            <CardHeader>
              <CardTitle>Intelligent Automation</CardTitle>
              <CardDescription>Use AI-powered tools to optimize your workflows and boost productivity.</CardDescription>
            </CardHeader>
            <CardContent>
              <img src="https://placehold.co/400x250" alt="Feature 2" width={400} height={250} className="rounded-lg" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/70 to-muted/10">
            <CardHeader>
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>Your data is protected with industry-standard security protocols.</CardDescription>
            </CardHeader>
            <CardContent>
              <img src="https://placehold.co/400x250" alt="Feature 3" width={400} height={250} className="rounded-lg" />
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="bg-gradient-to-br from-muted/70 to-muted/10 py-24 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to start?</h2>
        <p className="text-lg mb-8">Sign up now and start building smarter apps today.</p>
        <Button size="lg">Sign Up</Button>
      </section>

      <section className="mt-5" style={{marginBottom:"5rem"}}>
        <PricingQnA></PricingQnA>
      </section>

    </main>
  );
}
