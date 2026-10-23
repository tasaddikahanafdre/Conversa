import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security/encryption";
import { sendMessengerMessage } from "@/lib/meta/client";
import { generateAiReply, ChatMessage } from "@/lib/ai/provider";

// GET: Meta Webhook Verification Challenge
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || "conversa_verify_tok_99182";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("[Meta Webhook] Successfully verified webhook subscription challenge.");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden: Invalid verification token", { status: 403 });
}

// POST: Meta Event Receiver & Auto-Reply Dispatcher
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // 1. Verify HMAC-SHA256 signature if app secret is available
    const signature = request.headers.get("x-hub-signature-256");
    const appSecret = process.env.META_APP_SECRET;

    if (appSecret && signature) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex")}`;

      if (signature !== expectedSignature) {
        console.error("[Meta Webhook] Invalid signature rejected.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Meta expects a fast 200 OK within 5 seconds to avoid event retries
    if (payload.object === "page") {
      for (const entry of payload.entry || []) {
        const pageId = entry.id;
        const messaging = entry.messaging || [];

        for (const event of messaging) {
          // Ignore echo messages sent by the Page itself
          if (event.message?.is_echo) continue;

          const senderId = event.sender?.id;
          const messageText = event.message?.text;
          const messageId = event.message?.mid;

          if (senderId && messageText) {
            console.log(
              `[Meta Webhook] Incoming message on Page ${pageId} from ${senderId}: "${messageText}"`
            );

            // Execute auto-reply pipeline asynchronously
            processIncomingMessage({
              pageId,
              senderId,
              messageText,
              messageId,
            }).catch((err) =>
              console.error("[Auto-Reply Pipeline Error]", err)
            );
          }
        }
      }

      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown event object" }, { status: 404 });
  } catch (err: unknown) {
    console.error("[Meta Webhook Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Handles incoming Facebook message:
 * 1. Resolves connected channel and decrypts Page token
 * 2. Checks AI status and human-handoff pause state
 * 3. Builds prompt with business knowledge & product catalog
 * 4. Calls Gemini AI for native Bangla/English response
 * 5. Dispatches reply to Messenger via Meta Graph Send API
 * 6. Stores customer and AI messages in Supabase database
 */
async function processIncomingMessage(params: {
  pageId: string;
  senderId: string;
  messageText: string;
  messageId?: string;
}) {
  const { pageId, senderId, messageText, messageId } = params;
  const adminClient = createAdminClient();

  // 1. Find connected channel for this Facebook Page
  const { data: channel, error: channelError } = await adminClient
    .from("connected_channels")
    .select(
      "id, workspace_id, account_name, page_access_token_encrypted, automation_enabled, is_active"
    )
    .eq("platform", "facebook")
    .eq("platform_id", pageId)
    .eq("is_active", true)
    .maybeSingle();

  if (channelError || !channel) {
    console.warn(`[Auto-Reply] No active channel found for Facebook Page ID: ${pageId}`);
    return;
  }

  if (channel.automation_enabled === false) {
    console.log(`[Auto-Reply] Automation disabled for channel ${channel.account_name}`);
    return;
  }

  // 2. Decrypt Page Access Token
  let pageAccessToken: string;
  try {
    pageAccessToken = decryptToken(channel.page_access_token_encrypted);
  } catch (decryptErr) {
    console.error("[Auto-Reply] Failed to decrypt token for page:", pageId, decryptErr);
    return;
  }

  // 3. Find or create conversation thread
  let { data: conv } = await adminClient
    .from("conversations")
    .select("id, ai_status, workspace_id")
    .eq("channel_id", channel.id)
    .eq("external_contact_id", senderId)
    .maybeSingle();

  if (!conv) {
    const { data: newConv, error: convError } = await adminClient
      .from("conversations")
      .insert({
        workspace_id: channel.workspace_id,
        channel_id: channel.id,
        external_contact_id: senderId,
        contact_name: "Customer",
        ai_status: "active",
        unread_count: 1,
        last_message_preview: messageText,
        last_message_at: new Date().toISOString(),
      })
      .select("id, ai_status, workspace_id")
      .single();

    if (convError || !newConv) {
      console.error("[Auto-Reply] Failed to create conversation:", convError);
      return;
    }
    conv = newConv;
  }

  // 4. Save incoming customer message to database
  await adminClient.from("messages").insert({
    conversation_id: conv.id,
    sender_type: "customer",
    content: messageText,
    external_msg_id: messageId || null,
  });

  // 5. If conversation is paused by merchant for human takeover, do NOT auto-reply
  if (conv.ai_status === "paused" || conv.ai_status === "disabled") {
    console.log(`[Auto-Reply] Conversation ${conv.id} is paused for human agent.`);
    return;
  }

  // 6. Load AI Agent settings, Knowledge Base items, and Product Catalog
  const { data: agent } = await adminClient
    .from("ai_agents")
    .select("name, primary_language, tone, base_system_prompt")
    .eq("workspace_id", channel.workspace_id)
    .maybeSingle();

  const { data: knowledgeList } = await adminClient
    .from("agent_knowledge")
    .select("category, title, content")
    .eq("workspace_id", channel.workspace_id);

  const { data: productsList } = await adminClient
    .from("products")
    .select("name, price_bdt, description, in_stock")
    .eq("workspace_id", channel.workspace_id);

  // 7. Compile prompt context
  const knowledgeSummary = (knowledgeList || [])
    .map((k) => `[${k.category.toUpperCase()}] ${k.title}: ${k.content}`)
    .join("\n");

  const productSummary = (productsList || [])
    .map(
      (p) =>
        `- ${p.name}: ৳${p.price_bdt} (${p.in_stock ? "In Stock" : "Out of Stock"}). ${p.description || ""}`
    )
    .join("\n");

  const systemInstruction = `
You are the official AI customer care representative for "${channel.account_name}" in Bangladesh.
Your goal is to assist customers politely, answer product inquiries, quote delivery charges, and help capture orders.

Language & Tone Guidelines:
- Primary Language: ${agent?.primary_language || "Bangla & English (Banglish)"}
- Tone: ${agent?.tone || "Friendly, helpful, and polite"}
- If the customer writes in Bangla, reply in natural, polite Bangla.
- If the customer writes in English or Banglish (e.g. "Price koto?", "Delivery koto?"), reply naturally in the same style.
- Be concise: Keep replies under 2 to 3 sentences suitable for Facebook Messenger.

Business Knowledge Base:
${knowledgeSummary || "Standard delivery inside Dhaka: ৳70 (1-2 days). Outside Dhaka: ৳130 (2-3 days). Cash on delivery available."}

Available Products:
${productSummary || "Various lifestyle and retail products."}

${agent?.base_system_prompt || ""}
`;

  // 8. Fetch last 5 messages for conversation context
  const { data: recentMsgs } = await adminClient
    .from("messages")
    .select("sender_type, content")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const chatHistory: ChatMessage[] = (recentMsgs || [])
    .reverse()
    .map((m) => ({
      role: m.sender_type === "customer" ? "user" : "assistant",
      content: m.content,
    }));

  if (chatHistory.length === 0) {
    chatHistory.push({ role: "user", content: messageText });
  }

  // 9. Generate AI response using Gemini AI
  const aiResponse = await generateAiReply(chatHistory, {
    systemInstruction,
    temperature: 0.3,
    maxTokens: 250,
  });

  const replyText = aiResponse.text?.trim();
  if (!replyText) {
    console.warn("[Auto-Reply] AI returned empty response.");
    return;
  }

  // 10. Send reply back to customer on Facebook Messenger
  const sendResult = await sendMessengerMessage(
    pageAccessToken,
    senderId,
    replyText
  );

  if (!sendResult.success) {
    console.error("[Auto-Reply] Failed to send via Meta Send API:", sendResult.error);
    return;
  }

  // 11. Save AI reply in database
  await adminClient.from("messages").insert({
    conversation_id: conv.id,
    sender_type: "ai",
    content: replyText,
    tokens_used: aiResponse.tokensUsed?.totalTokens || 0,
    cost_bdt: aiResponse.costBdt || 0,
    external_msg_id: sendResult.messageId || null,
  });

  // 12. Update conversation preview
  await adminClient
    .from("conversations")
    .update({
      last_message_preview: replyText,
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    })
    .eq("id", conv.id);

  console.log(`[Auto-Reply Success] Replied to customer ${senderId}: "${replyText}"`);
}
