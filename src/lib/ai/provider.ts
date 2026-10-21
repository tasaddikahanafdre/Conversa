export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export interface AICompletionResponse {
  text: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costBdt: number;
}

/**
 * Calculate conversation cost in BDT based on Gemini 1.5 Flash token rates:
 * - Input: ~$0.075 per 1M tokens (~0.009 BDT per 1k tokens)
 * - Output: ~$0.30 per 1M tokens (~0.036 BDT per 1k tokens)
 */
export function calculateGeminiBdtCost(promptTokens: number, completionTokens: number): number {
  const usdRate = 120; // 1 USD = 120 BDT
  const inputCostUsd = (promptTokens / 1_000_000) * 0.075;
  const outputCostUsd = (completionTokens / 1_000_000) * 0.30;
  return (inputCostUsd + outputCostUsd) * usdRate;
}

/**
 * Universal AI Completion Engine
 */
export async function generateAiReply(
  messages: ChatMessage[],
  options: AICompletionOptions = {}
): Promise<AICompletionResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = options.model || "gemini-1.5-flash";

  // If no Gemini key is set in local environment, provide realistic structured fallback
  if (!apiKey || apiKey === "your-gemini-api-key") {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const lower = lastUserMessage.toLowerCase();

    let reply = "Assalamu Alaikum! Conversa Fashion e apnake shagotom. Apnar kisu janar thakle bolun.";

    if (lower.includes("price") || lower.includes("koto") || lower.includes("dam")) {
      reply = "Amader Premium Cotton T-Shirt er dam matro ৳ 750! Stock e size M, L, XL available ache.";
    } else if (lower.includes("delivery")) {
      reply = "Delivery charge Dhaka city te ৳ 70 ebong Dhaka baire ৳ 130. 2-3 diner moddhe delivery peye jaben.";
    }

    return {
      text: reply,
      tokensUsed: {
        promptTokens: 120,
        completionTokens: 45,
        totalTokens: 165,
      },
      costBdt: 0.05,
    };
  }

  // Official Google AI Gemini REST API call
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 300,
      },
    };

    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const promptTokens = data.usageMetadata?.promptTokenCount || 100;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 50;

    return {
      text,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      costBdt: calculateGeminiBdtCost(promptTokens, completionTokens),
    };
  } catch (error) {
    console.error("[AI Engine Error]", error);
    throw error;
  }
}
