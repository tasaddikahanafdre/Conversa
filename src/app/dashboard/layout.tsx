"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Smartphone,
  MessageSquare,
  Package,
  Share2,
  Wallet,
  Settings,
  ChevronDown,
  Menu,
  X,
  Power,
  Zap,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAiActiveGlobally, setIsAiActiveGlobally] = useState(true);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Agent Studio", href: "/dashboard/agent", icon: Sparkles },
    { label: "Knowledge & SOP", href: "/dashboard/knowledge", icon: BookOpen },
    { label: "Product Catalog", href: "/dashboard/products", icon: ShoppingBag },
    { label: "Live Test Arena", href: "/dashboard/test-arena", icon: Smartphone, highlight: true },
    { label: "Live Inbox", href: "/dashboard/inbox", icon: MessageSquare },
    { label: "Orders & Couriers", href: "/dashboard/orders", icon: Package },
    { label: "Channels", href: "/dashboard/channels", icon: Share2 },
    { label: "Wallet & Billing", href: "/dashboard/billing", icon: Wallet },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 md:flex">
        {/* Brand & Workspace Dropdown */}
        <div className="mb-6 px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Conversa<span className="text-blue-500">.</span>
              </span>
              <div className="text-[11px] text-slate-400 font-medium">Dhaka Retailers Ltd.</div>
            </div>
          </Link>
        </div>

        {/* Global AI Master Switch */}
        <div className="mb-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isAiActiveGlobally ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              <span className="text-xs font-semibold text-slate-300">
                AI Auto-Reply
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAiActiveGlobally(!isAiActiveGlobally)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAiActiveGlobally ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isAiActiveGlobally ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400">
            {isAiActiveGlobally ? "Automating responses 24/7" : "Paused — human mode only"}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                    TEST
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* BDT Balance Card */}
        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Wallet Balance</span>
            <span className="font-bold text-emerald-400">৳ 850.00</span>
          </div>
          <Link
            href="/dashboard/billing"
            className="mt-2 block w-full rounded-lg bg-slate-800 py-1.5 text-center text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Recharge (bKash/Nagad)
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Conversa</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 p-6 md:hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="font-bold text-white">Conversa Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
                  >
                    <Icon className="h-5 w-5 text-slate-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto bg-slate-900/60 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
