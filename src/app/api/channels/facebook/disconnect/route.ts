import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // 2. Fetch channel
    const adminClient = createAdminClient();
    const { data: channel, error: channelError } = await adminClient
      .from("connected_channels")
      .select("id, workspace_id, account_name")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "Channel not found." },
        { status: 404 }
      );
    }

    // 3. Verify workspace authorization (owner or admin)
    const targetWs = workspaceId || channel.workspace_id;
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWs)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json(
        { error: "Forbidden: Only workspace owners and admins can disconnect channels." },
        { status: 403 }
      );
    }

    // 4. Safely mark channel as inactive and disconnected
    // Note: We deliberately do NOT delete conversation history or order records.
    const nowIso = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("connected_channels")
      .update({
        is_active: false,
        status: "disconnected",
        disconnected_at: nowIso,
        automation_enabled: false,
      })
      .eq("id", channel.id);

    if (updateError) {
      console.error("[Disconnect Update Error]", updateError);
      return NextResponse.json(
        { error: `Failed to disconnect channel: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Disconnected ${channel.account_name}. Past conversations and orders have been preserved.`,
    });
  } catch (err: unknown) {
    console.error("[Channel Disconnect Route Error]", err);
    const msg = err instanceof Error ? err.message : "Disconnect failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
