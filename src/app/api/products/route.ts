import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // Resolve workspace
    const { data: memberWs } = await adminClient
      .from("workspace_members")
      .select("workspace_id")
      .limit(1)
      .maybeSingle();

    const wsId = memberWs?.workspace_id || "dc9f4daa-6ae7-4195-8130-66d268219c9e";

    const { data: products, error } = await adminClient
      .from("products")
      .select("id, title, sku, price, stock_quantity, description, image_urls, is_available, created_at, updated_at")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products: products || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();

    const { data: memberWs } = await adminClient
      .from("workspace_members")
      .select("workspace_id")
      .limit(1)
      .maybeSingle();

    const wsId = body.workspaceId || memberWs?.workspace_id || "dc9f4daa-6ae7-4195-8130-66d268219c9e";

    const title = (body.title || "").trim();
    const price = parseFloat(body.price) || 0;
    const stock = parseInt(body.stock_quantity, 10) || 10;
    const description = (body.description || "").trim();
    const sku = (body.sku || `SKU-${Date.now().toString().slice(-5)}`).trim();
    const imageUrls = Array.isArray(body.image_urls)
      ? body.image_urls
      : body.image_url
      ? [body.image_url]
      : [];

    if (!title || price <= 0) {
      return NextResponse.json({ error: "Title and a valid price are required" }, { status: 400 });
    }

    const { data: product, error } = await adminClient
      .from("products")
      .insert({
        workspace_id: wsId,
        title,
        price,
        stock_quantity: stock,
        description,
        sku,
        image_urls: imageUrls,
        is_available: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { id, title, price, stock_quantity, description, is_available, image_urls, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updateData.title = title.trim();
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity, 10) || 0;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (is_available !== undefined) updateData.is_available = Boolean(is_available);
    if (image_urls !== undefined) {
      updateData.image_urls = Array.isArray(image_urls) ? image_urls : [image_urls];
    } else if (image_url !== undefined) {
      updateData.image_urls = image_url ? [image_url] : [];
    }

    const { data: updated, error } = await adminClient
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const { error } = await adminClient.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete product" }, { status: 500 });
  }
}
