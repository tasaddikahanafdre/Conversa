# Conversa — AI Customer Support & Messaging Automation SaaS

Conversa is a self-service AI messaging automation SaaS built for Bangladeshi businesses on Facebook Messenger, Instagram, and WhatsApp.

---

## 🌟 Core Highlights

- **Native Multilingual AI**: Supports **Bangla**, **Banglish**, and **English** with real-time intent extraction.
- **7-Minute Zero-Touch Onboarding**: Business owners self-configure their AI without requiring manual setup from developers or platform admins.
- **Live Test Arena**: Real-time simulated mobile phone simulator to test conversations before going live.
- **Bangladeshi E-commerce Ecosystem**: Automated order detection and 1-click dispatch to **Steadfast Courier** and **Pathao Courier**.
- **Transparent BDT Billing**: Pay-As-You-Go per-conversation billing with bKash, Nagad, and card recharge support.
- **Human Handoff & Controls**: Global and per-thread master AI pause/resume switches.

---

## 🏗️ Architecture & Stack

- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL with strict Row-Level Security tenant isolation)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` for ultra-fast customer care and `gemini-1.5-pro` for complex catalog reasoning)
- **Messaging Integration**: Official Meta Graph API & Webhooks (`X-Hub-Signature-256` HMAC validation)
- **Courier Logistics**: Steadfast & Pathao Courier APIs

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials, Meta App credentials, and Gemini API key.

### 2. Run Database Migration
Apply the PostgreSQL migration found in `supabase/migrations/20261021_init_schema.sql` to your Supabase project.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
