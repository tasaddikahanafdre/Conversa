import { NextRequest, NextResponse } from "next/server";
import { generateAiReply } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("title, price, stock_quantity, description, is_available, image_urls")
      .eq("workspace_id", wsId);

    const knowledgeSummary = (knowledgeList || [])
      .map((k) => `[${k.category.toUpperCase()}] ${k.title}: ${k.content}`)
      .join("\n");

    const productSummary = (productsList || [])
      .map(
        (p) =>
          `- ${p.title}: ৳${p.price} (${p.is_available && p.stock_quantity > 0 ? "In Stock" : "Out of Stock"}). ${p.description || ""}${p.image_urls?.[0] ? ` [Photo: ${p.image_urls[0]}]` : ""}`
      )
      .join("\n");

    const systemInstruction = `
You are the versatile, highly intelligent, and friendly AI customer assistant for "Conversa" on Facebook Messenger in Bangladesh.

Capabilities & Universal Response Behavior:
- You can converse freely and politely about ANYTHING: greetings, casual small talk, general knowledge, store products, prices, delivery, order taking, recommendations, or whatever the customer says.
- Never refuse to chat or say "I can only answer shop questions". If the customer asks a general question, chit-chats, jokes, or asks for advice, respond warmly, wittily, and helpfully.
- When customers ask about products, pricing, or orders, use the business details and product catalog below accurately.
- Visual Image Recognition: When a customer sends a photo or image of an item, inspect the image visually and identify which product from our Available Products catalog it is (e.g. Magical Garage Key Hanger with LED Mini Car Display, XO1 Auto Charge Separator, etc.). Confirm that we sell it, state its exact price in BDT (৳) and stock status, and politely ask if they want to place an order. If it is an item not in our catalog, politely clarify that we do not have that specific item and recommend our popular available products.
- Language Rule: You MUST ALWAYS reply in Pure, Natural Bangla script (বাংলা ভাষা - বাংলা হরফে).
  - Even if the customer writes in Banglish (English letters like "price koto?", "kemon acho?", "delivery koto?") or English or Bangla, you MUST ALWAYS respond in pure, polite, natural standard Bangla (বাংলা বর্ণমালা).
  - NEVER reply in Banglish (English alphabets writing Bangla words like "Jee, amader...").
  - Technical terms or product names can remain in clean English or Bangla as natural (e.g. XO1 Auto Charge Separator or ৳699), but all sentences, greetings, and explanations MUST be written in pure Bangla.
  - Tone: Polite, warm, respectful, and engaging with friendly emojis (${agent?.tone || "Friendly and polite"}).
- Plain Text Only: Never output markdown formatting like asterisks (**bold**), headers (###), or markdown bullets, as Facebook Messenger displays raw asterisks. Use standard line breaks and emojis.
- Completeness: Always finish your thoughts and sentences completely. Keep responses concise and engaging (1 to 3 sentences typically, or longer if a detailed explanation is requested).

Store Knowledge & Delivery Policies:
${knowledgeSummary || "ঢাকার ভিতরে ডেলিভারি চার্জ ৳৭০ (১-২ দিন), ঢাকার বাইরে ৳১৩০ (২-৩ দিন)। ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে।"}

Available Products:
${productSummary || "XO1 Auto Charge Separator: ৳699 (Original product with auto-disconnect feature)."}

${agent?.base_system_prompt || ""}
`;

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

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to simulate AI reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
