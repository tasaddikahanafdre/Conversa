"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  Truck,
  CreditCard,
  RotateCcw,
  Clock,
} from "lucide-react";

export default function KnowledgePage() {
  const [faqs, setFaqs] = useState([
    {
      id: "1",
      q: "Apnader delivery charge koto?",
      a: "Dhaka city te delivery charge 70 BDT, ar Dhaka baire 130 BDT. 3 ta product eksathe order korle delivery free!",
    },
    {
      id: "2",
      q: "Ami ki Cash on Delivery te payment korte parbo?",
      a: "Haa, amra shara Bangladesh-e cash on delivery offer kori. Product haate peye delivery man k taka diben.",
    },
    {
      id: "3",
      q: "Product size fit na hole exchange kora jabe?",
      a: "Oboshoy! Product pawar 3 diner moddhe amader inbox e janale amra size exchange kore dibo.",
    },
  ]);

  const [deliveryInside, setDeliveryInside] = useState("70");
  const [deliveryOutside, setDeliveryOutside] = useState("130");
  const [deliveryDays, setDeliveryDays] = useState("Dhaka te 24-48 hours, Dhaka baire 2-3 din.");

  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ || !newA) return;
    setFaqs([...faqs, { id: Date.now().toString(), q: newQ, a: newA }]);
    setNewQ("");
    setNewA("");
    setIsAddingFaq(false);
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Knowledge Base & SOP Rules
          </h1>
          <p className="text-sm text-slate-400">
            Rules and answers your AI references when replying to customers
          </p>
        </div>

        <button
          onClick={() => setIsAddingFaq(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Custom FAQ
        </button>
      </div>

      {/* Core Logistics Policies Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Standard Delivery Rules</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Inside Dhaka (৳)
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">৳</span>
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
              Outside Dhaka (৳)
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-semibold">৳</span>
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
        <form onSubmit={handleAddFaq} className="rounded-2xl border border-blue-500/40 bg-slate-950 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Create New Knowledge FAQ</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Customer Question / Trigger</label>
            <input
              type="text"
              required
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              placeholder="e.g. Apnader outlet/showroom kothay?"
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">AI Response / Policy</label>
            <textarea
              required
              rows={2}
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
              placeholder="Amader online-only brand, kono physical showroom nei. Amra shara deshe home delivery dei."
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingFaq(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Save Question
            </button>
          </div>
        </form>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white">Trained Business Knowledge ({faqs.length})</h2>

        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="group relative rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">Q</span>
                    <h4 className="text-sm font-semibold text-white">{faq.q}</h4>
                  </div>
                  <div className="flex items-start gap-2 pl-0.5 pt-1">
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">A</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 opacity-60 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
