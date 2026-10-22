import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  getAuthorizedPages,
  subscribePageToApp,
} from "@/lib/meta/client";
import { encryptToken } from "@/lib/security/encryption";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  const cookieStore = await cookies();

  // 1. Check for Meta OAuth errors or user cancellation
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  if (error || errorReason) {
    const errorMsg =
      errorDescription ||
      (errorReason === "user_denied"
        ? "Facebook authorization was canceled or permissions were denied."
        : "Failed to authenticate with Facebook.");

    // Clean up temporary cookies
    cookieStore.delete("meta_oauth_state");
    cookieStore.delete("meta_oauth_workspace");

    return NextResponse.redirect(
      new URL(
        `/dashboard/channels?error=oauth_denied&message=${encodeURIComponent(errorMsg)}`,
        request.url
      )
    );
  }

  // 2. Extract and validate state parameter (CSRF protection)
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const cookieState = cookieStore.get("meta_oauth_state")?.value;
  const cookieWorkspace = cookieStore.get("meta_oauth_workspace")?.value;

  if (!state || !code) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/channels?error=invalid_request&message=${encodeURIComponent(
          "Missing authorization code or state parameter."
        )}`,
        request.url
      )
    );
  }

  // Check state against cookie if cookie is available
  if (cookieState && cookieState !== state) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/channels?error=invalid_state&message=${encodeURIComponent(
          "CSRF security validation failed. The authorization session was tampered or invalid."
        )}`,
        request.url
      )
    );
  }

  try {
    const adminClient = createAdminClient();

    // 3. Look up active session in database
    const { data: session, error: sessionError } = await adminClient
      .from("meta_oauth_sessions")
      .select("*")
      .eq("state", state)
      .maybeSingle();

    if (sessionError || !session) {
      if (!cookieWorkspace) {
        return NextResponse.redirect(
          new URL(
            `/dashboard/channels?error=expired_session&message=${encodeURIComponent(
              "Your Facebook login session has expired. Please try connecting again."
            )}`,
            request.url
          )
        );
      }
    }

    if (session && new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/channels?error=expired_session&message=${encodeURIComponent(
            "Your Facebook login session timed out. Please try again."
          )}`,
          request.url
        )
      );
    }

    const targetWorkspaceId = session?.workspace_id || cookieWorkspace;

    // 4. Exchange code for short-lived user token
    const { accessToken: shortLivedToken } = await exchangeCodeForUserToken(
      code,
      origin
    );

    // 5. Upgrade to 60-day long-lived user token
    const { accessToken: longLivedToken } =
      await exchangeForLongLivedUserToken(shortLivedToken);

    // 6. Fetch authorized pages the user manages
    const candidatePages = await getAuthorizedPages(longLivedToken);

    if (candidatePages.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/channels?error=no_pages&message=${encodeURIComponent(
            "No Facebook Pages found for this account. Ensure you are an Admin or Editor of a Facebook Page."
          )}`,
          request.url
        )
      );
    }

    // 7. Encrypt page access tokens immediately before any storage (AES-256-GCM)
    const sanitizedCandidates = candidatePages.map((page) => ({
      id: page.id,
      name: page.name,
      category: page.category || "Facebook Page",
      tasks: page.tasks || [],
      pictureUrl: page.pictureUrl || null,
      encryptedAccessToken: encryptToken(page.accessToken),
    }));

    // 8. AUTO-CONNECT IF EXACTLY 1 PAGE: ZERO EXTRA CLICKS ("Accept permissions and done!")
    if (candidatePages.length === 1) {
      const page = candidatePages[0];
      const encryptedToken = sanitizedCandidates[0].encryptedAccessToken;

      // Subscribe page webhook
      await subscribePageToApp(page.id, page.accessToken);

      // Find default AI agent for workspace
      const { data: defaultAgent } = await adminClient
        .from("ai_agents")
        .select("id")
        .eq("workspace_id", targetWorkspaceId)
        .limit(1)
        .maybeSingle();

      // Upsert connected channel using base columns guaranteed in database
      const basePayload: any = {
        workspace_id: targetWorkspaceId,
        platform: "facebook",
        platform_id: page.id,
        account_name: page.name,
        page_access_token_encrypted: encryptedToken,
        is_active: true,
        automation_enabled: true,
        comment_reply_enabled: true,
        connected_at: new Date().toISOString(),
        agent_id: defaultAgent?.id || null,
      };

      const { data: savedChannel } = await adminClient
        .from("connected_channels")
        .upsert(basePayload, { onConflict: "platform,platform_id" })
        .select("id")
        .single();

      // Optionally update extended attributes if schema has been upgraded
      if (savedChannel?.id) {
        try {
          await adminClient
            .from("connected_channels")
            .update({
              page_picture_url: page.pictureUrl || null,
              status: "active",
              last_verified_at: new Date().toISOString(),
              permissions: page.tasks || [],
            })
            .eq("id", savedChannel.id);
        } catch {
          // Ignored if optional columns pending migration
        }
      }

      // Clean up session & cookies
      if (session?.id) {
        await adminClient.from("meta_oauth_sessions").delete().eq("id", session.id);
      }
      cookieStore.delete("meta_pending_session");
      cookieStore.delete("meta_oauth_state");
      cookieStore.delete("meta_oauth_workspace");

      // Redirect straight back to dashboard with instant success notification
      const redirectUrl = new URL("/dashboard/channels", request.url);
      redirectUrl.searchParams.set("connected_page", page.name);
      return NextResponse.redirect(redirectUrl);
    }

    // 9. If user manages MULTIPLE pages: store session so user can pick which one to connect
    let sessionId = session?.id;
    if (sessionId) {
      await adminClient
        .from("meta_oauth_sessions")
        .update({
          candidate_pages: sanitizedCandidates,
        })
        .eq("id", sessionId);
    } else {
      const { data: newSession } = await adminClient
        .from("meta_oauth_sessions")
        .insert({
          state,
          workspace_id: targetWorkspaceId,
          user_id: session?.user_id,
          candidate_pages: sanitizedCandidates,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();
      sessionId = newSession?.id;
    }

    cookieStore.set("meta_pending_session", sessionId || state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 900,
      path: "/",
    });
    cookieStore.delete("meta_oauth_state");

    const redirectUrl = new URL("/dashboard/channels", request.url);
    redirectUrl.searchParams.set("select_page", "1");
    if (sessionId) {
      redirectUrl.searchParams.set("session_id", sessionId);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err: unknown) {
    console.error("[Meta OAuth Callback Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to process Facebook callback";
    return NextResponse.redirect(
      new URL(
        `/dashboard/channels?error=callback_failed&message=${encodeURIComponent(msg)}`,
        request.url
      )
    );
  }
}
