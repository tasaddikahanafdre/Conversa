import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// GET: Meta Webhook Verification Challenge
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "conversa_verify_tok_99182";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("[Meta Webhook] Successfully verified webhook subscription challenge.");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden: Invalid verification token", { status: 403 });
}

// POST: Meta Event Receiver
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // 1. Verify HMAC-SHA256 signature if app secret is provided
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
        const messaging = entry.messaging || [];
        for (const event of messaging) {
          const senderId = event.sender?.id;
          const messageText = event.message?.text;

          if (senderId && messageText) {
            console.log(
              `[Meta Webhook] Received message from ${senderId}: "${messageText}"`
            );
            // In full worker pipeline:
            // 1. Check if AI automation is enabled for this page
            // 2. Check if conversation is paused for human takeover
            // 3. Compile prompt from agent_knowledge & products
            // 4. Call Gemini 1.5 Flash API
            // 5. Send reply via Meta Graph Send API
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
