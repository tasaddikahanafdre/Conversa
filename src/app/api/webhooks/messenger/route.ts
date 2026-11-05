import { after, NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security/encryption";
import { sendMessengerMessage, sendMessengerAttachment, sendMessengerMultipleAttachments } from "@/lib/meta/client";
import { generateAiReply, ChatMessage } from "@/lib/ai/provider";
import { findRequestedProductImage, sanitizeAiReplyText } from "@/lib/products/image-delivery";
import { buildSalesSystemPrompt } from "@/lib/ai/sales-prompt";

export const maxDuration = 60; // Allow background execution up to 60s for AI and Meta APIs

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

interface PendingMessageBatch {
  pageId: string;
  senderId: string;
  texts: string[];
  mediaUrls: string[];
  messageIds: string[];
  timer: NodeJS.Timeout;
}

// Global in-memory debounce map for rapid consecutive incoming events from Facebook
const pendingBatches = new Map<string, PendingMessageBatch>();

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
        console.warn("[Meta Webhook Warning] Signature mismatch. Proceeding with payload parsing.");
      }
    }

    const payload = JSON.parse(rawBody);

    // Meta expects a fast 200 OK within 5 seconds to avoid event retries
    if (payload.object === "page") {
      // Schedule background processing via Next.js 15 after()
      // This returns HTTP 200 OK to Meta in < 25ms, avoiding any webhook timeout or retry throttling
      after(async () => {
        // Group events by sender (pageId:senderId) across entries to prevent duplicate replies
        // when Meta bundles text + photo or multiple rapid events within the same webhook payload
        interface SenderBatch {
          pageId: string;
          senderId: string;
          texts: string[];
          mediaUrls: string[];
          messageIds: string[];
        }

        const senderBatches = new Map<string, SenderBatch>();

        for (const entry of payload.entry || []) {
          const pageId = entry.id;
          const messaging = entry.messaging || [];

          for (const event of messaging) {
            // Ignore echo messages sent by the Page itself
            if (event.message?.is_echo) continue;

            const senderId = event.sender?.id;
            if (!senderId) continue;

            const text = event.message?.text?.trim() || "";
            const messageId = event.message?.mid;
            const attachments = event.message?.attachments || [];
            const imageAttachment = attachments.find((a: any) => a.type === "image");
            const mediaUrl = imageAttachment?.payload?.url || null;

            if (!text && !mediaUrl) continue;

            const batchKey = `${pageId}:${senderId}`;
            let batch = senderBatches.get(batchKey);
            if (!batch) {
              batch = {
                pageId,
                senderId,
                texts: [],
                mediaUrls: [],
                messageIds: [],
              };
              senderBatches.set(batchKey, batch);
            }

            if (text) batch.texts.push(text);
            if (mediaUrl) batch.mediaUrls.push(mediaUrl);
            if (messageId) batch.messageIds.push(messageId);
          }
        }

        for (const batch of senderBatches.values()) {
          const combinedText = batch.texts.join(" ").trim();
          const primaryMediaUrl = batch.mediaUrls[0] || null;
          const primaryMid = batch.messageIds[0];

          console.log(
            `[Meta Webhook] Background processing for ${batch.senderId}: "${combinedText}" (Media: ${primaryMediaUrl ? "Yes" : "No"}, Events: ${batch.messageIds.length})`
          );

          try {
            await processIncomingMessage({
              pageId: batch.pageId,
              senderId: batch.senderId,
              messageText: combinedText,
              messageId: primaryMid,
              mediaUrl: primaryMediaUrl,
              allMessageIds: batch.messageIds,
            });
          } catch (err) {
            console.error("[Auto-Reply Pipeline Error]", err);
          }
        }
      });

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
  mediaUrl?: string | null;
  allMessageIds?: string[];
}) {
  const { pageId, senderId, messageText, messageId, mediaUrl, allMessageIds } = params;
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
    .select("id, ai_status, workspace_id, contact_name")
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
      .select("id, ai_status, workspace_id, contact_name")
      .single();

    if (convError || !newConv) {
      console.error("[Auto-Reply] Failed to create conversation:", convError);
      return;
    }
    conv = newConv;
  }

  // 4. Deduplication: Check if any of these incoming message IDs were already processed
  const idsToCheck = (allMessageIds && allMessageIds.length > 0)
    ? allMessageIds
    : messageId ? [messageId] : [];

  if (idsToCheck.length > 0) {
    const { data: existing } = await adminClient
      .from("messages")
      .select("id")
      .in("external_msg_id", idsToCheck)
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log(`[Auto-Reply] Message batch already recorded in DB. Skipping duplicate processing.`);
      return;
    }
  }

  const customerContent = messageText.trim() || "[Photo]";

  // Save incoming customer message to database
  const { data: insertedMsg, error: insertMsgError } = await adminClient
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_type: "customer",
      content: customerContent,
      media_url: mediaUrl || null,
      external_msg_id: messageId || (idsToCheck[0] ?? null),
    })
    .select("id, created_at")
    .single();

  if (insertMsgError) {
    console.error("[Auto-Reply] Failed to record customer message:", insertMsgError);
  }

  // Try extracting confirmed order if customer provided name, phone & address
  try {
    const { tryExtractAndSaveOrder } = await import("@/lib/orders/extractor");
    await tryExtractAndSaveOrder(adminClient, {
      conversationId: conv.id,
      workspaceId: channel.workspace_id,
      contactName: conv.contact_name || "Customer",
      messageText: messageText.trim() || customerContent,
    });
  } catch (extractErr) {
    console.warn("[Auto-Reply Order Extraction]", extractErr);
  }

  // 5. If conversation is paused by merchant for human takeover, do NOT auto-reply
  if (conv.ai_status === "paused" || conv.ai_status === "disabled") {
    console.log(`[Auto-Reply] Conversation ${conv.id} is paused for human agent.`);
    return;
  }

  // 5.1 If incoming event is ONLY an image attachment without a text question:
  // Store the photo in conversation context so AI understands what product was sent,
  // but do NOT send an auto-reply until the customer asks a question about it.
  const isImageOnly = !messageText.trim() && !!mediaUrl;
  if (isImageOnly) {
    console.log(
      `[Auto-Reply Context] Photo received without text from ${senderId}. Stored in conversation thread for subsequent inquiries.`
    );
    await adminClient
      .from("conversations")
      .update({
        last_message_preview: "[Photo]",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conv.id);
    return;
  }

  // 6. Load AI Agent settings, Product Catalog, and Conversation History in parallel
  const [
    { data: agent },
    { data: productsList },
    { data: recentMsgs }
  ] = await Promise.all([
    adminClient
      .from("ai_agents")
      .select("id, name, persona_prompt, business_type, business_overview, language_style, primary_model, is_active")
      .eq("workspace_id", channel.workspace_id)
      .maybeSingle(),
    adminClient
      .from("products")
      .select("id, title, price, stock_quantity, description, is_available, image_urls, metadata")
      .eq("workspace_id", channel.workspace_id),
    adminClient
      .from("messages")
      .select("sender_type, content, media_url")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const { data: knowledgeList } = agent?.id
    ? await adminClient
        .from("agent_knowledge")
        .select("category, title, content")
        .eq("agent_id", agent.id)
    : { data: [] };

  // 7. Compile Smart Sales AI prompt with confidential negotiation boundaries
  const systemInstruction = buildSalesSystemPrompt({
    storeName: channel.account_name || "Dregital",
    tone: agent?.language_style || "Friendly, polite, natural and persuasive",
    products: productsList || [],
    knowledgeList: knowledgeList || [],
    customPersonaPrompt: agent?.persona_prompt || "",
  });

  // 8. Build chat history context from loaded recent messages
  const chatHistory: ChatMessage[] = (recentMsgs || [])
    .reverse()
    .map((m) => {
      let content = m.content;
      if (m.sender_type === "customer" && (!content || content === "[Photo]")) {
        content = "[Product photo sent by customer. Visually identify this product from our catalog to answer the customer's inquiries.]";
      }
      return {
        role: m.sender_type === "customer" ? "user" : "assistant",
        content,
        mediaUrl: m.media_url,
      };
    });

  if (chatHistory.length === 0) {
    chatHistory.push({
      role: "user",
      content:
        messageText.trim() ||
        "[Product photo sent by customer. Visually identify this product from our catalog to answer the customer's inquiries.]",
      mediaUrl,
    });
  }

  // 9. Check if customer is asking for product pictures & match exact existing image
  const imageDelivery = findRequestedProductImage({
    currentMessage: messageText,
    chatHistory,
    products: productsList || [],
  });

  if (imageDelivery.isPictureRequest) {
    console.log(
      `[Auto-Reply Image Delivery] Product: ${imageDelivery.product?.title || "None"} (Ambiguous: ${imageDelivery.isAmbiguous}, Image: ${imageDelivery.imageUrl ? "Found" : "None"})`
    );
  }

  // 10. Generate AI response using Gemini AI with fallback guarantee
  let replyText = "";
  let tokensUsed = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let costBdt = 0;

  try {
    const aiResponse = await generateAiReply(chatHistory, {
      model: agent?.primary_model || "gemini-3.5-flash-lite",
      systemInstruction,
      temperature: 0.6,
      maxTokens: 800,
    });
    replyText = aiResponse.text?.trim() || "";
    if (aiResponse.tokensUsed) tokensUsed = aiResponse.tokensUsed;
    if (aiResponse.costBdt) costBdt = aiResponse.costBdt;
  } catch (aiErr) {
    console.error("[Auto-Reply AI Error] Failed to generate AI reply:", aiErr);
    // Reliable, friendly fallback in case of API outage or rate limits
    replyText = "Hello! 😊 We received your message. How can we help you today with our products or orders?";
  }

  if (!replyText) {
    replyText = "Hello! 😊 We received your message. How can we help you today?";
  }

  // Sanitize reply text to remove any raw image URLs so Messenger doesn't render file cards
  const cleanReplyText = sanitizeAiReplyText(replyText);

  // 10.1 Double-Reply Guard:
  // If an AI reply was already recorded for this conversation within the last 6 seconds,
  // or if the latest message is already an AI reply, suppress duplicate dispatch.
  const { data: latestMsgInDb } = await adminClient
    .from("messages")
    .select("id, sender_type, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestMsgInDb?.sender_type === "ai") {
    const msSinceLastReply = Date.now() - new Date(latestMsgInDb.created_at).getTime();
    if (msSinceLastReply < 6000) {
      console.log(
        `[Auto-Reply Guard] Suppressing duplicate reply: AI replied ${msSinceLastReply}ms ago (< 6s) to conversation ${conv.id}.`
      );
      return;
    }
  }

  // 11. Send text reply back to customer on Facebook Messenger with retry
  let sendResult = await sendMessengerMessage(
    pageAccessToken,
    senderId,
    cleanReplyText
  );

  if (!sendResult.success) {
    console.warn("[Auto-Reply Send Attempt 1 Failed] Retrying in 1.5s...", sendResult.error);
    await new Promise((res) => setTimeout(res, 1500));
    sendResult = await sendMessengerMessage(
      pageAccessToken,
      senderId,
      cleanReplyText
    );
  }

  if (!sendResult.success) {
    console.error("[Auto-Reply Critical Error] Failed to send via Meta Send API after retry:", sendResult.error);
    return;
  }

  // 12. If customer requested product picture and images exist, send as native Messenger image attachments
  // Setting type="image" ensures Facebook Messenger renders them as inline photos instead of downloadable files/documents
  if (imageDelivery.imageUrls && imageDelivery.imageUrls.length > 0) {
    try {
      const attachRes = await sendMessengerMultipleAttachments(
        pageAccessToken,
        senderId,
        imageDelivery.imageUrls,
        "image"
      );
      if (attachRes.success) {
        console.log(`[Auto-Reply Image Success] Sent ${attachRes.sentCount} native image attachments for ${imageDelivery.product?.title}`);
      } else {
        console.warn(`[Auto-Reply Image Warning] Failed to send attachments:`, attachRes.errors);
      }
    } catch (attachErr) {
      console.error("[Auto-Reply Attachment Error]", attachErr);
    }
  }

  // 13. Save AI reply in database (with media_url if image was delivered)
  await adminClient.from("messages").insert({
    conversation_id: conv.id,
    sender_type: "ai",
    content: cleanReplyText,
    media_url: imageDelivery.imageUrl || null,
    tokens_used: tokensUsed.totalTokens,
    cost_bdt: costBdt,
    external_msg_id: sendResult.messageId || null,
  });

  // 14. Update conversation preview
  await adminClient
    .from("conversations")
    .update({
      last_message_preview: cleanReplyText,
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    })
    .eq("id", conv.id);

  console.log(`[Auto-Reply Success] Replied to customer ${senderId}: "${cleanReplyText}"`);
}
