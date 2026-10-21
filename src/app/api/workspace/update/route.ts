import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const formData = await request.json();

    // Verify user is owner or admin of this workspace
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", formData.workspaceId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this workspace" },
        { status: 403 }
      );
    }

    // 1. Update workspace name
    const { error: wsError } = await supabase
      .from("workspaces")
      .update({
        name: formData.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", formData.workspaceId);

    if (wsError) throw wsError;

    // 2. Update AI Agent persona and language
    const { error: agentError } = await supabase
      .from("ai_agents")
      .update({
        business_overview: formData.businessOverview,
        language_style: formData.languageStyle,
        persona_prompt: `You are a polite, helpful customer service agent representing ${formData.name} in Bangladesh. Speak in natural ${formData.languageStyle} with a ${formData.aiTone} tone. ${formData.businessOverview}`,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", formData.workspaceId);

    if (agentError) throw agentError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
