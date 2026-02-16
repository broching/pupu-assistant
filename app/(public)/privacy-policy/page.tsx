// app/privacy-policy/page.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PrivacyPolicyPage() {
    const router = useRouter()
    const [tocOpen, setTocOpen] = useState(true);
    const toggleToc = () => setTocOpen(!tocOpen);

    return (
        <article className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
            {/* Sidebar TOC */}
            <aside className="col-span-12 xl:col-span-3 hidden xl:block sticky top-20 self-start">
                <Card className="p-4 mb-6">
                    <button
                        onClick={toggleToc}
                        className="flex justify-between w-full text-left font-semibold mb-2"
                        aria-expanded={tocOpen}
                    >
                        Table of Contents
                        <span className={`transition-transform ${tocOpen ? "rotate-180" : ""}`}>↑</span>
                    </button>
                    {tocOpen && (
                        <ul className="space-y-1 text-sm">
                            {[
                                ["introduction", "Introduction"],
                                ["personal-data", "1. Personal Data We Collect"],
                                ["how-we-use", "2. How We Use Personal Data"],
                                ["how-we-share", "3. How We Share Personal Data"],
                                ["retention", "4. Retention"],
                                ["security", "5. Security"],
                                ["rights", "6. Your Rights and Choices"],
                                ["changes", "7. Privacy Policy Changes"],
                                ["contact", "8. Contacting Us"],
                            ].map(([id, label]) => (
                                <li key={id}>
                                    <a href={`#${id}`} className="hover:text-blue-600 block">
                                        {label}
                                    </a>
                                </li>
                            ))}
                            <li key='terms&condition'>
                                <button onClick={ () => { router.push('/terms-and-conditions') }} className="hover:text-blue-600 block">
                                    Terms and conditions
                                </button>
                            </li>
                        </ul>
                    )}
                </Card>
            </aside>

            {/* Main Content */}
            <div className="col-span-12 xl:col-span-9 prose max-w-none space-y-8 " style={{ marginTop: "60px" }}>
                <h1 className="text-4xl font-bold">Privacy Policy – Gmail Assistant SaaS</h1>

                <p>Effective date: February 16, 2026</p>

                <p>
                    PuPuAssistant (“we,” “our,” or “the Service”) is committed to protecting your personal information.
                    This Privacy Policy explains how we collect, use, store, and secure your data when using our Gmail monitoring service.
                </p>

                {/* Sections */}
                <section id="introduction">
                    <h2>Introduction</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>By accessing or using our Service, you acknowledge that you have read and understood this Privacy Policy.</li>
                        <li>This policy applies to all users of the Gmail Assistant SaaS, including free trial and paid subscribers.</li>
                        <li>It covers how we handle Gmail data, messaging integrations, and billing/subscription data.</li>
                    </ul>
                </section>

                <section id="personal-data">
                    <h2>1. Personal Data We Collect</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>
                            <strong>Account Information:</strong> Name, email, and authentication credentials via Supabase.
                        </li>
                        <li>
                            <strong>Gmail Connection Data:</strong> OAuth tokens (read-only), Gmail account ID, and email metadata (subject, sender, timestamp) used for notifications.
                        </li>
                        <li>
                            <strong>Messaging Platform Data:</strong> Telegram ID or other identifiers required to deliver notifications.
                        </li>
                        <li>
                            <strong>Billing Information:</strong> Stored subscription status, plan type. Stripe handles all payment details.
                        </li>
                        <li>
                            <strong>Usage Data:</strong> App interactions, notifications delivered, device info (IP, browser type) for security purposes.
                        </li>
                    </ul>
                </section>

                <section id="how-we-use">
                    <h2>2. How We Use Personal Data</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Provide and maintain the Service, including Gmail notifications.</li>
                        <li>Authenticate users and ensure secure access.</li>
                        <li>Manage subscriptions, free trials, and billing.</li>
                        <li>Analyze anonymized usage to improve the Service.</li>
                        <li>Send updates, support messages, and notifications regarding the Service.</li>
                    </ul>
                </section>

                <section id="how-we-share">
                    <h2>3. How We Share Personal Data</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Third-party service providers: Supabase, Stripe, Telegram, etc., for supporting the Service.</li>
                        <li>Affiliates or business transfers: merger, acquisition, restructuring.</li>
                        <li>Legal obligations: comply with laws, protect rights, safety, and property.</li>
                        <li>With your consent: features designed to share information with other users.</li>
                    </ul>
                </section>

                <section id="retention">
                    <h2>4. Retention</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Data is retained only as long as necessary for Service functionality or legal obligations.</li>
                        <li>Account deletion triggers removal or anonymization of personal data.</li>
                        <li>Temporary data (logs, analytics) may be retained for a short period for performance and security purposes.</li>
                    </ul>
                </section>

                <section id="security">
                    <h2>5. Security</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>OAuth tokens are encrypted (AES-256-GCM).</li>
                        <li>Supabase Row-Level Security ensures users can only access their own data.</li>
                        <li>Access to server credentials is restricted; clients never see sensitive keys.</li>
                        <li>We implement industry-standard measures, but no system is completely secure.</li>
                    </ul>
                </section>

                <section id="rights">
                    <h2>6. Your Rights and Choices</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Access, correct, delete, or restrict processing of your personal data.</li>
                        <li>Withdraw consent where processing is based on consent.</li>
                        <li>Exercise rights via <a href="mailto:support@your-domain.com">support@your-domain.com</a>.</li>
                        <li>No automated decisions are made that impact legal rights.</li>
                        <li>We do not sell or share personal data for advertising purposes.</li>
                    </ul>
                </section>

                <section id="changes">
                    <h2>7. Privacy Policy Changes</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We may update this Privacy Policy periodically.</li>
                        <li>Changes will be posted with an updated effective date.</li>
                        <li>Continuing to use the Service constitutes acceptance of the changes.</li>
                    </ul>
                </section>

                <section id="contact">
                    <h2>8. Contacting Us</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>For questions or concerns, contact: <a href="mailto:support@your-domain.com">support@your-domain.com</a>.</li>
                    </ul>
                </section>
            </div>
        </article>
    );
}
