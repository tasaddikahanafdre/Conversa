"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Loader2,
  Pencil,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  workspace_id: string;
  title: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  description: string | null;
  image_urls?: string[] | null;
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentAddedNotice, setRecentAddedNotice] = useState<string | null>(null);

  // Add Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingAddImage, setUploadingAddImage] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
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

      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Image Upload to /api/upload
  const handleUploadImageFile = async (
    file: File,
    type: "add" | "edit"
  ) => {
    if (!file) return;
    try {
      if (type === "add") setUploadingAddImage(true);
      else setUploadingEditImage(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Image upload failed");
      }

      if (type === "add") {
        setNewImageUrl(data.url);
      } else {
        setEditImageUrl(data.url);
      }
    } catch (err: any) {
      alert("Could not upload image: " + err.message);
    } finally {
      if (type === "add") setUploadingAddImage(false);
      else setUploadingEditImage(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) return;

    try {
      setSubmitting(true);
      const priceNum = parseFloat(newPrice);
      const stockNum = parseInt(newStock, 10) || 10;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: newTitle.trim(),
          sku: newSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
          price: priceNum,
          stock_quantity: stockNum,
          description: newDesc.trim() || null,
          image_url: newImageUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.product) {
        throw new Error(data.error || "Failed to create product");
      }

      setProducts([data.product, ...products]);
      setRecentAddedNotice(data.product.title);
      setTimeout(() => setRecentAddedNotice(null), 5000);

      setNewTitle("");
      setNewSku("");
      setNewPrice("");
      setNewStock("");
      setNewDesc("");
      setNewImageUrl("");
      setIsAdding(false);
    } catch (err: any) {
      alert("Failed to add product: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditSku(product.sku || "");
    setEditPrice(product.price.toString());
    setEditStock(product.stock_quantity.toString());
    setEditDesc(product.description || "");
    setEditImageUrl(product.image_urls?.[0] || "");
    setEditIsAvailable(product.is_available);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editTitle.trim() || !editPrice.trim()) return;

    try {
      setUpdating(true);
      const priceNum = parseFloat(editPrice);
      const stockNum = parseInt(editStock, 10) || 0;

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          title: editTitle.trim(),
          sku: editSku.trim(),
          price: priceNum,
          stock_quantity: stockNum,
          description: editDesc.trim() || null,
          is_available: editIsAvailable && stockNum > 0,
          image_url: editImageUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.product) {
        throw new Error(data.error || "Failed to update product");
      }

      setProducts(
        products.map((p) => (p.id === data.product.id ? data.product : p))
      );
      setRecentAddedNotice(`Updated "${data.product.title}"`);
      setTimeout(() => setRecentAddedNotice(null), 5000);
      setEditingProduct(null);
    } catch (err: any) {
      alert("Failed to update product: " + (err.message || "Unknown error"));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete product");
      }
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    const updatedStatus = !product.is_available;
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          is_available: updatedStatus,
        }),
      });
      if (res.ok) {
        setProducts(
          products.map((p) =>
            p.id === product.id ? { ...p, is_available: updatedStatus } : p
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to update availability:", err);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Product Catalog
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              AI Vision & Multi-Modal Sync
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Edit products, upload images, and manage real items Conversa AI recognizes and quotes to customers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingProduct(null);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </button>
        </div>
      </div>

      {recentAddedNotice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>&quot;{recentAddedNotice}&quot;</strong> saved! Conversa AI is now trained with this product&apos;s latest specs and photo.
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Catalog Items</span>
            <Package className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{products.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Synced to Conversa AI Vision</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">In Stock & Active</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {products.filter((p) => p.is_available && p.stock_quantity > 0).length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Available for customer quoting</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Stock Attention</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {products.filter((p) => !p.is_available || p.stock_quantity === 0).length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Out of stock or paused</div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAdding && (
        <form
          onSubmit={handleAddProduct}
          className="rounded-2xl border border-blue-500/40 bg-slate-950 p-6 space-y-4 shadow-xl shadow-blue-950/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-400" />
              Add Product to Catalog
            </h3>
            <span className="text-[11px] text-slate-400">Instantly trained into Conversa AI</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Wireless Noise Cancelling Earbuds"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                SKU / Product Code (Optional)
              </label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="e.g. WN-EAR-01"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Price (৳ BDT) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="699"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="50"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Product Description / Key Features
            </label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. 40 hours battery backup, Bluetooth 5.3, active noise cancellation."
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Product Image Upload Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-300">
              Product Photo / Image (Used for AI Vision Recognition)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                ref={addFileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImageFile(file, "add");
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingAddImage}
                onClick={() => addFileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-blue-500 transition disabled:opacity-50"
              >
                {uploadingAddImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <Upload className="h-4 w-4 text-blue-400" />
                )}
                {uploadingAddImage ? "Uploading..." : "Upload Photo From Device"}
              </button>

              <span className="text-xs text-slate-500">or enter image URL:</span>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {newImageUrl && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2 max-w-sm mt-2">
                <img
                  src={newImageUrl}
                  alt="Product preview"
                  className="h-12 w-12 rounded-lg object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white font-medium truncate">{newImageUrl}</div>
                  <div className="text-[10px] text-emerald-400">Ready for AI recognition</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewImageUrl("")}
                  className="p-1 text-slate-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <form
          onSubmit={handleUpdateProduct}
          className="rounded-2xl border border-emerald-500/40 bg-slate-950 p-6 space-y-4 shadow-xl shadow-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Pencil className="h-4 w-4 text-emerald-400" />
              Edit Product: {editingProduct.title}
            </h3>
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                SKU / Product Code
              </label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Price (৳ BDT) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Stock Quantity
              </label>
              <input
                type="number"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Product Description / Key Features
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Product Image Upload Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-300">
              Product Photo / Image (Used for AI Vision Recognition)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                ref={editFileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImageFile(file, "edit");
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingEditImage}
                onClick={() => editFileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-emerald-500 transition disabled:opacity-50"
              >
                {uploadingEditImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <Upload className="h-4 w-4 text-emerald-400" />
                )}
                {uploadingEditImage ? "Uploading..." : "Upload / Replace Photo"}
              </button>

              <span className="text-xs text-slate-500">or image URL:</span>
              <input
                type="url"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {editImageUrl && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2 max-w-sm mt-2">
                <img
                  src={editImageUrl}
                  alt="Product preview"
                  className="h-14 w-14 rounded-lg object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white font-medium truncate">{editImageUrl}</div>
                  <div className="text-[10px] text-emerald-400">Active image in AI catalog</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditImageUrl("")}
                  className="p-1 text-slate-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editAvailable"
                checked={editIsAvailable}
                onChange={(e) => setEditIsAvailable(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
              />
              <label htmlFor="editAvailable" className="text-xs text-slate-300 font-medium">
                Available for quoting to customers
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={updating}
                onClick={() => setEditingProduct(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search and Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Package className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm">No products found in catalog</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Product</th>
                  <th className="px-6 py-3 font-semibold">SKU</th>
                  <th className="px-6 py-3 font-semibold">Price (BDT)</th>
                  <th className="px-6 py-3 font-semibold">Stock</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_urls?.[0] ? (
                          <img
                            src={product.image_urls[0]}
                            alt={product.title}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-700/80 bg-slate-900 shrink-0"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 shrink-0">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{product.title}</div>
                          {product.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{product.sku || "—"}</td>
                    <td className="px-6 py-4 font-semibold text-white">{formatBdt(product.price)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          product.stock_quantity > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {product.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                          product.is_available && product.stock_quantity > 0
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        {product.is_available && product.stock_quantity > 0 ? "Available" : "Unavailable"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(product)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-500/10 hover:text-blue-400"
                          title="Edit product"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
