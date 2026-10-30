import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security/encryption";
import { sendMessengerMessage } from "@/lib/meta/client";

// GET /api/conversations/[id]/messages: Fetch messages for a specific conversation
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const adminClient = createAdminClient();

    const { data: messages, error } = await adminClient
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages: Send a manual reply from merchant to customer
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Get conversation with channel
    const { data: conv, error: convErr } = await adminClient
      .from("conversations")
      .select("*, channel:connected_channels(*)")
      .eq("id", id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 2. Dispatch to Meta Messenger if page token is available
    let externalMsgId = null;
    if (conv.channel?.page_access_token_encrypted && conv.external_contact_id) {
      try {
        const pageToken = decryptToken(conv.channel.page_access_token_encrypted);
        const sendRes = await sendMessengerMessage(
          pageToken,
          conv.external_contact_id,
          text.trim()
        );
        if (sendRes.success) {
          externalMsgId = sendRes.messageId;
        }
      } catch (metaErr) {
        console.warn("[Manual Send] Meta send warning:", metaErr);
      }
    }

    // 3. Save message to DB as human_agent
    const { data: savedMsg, error: saveErr } = await adminClient
      .from("messages")
      .insert({
        conversation_id: id,
        sender_type: "human_agent",
        content: text.trim(),
        external_msg_id: externalMsgId,
      })
      .select()
      .single();

    if (saveErr) throw saveErr;

    // 4. Update conversation preview
    await adminClient
      .from("conversations")
      .update({
        last_message_preview: text.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ success: true, message: savedMsg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/conversations/[id]/messages: Toggle AI status (active vs paused)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { ai_status } = await request.json();

    if (!["active", "paused", "disabled"].includes(ai_status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("conversations")
      .update({ ai_status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, conversation: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
