import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { channelId, commentReplyEnabled, automationEnabled } = await request.json();

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const updatePayload: Record<string, any> = {};
    if (typeof commentReplyEnabled === "boolean") {
      updatePayload.comment_reply_enabled = commentReplyEnabled;
    }
    if (typeof automationEnabled === "boolean") {
      updatePayload.automation_enabled = automationEnabled;
    }

    const { error: updateError } = await adminClient
      .from("connected_channels")
      .update(updatePayload)
      .eq("id", channelId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
