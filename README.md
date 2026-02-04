# 📧 Gmail Assistant SaaS

A secure, AI-powered Gmail monitoring service that notifies users about important emails via messaging platforms—without replacing Gmail.

---

## 🚀 What This App Does

This SaaS allows users to connect one or more Gmail accounts and receive real-time notifications when new emails arrive. Instead of constantly checking Gmail, users get concise alerts and summaries through messaging apps.

Key goals:
- Reduce inbox noise
- Highlight important emails
- Deliver notifications where users already are (Telegram, WhatsApp, etc.)

---

## 🧭 Core User Flow

1. User signs up / logs in
2. User connects Gmail via Google OAuth
3. App subscribes to Gmail push notifications
4. New email arrives → backend processes it
5. User receives a notification (summary / alert)
6. User can manage or disconnect Gmail accounts anytime

---

## 🔐 Security & Permissions

- Gmail access is **read-only**
- No sending, deleting, or modifying emails
- OAuth tokens stored securely
- All sensitive operations require authenticated sessions
- Supabase Row-Level Security (RLS) ensures users can only access their own data
- Service-role credentials are never exposed to clients

---

## 🧩 Key Features

### Implemented
- Gmail OAuth connection
- Multiple Gmail accounts per user
- Gmail connection management (list, disconnect)
- Gmail push notifications (no polling)
- Telegram notifications
- Clean onboarding UI with collapsible steps
- **Subscriptions & billing**: Stripe Subscriptions, 14-day free trial, Starter / Plus / Professional tiers, pricing page, customer portal, webhooks

### Planned / In Progress
- AI email classification & summaries
- Importance filtering & rules
- WhatsApp integration
- Per-connection naming
- Keyword, sender, and label-based filters

---

## 🛠 Tech Stack

### Frontend
- Next.js (App Router)
- React (Client Components)
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react

### Backend
- Next.js API routes
- Google Gmail API
- Google OAuth 2.0
- Axios-based API client

### Auth & Database
- Supabase (Auth, Database, RLS)
- JWT-based sessions

### Billing
- Stripe Subscriptions (Checkout, Customer Portal, Webhooks)
- `subscriptions` table in Supabase; RLS enabled

### Notifications
- Telegram Bot API
- Extensible to WhatsApp, Slack, SMS, etc.

---

## 🧠 Architecture Notes

- Uses Gmail **push notifications**, not polling
- Designed for multi-user, multi-account scalability
- Clear separation between frontend UI and backend API logic
- Emphasis on least-privilege access and safe defaults

---

## 💳 Subscriptions & Stripe

- **Tiers**: Free Trial (14 days), Starter ($1.99/mo), Plus ($4.99/mo), Professional ($9.99/mo).
- **Free trial**: Starts on signup; stored in `subscriptions` with `trial_end`. No Stripe subscription for trial.
- **API routes**: `POST /api/stripe/checkout`, `POST /api/stripe/portal`, `POST /api/stripe/webhook`. `GET /api/subscription` returns current plan (use `Authorization: Bearer <access_token>`).
- **Access control**: `getSubscription(userId)` and `canAccessPlan(userId, plan)` server-side; `useSubscription()` and `<SubscriptionGuard requiredPlan="plus">` client-side.
- **Env vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_PROFESSIONAL`. Webhook URL: `https://your-domain.com/api/stripe/webhook`; events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

---

## 🧠 Mental Model

> “A Gmail signal amplifier — not an inbox replacement.”

---
