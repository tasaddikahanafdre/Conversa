import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAiReply } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const { message, workspaceId } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required to train the AI" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Resolve workspace ID
    let wsId = workspaceId;
    if (!wsId) {
      const { data: memberWs } = await adminClient
        .from("workspace_members")
        .select("workspace_id")
        .limit(1)
        .maybeSingle();
      wsId = memberWs?.workspace_id || "dc9f4daa-6ae7-4195-8130-66d268219c9e";
    }

    // 2. Resolve AI Agent for this workspace
    let { data: agent } = await adminClient
      .from("ai_agents")
      .select("id, name, workspace_id")
      .eq("workspace_id", wsId)
      .maybeSingle();

    if (!agent) {
      // Fallback to any active agent
      const { data: anyAgent } = await adminClient
        .from("ai_agents")
        .select("id, name, workspace_id")
        .limit(1)
        .maybeSingle();
      agent = anyAgent;
    }

    // 3. Ask Gemini to extract structured training data
    const parsePrompt = `
You are an expert AI training extractor for an e-commerce platform in Bangladesh.
A store merchant is talking to you to TRAIN or UPDATE your knowledge.
Their message: "${message.replace(/"/g, '\\"')}"

Determine whether this message is:
1) A "product" (adding a new item or updating an existing item with title, price in BDT/taka, stock, description, or specs).
2) "knowledge" (store policy, delivery charges, delivery times, return policy, payment options, showroom location, office hours, general FAQ).

Respond ONLY with a valid JSON object in the following format (no markdown code blocks, no other text):
{
  "type": "product" or "knowledge",
  "product": {
    "title": "Standardized Product Title",
    "price": 1200, // numeric price in BDT
    "stock_quantity": 25, // default to 20 if not specified
    "description": "Clear details, features or specs mentioned"
  },
  "knowledge": {
    "category": "delivery" | "return_policy" | "payment" | "showroom" | "general_faq",
    "title": "Short descriptive title for this rule or FAQ",
    "content": "Full clear details of what the merchant explained"
  },
  "friendlyConfirmation": "A polite, friendly confirmation in Bangla or Banglish explaining exactly what was learned and that it is now active for customers."
}
`;

    const aiRes = await generateAiReply(
      [{ role: "user", content: parsePrompt }],
      {
        model: "gemini-3.5-flash-lite",
        temperature: 0.1,
        maxTokens: 500,
      }
    );

    let parsed: any;
    try {
      const cleanJson = aiRes.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("[Train AI] Failed to parse JSON from AI output:", aiRes.text);
      return NextResponse.json(
        {
          error: "Could not automatically understand training details. Please specify product name and price or policy details.",
        },
        { status: 422 }
      );
    }

    if (parsed.type === "product" && parsed.product?.title) {
      const prod = parsed.product;
      const title = prod.title.trim();
      const price = typeof prod.price === "number" ? prod.price : parseFloat(prod.price) || 0;
      const stock = typeof prod.stock_quantity === "number" ? prod.stock_quantity : parseInt(prod.stock_quantity, 10) || 15;
      const description = prod.description || "";

      // Check if product with similar title exists in this workspace
      const { data: existingProds } = await adminClient
        .from("products")
        .select("id, title")
        .eq("workspace_id", wsId);

      const match = (existingProds || []).find((p) =>
        p.title.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(p.title.toLowerCase())
      );

      let savedRecord: any;
      if (match) {
        // Update existing product
        const { data: updated, error: updErr } = await adminClient
          .from("products")
          .update({
            title: title || match.title,
            price: price > 0 ? price : undefined,
            stock_quantity: stock,
            description: description || undefined,
            is_available: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", match.id)
          .select("*")
          .single();

        if (updErr) throw updErr;
        savedRecord = updated;
      } else {
        // Insert new product
        const sku = `SKU-${Date.now().toString().slice(-5)}`;
        const { data: inserted, error: insErr } = await adminClient
          .from("products")
          .insert({
            workspace_id: wsId,
            title,
            sku,
            price,
            stock_quantity: stock,
            description,
            is_available: true,
          })
          .select("*")
          .single();

        if (insErr) throw insErr;
        savedRecord = inserted;
      }

      return NextResponse.json({
        success: true,
        type: "product",
        action: match ? "updated" : "created",
        item: savedRecord,
        reply:
          parsed.friendlyConfirmation ||
          `আলহামদুলিল্লাহ! "${title}" (৳${price}) প্রডাক্ট সফলভাবে যুক্ত হয়েছে। কাস্টমাররা এখন মেসেঞ্জারে এই প্রডাক্ট সম্পর্কে জানতে পারবে। 😊`,
      });
    } else if (parsed.type === "knowledge" && parsed.knowledge) {
      const kn = parsed.knowledge;
      const agentId = agent?.id;

      if (!agentId) {
        return NextResponse.json({ error: "No active AI agent found for this workspace" }, { status: 400 });
      }

      // Check if knowledge in this category already exists
      const { data: existingKn } = await adminClient
        .from("agent_knowledge")
        .select("id, category, title")
        .eq("agent_id", agentId)
        .eq("category", kn.category)
        .maybeSingle();

      let savedRecord: any;
      if (existingKn) {
        const { data: updated, error: updErr } = await adminClient
          .from("agent_knowledge")
          .update({
            title: kn.title || existingKn.title,
            content: kn.content,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingKn.id)
          .select("*")
          .single();

        if (updErr) throw updErr;
        savedRecord = updated;
      } else {
        const { data: inserted, error: insErr } = await adminClient
          .from("agent_knowledge")
          .insert({
            agent_id: agentId,
            category: kn.category || "general_faq",
            title: kn.title || "Store Policy",
            content: kn.content,
            is_active: true,
          })
          .select("*")
          .single();

        if (insErr) throw insErr;
        savedRecord = inserted;
      }

      return NextResponse.json({
        success: true,
        type: "knowledge",
        item: savedRecord,
        reply:
          parsed.friendlyConfirmation ||
          `ধন্যবাদ! নতুন তথ্যটি "${kn.title}" সেভ করা হয়েছে। এখন থেকে কাস্টমারদের প্রশ্নের উত্তরে এই তথ্য ব্যবহার করা হবে। 😊`,
      });
    }

    return NextResponse.json({
      success: true,
      reply: parsed.friendlyConfirmation || "আপনার তথ্য সফলভাবে সংরক্ষিত হয়েছে!",
    });
  } catch (error: any) {
    console.error("[Train AI API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to train AI" },
      { status: 500 }
    );
  }
}
