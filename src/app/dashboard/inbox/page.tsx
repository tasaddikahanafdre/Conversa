"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  PauseCircle,
  PlayCircle,
  Search,
  CheckCircle2,
  Clock,
  Share2,
  Smartphone,
  RefreshCw,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";
import { FacebookIcon } from "@/components/icons/channel-icons";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string;
  workspace_id: string;
  channel_id: string;
  external_contact_id: string;
  contact_name: string;
  ai_status: "active" | "paused" | "disabled";
  unread_count: number;
  last_message_preview: string | null;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "ai" | "human_agent";
  content: string;
  media_url?: string | null;
  tokens_used: number;
  cost_bdt: number;
  created_at: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const [search, setSearch] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  // Precise container scroll that does NOT jump or scroll the window/page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loadingMessages]);

  async function fetchConversations() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .limit(1)
        .single();

      if (!member?.workspace_id) return;

      const { data: convs, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("workspace_id", member.workspace_id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      if (convs && convs.length > 0) {
        setConversations(convs);
        if (!activeConvId) {
          setActiveConvId(convs[0].id);
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(convId: string) {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeConvId || sendingReply) return;

    try {
      setSendingReply(true);
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setReplyInput("");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  last_message_preview: data.message.content,
                  last_message_at: new Date().toISOString(),
                }
              : c
          )
        );
      }
    } catch (err: any) {
      alert("Error sending message: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleAiStatus = async () => {
    const activeConv = conversations.find((c) => c.id === activeConvId);
    if (!activeConv || togglingAi) return;

    const newStatus = activeConv.ai_status === "active" ? "paused" : "active";

    try {
      setTogglingAi(true);
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, ai_status: newStatus } : c))
      );
    } catch (err: any) {
      alert("Error toggling AI status: " + err.message);
    } finally {
      setTogglingAi(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const filteredConvs = conversations.filter(
    (c) =>
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message_preview &&
        c.last_message_preview.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Conversations Inbox
          </h1>
          <p className="text-sm text-slate-400">
            Monitor live customer conversations on Messenger, review AI replies, and take over manually
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchConversations();
              if (activeConvId) fetchMessages(activeConvId);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link
            href="/dashboard/test-arena"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/30"
          >
            <Smartphone className="h-4 w-4" />
            Test Arena
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white">No active customer conversations yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            When customers message your connected Facebook Page, real conversations and automated AI replies will stream in here in real time.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <Link
              href="/dashboard/channels"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Share2 className="h-4 w-4" />
              Check Facebook Channel
            </Link>
            <Link
              href="/dashboard/test-arena"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Smartphone className="h-4 w-4 text-blue-400" />
              Simulate Customer Chat
            </Link>
          </div>
        </div>
      ) : (
        /* Constrained Split Container with fixed viewport calculation */
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden h-[calc(100vh-210px)] min-h-[580px] max-h-[780px]">
          {/* Thread List Sidebar */}
          <div className="lg:col-span-4 border-r border-slate-800 flex flex-col h-full min-h-0 bg-slate-950/40">
            <div className="p-3 border-b border-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Scrollable Thread Items */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/60 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
              {filteredConvs.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                      isActive
                        ? "bg-blue-600/10 border-l-4 border-blue-500"
                        : "hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-xs text-white">
                      {conv.contact_name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate">
                          {conv.contact_name || "Customer"}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                          {new Date(conv.last_message_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.last_message_preview || "No messages"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9px] font-semibold ${
                            conv.ai_status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              conv.ai_status === "active" ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          {conv.ai_status === "active" ? "AI Replying" : "AI Paused"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Conversation Message Pane */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-900/40">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
                      {activeConv.contact_name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {activeConv.contact_name || "Customer"}
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400 font-mono">
                          ID: {activeConv.external_contact_id}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <FacebookIcon className="h-3.5 w-3.5 shrink-0" />
                        Facebook Messenger
                      </div>
                    </div>
                  </div>

                  {/* AI Takeover Switch */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleAiStatus}
                      disabled={togglingAi}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                        activeConv.ai_status === "active"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {activeConv.ai_status === "active" ? (
                        <>
                          <PauseCircle className="h-3.5 w-3.5" /> Pause AI (Take Over)
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" /> Resume AI Automation
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Bubble Stream - Constrained to internal scroll with custom slim scrollbar */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs [scrollbar-width:thin] [scrollbar-color:#334155_transparent]"
                >
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      No messages recorded in this thread
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isCustomer = m.sender_type === "customer";
                      const isAi = m.sender_type === "ai";
                      const isHuman = m.sender_type === "human_agent";

                      return (
                        <div
                          key={m.id}
                          className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                              isCustomer
                                ? "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60"
                                : isAi
                                ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-900/20"
                                : "bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-900/20"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-80 font-semibold">
                              {isAi ? (
                                <>
                                  <Bot className="h-3 w-3" /> Conversa AI
                                </>
                              ) : isHuman ? (
                                <>
                                  <User className="h-3 w-3" /> Human Merchant
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3" /> {activeConv.contact_name}
                                </>
                              )}
                            </div>

                            {/* Customer Attachment / Photo */}
                            {m.media_url && (
                              <div className="mb-2">
                                <a
                                  href={m.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block overflow-hidden rounded-xl border border-slate-700/60 bg-black/40 hover:opacity-95 transition"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.media_url}
                                    alt="Customer attachment"
                                    className="max-h-60 max-w-full rounded-xl object-contain"
                                  />
                                </a>
                              </div>
                            )}

                            {m.content && m.content !== "[Photo]" && (
                              <div>{m.content}</div>
                            )}
                            {(!m.content || m.content === "[Photo]") && !m.media_url && (
                              <div className="italic text-slate-400 text-xs">[Attachment]</div>
                            )}
                            <div className="text-[9px] mt-1.5 opacity-70 text-right">
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Bar */}
                <form
                  onSubmit={handleSendManualReply}
                  className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 p-3 shrink-0"
                >
                  <input
                    type="text"
                    placeholder={
                      activeConv.ai_status === "active"
                        ? "Type a manual reply (AI will also stay active)..."
                        : "Type a human agent reply to send via Messenger..."
                    }
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    disabled={sendingReply}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyInput.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40"
                  >
                    {sendingReply ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" /> Send
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Select a conversation from the sidebar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
