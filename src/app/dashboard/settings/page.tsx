"use client";

import { useState } from "react";
import {
  Settings,
  Copy,
  Check,
  Shield,
  Key,
  Users,
  Bell,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [webhookUrl] = useState("https://conversa.app/api/webhooks/messenger");
  const [verifyToken] = useState("conversa_verify_tok_99182");
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Workspace Settings
          </h1>
          <p className="text-sm text-slate-400">
            Manage your credentials, webhook endpoints, and team permissions
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Meta Webhook Endpoint Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Meta Webhook Configuration</h3>
          </div>
          <p className="text-xs text-slate-400">
            Use these credentials inside your Meta App Developer Portal under <strong>Messenger &gt; Webhooks</strong>:
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Callback URL
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrl)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Verify Token
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(verifyToken)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom AI Provider Keys (BYOK Option) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Custom Google Gemini API Key (Optional)</h3>
          </div>
          <p className="text-xs text-slate-400">
            By default, Conversa manages all AI API costs through your BDT wallet. If you prefer to bring your own Google AI Studio key, enter it below:
          </p>

          <div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Workspace Team</h3>
            </div>
            <button className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
              + Invite Member
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-xs font-bold text-white">store_owner@business.com</div>
                <div className="text-[10.5px] text-slate-400">Owner (Full access)</div>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                Primary
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
