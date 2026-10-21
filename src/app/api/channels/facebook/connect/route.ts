import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscribePageToApp } from "@/lib/meta/client";
import { decryptToken } from "@/lib/security/encryption";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const { sessionId, pageId, workspaceId } = body;

    if (!sessionId || !pageId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId and pageId are required." },
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
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Fetch session from database
    const adminClient = createAdminClient();
    const { data: session, error: sessionError } = await adminClient
      .from("meta_oauth_sessions")
      .select("*")
      .or(`id.eq.${sessionId},state.eq.${sessionId}`)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Authorization session not found or expired." },
        { status: 404 }
      );
    }

    const targetWorkspaceId = workspaceId || session.workspace_id;

    // 3. Verify user has workspace membership
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace." },
        { status: 403 }
      );
    }

    // 4. Locate selected candidate page
    const candidatePages: any[] = Array.isArray(session.candidate_pages)
      ? session.candidate_pages
      : [];

    const selectedPage = candidatePages.find((p) => p.id === pageId);

    if (!selectedPage || !selectedPage.encryptedAccessToken) {
      return NextResponse.json(
        {
          error:
            "The selected Page is not in the list of authorized pages for this session.",
        },
        { status: 400 }
      );
    }

    // 5. Decrypt token securely on server to subscribe page webhook
    let pageAccessToken: string;
    try {
      pageAccessToken = decryptToken(selectedPage.encryptedAccessToken);
    } catch (decryptErr) {
      console.error("[Connect Decryption Error]", decryptErr);
      return NextResponse.json(
        { error: "Failed to decrypt authorization credentials." },
        { status: 500 }
      );
    }

    // 6. Subscribe Page to Conversa Webhook App
    const subscription = await subscribePageToApp(pageId, pageAccessToken);
    if (!subscription.success) {
      console.warn(
        `[Webhook App Subscription Warning] Could not subscribe page ${pageId}: ${subscription.error}`
      );
      // Non-fatal warning if App review is pending in development
    }

    // 7. Store connected channel in database
    // Ensure agent_id is attached if workspace has default agent
    const { data: defaultAgent } = await adminClient
      .from("ai_agents")
      .select("id")
      .eq("workspace_id", targetWorkspaceId)
      .limit(1)
      .maybeSingle();

    const channelPayload: any = {
      workspace_id: targetWorkspaceId,
      platform: "facebook",
      platform_id: pageId,
      account_name: selectedPage.name,
      page_access_token_encrypted: selectedPage.encryptedAccessToken,
      is_active: true,
      automation_enabled: true,
      comment_reply_enabled: true,
      connected_at: new Date().toISOString(),
      agent_id: defaultAgent?.id || null,
    };

    // Include extended columns if supported
    if (selectedPage.pictureUrl) {
      channelPayload.page_picture_url = selectedPage.pictureUrl;
    }
    channelPayload.status = "active";
    channelPayload.last_verified_at = new Date().toISOString();
    channelPayload.permissions = selectedPage.tasks || [];

    const { data: connectedChannel, error: saveError } = await adminClient
      .from("connected_channels")
      .upsert(channelPayload, { onConflict: "platform,platform_id" })
      .select(
        "id, workspace_id, platform, platform_id, account_name, is_active, automation_enabled, comment_reply_enabled, connected_at, created_at"
      )
      .single();

    if (saveError) {
      console.error("[Database Save Channel Error]", saveError);
      return NextResponse.json(
        { error: `Failed to save channel connection: ${saveError.message}` },
        { status: 500 }
      );
    }

    // 8. Clean up temporary oauth session
    await adminClient
      .from("meta_oauth_sessions")
      .delete()
      .eq("id", session.id);

    cookieStore.delete("meta_pending_session");
    cookieStore.delete("meta_oauth_state");
    cookieStore.delete("meta_oauth_workspace");

    return NextResponse.json({
      success: true,
      channel: {
        id: connectedChannel.id,
        platform: connectedChannel.platform,
        platformId: connectedChannel.platform_id,
        accountName: connectedChannel.account_name,
        isActive: connectedChannel.is_active,
        connectedAt: connectedChannel.connected_at,
        pictureUrl: selectedPage.pictureUrl || null,
        webhookSubscribed: subscription.success,
      },
    });
  } catch (err: unknown) {
    console.error("[Connect Route Error]", err);
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
