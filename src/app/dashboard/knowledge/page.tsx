"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Truck,
  RotateCcw,
  Sparkles,
  Loader2,
  GraduationCap,
  Send,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface KnowledgeItem {
  id: string;
  agent_id: string;
  category: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export default function KnowledgePage() {
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Delivery charge settings
  const [deliveryInside, setDeliveryInside] = useState("70");
  const [deliveryOutside, setDeliveryOutside] = useState("130");
  const [deliveryDays, setDeliveryDays] = useState("Dhaka te 1-2 din, Dhaka baire 2-3 din.");
  const [savingLogistics, setSavingLogistics] = useState(false);
  const [logisticsSaved, setLogisticsSaved] = useState(false);

  // Add FAQ State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general_faq");
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [submittingFaq, setSubmittingFaq] = useState(false);

  // Train AI via Chat State
  const [trainInput, setTrainInput] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingFeedback, setTrainingFeedback] = useState<{
    success: boolean;
    reply: string;
  } | null>(null);

  const handleTrainViaChat = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = customText || trainInput;
    if (!text.trim() || isTraining) return;

    try {
      setIsTraining(true);
      setTrainingFeedback(null);

      const res = await fetch("/api/ai/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.success) {
        setTrainingFeedback({
          success: true,
          reply: data.reply || "AI trained and saved successfully!",
        });
        setTrainInput("");
        await fetchKnowledge();
      } else {
        setTrainingFeedback({
          success: false,
          reply: data.error || "Training failed. Please try again.",
        });
      }
    } catch (err: any) {
      setTrainingFeedback({
        success: false,
        reply: "Error: " + err.message,
      });
    } finally {
      setIsTraining(false);
    }
  };

  const supabase = createClient();

  useEffect(() => {
    fetchKnowledge();
  }, []);

  async function fetchKnowledge() {
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

      // Get agent
      const { data: agent } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("workspace_id", member.workspace_id)
        .maybeSingle();

      if (!agent) return;
      setAgentId(agent.id);

      const { data: items, error } = await supabase
        .from("agent_knowledge")
        .select("*")
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (items) {
        setKnowledgeList(items);

        // Parse delivery policy if already present
        const deliveryItem = items.find((i) => i.category === "delivery");
        if (deliveryItem) {
          const matchInside = deliveryItem.content.match(/inside.*?[৳]?(\d+)/i) || deliveryItem.content.match(/৳(\d+).*?inside/i);
          const matchOutside = deliveryItem.content.match(/outside.*?[৳]?(\d+)/i) || deliveryItem.content.match(/৳(\d+).*?outside/i);
          if (matchInside) setDeliveryInside(matchInside[1]);
          if (matchOutside) setDeliveryOutside(matchOutside[1]);
        }
      }
    } catch (err) {
      console.error("Error loading knowledge items:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveLogistics = async () => {
    if (!agentId) return;
    try {
      setSavingLogistics(true);
      const deliveryContent = `Delivery fee is ৳${deliveryInside} inside Dhaka (${deliveryDays.split(",")[0] || "1-2 days"}), and ৳${deliveryOutside} outside Dhaka (${deliveryDays.split(",")[1] || "2-3 days"}). Cash on Delivery (COD) available nationwide.`;

      // Check if delivery rule exists
      const existing = knowledgeList.find((i) => i.category === "delivery");
      if (existing) {
        const { error } = await supabase
          .from("agent_knowledge")
          .update({ content: deliveryContent, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("agent_knowledge")
          .insert({
            agent_id: agentId,
            category: "delivery",
            title: "Standard Delivery Fees & Timeline",
            content: deliveryContent,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        if (inserted) setKnowledgeList([...knowledgeList, inserted]);
      }

      setLogisticsSaved(true);
      setTimeout(() => setLogisticsSaved(false), 3000);
      await fetchKnowledge();
    } catch (err: any) {
      alert("Failed to save delivery policy: " + err.message);
    } finally {
      setSavingLogistics(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !agentId) return;

    try {
      setSubmittingFaq(true);
      const { data: inserted, error } = await supabase
        .from("agent_knowledge")
        .insert({
          agent_id: agentId,
          category: newCategory,
          title: newTitle.trim(),
          content: newContent.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (inserted) {
        setKnowledgeList([...knowledgeList, inserted]);
      }

      setNewTitle("");
      setNewContent("");
      setIsAddingFaq(false);
    } catch (err: any) {
      alert("Failed to save knowledge item: " + err.message);
    } finally {
      setSubmittingFaq(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this policy from AI knowledge?")) return;

    try {
      const { error } = await supabase.from("agent_knowledge").delete().eq("id", id);
      if (error) throw error;
      setKnowledgeList(knowledgeList.filter((k) => k.id !== id));
    } catch (err: any) {
      alert("Failed to delete item: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Knowledge Base & AI Training
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Live Dynamic Memory
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Train your AI via chat or manage official business policies and FAQs Conversa AI uses in customer conversations
          </p>
        </div>

        <button
          onClick={() => setIsAddingFaq(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Custom FAQ / Policy
        </button>
      </div>

      {/* Train AI via Simple Chatting Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-950/80 to-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Train AI with Simple Chatting</h2>
              <p className="text-xs text-slate-400">
                Type any product, price, delivery rule, or FAQ in plain English or Banglish. The AI extracts and saves it automatically.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleTrainViaChat} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 'We offer 7 days replacement guarantee' or 'Smart Watch Series 9 price is 2450 tk'..."
            value={trainInput}
            onChange={(e) => setTrainInput(e.target.value)}
            disabled={isTraining}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isTraining || !trainInput.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 shrink-0"
          >
            {isTraining ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Teach AI
              </>
            )}
          </button>
        </form>

        {trainingFeedback && (
          <div
            className={`rounded-xl border p-3.5 text-xs flex items-start gap-2 ${
              trainingFeedback.success
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                : "border-red-500/40 bg-red-950/40 text-red-200"
            }`}
          >
            {trainingFeedback.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <RotateCcw className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{trainingFeedback.reply}</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="font-medium text-slate-500">Quick train samples:</span>
          <button
            type="button"
            onClick={() => handleTrainViaChat(undefined, "We offer 7 days replacement warranty on all electronics")}
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 hover:border-emerald-500/50 hover:text-white transition"
          >
            "7 days replacement warranty"
          </button>
          <button
            type="button"
            onClick={() => handleTrainViaChat(undefined, "Our showroom is open from 10am to 8pm, Saturday to Thursday")}
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 hover:border-emerald-500/50 hover:text-white transition"
          >
            "Showroom hours 10am to 8pm"
          </button>
          <button
            type="button"
            onClick={() => handleTrainViaChat(undefined, "Free delivery on orders over ৳3000")}
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 hover:border-emerald-500/50 hover:text-white transition"
          >
            "Free delivery over ৳3000"
          </button>
        </div>
      </div>

      {/* Core Logistics Policies Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Standard Delivery & Logistics Rules</h2>
          </div>
          <button
            onClick={handleSaveLogistics}
            disabled={savingLogistics}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
          >
            {savingLogistics ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : logisticsSaved ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Save className="h-3.5 w-3.5 text-blue-400" />
            )}
            {logisticsSaved ? "Rules Saved!" : "Save Delivery Rules"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Inside Dhaka Delivery (৳)
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">
                ৳
              </span>
              <input
                type="number"
                value={deliveryInside}
                onChange={(e) => setDeliveryInside(e.target.value)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Outside Dhaka Delivery (৳)
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">
                ৳
              </span>
              <input
                type="number"
                value={deliveryOutside}
                onChange={(e) => setDeliveryOutside(e.target.value)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Add FAQ Form Modal */}
      {isAddingFaq && (
        <form
          onSubmit={handleAddFaq}
          className="rounded-2xl border border-blue-500/40 bg-slate-950 p-6 space-y-4 shadow-xl shadow-blue-950/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Create New Knowledge FAQ / Policy</h3>
            <span className="text-[11px] text-slate-400">Instantly synced to Conversa AI</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Customer Question or Topic Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Apnader outlet/showroom kothay?"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="general_faq">General FAQ</option>
                <option value="return_policy">Return / Replacement Policy</option>
                <option value="payment">Payment & Pricing Policy</option>
                <option value="business_hours">Operating Hours & Contact</option>
                <option value="custom">Custom Policy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              AI Response Instruction / Answer *
            </label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Amader store-e shara Bangladesh-e cash on delivery deya hoy."
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submittingFaq}
              onClick={() => setIsAddingFaq(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingFaq}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submittingFaq ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Knowledge Item"
              )}
            </button>
          </div>
        </form>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Trained Business Knowledge ({knowledgeList.length} Items)
          </h2>
          <span className="text-xs text-slate-400">All items are active and training the AI in real time</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : knowledgeList.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center text-slate-500">
            <BookOpen className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No knowledge items trained yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {knowledgeList.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                        {item.category.replace("_", " ")}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 opacity-60 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
