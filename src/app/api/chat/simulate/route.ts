import { NextRequest, NextResponse } from "next/server";
import { generateAiReply } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const { messages, agentConfig } = await request.json();

    const systemInstruction = `
You are ${agentConfig?.name || "Maya"}, an intelligent AI customer sales assistant representing "${agentConfig?.businessName || "Conversa Fashion"}" in Bangladesh.
Persona & Tone: ${agentConfig?.languageStyle || "Banglish"} (polite, helpful, concise).
Business Overview: ${agentConfig?.businessOverview || "Online clothing brand in Bangladesh."}

Knowledge & Policies:
- Delivery inside Dhaka: ৳ 70 (24-48 hours)
- Delivery outside Dhaka: ৳ 130 (2-3 days)
- Payment: Cash on Delivery (COD) and bKash
- Return policy: 7 days free replacement for defective items

Instructions:
1. Always be polite and greet when appropriate.
2. Answer queries accurately based on the business rules.
3. If the customer wants to order, ask for their full name, mobile number, delivery address, and size/quantity.
4. Keep replies natural and under 3-4 sentences.
`.trim();

    const result = await generateAiReply(messages, {
      model: agentConfig?.model || "gemini-1.5-flash",
      systemInstruction,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to simulate AI reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
