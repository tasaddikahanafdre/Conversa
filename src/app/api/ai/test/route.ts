import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAiConfiguration, generateAiReply } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = validateAiConfiguration();
    if (!config.configured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: "No live AI API key configured.",
        instructions:
          "To enable live Gemini generation, add your Google AI Studio API key as GEMINI_API_KEY in .env.local.",
      });
    }

    // Run connection test with real credentials
    const testResult = await generateAiReply(
      [{ role: "user", content: "Reply with the word 'CONNECTED' and nothing else." }],
      { maxTokens: 10 }
    );

    return NextResponse.json({
      success: true,
      configured: true,
      provider: testResult.provider,
      model: testResult.model,
      sampleResponse: testResult.text.trim(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI provider connection test failed";
    return NextResponse.json(
      {
        success: false,
        configured: true,
        error: message,
      },
      { status: 502 }
    );
  }
}
