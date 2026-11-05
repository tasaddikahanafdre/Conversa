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
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatBdt } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  workspace_id: string;
  title: string;
  sku: string | null;
  price: number;
  min_price?: number;
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
  const [newMinPrice, setNewMinPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [customAddUrl, setCustomAddUrl] = useState("");
  const [uploadingAddImage, setUploadingAddImage] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMinPrice, setEditMinPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [customEditUrl, setCustomEditUrl] = useState("");
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

  // Handle Multi-file Uploads to /api/upload
  const handleUploadImageFiles = async (
    files: FileList | File[],
    type: "add" | "edit"
  ) => {
    if (!files || files.length === 0) return;
    try {
      if (type === "add") setUploadingAddImage(true);
      else setUploadingEditImage(true);

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || (!data.urls && !data.url)) {
        throw new Error(data.error || "Image upload failed");
      }

      const uploaded: string[] = Array.isArray(data.urls)
        ? data.urls
        : data.url
        ? [data.url]
        : [];

      if (type === "add") {
        setNewImageUrls((prev) => [...prev, ...uploaded]);
      } else {
        setEditImageUrls((prev) => [...prev, ...uploaded]);
      }
    } catch (err: any) {
      alert("Could not upload image(s): " + err.message);
    } finally {
      if (type === "add") {
        setUploadingAddImage(false);
        if (addFileInputRef.current) addFileInputRef.current.value = "";
      } else {
        setUploadingEditImage(false);
        if (editFileInputRef.current) editFileInputRef.current.value = "";
      }
    }
  };

  // Add custom URL to gallery
  const handleAddCustomUrl = (type: "add" | "edit") => {
    const url = (type === "add" ? customAddUrl : customEditUrl).trim();
    if (!url) return;
    if (type === "add") {
      setNewImageUrls((prev) => [...prev, url]);
      setCustomAddUrl("");
    } else {
      setEditImageUrls((prev) => [...prev, url]);
      setCustomEditUrl("");
    }
  };

  // Set one image as the primary product image (moves to index 0)
  const handleSetPrimary = (index: number, type: "add" | "edit") => {
    if (index === 0) return;
    if (type === "add") {
      setNewImageUrls((prev) => {
        const item = prev[index];
        const next = [...prev];
        next.splice(index, 1);
        return [item, ...next];
      });
    } else {
      setEditImageUrls((prev) => {
        const item = prev[index];
        const next = [...prev];
        next.splice(index, 1);
        return [item, ...next];
      });
    }
  };

  // Reorder photos (move left / right)
  const handleMoveImage = (
    index: number,
    direction: "left" | "right",
    type: "add" | "edit"
  ) => {
    const list = type === "add" ? [...newImageUrls] : [...editImageUrls];
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    if (type === "add") setNewImageUrls(list);
    else setEditImageUrls(list);
  };

  // Delete individual photo
  const handleDeleteImage = (index: number, type: "add" | "edit") => {
    if (type === "add") {
      setNewImageUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      setEditImageUrls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) return;

    try {
      setSubmitting(true);
      const priceNum = parseFloat(newPrice);
      const minPriceNum = newMinPrice.trim() ? parseFloat(newMinPrice) : priceNum;
      const stockNum = parseInt(newStock, 10) || 10;

      if (minPriceNum > priceNum) {
        alert("Minimum negotiation price cannot be higher than the normal selling price.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: newTitle.trim(),
          sku: newSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
          price: priceNum,
          min_price: minPriceNum,
          stock_quantity: stockNum,
          description: newDesc.trim() || null,
          image_urls: newImageUrls,
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
      setNewMinPrice("");
      setNewStock("");
      setNewDesc("");
      setNewImageUrls([]);
      setCustomAddUrl("");
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
    setEditMinPrice(
      typeof product.min_price === "number"
        ? product.min_price.toString()
        : product.price.toString()
    );
    setEditStock(product.stock_quantity.toString());
    setEditDesc(product.description || "");
    setEditImageUrls(
      Array.isArray(product.image_urls) ? [...product.image_urls] : []
    );
    setCustomEditUrl("");
    setEditIsAvailable(product.is_available);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editTitle.trim() || !editPrice.trim()) return;

    try {
      setUpdating(true);
      const priceNum = parseFloat(editPrice);
      const minPriceNum = editMinPrice.trim() ? parseFloat(editMinPrice) : priceNum;
      const stockNum = parseInt(editStock, 10) || 0;

      if (minPriceNum > priceNum) {
        alert("Minimum negotiation price cannot be higher than the normal selling price.");
        setUpdating(false);
        return;
      }

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          title: editTitle.trim(),
          sku: editSku.trim(),
          price: priceNum,
          min_price: minPriceNum,
          stock_quantity: stockNum,
          description: editDesc.trim() || null,
          is_available: editIsAvailable && stockNum > 0,
          image_urls: editImageUrls,
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
                Normal Selling Price (৳ BDT) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="890"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Regular price quoted initially.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Minimum Negotiation Price (৳ BDT)
              </label>
              <input
                type="number"
                step="any"
                value={newMinPrice}
                onChange={(e) => setNewMinPrice(e.target.value)}
                placeholder={newPrice || "750"}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-amber-400/90">Confidential floor. AI never goes below this.</p>
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
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-semibold text-slate-300">
                Product Photos ({newImageUrls.length} uploaded)
              </label>
              <span className="text-[11px] text-slate-400">
                ⭐ 1st photo is primary. Conversa sends all photos to customers.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                ref={addFileInputRef}
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadImageFiles(e.target.files, "add");
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingAddImage}
                onClick={() => addFileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-blue-500 transition disabled:opacity-50 shrink-0"
              >
                {uploadingAddImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <Upload className="h-4 w-4 text-blue-400" />
                )}
                {uploadingAddImage ? "Uploading..." : "Upload Photos (Select Multiple)"}
              </button>

              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <input
                  type="url"
                  value={customAddUrl}
                  onChange={(e) => setCustomAddUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomUrl("add");
                    }
                  }}
                  placeholder="Paste photo URL..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomUrl("add")}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>

            {/* Gallery Thumbnail Grid */}
            {newImageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {newImageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className={`group relative rounded-xl border p-1.5 transition ${
                      idx === 0
                        ? "border-amber-500/80 bg-amber-500/5 shadow-md shadow-amber-500/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-950">
                      <img
                        src={url}
                        alt={`Product preview ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                          <Star className="h-3 w-3 fill-slate-950" />
                          <span>Primary</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx, "add")}
                        title="Delete photo"
                        className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 p-1 text-slate-400 hover:bg-rose-600 hover:text-white transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] px-0.5">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, "left", "add")}
                          title="Move photo earlier"
                          className="rounded p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === newImageUrls.length - 1}
                          onClick={() => handleMoveImage(idx, "right", "add")}
                          title="Move photo later"
                          className="rounded p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx, "add")}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-medium transition"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                No photos selected yet. Click &quot;Upload Photos&quot; to select multiple images from device, or paste image URLs.
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
                Normal Selling Price (৳ BDT) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Regular price quoted initially.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Minimum Negotiation Price (৳ BDT)
              </label>
              <input
                type="number"
                step="any"
                value={editMinPrice}
                onChange={(e) => setEditMinPrice(e.target.value)}
                placeholder={editPrice}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-amber-400/90">Confidential floor. AI never goes below this.</p>
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
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-semibold text-slate-300">
                Product Photos ({editImageUrls.length} uploaded)
              </label>
              <span className="text-[11px] text-slate-400">
                ⭐ 1st photo is primary. Conversa sends all photos to customers.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                ref={editFileInputRef}
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadImageFiles(e.target.files, "edit");
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingEditImage}
                onClick={() => editFileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-emerald-500 transition disabled:opacity-50 shrink-0"
              >
                {uploadingEditImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <Upload className="h-4 w-4 text-emerald-400" />
                )}
                {uploadingEditImage ? "Uploading..." : "Add More Photos (Multi-select)"}
              </button>

              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <input
                  type="url"
                  value={customEditUrl}
                  onChange={(e) => setCustomEditUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomUrl("edit");
                    }
                  }}
                  placeholder="Paste photo URL..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomUrl("edit")}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>

            {/* Gallery Thumbnail Grid */}
            {editImageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {editImageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className={`group relative rounded-xl border p-1.5 transition ${
                      idx === 0
                        ? "border-amber-500/80 bg-amber-500/5 shadow-md shadow-amber-500/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-950">
                      <img
                        src={url}
                        alt={`Product photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                          <Star className="h-3 w-3 fill-slate-950" />
                          <span>Primary</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx, "edit")}
                        title="Delete photo"
                        className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 p-1 text-slate-400 hover:bg-rose-600 hover:text-white transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] px-0.5">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, "left", "edit")}
                          title="Move photo earlier"
                          className="rounded p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === editImageUrls.length - 1}
                          onClick={() => handleMoveImage(idx, "right", "edit")}
                          title="Move photo later"
                          className="rounded p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx, "edit")}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-medium transition"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                No photos for this product. Upload photos from device or paste image URLs to attach multiple photos.
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
                  <th className="px-6 py-3 font-semibold">Pricing (BDT)</th>
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
                          <div className="relative shrink-0">
                            <img
                              src={product.image_urls[0]}
                              alt={product.title}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-700/80 bg-slate-900"
                            />
                            {product.image_urls.length > 1 && (
                              <span
                                className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white ring-1 ring-slate-900 shadow"
                                title={`${product.image_urls.length} photos uploaded`}
                              >
                                {product.image_urls.length}
                              </span>
                            )}
                          </div>
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
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{formatBdt(product.price)}</div>
                      {typeof product.min_price === "number" && product.min_price < product.price ? (
                        <div className="text-[10px] text-emerald-400 font-medium">
                          Min: {formatBdt(product.min_price)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500">Fixed price</div>
                      )}
                    </td>
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
