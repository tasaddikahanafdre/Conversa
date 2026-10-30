"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Save,
  MessageSquare,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AgentStudioPage() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("Conversa Assistant");
  const [businessOverview, setBusinessOverview] = useState("");
  const [languageStyle, setLanguageStyle] = useState("banglish");
  const [primaryModel, setPrimaryModel] = useState("gemini-3.5-flash");
  const [replyDelay, setReplyDelay] = useState(2);
  const [isActive, setIsActive] = useState(true);

  // Counts for readiness
  const [productCount, setProductCount] = useState(0);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const [hasDelivery, setHasDelivery] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchAgentData();
  }, []);

  async function fetchAgentData() {
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

      // 1. Fetch Agent
      const { data: agent, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("workspace_id", member.workspace_id)
        .maybeSingle();

      if (agent) {
        setAgentId(agent.id);
        setAgentName(agent.name || "Conversa Assistant");
        setBusinessOverview(agent.business_overview || "");
        setLanguageStyle(agent.language_style || "banglish");
        setPrimaryModel(agent.primary_model || "gemini-3.5-flash");
        setReplyDelay(agent.reply_delay_seconds ?? 2);
        setIsActive(agent.is_active ?? true);

        // 2. Fetch Knowledge count & Delivery rule
        const { data: kItems } = await supabase
          .from("agent_knowledge")
          .select("category")
          .eq("agent_id", agent.id);

        setKnowledgeCount(kItems?.length || 0);
        setHasDelivery(!!kItems?.some((k) => k.category === "delivery"));
      }

      // 3. Fetch Product count
      const { count: pCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", member.workspace_id);

      setProductCount(pCount || 0);
    } catch (err) {
      console.error("Error loading agent:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!agentId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("ai_agents")
        .update({
          name: agentName,
          business_overview: businessOverview,
          language_style: languageStyle,
          primary_model: primaryModel,
          reply_delay_seconds: replyDelay,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert("Failed to save changes: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Dynamic Readiness items
  const readinessItems = [
    { key: "overview", label: "Business Overview & Brand Description", ready: businessOverview.trim().length > 10 },
    { key: "delivery", label: "Inside & Outside Dhaka delivery fees", ready: hasDelivery },
    { key: "products", label: "Product catalog loaded", ready: productCount > 0 },
    { key: "knowledge", label: "Knowledge policies & FAQs", ready: knowledgeCount >= 2 },
    { key: "model", label: "High-speed AI model selected", ready: !!primaryModel },
    { key: "active", label: "Agent status enabled", ready: isActive },
  ];

  const readyCount = readinessItems.filter((i) => i.ready).length;
  const totalCount = readinessItems.length;
  const readinessPercent = Math.round((readyCount / totalCount) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI Agent Studio
          </h1>
          <p className="text-sm text-slate-400">
            Define your assistant&apos;s personality, intelligence model, and conversational parameters
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved to Cloud!" : "Save Changes"}
        </button>
      </div>

      {/* Dynamic Readiness Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Agent Readiness Score</h3>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                  {readyCount}/{totalCount} Completed ({readinessPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The more your AI knows about your store, the fewer questions need human intervention.
              </p>
            </div>
          </div>
        </div>

        {/* Parameter chips */}
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
          {readinessItems.map((item) => (
            <div
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                item.ready
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-900 text-slate-400 border border-dashed border-slate-700"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-5">
              <h3 className="text-sm font-bold text-white">Brand & Persona Profile</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Assistant Display Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Maya or Conversa Assistant"
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Business Overview & Shop Identity
                </label>
                <textarea
                  rows={4}
                  value={businessOverview}
                  onChange={(e) => setBusinessOverview(e.target.value)}
                  placeholder="Describe your brand, what you sell, your target audience, and your core strengths..."
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Used by the AI to explain what your shop offers when customers ask open questions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Primary Language Style
                  </label>
                  <select
                    value={languageStyle}
                    onChange={(e) => setLanguageStyle(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="banglish">Natural Banglish & Bangla (Recommended)</option>
                    <option value="bangla">Standard Bangla (বাংলা)</option>
                    <option value="english">Professional English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Simulated Reply Delay
                  </label>
                  <select
                    value={replyDelay}
                    onChange={(e) => setReplyDelay(Number(e.target.value))}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value={1}>Instant (1-2 seconds)</option>
                    <option value={2}>Human-like (2-4 seconds)</option>
                    <option value={5}>Relaxed (5 seconds)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Engine & Intelligence Tier */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">AI Intelligence Engine</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  onClick={() => setPrimaryModel("gemini-3.5-flash")}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    primaryModel === "gemini-3.5-flash"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Gemini 3.5 Flash</span>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                      Ultra Fast
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Low latency ~1.2s, fluent Bangla & Banglish, optimized for Messenger.
                  </p>
                </div>

                <div
                  onClick={() => setPrimaryModel("gemini-flash-lite-latest")}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    primaryModel === "gemini-flash-lite-latest"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Gemini Flash Lite</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      Cost Saver
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Highest speed, lowest token cost, ideal for high-volume message traffic.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Live Persona Preview */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Live Persona Preview</h3>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{agentName}</div>
                    <div className="text-[10px] text-emerald-400">Active on Facebook Messenger</div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800/80 p-3 text-xs text-slate-200 leading-relaxed">
                  &quot;Assalamu Alaikum! {agentName}-e apnake swagatom. Delivery charge: Inside Dhaka ৳{hasDelivery ? "70" : "70"}, Outside Dhaka ৳{hasDelivery ? "130" : "130"}. Apnar kisu janar thakle bolun! 😊&quot;
                </div>
              </div>

              <div className="pt-2 text-center">
                <a
                  href="/dashboard/test-arena"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Test in Mobile Simulator
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
