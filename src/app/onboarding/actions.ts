"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(data: {
  businessName: string;
  category: string;
  languageStyle: string;
  aiTone: string;
  businessOverview: string;
  deliveryDhaka: string;
  deliveryOutside: string;
  returnPolicy: string;
}) {
  // 1. Verify user session via server cookies
  const serverSupabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Please log in to complete setup.");
  }

  // 2. Use privileged admin client on the server to prevent RLS chicken-and-egg timing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createAdminClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const rawSlug = (data.businessName || "workspace")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 30);
  const slug = `${rawSlug}-${Math.random().toString(36).substring(2, 7)}`;

  // 3. Create Workspace
  const { data: workspace, error: wsError } = await adminClient
    .from("workspaces")
    .insert({
      name: data.businessName || "My Business",
      slug,
      currency: "BDT",
      balance_bdt: 50.0, // Welcome credit
    })
    .select()
    .single();

  if (wsError) {
    console.error("[Onboarding Server Action] wsError:", wsError);
    throw new Error(`Failed to create workspace: ${wsError.message}`);
  }

  // 4. Add User as Workspace Owner
  const { error: memberError } = await adminClient.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    console.error("[Onboarding Server Action] memberError:", memberError);
    throw new Error(`Failed to assign workspace owner: ${memberError.message}`);
  }

  // 5. Create Default AI Agent
  const personaPrompt = `You are a polite, helpful customer service agent representing ${data.businessName} in Bangladesh. Speak in natural ${data.languageStyle} with a ${data.aiTone} tone. ${data.businessOverview}`;

  const { data: agent, error: agentError } = await adminClient
    .from("ai_agents")
    .insert({
      workspace_id: workspace.id,
      name: "Conversa Assistant",
      persona_prompt: personaPrompt,
      business_type: data.category || "ecommerce",
      business_overview: data.businessOverview || "",
      language_style: data.languageStyle || "banglish",
      primary_model: "gemini-1.5-flash",
      is_active: true,
    })
    .select()
    .single();

  if (agentError) {
    console.error("[Onboarding Server Action] agentError:", agentError);
    throw new Error(`Failed to initialize AI agent: ${agentError.message}`);
  }

  // 6. Save Initial Knowledge Rules
  const { error: knowledgeError } = await adminClient.from("agent_knowledge").insert([
    {
      agent_id: agent.id,
      category: "delivery",
      title: "Standard Delivery Fees",
      content: `Delivery fee is ৳${data.deliveryDhaka || 70} inside Dhaka, and ৳${data.deliveryOutside || 130} outside Dhaka.`,
    },
    {
      agent_id: agent.id,
      category: "return_policy",
      title: "Return and Replacement Policy",
      content: data.returnPolicy || "7-day exchange for defective items.",
    },
  ]);

  if (knowledgeError) {
    console.error("[Onboarding Server Action] knowledgeError:", knowledgeError);
    // Non-fatal, agent is still created
  }

  revalidatePath("/dashboard");
  return { success: true, workspaceId: workspace.id };
}
