"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateWorkspaceSettingsAction(formData: {
  workspaceId: string;
  name: string;
  languageStyle: string;
  aiTone: string;
  businessOverview: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in");
  }

  // Server-side authorization check: verify user is owner or admin of this workspace
  const { data: membership, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", formData.workspaceId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Forbidden: You do not have permission to edit this workspace");
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

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
