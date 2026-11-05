import { NextRequest, NextResponse } from "next/server";
import { generateAiReply } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { findRequestedProductImage, sanitizeAiReplyText } from "@/lib/products/image-delivery";
import { buildSalesSystemPrompt } from "@/lib/ai/sales-prompt";

export async function POST(request: NextRequest) {
  try {
    const { messages, workspaceId, mode } = await request.json();

    const adminClient = createAdminClient();

    // 1. Resolve workspace
    let wsId = workspaceId;
    if (!wsId) {
      const { data: memberWs } = await adminClient
        .from("workspace_members")
        .select("workspace_id")
        .limit(1)
        .maybeSingle();
      wsId = memberWs?.workspace_id || "dc9f4daa-6ae7-4195-8130-66d268219c9e";
    }

    const latestUserMessage = (messages || [])
      .filter((m: any) => m.sender === "user" || m.role === "user")
      .slice(-1)[0]?.text;

    // Check if training mode is active or user explicitly asked to train/teach/add product
    const isExplicitTrain =
      mode === "train" ||
      (latestUserMessage &&
        /^(teach:|train:|remember:|add product:|new product:|amra ekhon|notun product)/i.test(
          latestUserMessage.trim()
        ));

    if (isExplicitTrain && latestUserMessage) {
      // Forward directly to training logic
      const trainUrl = new URL("/api/ai/train", request.url);
      const trainRes = await fetch(trainUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: latestUserMessage.replace(/^(teach:|train:|remember:)/i, "").trim(),
          workspaceId: wsId,
        }),
      });

      const trainData = await trainRes.json();
      if (trainData.reply) {
        return NextResponse.json({
          text: trainData.reply,
          trained: true,
          item: trainData.item,
          type: trainData.type,
        });
      }
    }

    // 2. Fetch Agent, Knowledge, and Products
    const { data: agent } = await adminClient
      .from("ai_agents")
      .select("id, name, primary_language, tone, base_system_prompt, business_overview, primary_model")
      .eq("workspace_id", wsId)
      .maybeSingle();

    const { data: knowledgeList } = await adminClient
      .from("agent_knowledge")
      .select("category, title, content")
      .eq("agent_id", agent?.id || "");

    const { data: productsList } = await adminClient
      .from("products")
      .select("id, title, price, stock_quantity, description, is_available, image_urls, metadata")
      .eq("workspace_id", wsId);

    const systemInstruction = buildSalesSystemPrompt({
      storeName: "Conversa",
      tone: agent?.tone || "Friendly, polite, natural and persuasive",
      products: productsList || [],
      knowledgeList: knowledgeList || [],
      customPersonaPrompt: agent?.base_system_prompt || "",
    });

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.sender === "user" || m.role === "user" ? "user" : "assistant",
      content: m.text || m.content,
      mediaUrl: m.mediaUrl || null,
      imageBase64: m.imageBase64 || null,
      imageMimeType: m.imageMimeType || null,
    }));

    const result = await generateAiReply(formattedMessages, {
      model: agent?.primary_model || "gemini-3.5-flash-lite",
      systemInstruction,
      temperature: 0.6,
      maxTokens: 800,
    });

    const lastUserMsg = [...formattedMessages].reverse().find((m) => m.role === "user");
    const imageDelivery = findRequestedProductImage({
      currentMessage: lastUserMsg?.content || "",
      chatHistory: formattedMessages,
      products: productsList || [],
    });

    const cleanText = sanitizeAiReplyText(result.text || "");

    return NextResponse.json({
      ...result,
      text: cleanText,
      mediaUrl: imageDelivery.imageUrl || null,
      imageUrls: imageDelivery.imageUrls || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to simulate AI reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
