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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white selection:bg-blue-600 selection:text-white">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-center text-xs font-medium text-slate-300">
        🇧🇩 Built specifically for Bangladeshi businesses — Native Bangla, Banglish & English AI support
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Conversa<span className="text-blue-500">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-300 transition hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Pricing (BDT)
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-28 text-center md:pt-32">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />

        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            Self-Service AI Customer Care Automation
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
            Turn Facebook & Instagram chats into{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-600 bg-clip-text text-transparent">
              non-stop sales
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Train an intelligent AI sales agent on your products, delivery policies, and FAQs in 7 minutes.
            Auto-reply to Messenger DMs, comment inquiries, extract customer orders, and dispatch to couriers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500 sm:w-auto"
            >
              Build Your AI Agent Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/test-arena"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-8 text-base font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white sm:w-auto"
            >
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Live Demo Simulator
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              No Meta App Review needed to test
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Pre-integrated with Steadfast & Pathao
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Pay in BDT with bKash / Nagad
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="border-t border-slate-900 bg-slate-900/40 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold tracking-widest text-blue-400 uppercase">Engineered for Results</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything your online business needs to automate customer care
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-8 transition hover:border-blue-500/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">Conversational AI Training</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                No complex flowcharts or coding. Simply chat with your setup assistant, type your return policy, or upload a product CSV. Conversa learns instantly.
              </p>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-8 transition hover:border-blue-500/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">Order Extraction & Couriers</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                The AI automatically detects customer names, phone numbers, and addresses. Dispatch directly to Steadfast or Pathao Courier with 1 click.
              </p>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-8 transition hover:border-blue-500/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">Human Handoff & Controls</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Stay in full control. Toggle AI on/off globally or per conversation. When a human agent types a reply, the bot pauses gracefully.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Conversa AI. All rights reserved. Built for modern commerce in Bangladesh.</p>
      </footer>
    </div>
  );
}
