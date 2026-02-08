"use client"
import React from 'react';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '../ui/accordion';

function PricingQnA() {
  return (
    <section className="mt-20 max-w-7xl mx-auto px-4" style={{width:"96%"}}>
      {/* Heading */}
      <h2 className="mb-12 text-center text-4xl font-bold whitespace-nowrap">
        Questions & Answers
      </h2>

      {/* Accordions in row */}
      <div className="flex flex-wrap gap-12 justify-center text-2xl">
        {
          [
            {
              question: "Which plan should I choose?",
              answer:
                "If you’re just starting, the Free Trial gives full access for 14 days. Starter and Plus plans are ideal for individual users, while Professional is best for heavy usage or multiple Gmail accounts.",
            },
            {
              question: "What payment options are supported?",
              answer:
                "We accept all major credit and debit cards. Payments are processed securely via Stripe.",
            },
            {
              question: "Can I manage multiple Gmail accounts?",
              answer:
                "Yes! You can connect multiple Gmail accounts and manage them from your dashboard. Each account receives notifications independently.",
            },
            {
              question: "How do Gmail notifications work?",
              answer:
                "We use Gmail push notifications, not polling. When a new email arrives, you get a real-time alert on your preferred messaging app like Telegram or WhatsApp.",
            },
            {
              question: "Is my Gmail data safe?",
              answer:
                "Absolutely. We only request read-only access to your Gmail. OAuth tokens are stored securely, and we follow strict privacy and security standards.",
            },
            {
              question: "Can I customize notifications?",
              answer:
                "Yes! You can set filters based on sender, labels, or keywords, and prioritize which emails trigger alerts.",
            },
            {
              question: "Are there any limitations during the Free Trial?",
              answer:
                "The Free Trial provides full access for 14 days with one Gmail account. After the trial, you’ll need to choose a paid plan to continue receiving notifications.",
            },
            {
              question: "Does it integrate with other apps?",
              answer:
                "Currently, we support Telegram notifications, with WhatsApp and Slack integrations coming soon. Our API-first design allows future integrations easily.",
            },
            {
              question: "Can I change my subscription plan anytime?",
              answer:
                "Yes! You can upgrade, downgrade, or cancel your subscription anytime through the dashboard or Stripe customer portal.",
            },
          ]
            .map((item, index) => (
              <Accordion key={index} type="single" collapsible className="w-96 md:w-104">
                <AccordionItem value={`q${index + 1}`}>
                  <AccordionTrigger className="text-xl md:text-1xl font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-lg md:text-xl text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
      </div>
    </section>
  );
}

export default PricingQnA;
