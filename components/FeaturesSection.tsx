"use client";

import { motion, easeOut } from "framer-motion";

const fadeLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: easeOut },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: easeOut },
  },
};

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-16 px-6 w-full overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto space-y-32">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center"
        >
          What PuPu does for you
        </motion.h2>

        {/* Feature 1: Reduce Inbox Noise (text left, image right) */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-semibold">
              Email Classification
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              PuPu AI-powered filtering highlights your important emails and organizes your inbox. Never miss out on a deadline or important event again.
            </p>
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-2xl opacity-40 group-hover:opacity-70 transition" />
            <img
              src="/feature2.jpg"
              alt="Reduce Inbox Noise"
              className="relative rounded-2xl shadow-2xl w-full transition-transform duration-500 group-hover:scale-105"
            />
          </motion.div>
        </div>

        {/* Feature 2: Real-Time Alerts (image left, text right) */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative group order-last md:order-first"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-2xl opacity-40 group-hover:opacity-70 transition" />
            <img
              src="/feature1.jpg"
              alt="Real-Time Alerts"
              className="relative rounded-2xl shadow-2xl w-full transition-transform duration-500 group-hover:scale-105"
            />
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-semibold">
              Real-Time Alerts
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Receive instant notifications when important emails arrive —
              via Telegram or WhatsApp. Never miss critical updates again.
            </p>
          </motion.div>
        </div>

        {/* Feature 3: Smart Reminders & Calendar (text left, image right) */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-semibold">
              Smart Reminders & Calendar
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Schedule reminders effortlessly, and let PuPu automatically add
              important events to your calendar. Stay organized without lifting a finger.
            </p>
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative group order-last md:order-last"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-2xl opacity-40 group-hover:opacity-70 transition" />
            <img
              src="/feature3.png"
              alt="Smart Reminders & Calendar"
              className="relative rounded-2xl shadow-2xl w-full transition-transform duration-500 group-hover:scale-105"
            />
          </motion.div>
        </div>

        {/* Feature 4: Smart AI Replies (image left, text right) */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative group order-last md:order-first"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-2xl opacity-40 group-hover:opacity-70 transition" />
            <img
              src="/feature4.jpg"
              alt="Smart AI Replies"
              className="relative rounded-2xl shadow-2xl w-full transition-transform duration-500 group-hover:scale-105"
            />
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-semibold">
              Smart AI Replies
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Quickly generate AI-powered email responses with a single click.
              Save time while staying professional and on point.
            </p>
          </motion.div>
        </div>

        {/* Feature 5: Secure & Private (text left, image right) */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-semibold">
              Secure & Private
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We don’t store your email content.
              Your data is encrypted and stays protected with OAuth 2.0 and strict
              Supabase RLS policies.
            </p>
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative group order-last md:order-last"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-2xl opacity-40 group-hover:opacity-70 transition" />
            <img
              src="/feature5.jpg"
              alt="Secure & Private"
              className="relative rounded-2xl shadow-2xl w-full transition-transform duration-500 group-hover:scale-105"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
