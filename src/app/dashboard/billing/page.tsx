"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  CreditCard,
  Plus,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function BillingPage() {
  const [balance, setBalance] = useState(50.0);
  const [loading, setLoading] = useState(true);
  const [isRecharging, setIsRecharging] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"bkash" | "nagad" | "card">("bkash");
  const [transactions, setTransactions] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function loadBilling() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace:workspaces(*)")
          .limit(1)
          .single();

        if (member?.workspace) {
          const ws = member.workspace as any;
          if (typeof ws.balance_bdt === "number") {
            setBalance(ws.balance_bdt);
          }

          // Fetch recent messages with cost
          const { data: msgs } = await supabase
            .from("messages")
            .select("id, content, cost_bdt, tokens_used, created_at, sender_type, conversation:conversations(contact_name)")
            .eq("sender_type", "ai")
            .order("created_at", { ascending: false })
            .limit(5);

          if (msgs && msgs.length > 0) {
            setTransactions(
              msgs.map((m: any) => ({
                id: m.id.slice(0, 8),
                customer: m.conversation?.contact_name || "Drelicious Dregon",
                channel: "Facebook Messenger",
                repliesCount: 1,
                cost: m.cost_bdt || 0.0024,
                time: new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }))
            );
          } else {
            setTransactions([
              {
                id: "TX-991",
                customer: "Drelicious Dregon",
                channel: "Facebook Messenger",
                repliesCount: 1,
                cost: 0.0024,
                time: "Recently",
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading billing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBilling();
  }, []);

  const handleConfirmRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToAdd = Number(customAmount) || Number(selectedPreset);
    setBalance((prev) => prev + amountToAdd);
    setIsRecharging(false);
    setCustomAmount("");
    alert(`Added ৳${amountToAdd} test credit to Conversa wallet!`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Wallet & Pay-As-You-Go Usage
        </h1>
        <p className="text-sm text-slate-400">
          Transparent, pay-per-token BDT billing. Powered by Google Gemini 3.5 Flash.
        </p>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Available Wallet Balance
              </span>
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {loading ? "..." : `৳ ${formatBdt(balance)}`}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Free trial balance active (~{Math.floor(balance / 0.003)} Gemini replies)
            </p>
          </div>

          <button
            onClick={() => setIsRecharging(true)}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Recharge Balance (bKash/Nagad)
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Average Cost per Reply
            </span>
            <TrendingDown className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">৳ 0.002</div>
          <p className="mt-1 text-xs text-slate-400">
            Powered by Gemini 3.5 Flash (fraction of a poisha per reply)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Messages Automated
            </span>
            <ArrowUpRight className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-purple-400">
            {transactions.length}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Live Messenger replies delivered to customers
          </p>
        </div>
      </div>

      {/* Per Conversation Usage Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent AI Reply Cost Breakdown</h3>
          <span className="text-xs text-slate-400">Billed strictly per token consumed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Platform</th>
                <th className="px-6 py-3.5">Replies</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5 text-right">Cost (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-6 py-4 font-semibold text-white">{t.customer}</td>
                  <td className="px-6 py-4 text-slate-400">{t.channel}</td>
                  <td className="px-6 py-4 text-slate-300">{t.repliesCount} reply</td>
                  <td className="px-6 py-4 text-slate-400">{t.time}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    ৳ {Number(t.cost).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recharge Modal */}
      {isRecharging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmRecharge}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-400" />
                Recharge BDT Wallet
              </h3>
              <button
                type="button"
                onClick={() => setIsRecharging(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Amount (BDT)
              </label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {["500", "1000", "2500"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(p);
                      setCustomAmount("");
                    }}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                      selectedPreset === p && !customAmount
                        ? "border-blue-500 bg-blue-600/10 text-blue-400"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    ৳ {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("bkash")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedMethod === "bkash"
                      ? "border-pink-500 bg-pink-500/10 text-pink-400"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  bKash
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod("nagad")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedMethod === "nagad"
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  Nagad
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRecharging(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Add Test Balance
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
