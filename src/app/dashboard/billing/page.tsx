"use client";

import { useState } from "react";
import {
  Wallet,
  CreditCard,
  Plus,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";

export default function BillingPage() {
  const [balance, setBalance] = useState(850.0);
  const [isRecharging, setIsRecharging] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"bkash" | "nagad" | "card">("bkash");

  const [transactions, setTransactions] = useState([
    {
      id: "TX-771",
      customer: "Tanvir Ahmed",
      channel: "Facebook",
      repliesCount: 4,
      cost: 0.12,
      time: "Today, 10:14 AM",
    },
    {
      id: "TX-772",
      customer: "Sultana Razia",
      channel: "Facebook",
      repliesCount: 6,
      cost: 0.18,
      time: "Today, 09:30 AM",
    },
    {
      id: "TX-773",
      customer: "Kamrul Islam",
      channel: "Facebook",
      repliesCount: 3,
      cost: 0.09,
      time: "Yesterday, 08:45 PM",
    },
  ]);

  const handleConfirmRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToAdd = Number(customAmount) || Number(selectedPreset);
    setBalance((prev) => prev + amountToAdd);
    setIsRecharging(false);
    setCustomAmount("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Wallet & Pay-As-You-Go Usage
        </h1>
        <p className="text-sm text-slate-400">
          Transparent, pay-per-conversation BDT billing. No hidden fees or forced monthly lock-ins.
        </p>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Wallet Balance</span>
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">{formatBdt(balance)}</div>
            <p className="mt-1 text-xs text-slate-400">
              Enough for approximately ~{Math.floor(balance / 0.15)} customer inquiries
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
            <span className="text-xs font-semibold uppercase tracking-wider">Average Cost per Chat</span>
            <TrendingDown className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">৳ 0.12</div>
          <p className="mt-1 text-xs text-slate-400">
            Powered by high-efficiency Gemini 1.5 Flash (less than 15 poisha per customer conversation)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month Usage</span>
            <ArrowUpRight className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-purple-400">৳ 148.50</div>
          <p className="mt-1 text-xs text-slate-400">
            Across 1,230 automated messages generated
          </p>
        </div>
      </div>

      {/* Per Conversation Usage Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Conversation Cost Breakdown</h3>
          <span className="text-xs text-slate-400">Billed strictly per token consumed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Platform</th>
                <th className="px-6 py-3.5">AI Replies Generated</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5 text-right">Cost (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-6 py-4 font-semibold text-white">{t.customer}</td>
                  <td className="px-6 py-4 text-slate-400">{t.channel}</td>
                  <td className="px-6 py-4 text-slate-300">{t.repliesCount} messages</td>
                  <td className="px-6 py-4 text-slate-400">{t.time}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    ৳ {t.cost.toFixed(2)}
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

            {/* Presets */}
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
                    className={`rounded-xl border py-2.5 text-center text-xs font-bold transition ${
                      selectedPreset === p && !customAmount
                        ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                    }`}
                  >
                    ৳ {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Payment Channel
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: "bkash", label: "bKash" },
                  { id: "nagad", label: "Nagad" },
                  { id: "card", label: "Cards" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as any)}
                    className={`rounded-xl border py-2 text-center text-xs font-bold transition ${
                      selectedMethod === m.id
                        ? "border-pink-500 bg-pink-500/10 text-white ring-1 ring-pink-500"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
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
                Proceed with {selectedMethod.toUpperCase()}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
