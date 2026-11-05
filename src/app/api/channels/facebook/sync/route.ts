import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security/encryption";
import { sendMessengerMessage, sendMessengerAttachment, sendMessengerMultipleAttachments } from "@/lib/meta/client";
import { generateAiReply, ChatMessage } from "@/lib/ai/provider";
import { findRequestedProductImage, sanitizeAiReplyText } from "@/lib/products/image-delivery";
import { buildSalesSystemPrompt } from "@/lib/ai/sales-prompt";

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // 1. Fetch active channels
    const { data: channels } = await adminClient
      .from("connected_channels")
      .select("id, workspace_id, platform_id, account_name, page_access_token_encrypted, automation_enabled")
      .eq("platform", "facebook")
      .eq("is_active", true);

    if (!channels || channels.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let repliesSent = 0;

    for (const channel of channels) {
      if (channel.automation_enabled === false) continue;

      let pageToken: string;
      try {
        pageToken = decryptToken(channel.page_access_token_encrypted);
      } catch (err: any) {
        console.error(`[Sync] Decrypt token failed for ${channel.account_name}:`, err.message);
        return NextResponse.json({ error: "Decrypt token failed", details: err.message }, { status: 500 });
      }

      // Fetch latest conversations from Facebook Graph API (including attachments for images)
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${channel.platform_id}/conversations?fields=id,snippet,updated_time,messages.limit(3){id,message,from,created_time,attachments{image_data,mime_type}}&access_token=${encodeURIComponent(
          pageToken
        )}`
      );
      const convData = await res.json();
      if (!res.ok || convData.error) {
        console.error("[Sync] Facebook Graph API error:", convData.error);
        return NextResponse.json({ error: "Graph API error", details: convData.error }, { status: 500 });
      }

      const threads = convData.data || [];
      console.log(`[Sync] Found ${threads.length} threads for channel ${channel.account_name}`);

      for (const thread of threads) {
        const messages = thread.messages?.data || [];
        if (messages.length === 0) continue;

        const latestMsg = messages[0];
        // If the latest message was sent by the page itself, it's already answered
        if (latestMsg.from?.id === channel.platform_id) {
          console.log(`[Sync] Thread ${thread.id} skipped: latest message from Page itself`);
          continue;
        }

        const customerId = latestMsg.from?.id;
        let customerMsgText = latestMsg.message || "";
        const customerMsgId = latestMsg.id;
        const attachments = latestMsg.attachments?.data || [];
        const imageAtt = attachments.find((a: any) => a.image_data || (a.mime_type && a.mime_type.startsWith("image")));
        const mediaUrl = imageAtt?.image_data?.url || null;

        if (!customerMsgText && mediaUrl) {
          customerMsgText = "[Photo]";
        }

        if (!customerId || (!customerMsgText && !mediaUrl)) continue;

        // Check if we already recorded or replied to this message ID
        const { data: existingMsg } = await adminClient
          .from("messages")
          .select("id")
          .eq("external_msg_id", customerMsgId)
          .maybeSingle();

        if (existingMsg) {
          console.log(`[Sync] Message ${customerMsgId} already exists in DB. Skipping.`);
          continue;
        }

        // Find or create conversation
        let { data: conv } = await adminClient
          .from("conversations")
          .select("id, ai_status, contact_name")
          .eq("channel_id", channel.id)
          .eq("external_contact_id", customerId)
          .maybeSingle();

        if (!conv) {
          const { data: newConv } = await adminClient
            .from("conversations")
            .insert({
              workspace_id: channel.workspace_id,
              channel_id: channel.id,
              external_contact_id: customerId,
              contact_name: latestMsg.from?.name || "Customer",
              ai_status: "active",
              unread_count: 0,
              last_message_preview: customerMsgText,
              last_message_at: new Date().toISOString(),
            })
            .select("id, ai_status, contact_name")
            .single();
          conv = newConv;
        }

        if (!conv || conv.ai_status === "paused" || conv.ai_status === "disabled") continue;

        // Check if an AI message was already sent recently in this conversation to avoid any race condition with webhooks
        const { data: recentAiMsg } = await adminClient
          .from("messages")
          .select("created_at")
          .eq("conversation_id", conv.id)
          .eq("sender_type", "ai")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentAiMsg?.created_at) {
          const msSince = Date.now() - new Date(recentAiMsg.created_at).getTime();
          if (msSince < 15000) {
            console.log(`[Sync] Thread ${thread.id} skipped: AI replied ${msSince}ms ago`);
            continue;
          }
        }

        // Record incoming message
        await adminClient.from("messages").insert({
          conversation_id: conv.id,
          sender_type: "customer",
          content: customerMsgText,
          media_url: mediaUrl || null,
          external_msg_id: customerMsgId,
        });

        // Try extracting confirmed order if customer provided name, phone & address
        try {
          const { tryExtractAndSaveOrder } = await import("@/lib/orders/extractor");
          await tryExtractAndSaveOrder(adminClient, {
            conversationId: conv.id,
            workspaceId: channel.workspace_id,
            contactName: conv.contact_name || latestMsg.from?.name || "Customer",
            messageText: customerMsgText,
          });
        } catch (extractErr) {
          console.warn("[Sync Order Extraction]", extractErr);
        }

        // Update conversation last message preview and time
        await adminClient
          .from("conversations")
          .update({
            last_message_preview: customerMsgText,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", conv.id);

        // Load knowledge base & products
        const { data: agent } = await adminClient
          .from("ai_agents")
          .select("id, primary_language, tone, base_system_prompt, primary_model")
          .eq("workspace_id", channel.workspace_id)
          .maybeSingle();

        const { data: knowledgeList } = await adminClient
          .from("agent_knowledge")
          .select("category, title, content")
          .eq("agent_id", agent?.id || "");

        const { data: productsList } = await adminClient
          .from("products")
          .select("id, title, price, stock_quantity, description, is_available, image_urls, metadata")
          .eq("workspace_id", channel.workspace_id);

        const systemInstruction = buildSalesSystemPrompt({
          storeName: channel.account_name || "Dregital",
          tone: agent?.tone || "Friendly, polite, natural and persuasive",
          products: productsList || [],
          knowledgeList: knowledgeList || [],
          customPersonaPrompt: agent?.base_system_prompt || "",
        });

        // Fetch recent conversation context for smooth multi-turn chats
        const { data: recentMsgs } = await adminClient
          .from("messages")
          .select("sender_type, content, media_url")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(6);

        const chatHistory: ChatMessage[] = (recentMsgs || [])
          .reverse()
          .map((m) => {
            let content = m.content;
            if (m.sender_type === "customer" && (!content || content === "[Photo]")) {
              content = "The customer sent a product photo or image. Please inspect it visually, identify the product from our catalog, quote its price in BDT (৳), and ask if they wish to place an order.";
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
              customerMsgText !== "[Photo]"
                ? customerMsgText
                : "The customer sent a product photo or image. Please inspect it visually, identify the product from our catalog, quote its price in BDT (৳), and ask if they wish to place an order.",
            mediaUrl,
          });
        }

        // Check if customer requested product pictures & match exact existing image
        const imageDelivery = findRequestedProductImage({
          currentMessage: customerMsgText,
          chatHistory,
          products: productsList || [],
        });

        // Generate AI reply with fallback guarantee
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
          console.error("[Sync AI Error]", aiErr);
          replyText = "Hello! 😊 We received your message. How can we help you today with our products or orders?";
        }

        if (replyText) {
          const cleanReplyText = sanitizeAiReplyText(replyText);
          const sendRes = await sendMessengerMessage(pageToken, customerId, cleanReplyText);
          if (sendRes.success) {
            repliesSent++;

            // If customer requested product pictures, send native Messenger image attachments
            if (imageDelivery.imageUrls && imageDelivery.imageUrls.length > 0) {
              try {
                await sendMessengerMultipleAttachments(
                  pageToken,
                  customerId,
                  imageDelivery.imageUrls,
                  "image"
                );
              } catch (attachErr) {
                console.warn("[Sync Image Attachment Warning]", attachErr);
              }
            }

            await adminClient.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "ai",
              content: cleanReplyText,
              media_url: imageDelivery.imageUrl || null,
              tokens_used: tokensUsed.totalTokens,
              cost_bdt: costBdt,
              external_msg_id: sendRes.messageId || null,
            });
            await adminClient
              .from("conversations")
              .update({
                last_message_preview: cleanReplyText,
                last_message_at: new Date().toISOString(),
              })
              .eq("id", conv.id);

            console.log(`[Sync Auto-Reply Success] Replied to customer ${customerId}: "${cleanReplyText}"`);
          } else {
            console.error(`[Sync Send Error]`, sendRes.error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, repliesSent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
