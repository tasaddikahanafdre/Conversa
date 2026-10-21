import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMetaConfigured } from "@/lib/meta/client";

export async function GET(request: NextRequest) {
  try {
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

    let workspaceId = request.nextUrl.searchParams.get("workspace_id");

    if (!workspaceId) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      workspaceId = member?.workspace_id;
    }

    if (!workspaceId) {
      return NextResponse.json({
        isMetaConfigured: isMetaConfigured(),
        connected: false,
        channel: null,
      });
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Query channel using adminClient to ensure fields are safely read and strictly sanitized
    const adminClient = createAdminClient();
    const { data: channel } = await adminClient
      .from("connected_channels")
      .select(
        "id, workspace_id, platform, platform_id, account_name, is_active, connected_at, automation_enabled, comment_reply_enabled"
      )
      .eq("workspace_id", workspaceId)
      .eq("platform", "facebook")
      .eq("is_active", true)
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!channel) {
      return NextResponse.json({
        isMetaConfigured: isMetaConfigured(),
        connected: false,
        channel: null,
      });
    }

    // Query extra metadata columns if present
    let extraData: any = {};
    try {
      const { data: extra } = await adminClient
        .from("connected_channels")
        .select("page_picture_url, status, last_verified_at, permissions")
        .eq("id", channel.id)
        .single();
      if (extra) {
        extraData = extra;
      }
    } catch {
      // Extended columns might not exist yet if migration pending
    }

    return NextResponse.json({
      isMetaConfigured: isMetaConfigured(),
      connected: true,
      channel: {
        id: channel.id,
        platform: channel.platform,
        platformId: channel.platform_id,
        accountName: channel.account_name,
        isActive: channel.is_active,
        status: extraData.status || (channel.is_active ? "active" : "disconnected"),
        connectedAt: channel.connected_at,
        lastVerifiedAt: extraData.last_verified_at || channel.connected_at,
        pictureUrl: extraData.page_picture_url || null,
        permissions: extraData.permissions || [],
        automationEnabled: channel.automation_enabled ?? true,
        commentReplyEnabled: channel.comment_reply_enabled ?? true,
      },
    });
  } catch (err: unknown) {
    console.error("[Channel Status Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch channel status" },
      { status: 500 }
    );
  }
}
