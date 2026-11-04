import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    let files = formData.getAll("files") as File[];
    if (files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile) files = [singleFile];
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate mime type
      const mimeType = file.type || "image/jpeg";
      if (!mimeType.startsWith("image/")) {
        continue;
      }

      const fileExt = file.name.split(".").pop() || "png";
      const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;

      let fileUrl = "";

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
            fileUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn("[Upload] Supabase Storage upload failed, falling back to local file storage:", storageErr);
      }

      // 2. Fallback to local /public/uploads/products/
      if (!fileUrl) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const localFilePath = path.join(uploadsDir, safeFileName);
        fs.writeFileSync(localFilePath, buffer);
        fileUrl = `/uploads/products/${safeFileName}`;
      }

      if (fileUrl) {
        uploadedUrls.push(fileUrl);
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: "Failed to upload any images" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error("[Upload API Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to upload file" }, { status: 500 });
  }
}
