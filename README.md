# Conversa — AI Customer Support & Messaging Automation SaaS

Conversa is a self-service AI messaging automation SaaS built for Bangladeshi businesses on Facebook Messenger, Instagram, and WhatsApp.

---

## 🌟 Key Capabilities

- **Native Multilingual AI**: Comprehends **Bangla**, **Banglish**, and **English** with real-time customer intent extraction.
- **Official Meta Facebook Page Connection**: Official OAuth 2.0 flow with CSRF state protection, candidate page picker, AES-256-GCM encrypted token storage, health verification, and secure disconnection.
- **7-Minute Zero-Touch Onboarding**: Business owners self-configure their AI without requiring manual setup from developers or platform admins.
- **Live Test Arena**: Real-time simulated mobile phone simulator to test conversations before going live.
- **Bangladeshi E-commerce Ecosystem**: Automated order detection and 1-click dispatch to **Steadfast Courier** and **Pathao Courier**.
- **Transparent BDT Billing**: Pay-As-You-Go per-conversation billing with bKash, Nagad, and card recharge support.
- **Human Handoff & Controls**: Global and per-thread master AI pause/resume switches.

---

## 🏗️ Architecture & Stack

- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL with strict Row-Level Security tenant isolation)
- **Token Security**: Dedicated AES-256-GCM authenticated encryption service with tamper protection
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` for ultra-fast customer care and `gemini-1.5-pro` for complex catalog reasoning) + OpenRouter fallback abstraction
- **Messaging Integration**: Official Meta Graph API (`v21.0`) & Webhooks (`X-Hub-Signature-256` HMAC validation)
- **Courier Logistics**: Steadfast & Pathao Courier APIs

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js version 18.18+ or 20+ (Node v24 supported)
- npm version 9+
- A Supabase project (Free tier)
- Google AI Studio API Key (optional for live Gemini generations)
- Meta for Developers Account (for connecting Facebook Pages)

### 2. Environment Variables Setup
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key

# Token Encryption Secret (AES-256-GCM: 32 bytes hex or random string)
TOKEN_ENCRYPTION_SECRET=b65fa349d4791e846069c9b583f773425026993ce8abacb8f36c4ff98c199852

# AI Provider (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Meta Developer App (Facebook Messenger)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_GRAPH_API_VERSION=v21.0
META_WEBHOOK_VERIFY_TOKEN=conversa_verify_tok_99182
```

### 3. Database Migration
Run both migration scripts in your Supabase Dashboard **SQL Editor**:
1. `supabase/migrations/20261021_init_schema.sql` (Multi-tenant core schema, RLS policies, tables)
2. `supabase/migrations/20261021_step3_facebook_channels.sql` (Meta OAuth sessions and enhanced channel attributes)

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

## 📘 Meta Developer App Setup (Facebook Page Connection)

To connect a live Facebook Page to your Conversa workspace:

1. **Create an App**:
   - Go to [Meta for Developers](https://developers.facebook.com/apps).
   - Click **Create App** and choose **Business** (or add the **Facebook Login for Business** use case).
2. **Configure Facebook Login**:
   - Navigate to **Facebook Login > Settings**.
   - Add the following to **Valid OAuth Redirect URIs**:
     ```
     http://localhost:3000/api/auth/facebook/callback
     ```
     *(In production, replace `http://localhost:3000` with your production domain, e.g. `https://conversa.ai`)*.
3. **Copy App Credentials**:
   - Navigate to **App settings > Basic**.
   - Copy **App ID** and **App Secret**.
   - Paste them into your `.env.local`:
     ```env
     META_APP_ID=your_facebook_app_id
     META_APP_SECRET=your_facebook_app_secret
     ```
4. **Permissions Requested**:
   During the OAuth dialog, Conversa requests the following permissions:
   - `pages_show_list`: Retrieve Facebook Pages managed by the authorizing user.
   - `pages_messaging`: Receive incoming customer DMs and send automated AI responses.
   - `pages_manage_metadata`: Automatically subscribe the Page to Conversa's webhook app.
   - `pages_read_engagement`: Detect customer comments on Page posts for Comment-to-DM auto-replies.

---

## 🔐 Security & Token Encryption Architecture

- **Tenant Isolation**: Row-Level Security (RLS) is strictly enforced on all tables. Queries filter through `public.is_workspace_member(workspace_id)`.
- **Authenticated Encryption (AES-256-GCM)**:
  - All Page Access Tokens are encrypted with AES-256-GCM using unique 12-byte IVs and 16-byte authentication tags.
  - Plaintext tokens are NEVER stored in the database, returned in public API payloads, exposed to the browser, or logged.
  - Decryption is strictly restricted to server-side webhook subscriptions and token verification calls.
- **CSRF & OAuth Validation**:
  - Cryptographically secure 32-byte hex state parameter generated per authorization attempt.
  - Validated against database session records and HTTP-only session cookies with 15-minute expiration.
  - User cancellation, denied permissions, and expired sessions are gracefully trapped with user-friendly error banners.
- **Preserved Records on Disconnect**:
  - Disconnecting a channel flags `is_active: false` and sets `status: 'disconnected'` while safely preserving all prior customer conversations, messages, and captured orders.

---

## 🧪 Testing

Run the automated test suite for Facebook OAuth parameter generation and AES-256-GCM token encryption:
```bash
node --test scripts/test-facebook-auth.mjs
```
