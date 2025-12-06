import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { getLinguisticStats } from '@/lib/engine/enhanced/1_FastAnalyzer';
import { buildIntelligentPrompt, type RewriteRequest } from '@/lib/engine/enhanced/2_SmartPromptBuilder';
import { executeRewriteStream } from '@/lib/engine/enhanced/3_RewriteExecutionAgent';

// -------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------
const MAX_TEXT_LENGTH = 15000;


// -------------------------------------------------------
// MAIN ROUTE HANDLER - Enhanced Architecture
// -------------------------------------------------------
export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      text,
      intent = "humanize",
      targetTone = "neutral",
      targetLength = "medium",
      styleSamples = []
    } = body;

    // Input validation
    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: "Text is required" });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`
      });
    }

    // Validate intent
    const validIntents = ['humanize', 'summarize', 'expand', 'simplify', 'grammar'];
    if (!validIntents.includes(intent)) {
      return NextResponse.json({
        success: false,
        error: `Invalid intent. Must be one of: ${validIntents.join(', ')}`
      });
    }

    // 1. FAST ANALYSIS: CPU-bound linguistic analysis
    const linguisticStats = getLinguisticStats(text);

    // 2. SMART PROMPT BUILDING: Contextual injection
    const rewriteRequest: RewriteRequest = {
      text,
      intent: intent as RewriteRequest['intent'],
      targetTone,
      targetLength: targetLength as RewriteRequest['targetLength'],
      styleSamples
    };

    const intelligentPrompt = buildIntelligentPrompt(rewriteRequest, linguisticStats);

    // 3. STREAMING EXECUTION: Semantic routing with async billing
    const streamingResponse = await executeRewriteStream(
      intelligentPrompt,
      rewriteRequest,
      user.id
    );

    // Return the streaming response directly
    return streamingResponse;

  } catch (err: unknown) {
    console.error('Enhanced rewrite error:', err);
    const errorMessage = err instanceof Error ? err.message : "Rewrite failed";

    // Provide user-friendly error messages
    let userFriendlyError = errorMessage;

    if (errorMessage.includes('API credentials not configured')) {
      userFriendlyError = "AI service configuration error. Please contact support.";
    } else if (errorMessage.includes('API error')) {
      userFriendlyError = "AI service temporarily unavailable. Please try again.";
    } else if (errorMessage.includes('streaming')) {
      userFriendlyError = "Connection error. Please check your internet and try again.";
    }

    return NextResponse.json(
      { success: false, error: userFriendlyError },
      { status: 500 }
    );
  }
}