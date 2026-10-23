import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security/encryption";
import { sendMessengerMessage } from "@/lib/meta/client";
import { generateAiReply, ChatMessage } from "@/lib/ai/provider";

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
      } catch {
        continue;
      }

      // Fetch latest conversations from Facebook Graph API
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${channel.platform_id}/conversations?fields=id,snippet,updated_time,messages.limit(3){id,message,from,created_time}&access_token=${encodeURIComponent(
          pageToken
        )}`
      );
      const convData = await res.json();
      const threads = convData.data || [];

      for (const thread of threads) {
        const messages = thread.messages?.data || [];
        if (messages.length === 0) continue;

        const latestMsg = messages[0];
        // If the latest message was sent by the page itself, it's already answered
        if (latestMsg.from?.id === channel.platform_id) continue;

        const customerId = latestMsg.from?.id;
        const customerMsgText = latestMsg.message;
        const customerMsgId = latestMsg.id;

        if (!customerId || !customerMsgText) continue;

        // Check if we already recorded or replied to this message ID
        const { data: existingMsg } = await adminClient
          .from("messages")
          .select("id")
          .eq("external_msg_id", customerMsgId)
          .maybeSingle();

        if (existingMsg) continue; // Already processed!

        // Find or create conversation
        let { data: conv } = await adminClient
          .from("conversations")
          .select("id, ai_status")
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
            .select("id, ai_status")
            .single();
          conv = newConv;
        }

        if (!conv || conv.ai_status === "paused" || conv.ai_status === "disabled") continue;

        // Record incoming message
        await adminClient.from("messages").insert({
          conversation_id: conv.id,
          sender_type: "customer",
          content: customerMsgText,
          external_msg_id: customerMsgId,
        });

        // Load knowledge base & products
        const { data: agent } = await adminClient
          .from("ai_agents")
          .select("primary_language, tone, base_system_prompt")
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

        const knowledgeSummary = (knowledgeList || [])
          .map((k) => `[${k.category.toUpperCase()}] ${k.title}: ${k.content}`)
          .join("\n");

        const productSummary = (productsList || [])
          .map((p) => `- ${p.name}: ৳${p.price_bdt}. ${p.description || ""}`)
          .join("\n");

        const systemInstruction = `
You are the AI customer care agent for "${channel.account_name}" in Bangladesh.
Language: ${agent?.primary_language || "Bangla & English (Banglish)"}
Tone: ${agent?.tone || "Friendly and polite"}
Products: ${productSummary || "XO1 Auto Charge Separator price 699 BDT."}
Policies: ${knowledgeSummary || "Inside Dhaka delivery 70 BDT, outside Dhaka 130 BDT."}
Answer concisely in natural Bangla or English based on the customer message.
`;

        const aiResponse = await generateAiReply(
          [{ role: "user", content: customerMsgText }],
          { systemInstruction, temperature: 0.3 }
        );

        if (aiResponse.text?.trim()) {
          const sendRes = await sendMessengerMessage(pageToken, customerId, aiResponse.text.trim());
          if (sendRes.success) {
            repliesSent++;
            await adminClient.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "ai",
              content: aiResponse.text.trim(),
              external_msg_id: sendRes.messageId || null,
            });
            await adminClient
              .from("conversations")
              .update({
                last_message_preview: aiResponse.text.trim(),
                last_message_at: new Date().toISOString(),
              })
              .eq("id", conv.id);
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
