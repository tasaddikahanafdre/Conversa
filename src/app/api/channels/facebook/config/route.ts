import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, appSecret } = await request.json();

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "Both Meta App ID and Meta App Secret are required." },
        { status: 400 }
      );
    }

    // Set process.env immediately in memory
    process.env.META_APP_ID = appId.trim();
    process.env.META_APP_SECRET = appSecret.trim();

    // Persist to .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf8");
    }

    // Replace or append META_APP_ID
    if (/^META_APP_ID=.*$/m.test(content)) {
      content = content.replace(/^META_APP_ID=.*$/m, `META_APP_ID=${appId.trim()}`);
    } else {
      content += `\nMETA_APP_ID=${appId.trim()}`;
    }

    // Replace or append META_APP_SECRET
    if (/^META_APP_SECRET=.*$/m.test(content)) {
      content = content.replace(/^META_APP_SECRET=.*$/m, `META_APP_SECRET=${appSecret.trim()}`);
    } else {
      content += `\nMETA_APP_SECRET=${appSecret.trim()}`;
    }

    fs.writeFileSync(envPath, content, "utf8");

    return NextResponse.json({
      success: true,
      message: "Meta App credentials saved successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save configuration";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
