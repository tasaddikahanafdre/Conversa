import Link from "next/link";
import {
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Truck,
  TrendingUp,
  CreditCard,
  Layers,
  Clock,
  Smartphone,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white selection:bg-blue-600 selection:text-white">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-center text-xs font-medium text-slate-300">
        🇧🇩 Built specifically for Bangladeshi businesses — Native Bangla, Banglish & English AI customer automation
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo/logo.png" alt="Conversa - Always online. Always on point." className="h-8 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-xs font-medium text-slate-300 transition hover:text-white">
              How it works
            </a>
            <a href="#features" className="text-xs font-medium text-slate-300 transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="text-xs font-medium text-slate-300 transition hover:text-white">
              Pricing (BDT)
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Start Free Trial
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-28 text-center md:pt-32">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />

        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            Self-Service Customer Support Automation
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
            Turn Facebook & Instagram chats into{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-600 bg-clip-text text-transparent">
              non-stop sales
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Train an intelligent AI sales agent on your products, delivery fees, and return policies in 7 minutes.
            Auto-reply to customer DMs, comment inquiries, extract customer orders, and dispatch to couriers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500 sm:w-auto"
            >
              Build Your AI Agent Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/test-arena"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-8 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white sm:w-auto"
            >
              <Smartphone className="h-4 w-4 text-blue-400" />
              Live Interactive Simulator
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Native Bangla & Banglish AI
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Steadfast & Pathao integration
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              bKash / Nagad BDT billing
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-900 bg-slate-900/40 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold tracking-widest text-blue-400 uppercase">Self-Onboarding In 3 Steps</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Go live in under 7 minutes — zero technical skills required
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Create Workspace & Teach AI</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Enter your business name, select your preferred language (Banglish, Bangla, or English), and set your delivery charges and return policies.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Test in Live Phone Arena</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Chat with your AI assistant in our real-time mobile simulator. Test real inquiries like &ldquo;Delivery charge koto?&rdquo; before connecting customers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Connect Channels & Automate</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Connect your Facebook Business Page. The AI immediately takes over inquiries, captures customer orders, and gives your team live handoff control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="border-t border-slate-900 bg-slate-950 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold tracking-widest text-blue-400 uppercase">Engineered For BD E-Commerce</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Powerful customer care features built for growth
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Banglish & Bangla Natural AI</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Trained specifically on phonetic Banglish, Bengali script, and regional customer behavior. Understands slang and typos naturally.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Order Extraction & Couriers</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Automatically detects customer names, phone numbers, and addresses. Dispatch directly to Steadfast or Pathao Courier with 1 click.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Live Human Takeover Switch</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                You stay in total control. Whenever an agent sends a manual message, the AI automatically pauses for that thread to prevent double replies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (BDT) */}
      <section id="pricing" className="border-t border-slate-900 bg-slate-900/40 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold tracking-widest text-blue-400 uppercase">Affordable BDT Pricing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pay in Bangladeshi Taka with bKash, Nagad, or Cards
            </p>
            <p className="mt-3 text-xs text-slate-400 max-w-xl mx-auto">
              Start with our free trial. Scale as your customer inquiries grow.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Starter</h3>
                <p className="mt-1 text-xs text-slate-400">For new online shops starting automation</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">৳ 1,490</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Up to 1,500 AI replies / month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    1 Facebook Page connection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Product Catalog & FAQ rules
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Live Mobile Test Arena
                  </li>
                </ul>
              </div>
              <Link
                href="/auth/signup"
                className="mt-8 block w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-center text-xs font-semibold text-white hover:bg-slate-800"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Growth Plan (Popular) */}
            <div className="relative rounded-2xl border border-blue-500 bg-slate-950 p-8 flex flex-col justify-between shadow-2xl shadow-blue-900/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold tracking-wide uppercase text-white">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Growth</h3>
                <p className="mt-1 text-xs text-slate-400">For busy stores handling daily volume</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">৳ 3,490</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Up to 6,000 AI replies / month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    3 Facebook Pages & Instagram DM
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Steadfast & Pathao Courier booking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Post Comments auto-reply & DM
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Team Inbox & Human Handoff
                  </li>
                </ul>
              </div>
              <Link
                href="/auth/signup"
                className="mt-8 block w-full rounded-xl bg-blue-600 py-2.5 text-center text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Enterprise</h3>
                <p className="mt-1 text-xs text-slate-400">Custom volume & multi-brand setups</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">৳ 7,990</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Unlimited AI customer conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Unlimited Facebook & Instagram Pages
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Dedicated Account Manager & Training
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Custom CRM & Courier integrations
                  </li>
                </ul>
              </div>
              <Link
                href="/auth/signup"
                className="mt-8 block w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-center text-xs font-semibold text-white hover:bg-slate-800"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Conversa AI. Built with precision for modern commerce in Bangladesh.</p>
      </footer>
    </div>
  );
}
