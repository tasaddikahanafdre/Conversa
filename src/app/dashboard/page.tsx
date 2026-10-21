"use client";

import { useState, useEffect } from "react";
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
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardOverviewPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [channelsCount, setChannelsCount] = useState<number>(0);
  const [knowledgeCount, setKnowledgeCount] = useState<number>(0);
  const [conversationsCount, setConversationsCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: member } = await supabase
            .from("workspace_members")
            .select("workspace:workspaces(*)")
            .limit(1)
            .single();

          if (member?.workspace) {
            const ws = member.workspace as any;
            setWorkspace(ws);

            // Fetch real counts
            const [channels, knowledge, conversations, orders] = await Promise.all([
              supabase.from("connected_channels").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
              supabase.from("agent_knowledge").select("id", { count: "exact", head: true }),
              supabase.from("conversations").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
              supabase.from("captured_orders").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
            ]);

            setChannelsCount(channels.count || 0);
            setKnowledgeCount(knowledge.count || 0);
            setConversationsCount(conversations.count || 0);
            setOrdersCount(orders.count || 0);
          }
        }
      } catch (err) {
        console.warn("Could not load stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {workspace?.name ? `${workspace.name} Overview` : "Workspace Overview"}
          </h1>
          <p className="text-sm text-slate-400">
            Real-time status of your AI customer support automation
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

      {/* Setup Progress Card */}
      {channelsCount === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Setup Checklist: Connect Channel
              </div>
              <h2 className="text-lg font-bold text-white">
                Connect your Facebook Page to start automating customer replies
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Your AI agent is trained with initial business rules. Connect your Facebook Business Page or test in the mobile simulator before going live.
              </p>
            </div>

            <Link
              href="/dashboard/channels"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 shrink-0"
            >
              <Share2 className="h-4 w-4" />
              Connect Channels
            </Link>
          </div>
        </div>
      )}

      {/* Real KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Conversations</span>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{conversationsCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {conversationsCount === 0 ? "Awaiting first customer contact" : "Live threads in inbox"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Connected Channels</span>
            <Share2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{channelsCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {channelsCount === 0 ? "No channels active yet" : "Facebook / Instagram pages"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Trained Rules & FAQs</span>
            <BookOpen className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{knowledgeCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Knowledge base policies loaded
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Orders Captured</span>
            <Truck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-400">{ordersCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {ordersCount === 0 ? "No orders captured yet" : "Pending courier dispatch"}
          </div>
        </div>
      </div>

      {/* Real Empty State for Recent Inquiries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Live Customer Inquiries</h3>
              <p className="text-xs text-slate-400">Real-time incoming customer inquiries</p>
            </div>
            <Link
              href="/dashboard/inbox"
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Open Inbox
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 border border-slate-800">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No customer conversations yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Once you connect a Facebook Page or Instagram account, customer messages will appear here and the AI will auto-reply according to your rules.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/test-arena"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                <Smartphone className="h-3.5 w-3.5 text-blue-400" />
                Simulate in Test Arena
              </Link>
            </div>
          </div>
        </div>

        {/* Channel Status Overview */}
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
                  <div className="text-[11px] text-slate-500">Future Milestone</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
