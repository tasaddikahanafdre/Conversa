import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId =
      request.nextUrl.searchParams.get("session_id") ||
      cookieStore.get("meta_pending_session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "No pending Facebook authorization session found." },
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

    // 2. Query session from database
    const adminClient = createAdminClient();
    const { data: session, error: sessionError } = await adminClient
      .from("meta_oauth_sessions")
      .select("id, user_id, workspace_id, candidate_pages, expires_at")
      .or(`id.eq.${sessionId},state.eq.${sessionId}`)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Authorization session not found or expired." },
        { status: 404 }
      );
    }

    // 3. Verify session user or workspace membership
    if (session.user_id && session.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied to this authorization session." },
        { status: 403 }
      );
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Session has expired. Please initiate Facebook connection again." },
        { status: 410 }
      );
    }

    // 4. Return sanitized candidates list — EXPLICITLY OMIT ANY TOKENS
    const candidates = Array.isArray(session.candidate_pages)
      ? session.candidate_pages.map((page: any) => ({
          id: page.id,
          name: page.name,
          category: page.category || "Facebook Page",
          tasks: page.tasks || [],
          pictureUrl: page.pictureUrl || null,
        }))
      : [];

    return NextResponse.json({
      sessionId: session.id,
      workspaceId: session.workspace_id,
      candidates,
    });
  } catch (err: unknown) {
    console.error("[Candidates API Error]", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
