import React from 'react';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '../ui/accordion';

function PricingQnA() {
  return (
    <section className="mt-20 max-w-7xl mx-auto px-4">
      {/* Heading */}
      <h2 className="mb-12 text-center text-4xl font-bold  font-bold whitespace-nowrap">
        Questions & Answers
      </h2>

      {/* Accordions in row */}
      <div className="flex flex-wrap gap-12 justify-center text-2xl">
        {[
          {
            question: "What is the right plan for me?",
            answer:
              "If you’re just getting started, the Free Trial gives you full access with no commitment. Starter and Plus are great for individual users, while Professional is best for heavy usage or multiple connections.",
          },
          {
            question: "What are my payment options?",
            answer:
              "We accept all major credit and debit cards. Payments are processed securely through Stripe.",
          },
          {
            question: "How does usage-based pricing work?",
            answer:
              "Your subscription gives you a base level of access. If usage-based features apply, you’ll only be billed for what you actually use, with full transparency in your billing portal.",
          },
          {
            question: "How can I see and manage my usage?",
            answer:
              "You can view usage, invoices, and manage your subscription directly from the Stripe billing portal.",
          },
          {
            question: "How does Cursor use my data?",
            answer:
              "Your data is processed only to provide the service and is never sold. We follow industry best practices for security and privacy.",
          },
          {
            question: "Where can I ask more questions?",
            answer:
              "You can reach out to our support team anytime via email or through your dashboard.",
          },
        ].map((item, index) => (
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
