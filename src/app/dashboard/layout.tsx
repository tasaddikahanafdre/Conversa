"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/auth/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAiActiveGlobally, setIsAiActiveGlobally] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("admin@conversa.app");
  const [workspaceName, setWorkspaceName] = useState<string>("My Business");

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      }

      // Fetch active workspace
      const { data: memberWorkspaces } = await supabase
        .from("workspace_members")
        .select("workspace:workspaces(name)")
        .limit(1)
        .single();

      if (memberWorkspaces?.workspace) {
        const ws = memberWorkspaces.workspace as any;
        if (ws?.name) setWorkspaceName(ws.name);
      }
    }
    fetchUser();
  }, []);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Agents", href: "/dashboard/agent", icon: Sparkles },
    { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
    { label: "Product Catalog", href: "/dashboard/products", icon: ShoppingBag },
    { label: "Live Test Arena", href: "/dashboard/test-arena", icon: Smartphone, highlight: true },
    { label: "Conversations", href: "/dashboard/inbox", icon: MessageSquare },
    { label: "Orders & Couriers", href: "/dashboard/orders", icon: Package },
    { label: "Channels", href: "/dashboard/channels", icon: Share2 },
    { label: "Usage & Billing", href: "/dashboard/billing", icon: Wallet },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 md:flex">
        {/* Brand */}
        <div className="mb-6 px-2">
          <Link href="/dashboard" className="flex items-center h-9 group">
            <img
              src="/logo/logo.png"
              alt="Conversa"
              className="h-8 max-w-[200px] w-auto object-contain object-left"
            />
          </Link>
        </div>

        {/* Global AI Master Switch */}
        <div className="mb-5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isAiActiveGlobally ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              <span className="text-xs font-semibold text-slate-300">
                AI Automation
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
            {isAiActiveGlobally ? "Active 24/7 on connected channels" : "Paused — human agent mode only"}
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
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
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

        {/* User Profile & Sign Out Card */}
        <div className="mt-auto border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-white truncate">{userEmail}</div>
              <div className="text-[10px] text-slate-400">Owner</div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign Out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo/logo.png" alt="Conversa" className="h-7 w-auto object-contain" />
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
          <div className="fixed inset-0 z-50 bg-slate-950/95 p-6 md:hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <img src="/logo/logo.png" alt="Conversa" className="h-6 w-auto object-contain" />
                </div>
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      <Icon className="h-5 w-5 text-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <form action={signOutAction} className="pt-6 border-t border-slate-800">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-red-400 hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
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
