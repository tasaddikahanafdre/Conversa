"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Sparkles,
  ShoppingBag,
  Truck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Coins,
  ShieldCheck,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Workspace & Brand Identity
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("ecommerce");

  // Step 2: Language & Tone
  const [languageStyle, setLanguageStyle] = useState("banglish");
  const [aiTone, setAiTone] = useState("friendly");

  // Step 3: Business Details & Policies (Optional / Skippable)
  const [businessOverview, setBusinessOverview] = useState("");
  const [deliveryDhaka, setDeliveryDhaka] = useState("70");
  const [deliveryOutside, setDeliveryOutside] = useState("130");
  const [returnPolicy, setReturnPolicy] = useState("7-day exchange for defective or incorrect sizes.");

  // Restore saved draft from localStorage on mount
  useEffect(() => {
    try {
      const savedTempName = localStorage.getItem("conversa_temp_business_name");
      if (savedTempName) setBusinessName(savedTempName);

      const savedDraft = localStorage.getItem("conversa_onboarding_draft");
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.businessName) setBusinessName(d.businessName);
        if (d.category) setCategory(d.category);
        if (d.languageStyle) setLanguageStyle(d.languageStyle);
        if (d.aiTone) setAiTone(d.aiTone);
        if (d.businessOverview) setBusinessOverview(d.businessOverview);
        if (d.deliveryDhaka) setDeliveryDhaka(d.deliveryDhaka);
        if (d.deliveryOutside) setDeliveryOutside(d.deliveryOutside);
        if (d.returnPolicy) setReturnPolicy(d.returnPolicy);
        if (d.step) setStep(d.step);
      }
    } catch (e) {
      console.warn("Could not restore onboarding draft", e);
    }
  }, []);

  // Save draft whenever state changes
  useEffect(() => {
    try {
      const draft = {
        step,
        businessName,
        category,
        languageStyle,
        aiTone,
        businessOverview,
        deliveryDhaka,
        deliveryOutside,
        returnPolicy,
      };
      localStorage.setItem("conversa_onboarding_draft", JSON.stringify(draft));
    } catch (e) {
      // Ignore storage errors
    }
  }, [step, businessName, category, languageStyle, aiTone, businessOverview, deliveryDhaka, deliveryOutside, returnPolicy]);

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Fallback for unauthenticated dev preview
        console.warn("Dev mode: User not logged in, redirecting to dashboard");
        router.push("/dashboard");
        return;
      }

      const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      // 1. Create Workspace
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          name: businessName || "My Business",
          slug,
          currency: "BDT",
          balance_bdt: 50.0, // Welcome credit
        })
        .select()
        .single();

      if (wsError) throw wsError;

      // 2. Add User as Workspace Owner
      const { error: memberError } = await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) throw memberError;

      // 3. Create Default AI Agent
      const personaPrompt = `You are a polite, helpful customer service agent representing ${businessName} in Bangladesh. Speak in natural ${languageStyle} with a ${aiTone} tone. ${businessOverview}`;

      const { data: agent, error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          workspace_id: workspace.id,
          name: "Conversa Assistant",
          persona_prompt: personaPrompt,
          business_type: category,
          business_overview: businessOverview,
          language_style: languageStyle,
          primary_model: "gemini-1.5-flash",
          is_active: true,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // 4. Save Initial Knowledge Rules
      await supabase.from("agent_knowledge").insert([
        {
          agent_id: agent.id,
          category: "delivery",
          title: "Standard Delivery Fees",
          content: `Delivery fee is ৳${deliveryDhaka} inside Dhaka, and ৳${deliveryOutside} outside Dhaka.`,
        },
        {
          agent_id: agent.id,
          category: "return_policy",
          title: "Return and Replacement Policy",
          content: returnPolicy,
        },
      ]);

      // Clear draft on successful completion
      localStorage.removeItem("conversa_onboarding_draft");
      localStorage.removeItem("conversa_temp_business_name");

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to complete setup";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      {/* Header */}
      <div className="mx-auto flex max-w-2xl items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Workspace Setup</h1>
            <p className="text-xs text-slate-400 mt-1">Step {step} of 3</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? "w-8 bg-blue-500"
                  : s < step
                  ? "w-4 bg-emerald-500"
                  : "w-4 bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Wizard Form */}
      <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Workspace & Category */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                Step 1: Your Business
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">Create your business workspace</h2>
              <p className="text-xs text-slate-400">
                Tell us about your brand. You can invite team members later.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Business / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Dhaka Closet or Silk & Style"
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Business Category
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { id: "ecommerce", label: "E-Commerce", desc: "Physical products" },
                    { id: "service", label: "Services", desc: "Consulting & salon" },
                    { id: "booking", label: "Bookings", desc: "Appointments" },
                    { id: "other", label: "Other", desc: "General queries" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        category === c.id
                          ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold">{c.label}</div>
                      <div className="mt-0.5 text-[10.5px] text-slate-500">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!businessName.trim()}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40"
              >
                Next: Language & Tone
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Language & AI Tone */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <Bot className="h-3.5 w-3.5" />
                Step 2: Language & Tone
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">How should your AI speak?</h2>
              <p className="text-xs text-slate-400">
                Conversa seamlessly understands Bangladeshi customer slang and phonetic spellings.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Primary Customer Language
                </label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { id: "banglish", label: "Banglish (English letters)", sample: "Bhai, apnar delivery kobe lagbe?" },
                    { id: "bangla", label: "Pure Bangla (বাংলা)", sample: "আপনার ডেলিভারি কবে প্রয়োজন?" },
                    { id: "english", label: "English", sample: "When would you like delivery?" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguageStyle(l.id)}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        languageStyle === l.id
                          ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{l.label}</div>
                      <div className="mt-1 text-[11px] text-slate-400 italic">{l.sample}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  AI Response Tone
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[
                    { id: "friendly", label: "Friendly & Warm", desc: "Welcoming and conversational" },
                    { id: "formal", label: "Professional & Polite", desc: "Respectful and structured" },
                    { id: "concise", label: "Short & Direct", desc: "Fast, to-the-point answers" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAiTone(t.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        aiTone === t.id
                          ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{t.label}</div>
                      <div className="mt-0.5 text-[10.5px] text-slate-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
              >
                Next: Business Knowledge
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Business Details & Policies */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  <Truck className="h-3.5 w-3.5" />
                  Step 3: Basic Store Policies
                </div>
                <h2 className="mt-3 text-2xl font-bold text-white">Teach your basic policies</h2>
                <p className="text-xs text-slate-400">
                  You can skip this and customize later from your Knowledge Base settings.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinishOnboarding}
                className="text-xs text-slate-400 hover:text-slate-200 underline pt-2"
              >
                Skip for now
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Store Overview / Products Sold (Optional)
                </label>
                <textarea
                  rows={2}
                  value={businessOverview}
                  onChange={(e) => setBusinessOverview(e.target.value)}
                  placeholder="e.g. We sell premium men's cotton panjabis and casual shirts online with cash on delivery across Bangladesh."
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Inside Dhaka Delivery (৳)
                  </label>
                  <input
                    type="number"
                    value={deliveryDhaka}
                    onChange={(e) => setDeliveryDhaka(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Outside Dhaka Delivery (৳)
                  </label>
                  <input
                    type="number"
                    value={deliveryOutside}
                    onChange={(e) => setDeliveryOutside(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Return & Exchange Policy
                </label>
                <input
                  type="text"
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinishOnboarding}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup & Enter Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
