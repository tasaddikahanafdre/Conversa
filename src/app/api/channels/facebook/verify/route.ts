import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPageToken } from "@/lib/meta/client";
import { decryptToken } from "@/lib/security/encryption";

export async function POST(request: NextRequest) {
  try {
    const { channelId, workspaceId } = await request.json();

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required." },
        { status: 400 }
      );
    }

    // 1. Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Fetch channel record (including encrypted token strictly on server)
    const adminClient = createAdminClient();
    const { data: channel, error: channelError } = await adminClient
      .from("connected_channels")
      .select("id, workspace_id, platform_id, account_name, page_access_token_encrypted, is_active")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "Channel not found." },
        { status: 404 }
      );
    }

    // 3. Verify workspace authorization
    const targetWs = workspaceId || channel.workspace_id;
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWs)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized in this workspace" },
        { status: 403 }
      );
    }

    // 4. Decrypt token securely
    let plainToken: string;
    try {
      plainToken = decryptToken(channel.page_access_token_encrypted);
    } catch (decryptErr) {
      console.error("[Verify Token Decryption Failure]", decryptErr);
      return NextResponse.json({
        isValid: false,
        error: "Token decryption failed. Credential may have been corrupted or encryption secret changed.",
      });
    }

    // 5. Test token against Meta Graph API
    const verification = await verifyPageToken(channel.platform_id, plainToken);

    // 6. Update database status and timestamp
    const nowIso = new Date().toISOString();
    try {
      await adminClient
        .from("connected_channels")
        .update({
          last_verified_at: nowIso,
          status: verification.isValid ? "active" : "expired",
        })
        .eq("id", channel.id);
    } catch (updateErr) {
      console.warn("[Verify Status Update Warning]", updateErr);
    }

    return NextResponse.json({
      isValid: verification.isValid,
      pageId: verification.pageId || channel.platform_id,
      pageName: verification.pageName || channel.account_name,
      lastVerifiedAt: nowIso,
      error: verification.error,
    });
  } catch (err: unknown) {
    console.error("[Channel Verify Route Error]", err);
    const msg = err instanceof Error ? err.message : "Verification error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
