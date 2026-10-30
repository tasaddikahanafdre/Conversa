import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate mime type
    const mimeType = file.type || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop() || "png";
    const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;

    const adminClient = createAdminClient();

    // 1. Try uploading to Supabase Storage 'product-images' bucket
    try {
      const { data: uploadData, error: uploadErr } = await adminClient.storage
        .from("product-images")
        .upload(safeFileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = adminClient.storage
          .from("product-images")
          .getPublicUrl(safeFileName);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
        }
      }
    } catch (storageErr) {
      console.warn("[Upload] Supabase Storage upload failed, falling back to local file storage:", storageErr);
    }

    // 2. Fallback to local /public/uploads/products/
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(localFilePath, buffer);

    const localUrl = `/uploads/products/${safeFileName}`;
    return NextResponse.json({ success: true, url: localUrl });
  } catch (error: any) {
    console.error("[Upload API Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to upload file" }, { status: 500 });
  }
}
