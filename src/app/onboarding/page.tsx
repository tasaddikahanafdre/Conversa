"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Agent & Business Profile
  const [businessName, setBusinessName] = useState("My Online Shop");
  const [aiName, setAiName] = useState("Conversa Assistant");
  const [category, setCategory] = useState("ecommerce");
  const [languageStyle, setLanguageStyle] = useState("banglish");

  // Step 2: Business Policies (SOP)
  const [deliveryDhaka, setDeliveryDhaka] = useState("70");
  const [deliveryOutside, setDeliveryOutside] = useState("130");
  const [deliveryTime, setDeliveryTime] = useState("2-3 days inside Dhaka, 3-5 days outside");
  const [returnPolicy, setReturnPolicy] = useState("7-day replacement if product is damaged or defective.");

  // Step 3: Sample Product
  const [productTitle, setProductTitle] = useState("Premium Cotton T-Shirt");
  const [productPrice, setProductPrice] = useState("750");
  const [productStock, setProductStock] = useState("25");

  const [saving, setSaving] = useState(false);

  const handleFinishOnboarding = async () => {
    setSaving(true);
    // Persist configuration in localStorage / database
    try {
      const config = {
        businessName,
        aiName,
        category,
        languageStyle,
        policies: {
          deliveryDhaka,
          deliveryOutside,
          deliveryTime,
          returnPolicy,
        },
        sampleProduct: {
          title: productTitle,
          price: productPrice,
          stock: productStock,
        },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("conversa_onboarding_config", JSON.stringify(config));
      }
      // Redirect to test arena with initial bot setup
      router.push("/dashboard/test-arena?onboarding=complete");
    } catch {
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      {/* Top Header */}
      <div className="mx-auto flex max-w-3xl items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Setup Your AI Agent</h1>
            <p className="text-xs text-slate-400 mt-1">Step {step} of 3</p>
          </div>
        </div>

        {/* Progress Pills */}
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

      {/* Main Form Container */}
      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        {/* STEP 1: Agent Persona & Brand */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                Step 1: Agent Persona
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">Name and style your assistant</h2>
              <p className="text-sm text-slate-400">
                Your AI will introduce itself and adapt its tone to your customers.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  AI Agent Name (What customers see)
                </label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="e.g. Maya, Kabir, Conversa Assistant"
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Preferred Conversational Tone
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[
                    { id: "banglish", label: "Banglish (Most Popular)", desc: "Apnar delivery kobe lagbe?" },
                    { id: "bangla", label: "Pure Bangla", desc: "আপনার ডেলিভারি কবে প্রয়োজন?" },
                    { id: "english", label: "English", desc: "When do you need delivery?" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLanguageStyle(t.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        languageStyle === t.id
                          ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="mt-1 text-[11px] text-slate-400 italic line-clamp-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Next: Business Policies
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Key Business Policies (SOP) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <Truck className="h-3.5 w-3.5" />
                Step 2: Delivery & Payment Rules
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">Teach your delivery & return policies</h2>
              <p className="text-sm text-slate-400">
                Customers frequently ask for delivery charges. Conversa will quote these accurately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Inside Dhaka Delivery (৳)
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">৳</span>
                  <input
                    type="number"
                    value={deliveryDhaka}
                    onChange={(e) => setDeliveryDhaka(e.target.value)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Outside Dhaka Delivery (৳)
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">৳</span>
                  <input
                    type="number"
                    value={deliveryOutside}
                    onChange={(e) => setDeliveryOutside(e.target.value)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Estimated Delivery Timeline
              </label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Return & Exchange Policy
              </label>
              <textarea
                rows={2}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Next: Sample Product
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Add Sample Product */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <PackagePlus className="h-3.5 w-3.5" />
                Step 3: Add Your First Product
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">Add a product to test inquiries</h2>
              <p className="text-sm text-slate-400">
                You can import full CSV catalogs later. Let&apos;s add one item now so you can test right away.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Product Title
                </label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="e.g. Silk Panjabi or Wireless Earbuds"
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Price (BDT)
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">৳</span>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      className="block w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                <div className="text-xs text-blue-300">
                  <span className="font-bold">Ready to simulate:</span> Next, you will test your AI assistant in a live phone arena before connecting your Facebook Page!
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleFinishOnboarding}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
              >
                Launch Test Simulator
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
