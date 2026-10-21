import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user session via server cookies
    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to complete setup." },
        { status: 401 }
      );
    }

    const data = await request.json();

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
      console.error("[Onboarding API] wsError:", wsError);
      return NextResponse.json(
        { error: `Failed to create workspace: ${wsError.message}` },
        { status: 500 }
      );
    }

    // 4. Add User as Workspace Owner
    const { error: memberError } = await adminClient.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      console.error("[Onboarding API] memberError:", memberError);
      return NextResponse.json(
        { error: `Failed to assign workspace owner: ${memberError.message}` },
        { status: 500 }
      );
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
      console.error("[Onboarding API] agentError:", agentError);
    }

    // 6. Save Initial Knowledge Rules
    if (agent) {
      await adminClient.from("agent_knowledge").insert([
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
    }

    return NextResponse.json({ success: true, workspaceId: workspace.id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
