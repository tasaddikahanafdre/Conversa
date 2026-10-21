"use client";

import { useState } from "react";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function ChannelsPage() {
  const [fbConnected, setFbConnected] = useState(false);
  const [commentReply, setCommentReply] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectFacebook = () => {
    setIsConnecting(true);
    // In production, redirects to /api/auth/facebook/login (OAuth redirect)
    setTimeout(() => {
      setFbConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Social Channels & Integrations
        </h1>
        <p className="text-sm text-slate-400">
          Connect your official Meta Facebook Pages and Instagram accounts to activate 24/7 AI messaging
        </p>
      </div>

      {/* Facebook Messenger Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 shrink-0">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Facebook Messenger</h3>
                {fbConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-400 border border-amber-500/20">
                    <AlertCircle className="h-3 w-3" />
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Automatically answer customer messages, quote delivery prices, and capture orders on your Facebook Business Page.
              </p>
            </div>
          </div>

          <div>
            {fbConnected ? (
              <button
                onClick={() => setFbConnected(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-red-400 hover:border-red-500/50"
              >
                Disconnect Page
              </button>
            ) : (
              <button
                onClick={handleConnectFacebook}
                disabled={isConnecting}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Connecting to Meta...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Connect Facebook Page
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {fbConnected && (
          <div className="border-t border-slate-800 pt-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Dhaka Fashion House (Page ID: 109283746)</div>
                <div className="text-[11px] text-emerald-400">Webhook verified & receiving messages</div>
              </div>
              <div className="text-xs text-slate-400">Subscribed to: <code className="text-blue-400">messages, messaging_postbacks</code></div>
            </div>

            {/* Comment to DM Automation */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div>
                <div className="text-xs font-bold text-white">Auto-Reply to Post Comments + Send Private DM</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  When a customer comments &quot;Price koto?&quot; on your Facebook post, AI replies publicly and sends details via Messenger DM.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCommentReply(!commentReply)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  commentReply ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    commentReply ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instagram Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-600/10 text-pink-500 shrink-0">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instagram Direct (DMs)</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Connect your Instagram Professional Account linked to your Facebook Page to automate Instagram Direct customer inquiries.
              </p>
            </div>
          </div>
          <button
            disabled
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
          >
            Requires Facebook Page First
          </button>
        </div>
      </div>
    </div>
  );
}
