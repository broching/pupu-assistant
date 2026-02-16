// app/terms-and-conditions/page.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TermsAndConditionsPage() {
    const router = useRouter();
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
                                ["acceptance", "1. Acceptance of Terms"],
                                ["eligibility", "2. Eligibility"],
                                ["accounts", "3. Accounts and Security"],
                                ["subscriptions", "4. Subscriptions and Billing"],
                                ["use-of-service", "5. Use of Service"],
                                ["prohibited", "6. Prohibited Conduct"],
                                ["termination", "7. Termination"],
                                ["disclaimer", "8. Disclaimer of Warranties"],
                                ["limitation", "9. Limitation of Liability"],
                                ["changes", "10. Changes to Terms"],
                                ["contact", "11. Contact Information"],
                            ].map(([id, label]) => (
                                <li key={id}>
                                    <a href={`#${id}`} className="hover:text-blue-600 block">
                                        {label}
                                    </a>
                                </li>
                            ))}
                            <li key='privacy'>
                                <button
                                    onClick={() => router.push("/privacy-policy")}
                                    className="hover:text-blue-600 block"
                                >
                                    Privacy Policy
                                </button>
                            </li>
                        </ul>
                    )}
                </Card>
            </aside>

            {/* Main Content */}
            <div className="col-span-12 xl:col-span-9 prose max-w-none space-y-8" style={{ marginTop: "60px" }}>
                <h1 className="text-4xl font-bold">Terms and Conditions – Gmail Assistant SaaS</h1>

                <p>Effective date: February 16, 2026</p>

                <p>
                    Welcome to PuPuAssistant. These Terms and Conditions (“Terms”) govern your access to and use of our
                    Gmail monitoring service (“Service”). By using the Service, you agree to be bound by these Terms.
                </p>

                {/* Sections */}
                <section id="introduction">
                    <h2>Introduction</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>These Terms apply to all users, including free trial and paid subscribers.</li>
                        <li>By accessing the Service, you agree to comply with these Terms and all applicable laws.</li>
                        <li>Our Privacy Policy explains how we collect and use your data.</li>
                    </ul>
                </section>

                <section id="acceptance">
                    <h2>1. Acceptance of Terms</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>By using the Service, you accept these Terms in full.</li>
                        <li>If you do not agree, do not use the Service.</li>
                        <li>We may update Terms from time to time; continued use constitutes acceptance of changes.</li>
                    </ul>
                </section>

                <section id="eligibility">
                    <h2>2. Eligibility</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>You must be at least 18 years old or have legal capacity in your jurisdiction to use the Service.</li>
                        <li>Children under 18 are not allowed to use the Service.</li>
                    </ul>
                </section>

                <section id="accounts">
                    <h2>3. Accounts and Security</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Users must create an account to access the Service.</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                        <li>Notify us immediately of any unauthorized use of your account.</li>
                    </ul>
                </section>

                <section id="subscriptions">
                    <h2>4. Subscriptions and Billing</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We offer a free trial and paid tiers: Starter, Plus, Professional.</li>
                        <li>Billing is handled via Stripe; we do not store full credit card details.</li>
                        <li>Subscription fees are charged in advance and are non-refundable except as required by law.</li>
                    </ul>
                </section>

                <section id="use-of-service">
                    <h2>5. Use of Service</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>The Service is for personal or internal business use only.</li>
                        <li>You may connect Gmail accounts for notifications only; read-only access is provided.</li>
                        <li>You are responsible for any content you submit via the Service.</li>
                    </ul>
                </section>

                <section id="prohibited">
                    <h2>6. Prohibited Conduct</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Do not use the Service for illegal activities.</li>
                        <li>Do not attempt to bypass security or access other users’ accounts.</li>
                        <li>Do not reverse engineer, modify, or distribute the Service.</li>
                    </ul>
                </section>

                <section id="termination">
                    <h2>7. Termination</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We may suspend or terminate your access if you violate these Terms.</li>
                        <li>Termination does not relieve you of obligations incurred prior to termination.</li>
                        <li>Sections on limitation of liability and governing law survive termination.</li>
                    </ul>
                </section>

                <section id="disclaimer">
                    <h2>8. Disclaimer of Warranties</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>The Service is provided “as is” without warranties of any kind.</li>
                        <li>We do not guarantee that the Service will be error-free or uninterrupted.</li>
                    </ul>
                </section>

                <section id="limitation">
                    <h2>9. Limitation of Liability</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We are not liable for indirect, incidental, or consequential damages.</li>
                        <li>Maximum liability is limited to the amount you paid for the Service in the last 12 months.</li>
                    </ul>
                </section>

                <section id="changes">
                    <h2>10. Changes to Terms</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We may update Terms periodically; updated Terms will have a new effective date.</li>
                        <li>Continued use of the Service after changes constitutes acceptance of the new Terms.</li>
                    </ul>
                </section>

                <section id="contact">
                    <h2>11. Contact Information</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Questions about these Terms can be sent to <a href="mailto:support@your-domain.com">support@your-domain.com</a>.</li>
                    </ul>
                </section>
            </div>
        </article>
    );
}
