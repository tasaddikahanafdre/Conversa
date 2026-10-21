# Conversa — AI Customer Support & Messaging Automation SaaS

Conversa is a self-service AI messaging automation SaaS built for Bangladeshi businesses on Facebook Messenger, Instagram, and WhatsApp.

---

## 🌟 Key Capabilities

- **Native Multilingual AI**: Comprehends **Bangla**, **Banglish**, and **English** with real-time customer intent extraction.
- **7-Minute Zero-Touch Onboarding**: Business owners self-configure their AI without requiring manual setup from developers or platform admins.
- **Live Test Arena**: Real-time simulated mobile phone simulator to test conversations before going live.
- **Bangladeshi E-commerce Ecosystem**: Automated order detection and 1-click dispatch to **Steadfast Courier** and **Pathao Courier**.
- **Transparent BDT Billing**: Pay-As-You-Go per-conversation billing with bKash, Nagad, and card recharge support.
- **Human Handoff & Controls**: Global and per-thread master AI pause/resume switches.

---

## 🏗️ Architecture & Stack

- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL with strict Row-Level Security tenant isolation)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` for ultra-fast customer care and `gemini-1.5-pro` for complex catalog reasoning) + OpenRouter fallback abstraction
- **Messaging Integration**: Official Meta Graph API & Webhooks (`X-Hub-Signature-256` HMAC validation)
- **Courier Logistics**: Steadfast & Pathao Courier APIs

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js version 18.18+ or 20+ (Node v24 supported)
- npm version 9+
- A Supabase project (Free tier)
- Google AI Studio API Key (optional for live Gemini generations)

### 2. Environment Variables Setup
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key

# AI Provider (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Meta Developer App (Facebook Messenger)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_WEBHOOK_VERIFY_TOKEN=conversa_verify_tok_99182
```

### 3. Database Migration
Run the SQL migration script located at:
`supabase/migrations/20261021_init_schema.sql`
inside your Supabase Dashboard **SQL Editor**.

> **Note on Email Confirmations in Supabase**:
> By default, Supabase requires users to click an email verification link before signing in.
> - To test immediately in development without clicking verification links:
>   Navigate to **Authentication > Providers > Email** in your Supabase dashboard and toggle **Confirm email** to **OFF**.

### 4. Install & Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔐 Security Architecture

- **Tenant Isolation**: Row-Level Security (RLS) is strictly enforced on all tables. Queries filter through `public.is_workspace_member(workspace_id)`.
- **Privilege Separation**: The Supabase service role key is strictly isolated to server-side tasks and is never bundled into client JavaScript.
- **Secret Encryption**: Social channel access tokens are stored encrypted rather than in plaintext.
- **Webhook Nonce Verification**: Every Meta webhook payload is verified with `x-hub-signature-256` HMAC SHA-256 using the Meta App Secret.

---

## ⚠️ Known Limitations & Setup Requirements (Milestone 1 & 2)

1. **Meta App Review**: For external businesses to connect their Facebook pages publicly, the Meta App must undergo Meta App Review for `pages_messaging` and `pages_manage_metadata`.
2. **AI API Key**: In local mode without `GEMINI_API_KEY`, the Test Arena runs on the built-in Conversa rule-engine simulator. Add your Gemini API key in `.env.local` for dynamic LLM generation.
