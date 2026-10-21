"use client";

import Link from "next/link";
import {
  MessageSquare,
  Bot,
  Truck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Share2,
  Sparkles,
  Smartphone,
} from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Workspace Overview
          </h1>
          <p className="text-sm text-slate-400">
            Real-time automation activity for your connected business channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/test-arena"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Smartphone className="h-4 w-4" />
            Open Live Test Arena
          </Link>
        </div>
      </div>

      {/* Readiness / Onboarding Action Card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Agent Readiness: 80% Ready
            </div>
            <h2 className="text-lg font-bold text-white">
              Connect your Facebook Page to go live!
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Your AI agent has learned your delivery rules and sample products. Connect your Facebook Page to start answering customer inquiries automatically.
            </p>
          </div>

          <Link
            href="/dashboard/channels"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 shrink-0"
          >
            <Share2 className="h-4 w-4" />
            Connect Facebook Page
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Conversations</span>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">128</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            +24% from last week
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">AI Automated Replies</span>
            <Bot className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">512</div>
          <div className="mt-1 text-[11px] text-slate-400">
            94% handled without human intervention
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Orders Captured</span>
            <Truck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">18</div>
          <div className="mt-1 text-[11px] text-slate-400">
            ৳ 24,500 gross sales value
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Human Handoffs</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">7</div>
          <div className="mt-1 text-[11px] text-slate-400">
            Requires agent review
          </div>
        </div>
      </div>

      {/* Split Section: Recent Customer Inquiries vs Channel Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Live Customer Inquiries</h3>
              <p className="text-xs text-slate-400">Real-time messages across your channels</p>
            </div>
            <Link
              href="/dashboard/inbox"
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {[
              {
                name: "Tanvir Ahmed",
                msg: "Bhai Cotton Shirt tar size L ache? Ar delivery charge koto?",
                time: "2m ago",
                status: "AI Replied",
                statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              },
              {
                name: "Nusrat Jahan",
                msg: "Ami amar order track korte chai. Order id #781",
                time: "14m ago",
                status: "AI Replied",
                statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              },
              {
                name: "Mahmud Hasan",
                msg: "Custom size banano jabe kina janaben please?",
                time: "32m ago",
                status: "Human Handoff",
                statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
              },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.time}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">{c.msg}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${c.statusColor}`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Channels Widget */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Channel Status</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Facebook Messenger</div>
                  <div className="text-[11px] text-amber-400">Not Connected</div>
                </div>
              </div>
              <Link
                href="/dashboard/channels"
                className="rounded-lg bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
              >
                Connect
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600/20 text-pink-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Instagram Direct</div>
                  <div className="text-[11px] text-slate-500">Requires FB Page</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">WhatsApp Business</div>
                  <div className="text-[11px] text-slate-500">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
