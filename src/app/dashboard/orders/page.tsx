"use client";

import { useState } from "react";
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
} from "lucide-react";
import { formatBdt } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Orders & Courier Dispatch
        </h1>
        <p className="text-sm text-slate-400">
          Orders automatically extracted from customer conversations — dispatch to Steadfast or Pathao with 1 click
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white">No captured orders yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            During customer conversations, Conversa automatically extracts delivery details (Recipient Name, Mobile Number, Delivery Address, Item, Quantity) and prepares them here for instant courier booking.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/test-arena"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Test Order Extraction in Simulator
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          {/* Orders table */}
        </div>
      )}
    </div>
  );
}
