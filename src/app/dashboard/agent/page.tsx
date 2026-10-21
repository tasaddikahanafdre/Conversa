"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Circle,
  Save,
  MessageSquare,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function AgentStudioPage() {
  const [agentName, setAiName] = useState("Maya (Conversa)");
  const [businessOverview, setBusinessOverview] = useState(
    "We are an online fashion brand based in Dhaka offering premium t-shirts, panjabis, and denim jeans with nationwide cash on delivery."
  );
  const [languageStyle, setLanguageStyle] = useState("banglish");
  const [primaryModel, setPrimaryModel] = useState("gemini-1.5-flash");
  const [replyDelay, setReplyDelay] = useState(2);
  const [saved, setSaved] = useState(false);

  // Readiness items
  const readinessItems = [
    { key: "delivery", label: "Inside & Outside Dhaka delivery fees", ready: true },
    { key: "payment", label: "Payment terms (COD & bKash)", ready: true },
    { key: "return", label: "Return & exchange warranty", ready: true },
    { key: "products", label: "Product catalog items", ready: true },
    { key: "hours", label: "Operating & response hours", ready: false },
    { key: "emergency", label: "Emergency phone contact", ready: false },
  ];

  const readyCount = readinessItems.filter((i) => i.ready).length;
  const totalCount = readinessItems.length;
  const readinessPercent = Math.round((readyCount / totalCount) * 100);

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
            AI Agent Studio
          </h1>
          <p className="text-sm text-slate-400">
            Define your assistant&apos;s personality, intelligence tier, and conversational rules
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved Successfully!" : "Save Changes"}
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
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                  {readyCount}/{totalCount} Completed ({readinessPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The more your AI knows about your store, the fewer questions need human intervention.
              </p>
            </div>
          </div>
        </div>

        {/* Missing parameter chips */}
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
          {readinessItems.map((item) => (
            <div
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                item.ready
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-900 text-slate-400 border border-dashed border-slate-700 hover:border-blue-500 cursor-pointer"
              }`}
            >
              {item.ready ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>{item.label}</span>
              {!item.ready && (
                <span className="text-[10px] text-blue-400 font-bold ml-1">+ Teach</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Core Agent Configuration Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-5">
            <h3 className="text-sm font-bold text-white">Persona & Identity</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Agent Display Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAiName(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Store Overview & Brand Identity
              </label>
              <textarea
                rows={3}
                value={businessOverview}
                onChange={(e) => setBusinessOverview(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Language Style
              </label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {[
                  { id: "banglish", label: "Banglish", sample: "Bhai, apnar location kothay?" },
                  { id: "bangla", label: "Pure Bangla", sample: "সম্মানিত গ্রাহক, আপনার ঠিকানা কোথায়?" },
                  { id: "english", label: "English", sample: "Hello! Where should we deliver?" },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguageStyle(l.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      languageStyle === l.id
                        ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{l.label}</div>
                    <div className="mt-1 text-[11px] text-slate-400 italic line-clamp-1">{l.sample}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Model Intelligence Tier Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">AI Engine & Speed</h3>
            </div>
            <p className="text-xs text-slate-400">
              Select which AI model powers your customer conversations
            </p>

            <div className="space-y-3">
              {[
                {
                  id: "gemini-1.5-flash",
                  name: "Gemini 1.5 Flash (Recommended)",
                  desc: "Ultra-fast (<1s latency), best for real-time customer care and lowest token cost.",
                  badge: "Standard",
                },
                {
                  id: "gemini-1.5-pro",
                  name: "Gemini 1.5 Pro",
                  desc: "Deep reasoning model for complex product catalogs and multi-step custom orders.",
                  badge: "Advanced",
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPrimaryModel(m.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition ${
                    primaryModel === m.id
                      ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {m.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Natural Human Typing Delay
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={replyDelay}
                  onChange={(e) => setReplyDelay(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <span className="text-xs font-bold text-white min-w-[40px] text-right">{replyDelay}s</span>
              </div>
              <p className="mt-1 text-[10.5px] text-slate-500">
                Adds a small pause before replying to feel like a real human customer care agent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
