"use client";

import { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  Search,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  item: string;
  amount: number;
  status: "pending" | "dispatched" | "delivered";
  courier?: "steadfast" | "pathao";
  trackingCode?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-901",
      customerName: "Kazi Rafiq",
      phone: "01711223344",
      address: "House 24, Road 7, Sector 4, Uttara, Dhaka",
      item: "Premium Heavyweight Cotton T-Shirt (Size L) x 1",
      amount: 820, // 750 + 70 delivery
      status: "pending",
    },
    {
      id: "ORD-902",
      customerName: "Sultana Razia",
      phone: "01899887766",
      address: "Chawkbazar, Chittagong",
      item: "Royal Semi-Fit Embroidered Panjabi (Size 42) x 1",
      amount: 1980, // 1850 + 130 delivery
      status: "dispatched",
      courier: "steadfast",
      trackingCode: "STDF-872911",
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courierProvider, setCourierProvider] = useState<"steadfast" | "pathao">("steadfast");
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsDispatching(true);
    setTimeout(() => {
      const tracking =
        courierProvider === "steadfast"
          ? `STDF-${Math.floor(100000 + Math.random() * 900000)}`
          : `PTH-${Math.floor(100000 + Math.random() * 900000)}`;

      setOrders(
        orders.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: "dispatched",
                courier: courierProvider,
                trackingCode: tracking,
              }
            : o
        )
      );
      setIsDispatching(false);
      setSelectedOrder(null);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Orders & Courier Dispatch
        </h1>
        <p className="text-sm text-slate-400">
          Orders extracted automatically from customer conversations — dispatch to Steadfast or Pathao with 1 click
        </p>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer & Phone</th>
                <th className="px-6 py-3.5">Delivery Address</th>
                <th className="px-6 py-3.5">Items Ordered</th>
                <th className="px-6 py-3.5">Amount (COD)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-6 py-4 font-bold text-white font-mono">{o.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{o.customerName}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{o.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-xs truncate">{o.address}</td>
                  <td className="px-6 py-4 text-slate-200">{o.item}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{formatBdt(o.amount)}</td>
                  <td className="px-6 py-4">
                    {o.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        Pending Dispatch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-blue-400 border border-blue-500/20">
                        <Truck className="h-3 w-3" />
                        Dispatched ({o.courier})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {o.status === "pending" ? (
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Send to Courier
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">{o.trackingCode}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Dispatch Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleDispatch}
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-400" />
                Dispatch Order #{selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Courier Provider
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCourierProvider("steadfast")}
                  className={`rounded-xl border p-3 text-left transition ${
                    courierProvider === "steadfast"
                      ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  <div className="text-xs font-bold text-white">Steadfast Courier</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">Nationwide delivery & next-day COD</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCourierProvider("pathao")}
                  className={`rounded-xl border p-3 text-left transition ${
                    courierProvider === "pathao"
                      ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  <div className="text-xs font-bold text-white">Pathao Courier</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">Fastest parcel delivery in Dhaka</div>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-1.5 text-xs text-slate-300">
              <div><strong className="text-white">Customer:</strong> {selectedOrder.customerName} ({selectedOrder.phone})</div>
              <div><strong className="text-white">Address:</strong> {selectedOrder.address}</div>
              <div><strong className="text-white">COD Amount to Collect:</strong> {formatBdt(selectedOrder.amount)}</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDispatching}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isDispatching ? "Booking Parcel..." : `Book with ${courierProvider === "steadfast" ? "Steadfast" : "Pathao"}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
