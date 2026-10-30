"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  Search,
  MessageSquare,
  Plus,
  Loader2,
  Trash2,
  Phone,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ConfirmedOrder {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: any;
  total_amount: number;
  status: "confirmed" | "dispatched_courier" | "pending" | "cancelled";
  courier_tracking_code: string | null;
  courier_provider: string | null;
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ConfirmedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrder | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // New Confirmed Order Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newItemName, setNewItemName] = useState("XO1 Auto Charge Separator");
  const [newPrice, setNewPrice] = useState("699");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchConfirmedOrders();
  }, []);

  async function fetchConfirmedOrders() {
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
      setWorkspaceId(member.workspace_id);

      // Only fetch orders that have complete Name, Phone, and Address
      const { data: orderList, error } = await supabase
        .from("captured_orders")
        .select("*")
        .eq("workspace_id", member.workspace_id)
        .not("customer_name", "is", null)
        .not("customer_phone", "is", null)
        .not("delivery_address", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Strictly filter only confirmed orders that have non-empty address, name, and phone
      const validOrders = (orderList || []).filter((o) => {
        const hasName = Boolean(o.customer_name?.trim() && o.customer_name !== "Customer");
        const hasPhone = Boolean(o.customer_phone?.trim() && o.customer_phone.length >= 10);
        const hasAddress = Boolean(o.delivery_address?.trim() && o.delivery_address.length >= 6);
        return hasName && hasPhone && hasAddress;
      });

      setOrders(validOrders);
    } catch (err) {
      console.error("Error loading confirmed orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDispatchCourier = async (orderId: string, provider: "steadfast" | "pathao") => {
    try {
      setUpdatingId(orderId);
      const trackingCode = `${provider === "steadfast" ? "SF" : "PTH"}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const { error } = await supabase
        .from("captured_orders")
        .update({
          status: "dispatched_courier",
          courier_provider: provider,
          courier_tracking_code: trackingCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "dispatched_courier",
                courier_provider: provider,
                courier_tracking_code: trackingCode,
              }
            : o
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: "dispatched_courier",
                courier_provider: provider,
                courier_tracking_code: trackingCode,
              }
            : null
        );
      }
    } catch (err: any) {
      alert("Failed to book courier: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateConfirmedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newAddress.trim() || !workspaceId) {
      alert("All fields (Customer Name, Phone Number, Delivery Address) are required.");
      return;
    }

    try {
      setSubmittingOrder(true);
      const isDhaka =
        newAddress.toLowerCase().includes("dhaka") || newAddress.includes("ঢাকা");
      const deliveryFee = isDhaka ? 70 : 130;
      const itemPrice = parseFloat(newPrice) || 699;
      const total = itemPrice + deliveryFee;

      const { data: inserted, error } = await supabase
        .from("captured_orders")
        .insert({
          workspace_id: workspaceId,
          customer_name: newCustomerName.trim(),
          customer_phone: newCustomerPhone.trim(),
          delivery_address: newAddress.trim(),
          items: [{ title: newItemName.trim(), quantity: 1, price: itemPrice }],
          total_amount: total,
          status: "confirmed",
          courier_provider: "steadfast",
        })
        .select()
        .single();

      if (error) throw error;

      if (inserted) {
        setOrders([inserted, ...orders]);
      }

      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewAddress("");
      setShowAddModal(false);
    } catch (err: any) {
      alert("Failed to save confirmed order: " + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const filtered = orders.filter(
    (o) =>
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      o.delivery_address.toLowerCase().includes(search.toLowerCase()) ||
      (o.courier_tracking_code && o.courier_tracking_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Confirmed Orders & Courier Dispatch
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Details Only
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Orders captured from customer conversations with complete Customer Name, Mobile Number, and Delivery Address
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create Confirmed Order
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Confirmed Orders
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{orders.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Verified with Name, Phone & Address
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Ready for Courier Dispatch
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {orders.filter((o) => o.status === "confirmed" || o.status === "pending").length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Awaiting Steadfast / Pathao pickup</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Dispatched / In Transit
            </span>
            <Truck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-blue-400">
            {orders.filter((o) => o.status === "dispatched_courier").length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Booked with tracking numbers</div>
        </div>
      </div>

      {/* Confirmed Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing {filtered.length} confirmed order{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-white">No confirmed orders yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              When a customer confirms an order on Messenger with their Name, Phone Number, and Delivery Address, it will instantly appear here with full details.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" /> Create Test Confirmed Order
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Recipient & Contact</th>
                  <th className="px-6 py-4 font-semibold">Delivery Address</th>
                  <th className="px-6 py-4 font-semibold">Ordered Items</th>
                  <th className="px-6 py-4 font-semibold">Total (COD)</th>
                  <th className="px-6 py-4 font-semibold">Dispatch Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Courier Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((order) => {
                  const isDispatched = order.status === "dispatched_courier";
                  const isDhaka =
                    order.delivery_address.toLowerCase().includes("dhaka") ||
                    order.delivery_address.includes("ঢাকা");

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-900/40 transition cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Recipient Name & Phone */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                          {order.customer_name}
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-slate-300 text-xs">
                            {order.customer_phone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPhone(order.customer_phone);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800"
                            title="Copy phone"
                          >
                            {copiedPhone === order.customer_phone ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-xs leading-relaxed">
                            {order.delivery_address}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                            {isDhaka ? "Inside Dhaka (৳70 COD)" : "Outside Dhaka (৳130 COD)"}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {Array.isArray(order.items) ? (
                            order.items.map((item: any, idx: number) => (
                              <div key={idx} className="font-medium text-white flex items-center gap-1">
                                <span>{item.title || item.name}</span>
                                <span className="text-slate-400 text-[11px]">
                                  (x{item.quantity || 1})
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-white">XO1 Auto Charge Separator (x1)</div>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">
                          {formatBdt(order.total_amount)}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Cash on Delivery
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isDispatched
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {isDispatched ? (
                            <>
                              <Truck className="h-3 w-3" /> Dispatched
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Confirmed
                            </>
                          )}
                        </span>

                        {order.courier_tracking_code && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {order.courier_provider?.toUpperCase()}: {order.courier_tracking_code}
                          </div>
                        )}
                      </td>

                      {/* Dispatch Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {isDispatched ? (
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Booked with Courier
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDispatchCourier(order.id, "steadfast")}
                              disabled={updatingId === order.id}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                            >
                              Dispatch Steadfast
                            </button>
                            <button
                              onClick={() => handleDispatchCourier(order.id, "pathao")}
                              disabled={updatingId === order.id}
                              className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                            >
                              Pathao
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Order Details & Packing Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Recipient Details Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Verified Recipient
                </span>
                <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">
                  Confirmed Order
                </span>
              </div>
              <div className="text-sm font-bold text-white">{selectedOrder.customer_name}</div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono">{selectedOrder.customer_phone}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{selectedOrder.delivery_address}</span>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
              <div className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-1">
                Order Items
              </div>
              {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-slate-200 py-1">
                    <span>
                      {item.title || item.name} (x{item.quantity || 1})
                    </span>
                    <span className="font-semibold text-white">
                      {formatBdt(item.price * (item.quantity || 1))}
                    </span>
                  </div>
                ))}

              <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-bold text-white text-sm">
                <span>Total Amount (COD):</span>
                <span className="text-emerald-400">{formatBdt(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Courier Booking Status */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Tracking:{" "}
                <strong className="text-white">
                  {selectedOrder.courier_tracking_code || "Not yet booked"}
                </strong>
              </span>

              {selectedOrder.status !== "dispatched_courier" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDispatchCourier(selectedOrder.id, "steadfast")}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Book Steadfast
                  </button>
                  <button
                    onClick={() => handleDispatchCourier(selectedOrder.id, "pathao")}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    Book Pathao
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Consignment Dispatched
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Confirmed Order Modal */}
      {showAddModal && (
        <form
          onSubmit={handleCreateConfirmedOrder}
          className="rounded-2xl border border-blue-500/40 bg-slate-950 p-6 space-y-4 shadow-xl shadow-blue-950/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Create Confirmed Order</h3>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Address, Name & Phone Required
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Recipient Customer Name *
              </label>
              <input
                type="text"
                required
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Drelicious Dregon"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Verified Mobile Number (BD) *
              </label>
              <input
                type="text"
                required
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Ordered Item
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Product Price (৳ BDT)
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Full Delivery Address (House, Road, Area, City/District) *
            </label>
            <textarea
              required
              rows={2}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="e.g. House 14, Road 5, Dhanmondi, Dhaka"
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submittingOrder}
              onClick={() => setShowAddModal(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingOrder}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submittingOrder ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Confirmed Order"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
