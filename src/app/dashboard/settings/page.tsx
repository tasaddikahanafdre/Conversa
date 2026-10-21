"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Copy,
  Check,
  Shield,
  Key,
  Users,
  Bell,
  Save,
  Loader2,
  AlertCircle,
  Building,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateWorkspaceSettingsAction } from "./actions";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("conversa_verify_tok_99182");

  // Workspace and Agent State
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [businessOverview, setBusinessOverview] = useState<string>("");
  const [languageStyle, setLanguageStyle] = useState<string>("banglish");
  const [aiTone, setAiTone] = useState<string>("friendly");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/messenger`);
    }

    async function loadWorkspaceData() {
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
            setWorkspaceId(ws.id);
            setWorkspaceName(ws.name);

            // Fetch Agent
            const { data: agent } = await supabase
              .from("ai_agents")
              .select("*")
              .eq("workspace_id", ws.id)
              .limit(1)
              .single();

            if (agent) {
              setBusinessOverview(agent.business_overview || "");
              setLanguageStyle(agent.language_style || "banglish");
            }

            // Fetch Members
            const { data: allMembers } = await supabase
              .from("workspace_members")
              .select("id, role, user_id")
              .eq("workspace_id", ws.id);

            setMembers(allMembers || []);
          }
        }
      } catch (err) {
        console.warn("Could not load workspace settings", err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateWorkspaceSettingsAction({
        workspaceId,
        name: workspaceName,
        languageStyle,
        aiTone,
        businessOverview,
      });
      setSuccessMessage("Workspace settings updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
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
            Manage your business profile, language preferences, team, and webhook credentials
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Business Details</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Workspace / Brand Name
              </label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Currency
              </label>
              <input
                type="text"
                disabled
                value="BDT (৳ Bangladeshi Taka)"
                className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Business Overview & Policy Summary
            </label>
            <textarea
              rows={3}
              value={businessOverview}
              onChange={(e) => setBusinessOverview(e.target.value)}
              placeholder="e.g. Online clothing brand delivering casual wear across Bangladesh."
              className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* AI Language & Response Tone */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">AI Language & Response Tone</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Primary Language
              </label>
              <select
                value={languageStyle}
                onChange={(e) => setLanguageStyle(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="banglish">Banglish (English letters) - Most Popular</option>
                <option value="bangla">Pure Bangla (বাংলা)</option>
                <option value="english">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Response Tone
              </label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="friendly">Friendly & Warm</option>
                <option value="formal">Professional & Formal</option>
                <option value="concise">Short & Concise</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Workspace Changes
            </button>
          </div>
        </div>
      </form>

      {/* Meta Webhook Endpoint */}
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

      {/* AI Provider Configuration & Live Test */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">AI Provider Connection (Gemini / OpenRouter)</h3>
          </div>
          <button
            type="button"
            disabled={testingAi}
            onClick={async () => {
              setTestingAi(true);
              setAiTestResult("Running live AI connection test...");
              try {
                const res = await fetch("/api/ai/test", { method: "POST" });
                const data = await res.json();
                if (data.success) {
                  setAiTestResult(`✅ Connected successfully to ${data.provider} (${data.model})! Response: "${data.sampleResponse}"`);
                } else {
                  setAiTestResult(`⚠️ ${data.message || data.error || "Not configured"}. ${data.instructions || ""}`);
                }
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Connection failed";
                setAiTestResult(`❌ Connection test failed: ${msg}`);
              } finally {
                setTestingAi(false);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 self-start sm:self-auto"
          >
            {testingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Test AI Connection
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Conversa runs all AI generation strictly server-side using <code>GEMINI_API_KEY</code> or <code>OPENROUTER_API_KEY</code> from <code>.env.local</code>. Secret keys are never exposed in browser code.
        </p>

        {aiTestResult && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs font-mono text-slate-300 leading-relaxed">
            {aiTestResult}
          </div>
        )}
      </div>
    </div>
  );
}
