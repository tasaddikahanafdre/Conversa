"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Upload,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState([
    {
      id: "1",
      title: "Premium Heavyweight Cotton T-Shirt",
      sku: "TS-BLK-01",
      price: 750,
      stock: 45,
      isAvailable: true,
    },
    {
      id: "2",
      title: "Royal Semi-Fit Embroidered Panjabi",
      sku: "PJ-NAV-02",
      price: 1850,
      stock: 12,
      isAvailable: true,
    },
    {
      id: "3",
      title: "Vintage Slim Fit Denim Jeans",
      sku: "JN-BLU-03",
      price: 1450,
      stock: 0,
      isAvailable: false,
    },
  ]);

  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;

    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        title: newTitle,
        sku: newSku || `SKU-${Date.now().toString().slice(-4)}`,
        price: Number(newPrice),
        stock: Number(newStock) || 10,
        isAvailable: Number(newStock) > 0,
      },
    ]);

    setNewTitle("");
    setNewSku("");
    setNewPrice("");
    setNewStock("");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-400">
            Products your AI references to answer price, size, and stock availability questions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("CSV bulk import will open upload dialog")}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Upload CSV
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <form onSubmit={handleAddProduct} className="rounded-2xl border border-blue-500/40 bg-slate-950 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Add New Product</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Product Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Linen Short Sleeve Shirt"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">SKU / Code (Optional)</label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="e.g. SH-001"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Price in BDT (৳)</label>
              <input
                type="number"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="950"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Initial Stock Quantity</label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="20"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Save Product
            </button>
          </div>
        </form>
      )}

      {/* Filter and Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title or SKU..."
              className="block w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-6 py-4 font-semibold text-white">{item.title}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{item.sku}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{formatBdt(item.price)}</td>
                  <td className="px-6 py-4 text-slate-300">{item.stock} units</td>
                  <td className="px-6 py-4">
                    {item.isAvailable ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-red-400 border border-red-500/20">
                        <AlertCircle className="h-3 w-3" />
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
