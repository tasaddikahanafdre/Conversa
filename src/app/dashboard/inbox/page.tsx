"use client";

import { useState } from "react";
import Link from "next/link";
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
  Share2,
  Smartphone,
} from "lucide-react";

export default function InboxPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Conversations Inbox
          </h1>
          <p className="text-sm text-slate-400">
            Monitor real-time customer conversations, review AI replies, and take over manually
          </p>
        </div>

        <Link
          href="/dashboard/test-arena"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
        >
          <Smartphone className="h-4 w-4" />
          Test in Simulator
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white">No active customer conversations yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            When you connect your Facebook Page or Instagram business account, real customer messages and automated AI responses will appear here in real time.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <Link
              href="/dashboard/channels"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Share2 className="h-4 w-4" />
              Connect Facebook Page
            </Link>
            <Link
              href="/dashboard/test-arena"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Smartphone className="h-4 w-4 text-blue-400" />
              Open Live Test Arena
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden h-[620px]">
          {/* Thread list and conversation window */}
        </div>
      )}
    </div>
  );
}
