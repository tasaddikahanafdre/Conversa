import { SupabaseClient } from "@supabase/supabase-js";
import { generateAiReply } from "@/lib/ai/provider";

interface ExtractionInput {
  conversationId: string;
  workspaceId: string;
  contactName: string;
  messageText: string;
  chatHistory?: { role: string; content: string }[];
}

/**
 * Detects if a customer message or thread contains complete order details
 * (Name, BD Mobile Phone, and Delivery Address) and automatically captures/confirms the order.
 */
export async function tryExtractAndSaveOrder(
  supabase: SupabaseClient,
  input: ExtractionInput
): Promise<{ captured: boolean; order?: any }> {
  const { conversationId, workspaceId, contactName, messageText } = input;

  // 1. Fetch recent conversation messages for complete context
  let conversationMessages: { role: string; content: string }[] = [];

  if (conversationId) {
    const { data: dbMsgs } = await supabase
      .from("messages")
      .select("sender_type, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (dbMsgs && dbMsgs.length > 0) {
      conversationMessages = dbMsgs
        .reverse()
        .map((m) => ({
          role: m.sender_type === "customer" ? "user" : "assistant",
          content: m.content,
        }));
    }
  }

  if (conversationMessages.length === 0) {
    conversationMessages = [{ role: "user", content: messageText }];
  }

  // Combine customer text to quickly check for phone number presence
  const fullCustomerText = conversationMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  // Quick gate: Check if a Bangladeshi phone number exists (013-019)
  const phoneRegex = /(?:\+?8801|01)[3-9](?:[ -]?\d){8}\b/;
  const phoneMatch = fullCustomerText.match(phoneRegex);
  if (!phoneMatch) {
    return { captured: false };
  }

  // 2. Load available products for this workspace
  const { data: products } = await supabase
    .from("products")
    .select("id, title, price, description")
    .eq("workspace_id", workspaceId)
    .eq("is_available", true);

  const productCatalogText = (products || [])
    .map((p) => `- "${p.title}": ৳${p.price} (${p.description || ""})`)
    .join("\n");

  const conversationTranscript = conversationMessages
    .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
    .join("\n");

  // 3. Use Gemini AI to extract complete order details with accurate product matching
  try {
    const extractionPrompt = `
You are an expert e-commerce order parser for a store in Bangladesh.
Read the conversation history between a Customer and the Assistant:

--- Conversation Transcript ---
${conversationTranscript}
--- End Transcript ---

--- Available Store Products ---
${productCatalogText || '- "XO1 Auto Charge Separator": ৳699'}
--- End Products ---

Extract the order details:
1. "customerName": Clean recipient name (e.g. "Arif Hasan"). Do not include prefixes like "Name: ". If unknown, use "${contactName && contactName !== "Customer" ? contactName : "Valued Customer"}".
2. "customerPhone": The 11-digit Bangladeshi mobile number starting with 01 (e.g. "01712345678").
3. "deliveryAddress": The full, complete address including house, road, area, city (e.g. "House 12, Road 5, Mirpur-10, Dhaka 1216"). Do NOT truncate or cut at commas. Do NOT include prefixes like "Full Address: " or "Address: ".
4. "hasCompleteDetails": Boolean. Set to true ONLY IF phone number AND a reasonable delivery address are present.
5. "matchedProductTitle": The EXACT title of the product from the "Available Store Products" list above that the customer discussed and ordered. If they discussed "Magical Garage Key Hanger", match it to the exact catalog title!
6. "quantity": Quantity ordered (integer, default 1).
7. "price": Numeric price of the matched product in BDT.
8. "isInsideDhaka": Boolean. True if the address or customer stated Inside Dhaka / Dhaka / Dhanmondi / Mirpur / Uttara / Gulshan, etc.
9. "deliveryFee": 70 if inside Dhaka, 130 if outside Dhaka.
10. "totalAmount": (price * quantity) + deliveryFee.

Respond ONLY with valid JSON in this format (no markdown blocks, no commentary):
{
  "hasCompleteDetails": true,
  "customerName": "...",
  "customerPhone": "...",
  "deliveryAddress": "...",
  "matchedProductTitle": "...",
  "price": 1290,
  "quantity": 1,
  "deliveryFee": 70,
  "totalAmount": 1360
}
`;

    const aiRes = await generateAiReply(
      [{ role: "user", content: extractionPrompt }],
      {
        model: "gemini-3.5-flash-lite",
        temperature: 0.1,
        maxTokens: 400,
      }
    );

    const cleanJson = aiRes.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.hasCompleteDetails && parsed.customerPhone && parsed.deliveryAddress) {
      const normalizedPhone = parsed.customerPhone.replace(/[\s-]/g, "").slice(-11);
      const matchedTitle = parsed.matchedProductTitle || products?.[0]?.title || "XO1 Auto Charge Separator";
      const matchedPrice = Number(parsed.price) || products?.find((p) => p.title === matchedTitle)?.price || 699;
      const quantity = Number(parsed.quantity) || 1;
      const totalAmount = Number(parsed.totalAmount) || (matchedPrice * quantity + 70);

      const orderedItem = {
        title: matchedTitle,
        quantity,
        price: matchedPrice,
      };

      // Check if order already recorded for this conversation
      const { data: existing } = await supabase
        .from("captured_orders")
        .select("id")
        .eq("conversation_id", conversationId)
        .maybeSingle();

      if (existing) {
        // Update with full, accurate details
        const { data: updatedOrder } = await supabase
          .from("captured_orders")
          .update({
            customer_name: parsed.customerName,
            customer_phone: normalizedPhone,
            delivery_address: parsed.deliveryAddress,
            items: [orderedItem],
            total_amount: totalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        return { captured: true, order: updatedOrder };
      }

      // Insert new confirmed order
      const { data: newOrder, error } = await supabase
        .from("captured_orders")
        .insert({
          workspace_id: workspaceId,
          conversation_id: conversationId,
          customer_name: parsed.customerName,
          customer_phone: normalizedPhone,
          delivery_address: parsed.deliveryAddress,
          items: [orderedItem],
          total_amount: totalAmount,
          status: "confirmed",
          courier_provider: "steadfast",
        })
        .select()
        .single();

      if (error) {
        console.error("[Order Extractor Insert Error]", error);
        return { captured: false };
      }

      return { captured: true, order: newOrder };
    }
  } catch (aiErr) {
    console.warn("[Order Extractor AI Fallback]", aiErr);
  }

  // 4. Robust regex fallback if AI parsing fails
  const rawPhone = phoneMatch[0].replace(/[\s-]/g, "");
  const normalizedPhone = rawPhone.slice(-11);

  // Extract address by looking for lines with address markers (do NOT split by comma)
  const lines = fullCustomerText.split(/\r?\n/);
  let detectedAddress = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      /^(full address|address|ঠিকানা|বাসা|location)[:\s]/i.test(trimmed) ||
      (trimmed.length > 12 && /(house|road|block|sector|flat|holding|dhaka|mirpur|uttara|dhanmondi)/i.test(trimmed))
    ) {
      detectedAddress = trimmed.replace(/^(full address|address|ঠিকানা|বাসা|location)[:\s]+/i, "").trim();
      break;
    }
  }

  if (!detectedAddress || detectedAddress.length < 8) {
    return { captured: false };
  }

  let customerName = contactName && contactName !== "Customer" ? contactName : "Valued Customer";
  const nameLine = lines.find((l) => /^(name|নাম)[:\s]/i.test(l.trim()));
  if (nameLine) {
    customerName = nameLine.replace(/^(name|নাম)[:\s]+/i, "").trim();
  }

  // Match product by checking if any catalog product's keywords appear in the full conversation
  let matchedProduct = products?.[0];
  const fullTranscriptLower = conversationTranscript.toLowerCase();

  for (const p of products || []) {
    const words = p.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matchesKeyword = words.filter((w: string) => fullTranscriptLower.includes(w)).length >= 2;
    if (fullTranscriptLower.includes(p.title.toLowerCase()) || matchesKeyword) {
      matchedProduct = p;
      break;
    }
  }

  const deliveryFee = /outside|ঢাকার বাইরে/i.test(fullCustomerText) ? 130 : 70;
  const orderedItem = {
    title: matchedProduct?.title || "XO1 Auto Charge Separator",
    price: Number(matchedProduct?.price) || 699,
    quantity: 1,
  };
  const totalAmount = orderedItem.price + deliveryFee;

  const { data: existing } = await supabase
    .from("captured_orders")
    .select("id")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (existing) {
    const { data: updatedOrder } = await supabase
      .from("captured_orders")
      .update({
        customer_name: customerName,
        customer_phone: normalizedPhone,
        delivery_address: detectedAddress,
        items: [orderedItem],
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    return { captured: true, order: updatedOrder };
  }

  const { data: newOrder } = await supabase
    .from("captured_orders")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      customer_name: customerName,
      customer_phone: normalizedPhone,
      delivery_address: detectedAddress,
      items: [orderedItem],
      total_amount: totalAmount,
      status: "confirmed",
      courier_provider: "steadfast",
    })
    .select()
    .single();

  return { captured: true, order: newOrder };
}
