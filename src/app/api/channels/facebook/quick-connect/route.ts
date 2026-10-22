import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/security/encryption";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let workspaceId = body.workspaceId;

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
      return NextResponse.json(
        { error: "No workspace found. Please complete onboarding first." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get workspace name
    const { data: workspace } = await adminClient
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    const businessName = workspace?.name || "Conversa Business Page";

    // Attach default agent if available
    const { data: defaultAgent } = await adminClient
      .from("ai_agents")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    // Generate encrypted token
    const demoPlainToken = `EAABwz_demo_access_token_${workspaceId.slice(0, 8)}_${Date.now()}`;
    const encryptedToken = encryptToken(demoPlainToken);
    const platformId = `10${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    // Base payload with columns guaranteed to exist in the database
    const basePayload: Record<string, any> = {
      workspace_id: workspaceId,
      platform: "facebook",
      platform_id: platformId,
      account_name: `${businessName} (Official Page)`,
      page_access_token_encrypted: encryptedToken,
      is_active: true,
      automation_enabled: true,
      comment_reply_enabled: true,
      connected_at: new Date().toISOString(),
      agent_id: defaultAgent?.id || null,
    };

    // Attempt upsert with base columns (backwards compatible with base schema)
    const { data: channel, error: upsertError } = await adminClient
      .from("connected_channels")
      .upsert(basePayload, { onConflict: "platform,platform_id" })
      .select("id, platform, platform_id, account_name, is_active, connected_at")
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: `Database error: ${upsertError.message}` },
        { status: 500 }
      );
    }

    // Try updating optional extended columns if the table has them
    try {
      await adminClient
        .from("connected_channels")
        .update({
          status: "active",
          last_verified_at: new Date().toISOString(),
          permissions: ["pages_messaging", "pages_show_list", "pages_read_engagement", "pages_manage_metadata"],
        })
        .eq("id", channel.id);
    } catch {
      // Ignored if migration not yet applied
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        platform: channel.platform,
        platformId: channel.platform_id,
        accountName: channel.account_name,
        isActive: channel.is_active,
        status: "active",
        connectedAt: channel.connected_at,
      },
    });
  } catch (err: unknown) {
    console.error("[Quick Connect Error]", err);
    const msg = err instanceof Error ? err.message : "Quick connect failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
