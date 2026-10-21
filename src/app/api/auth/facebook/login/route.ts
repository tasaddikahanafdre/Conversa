import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMetaConfigured, getMetaOAuthUrl } from "@/lib/meta/client";

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const cookieStore = await cookies();

    // 1. Authenticate caller
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", "/dashboard/channels");
      return NextResponse.redirect(loginUrl);
    }

    // 2. Validate workspace parameter or find user's workspace
    let workspaceId = request.nextUrl.searchParams.get("workspace_id");

    if (!workspaceId) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      workspaceId = member?.workspace_id;
    }

    if (!workspaceId) {
      return NextResponse.redirect(
        new URL("/onboarding", request.url)
      );
    }

    // 3. Verify user has access to this workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.redirect(
        new URL("/dashboard/channels?error=forbidden", request.url)
      );
    }

    // 4. Verify Meta credentials are configured
    if (!isMetaConfigured()) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/channels?error=meta_not_configured",
          request.url
        )
      );
    }

    // 5. Generate cryptographically secure random state (32 bytes = 64 hex chars)
    const state = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 6. Persist state in meta_oauth_sessions table
    try {
      const adminClient = createAdminClient();
      await adminClient.from("meta_oauth_sessions").insert({
        state,
        workspace_id: workspaceId,
        user_id: user.id,
        expires_at: expiresAt,
      });
    } catch (dbErr) {
      console.warn("[Meta OAuth Login] Could not persist to meta_oauth_sessions table:", dbErr);
    }

    // 7. Also set secure HTTP-only cookie as double-layer CSRF protection
    cookieStore.set("meta_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 900, // 15 minutes
      path: "/",
    });
    cookieStore.set("meta_oauth_workspace", workspaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 900,
      path: "/",
    });

    // 8. Redirect user to official Meta Facebook Login dialog
    const oauthUrl = getMetaOAuthUrl(state, origin);
    return NextResponse.redirect(oauthUrl);
  } catch (err: unknown) {
    console.error("[Meta OAuth Login Unexpected Error]", err);
    const msg = err instanceof Error ? err.message : "Initialization failed";
    return NextResponse.redirect(
      new URL(`/dashboard/channels?error=oauth_init_failed&message=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
