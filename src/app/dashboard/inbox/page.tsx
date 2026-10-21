"use client";

import { useState } from "react";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface ConversationThread {
  id: string;
  name: string;
  platform: "facebook" | "instagram";
  lastMessage: string;
  time: string;
  aiStatus: "active" | "paused";
  messages: Array<{
    id: string;
    sender: "customer" | "ai" | "human";
    text: string;
    time: string;
  }>;
}

export default function InboxPage() {
  const [threads, setThreads] = useState<ConversationThread[]>([
    {
      id: "1",
      name: "Tanvir Ahmed",
      platform: "facebook",
      lastMessage: "Amader delivery charge Dhaka city te ৳ 70 ebong Dhaka baire ৳ 130...",
      time: "2m ago",
      aiStatus: "active",
      messages: [
        {
          id: "m1",
          sender: "customer",
          text: "Bhai Cotton Shirt tar size L ache? Ar delivery charge koto?",
          time: "10:14 AM",
        },
        {
          id: "m2",
          sender: "ai",
          text: "Assalamu Alaikum Tanvir bhai! Ji amader Cotton Shirt size L stock e ache (৳ 750). Dhaka city te delivery charge ৳ 70, Dhaka baire ৳ 130.",
          time: "10:14 AM",
        },
      ],
    },
    {
      id: "2",
      name: "Mahmud Hasan",
      platform: "facebook",
      lastMessage: "Custom size banano jabe kina janaben please?",
      time: "18m ago",
      aiStatus: "paused",
      messages: [
        {
          id: "m3",
          sender: "customer",
          text: "Custom size banano jabe kina janaben please?",
          time: "09:58 AM",
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>("1");
  const [replyInput, setReplyInput] = useState("");

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleToggleAi = (threadId: string) => {
    setThreads(
      threads.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            aiStatus: t.aiStatus === "active" ? "paused" : "active",
          };
        }
        return t;
      })
    );
  };

  const handleSendHumanReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    // Sending manual reply auto-pauses AI for this thread
    setThreads(
      threads.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            aiStatus: "paused", // Auto-pause AI on human takeover
            messages: [
              ...t.messages,
              {
                id: Date.now().toString(),
                sender: "human",
                text: replyInput,
                time: "Now",
              },
            ],
            lastMessage: replyInput,
          };
        }
        return t;
      })
    );
    setReplyInput("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Unified Customer Inbox
        </h1>
        <p className="text-sm text-slate-400">
          Monitor live AI conversations and take over as human agent when needed
        </p>
      </div>

      {/* Inbox Split Pane */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden h-[620px]">
        {/* Left: Thread List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute inset-y-0 left-3 my-auto h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`p-3.5 cursor-pointer transition ${
                  activeThreadId === t.id
                    ? "bg-slate-900 border-l-4 border-blue-500"
                    : "hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <span className="text-[10px] text-slate-500">{t.time}</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{t.lastMessage}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase">
                    {t.platform}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                      t.aiStatus === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {t.aiStatus === "active" ? "AI Active" : "Human Mode"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Message Window (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-900/40">
          {/* Active Conversation Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{activeThread.name}</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                  {activeThread.platform}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Customer PSID: fb_user_872194
              </span>
            </div>

            {/* AI Pause / Resume Switch for this thread */}
            <button
              type="button"
              onClick={() => handleToggleAi(activeThread.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeThread.aiStatus === "active"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
            >
              {activeThread.aiStatus === "active" ? (
                <>
                  <PauseCircle className="h-4 w-4" />
                  Take Over (Pause AI)
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Resume AI Auto-Reply
                </>
              )}
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "customer" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "customer"
                      ? "bg-slate-800 text-slate-200 border border-slate-700/60"
                      : msg.sender === "ai"
                      ? "bg-blue-600/90 text-white"
                      : "bg-purple-600 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1">
                    <span>
                      {msg.sender === "customer"
                        ? activeThread.name
                        : msg.sender === "ai"
                        ? "Conversa AI"
                        : "Human Agent (You)"}
                    </span>
                    <span>{msg.time}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form
            onSubmit={handleSendHumanReply}
            className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Type manual reply (will automatically pause AI for this conversation)..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!replyInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
