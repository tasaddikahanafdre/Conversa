/**
 * CONVERSA AI PROVIDER ABSTRACTION
 * Supports Google Gemini API (gemini-1.5-flash, gemini-1.5-pro)
 * and OpenRouter-compatible OpenAI format providers.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  mediaUrl?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
}

export interface AIProviderConfig {
  provider: "gemini" | "openrouter";
  apiKey?: string;
  model?: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export interface AICompletionResponse {
  text: string;
  provider: string;
  model: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costBdt: number;
}

/**
 * Calculates BDT cost based on Gemini 1.5 Flash rates:
 * - Input: $0.075 / 1M tokens
 * - Output: $0.30 / 1M tokens
 * Conversion: 1 USD = 120 BDT
 */
export function calculateGeminiBdtCost(promptTokens: number, completionTokens: number): number {
  const usdRate = 120;
  const inputCostUsd = (promptTokens / 1_000_000) * 0.075;
  const outputCostUsd = (completionTokens / 1_000_000) * 0.30;
  return (inputCostUsd + outputCostUsd) * usdRate;
}

/**
 * Validates whether the AI provider is properly configured
 */
export function validateAiConfiguration(): { configured: boolean; provider: string; error?: string } {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (geminiKey && geminiKey !== "your-gemini-api-key" && !geminiKey.startsWith("your-")) {
    return { configured: true, provider: "gemini" };
  }

  if (openRouterKey && openRouterKey !== "your-openrouter-key") {
    return { configured: true, provider: "openrouter" };
  }

  return {
    configured: false,
    provider: "none",
    error: "No AI API key found. Please configure GEMINI_API_KEY in your .env.local file.",
  };
}

/**
 * Executes chat completion against Google Gemini REST API
 */
async function callGeminiApi(
  apiKey: string,
  messages: ChatMessage[],
  options: AICompletionOptions
): Promise<AICompletionResponse> {
  const requestedModel = options.model || "gemini-3.1-flash-lite";
  const candidateModels = [
    requestedModel,
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  const contents = await Promise.all(
    messages
      .filter((m) => m.role !== "system")
      .map(async (m, idx, arr) => {
        const parts: any[] = [];

        if (m.imageBase64) {
          parts.push({
            inlineData: {
              mimeType: m.imageMimeType || "image/jpeg",
              data: m.imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
            },
          });
        } else if (
          m.role === "user" &&
          m.mediaUrl &&
          m.mediaUrl.startsWith("http") &&
          idx >= arr.length - 2 // Only download image for recent turns to prevent redundant CDN fetches
        ) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const imgRes = await fetch(m.mediaUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (imgRes.ok) {
              const mime = imgRes.headers.get("content-type") || "image/jpeg";
              const arrayBuf = await imgRes.arrayBuffer();
              const b64 = Buffer.from(arrayBuf).toString("base64");
              parts.push({
                inlineData: {
                  mimeType: mime,
                  data: b64,
                },
              });
            }
          } catch (fetchImgErr) {
            console.warn("[Gemini Provider] Failed to fetch image from mediaUrl:", fetchImgErr);
          }
        }

        parts.push({ text: m.content || "Please look at this product image and answer my inquiry." });

        return {
          role: m.role === "assistant" ? "model" : "user",
          parts,
        };
      })
  );

  // Merge consecutive same-role turns so parts (e.g. photo attachment + subsequent question) are combined into a single prompt turn
  const mergedContents: Array<{ role: "user" | "model"; parts: any[] }> = [];
  for (const c of contents) {
    const role = c.role as "user" | "model";
    if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === role) {
      mergedContents[mergedContents.length - 1].parts.push(...c.parts);
    } else {
      mergedContents.push({ role, parts: [...c.parts] });
    }
  }

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const genConfig: Record<string, any> = {
        temperature: options.temperature ?? 0.6,
        maxOutputTokens: options.maxTokens ?? 1000,
      };

      // Only reasoning models support thinkingConfig
      if (model.includes("3.5-flash") && !model.includes("-lite")) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const body: Record<string, any> = {
        contents: mergedContents,
        generationConfig: genConfig,
      };

      if (options.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorDetails = await res.text();
        console.warn(`[Gemini API Warning] Model ${model} returned ${res.status}. Attempting fallback...`);
        lastError = new Error(`Gemini API returned error (${res.status}): ${errorDetails}`);
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const text =
        parts
          .filter((p: any) => !p.thought && typeof p.text === "string")
          .map((p: any) => p.text)
          .join("") ||
        parts[0]?.text ||
        "";
      const promptTokens = data.usageMetadata?.promptTokenCount || 50;
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 25;

      return {
        text,
        provider: "google-gemini",
        model,
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        costBdt: calculateGeminiBdtCost(promptTokens, completionTokens),
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini API.");
}

/**
 * Executes chat completion against OpenRouter API
 */
async function callOpenRouterApi(
  apiKey: string,
  messages: ChatMessage[],
  options: AICompletionOptions
): Promise<AICompletionResponse> {
  const model = options.model || "meta-llama/llama-3.1-8b-instruct";
  const formattedMessages = [
    ...(options.systemInstruction
      ? [{ role: "system" as const, content: options.systemInstruction }]
      : []),
    ...messages,
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Conversa SaaS",
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 300,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || {};

  return {
    text,
    provider: "openrouter",
    model,
    tokensUsed: {
      promptTokens: usage.prompt_tokens || 50,
      completionTokens: usage.completion_tokens || 25,
      totalTokens: usage.total_tokens || 75,
    },
    costBdt: calculateGeminiBdtCost(usage.prompt_tokens || 50, usage.completion_tokens || 25),
  };
}

/**
 * Universal Generate AI Reply Dispatcher
 */
export async function generateAiReply(
  messages: ChatMessage[],
  options: AICompletionOptions = {}
): Promise<AICompletionResponse> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (geminiKey && geminiKey !== "your-gemini-api-key" && !geminiKey.startsWith("your-")) {
    return await callGeminiApi(geminiKey, messages, options);
  }

  if (openRouterKey && openRouterKey !== "your-openrouter-key") {
    return await callOpenRouterApi(openRouterKey, messages, options);
  }

  // If no external key is configured, return an explicit configuration status
  // Note: As specified, we do not pretend external API connection succeeded.
  return {
    text: "Assalamu Alaikum! (Conversa Local Sandbox Mode: Please set your GEMINI_API_KEY in .env.local to generate live responses from Google Gemini)",
    provider: "local-simulation",
    model: "sandbox-rule-engine",
    tokensUsed: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    costBdt: 0.0,
  };
}
