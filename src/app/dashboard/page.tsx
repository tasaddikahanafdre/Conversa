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
  Package,
} from "lucide-react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/icons/channel-icons";
import { createClient } from "@/lib/supabase/client";

export default function DashboardOverviewPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [channelsCount, setChannelsCount] = useState<number>(0);
  const [activeFbChannel, setActiveFbChannel] = useState<any>(null);
  const [knowledgeCount, setKnowledgeCount] = useState<number>(0);
  const [conversationsCount, setConversationsCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
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

            // Fetch real counts & data
            const [channelsRes, knowledgeRes, conversationsRes, ordersRes, recentRes, fbChanRes] =
              await Promise.all([
                supabase
                  .from("connected_channels")
                  .select("id", { count: "exact", head: true })
                  .eq("workspace_id", ws.id),
                supabase
                  .from("agent_knowledge")
                  .select("id", { count: "exact", head: true }),
                supabase
                  .from("conversations")
                  .select("id", { count: "exact", head: true })
                  .eq("workspace_id", ws.id),
                supabase
                  .from("captured_orders")
                  .select("id", { count: "exact", head: true })
                  .eq("workspace_id", ws.id),
                supabase
                  .from("conversations")
                  .select("*")
                  .eq("workspace_id", ws.id)
                  .order("last_message_at", { ascending: false })
                  .limit(5),
                supabase
                  .from("connected_channels")
                  .select("*")
                  .eq("workspace_id", ws.id)
                  .eq("platform", "facebook")
                  .eq("is_active", true)
                  .maybeSingle(),
              ]);

            setChannelsCount(channelsRes.count || 0);
            setKnowledgeCount(knowledgeRes.count || 0);
            setConversationsCount(conversationsRes.count || 0);
            setOrdersCount(ordersRes.count || 0);
            setRecentConversations(recentRes.data || []);
            setActiveFbChannel(fbChanRes.data || null);
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
            Conversa Overview
          </h1>
          <p className="text-sm text-slate-400">
            Real-time status of your Conversa AI customer support automation
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
          <div className="mt-3 text-2xl font-bold text-white">
            {activeFbChannel ? "1 Active" : channelsCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">
            {activeFbChannel ? `${activeFbChannel.account_name} connected` : "No channels active"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Trained Rules & FAQs</span>
            <BookOpen className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{knowledgeCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Knowledge base policies active
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Orders Captured</span>
            <Package className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-400">{ordersCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {ordersCount === 0 ? "No orders captured yet" : "Ready for courier dispatch"}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Inquiries + Channels Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Customer Inquiries Feed */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Live Customer Inquiries</h3>
                <p className="text-xs text-slate-400">Recent customer activity from Messenger</p>
              </div>
              <Link
                href="/dashboard/inbox"
                className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Open Full Inbox
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentConversations.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 border border-slate-800">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No customer conversations yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When customers message your connected channels on Messenger, they will stream in here and Conversa AI will auto-reply.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 mt-2">
                {recentConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href="/dashboard/inbox"
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-900/40 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs">
                        {conv.contact_name?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {conv.contact_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 max-w-md">
                          {conv.last_message_preview || "Customer inquiry"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {conv.ai_status === "active" ? "AI Active" : "Paused"}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(conv.last_message_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Conversa AI automates replies with Google Gemini 3.5 Flash
            </span>
            <Link
              href="/dashboard/test-arena"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Simulate in Test Arena <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Channel Status Overview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Channel Status</h3>

          <div className="space-y-3">
            {/* Facebook Messenger */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <FacebookIcon className="h-8 w-8 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Facebook Messenger</div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    {activeFbChannel ? `${activeFbChannel.account_name} (Active)` : "Not Connected"}
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/channels"
                className="rounded-lg bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
              >
                {activeFbChannel ? "Manage" : "Connect"}
              </Link>
            </div>

            {/* Instagram Direct */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <InstagramIcon className="h-8 w-8 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Instagram Direct</div>
                  <div className="text-[11px] text-pink-400 font-medium">Coming Soon</div>
                </div>
              </div>
              <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                Coming Soon
              </span>
            </div>

            {/* WhatsApp Business */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <WhatsAppIcon className="h-8 w-8 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">WhatsApp Business</div>
                  <div className="text-[11px] text-emerald-400 font-medium">Coming Soon</div>
                </div>
              </div>
              <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                Coming Soon
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              Instant Courier Integration
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Captured orders in conversations can be dispatched directly to Steadfast or Pathao with 1 click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
