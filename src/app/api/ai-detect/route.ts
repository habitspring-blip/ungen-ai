import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { aiDetectSchema } from '@/lib/validations';
import { aiDetectLimiter, getClientIP, validateRateLimitConfig } from '@/lib/rate-limit';

// -------------------------------------------------------
// AI DETECTION ENGINE - SUPERIOR TO QUILLBOT
// -------------------------------------------------------

// Advanced AI detection using multiple models and techniques
const CF_API_KEY = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Detection thresholds
const AI_CONFIDENCE_THRESHOLD = 0.7;
const HUMAN_CONFIDENCE_THRESHOLD = 0.6;

// Types for AI detection results
interface DetectionResult {
  isAIGenerated: boolean;
  confidence: number;
  reasoning: string[];
  indicators: {
    sentenceStructure: number;
    vocabularyComplexity: number;
    repetitionPatterns: number;
    coherence: number;
    stylisticMarkers: number;
  };
  modelConsensus: string;
  timestamp: string;
}

// Advanced linguistic analysis for AI detection
function analyzeLinguisticPatterns(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  // Sentence length analysis (AI tends to have more uniform sentence lengths)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const sentenceLengthVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
  
  // Vocabulary analysis (AI tends to use more complex but less varied vocabulary)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabularyRichness = uniqueWords.size / words.length;
  
  // Repetition patterns (AI often repeats certain phrases or structures)
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    const normalized = word.toLowerCase().replace(/[^\w]/g, '');
    if (normalized.length > 3) {
      wordFreq[normalized] = (wordFreq[normalized] || 0) + 1;
    }
  });
  
  const repeatedWords = Object.entries(wordFreq).filter(([_, count]) => count > 2).length;
  const repetitionRatio = repeatedWords / uniqueWords.size;
  
  // Transition word analysis (AI often overuses transitions)
  const transitions = [
    'furthermore', 'moreover', 'additionally', 'consequently', 'therefore',
    'however', 'nevertheless', 'nonetheless', 'meanwhile', 'similarly',
    'likewise', 'in contrast', 'on the other hand', 'for example', 'for instance'
  ];
  
  const transitionCount = transitions.reduce((count, transition) => {
    return count + (text.toLowerCase().match(new RegExp(transition, 'g')) || []).length;
  }, 0);
  
  const transitionDensity = transitionCount / sentences.length;
  
  return {
    avgSentenceLength,
    sentenceLengthVariance,
    vocabularyRichness,
    repetitionRatio,
    transitionDensity,
    totalWords: words.length,
    totalSentences: sentences.length
  };
}

// AI Detection using Cloudflare Workers AI
async function cloudflareAIDetection(text: string): Promise<{ score: number; reasoning: string[] }> {
  if (!CF_API_KEY || !CF_ACCOUNT_ID) {
    throw new Error("Cloudflare credentials not available");
  }

  const prompt = `
Analyze the following text and determine if it was likely written by AI or a human. 

Provide your analysis in JSON format:
{
  "ai_score": 0.0-1.0,
  "reasoning": ["reason1", "reason2", "reason3"],
  "confidence": 0.0-1.0
}

Text to analyze:
${text}

Consider these AI indicators:
- Uniform sentence structure and length
- Overuse of transition words
- Lack of personal experience or emotion
- Perfect grammar and structure
- Generic or template-like language
- Lack of natural writing quirks or imperfections
- Repetitive vocabulary patterns
- Overly formal or academic tone

Consider these human indicators:
- Varied sentence structure and length
- Personal experiences or opinions
- Natural imperfections and inconsistencies
- Creative or unique phrasing
- Emotional language when appropriate
- First-person narrative
- Regional or cultural references
- Natural flow with occasional errors
`;

  const models = [
    "@cf/meta/llama-3-8b-instruct",
    "@cf/mistral/mistral-7b-instruct-v0.1"
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CF_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are an expert AI detection system. Respond with valid JSON only." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 500
          })
        }
      );

      const raw = await response.text();
      const parsed = JSON.parse(raw);

      const output = parsed?.result?.response || parsed?.result?.output || parsed?.result?.message || "";
      
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          score: result.ai_score || 0.5,
          reasoning: result.reasoning || ["Analysis completed"]
        };
      }
    } catch (error) {
      console.error("Cloudflare AI detection error:", error);
      continue;
    }
  }

  throw new Error("All Cloudflare AI models failed");
}

// AI Detection using Anthropic Claude
async function claudeAIDetection(text: string): Promise<{ score: number; reasoning: string[] }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not available");
  }

  const prompt = `
Analyze this text for AI vs human authorship. Return ONLY valid JSON:

{
  "ai_score": 0.0-1.0,
  "reasoning": ["specific reason 1", "specific reason 2", "specific reason 3"],
  "confidence": 0.0-1.0
}

Text: ${text.slice(0, 2000)}...

Score 0.0 = definitely human, 1.0 = definitely AI
Focus on linguistic patterns, structure, and writing style.
`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY!,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text_result = data?.content?.[0]?.text;

    if (text_result) {
      const jsonMatch = text_result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          score: result.ai_score || 0.5,
          reasoning: result.reasoning || ["Claude analysis completed"]
        };
      }
    }

    throw new Error("Invalid JSON response from Claude");
  } catch (error) {
    console.error("Claude AI detection error:", error);
    throw error;
  }
}

// Consensus-based AI detection
async function consensusDetection(text: string): Promise<DetectionResult> {
  const linguistic = analyzeLinguisticPatterns(text);
  
  const results: number[] = [];
  const reasoning: string[] = [];
  
  try {
    const [cloudflareResult, claudeResult] = await Promise.allSettled([
      cloudflareAIDetection(text),
      claudeAIDetection(text)
    ]);

    if (cloudflareResult.status === 'fulfilled') {
      results.push(cloudflareResult.value.score);
      reasoning.push(...cloudflareResult.value.reasoning.map(r => `Cloudflare: ${r}`));
    }

    if (claudeResult.status === 'fulfilled') {
      results.push(claudeResult.value.score);
      reasoning.push(...claudeResult.value.reasoning.map(r => `Claude: ${r}`));
    }

    // If both models fail, fall back to linguistic analysis only
    if (results.length === 0) {
      // Simple rule-based fallback
      let fallbackScore = 0.5;
      
      if (linguistic.sentenceLengthVariance < 5) fallbackScore += 0.2;
      if (linguistic.transitionDensity > 0.3) fallbackScore += 0.2;
      if (linguistic.repetitionRatio > 0.15) fallbackScore += 0.1;
      if (linguistic.vocabularyRichness < 0.6) fallbackScore += 0.1;
      
      results.push(Math.min(fallbackScore, 1.0));
      reasoning.push("Linguistic pattern analysis");
    }

  } catch (error) {
    console.error("Consensus detection error:", error);
    // Fallback to simple analysis
    let fallbackScore = 0.5;
    
    if (linguistic.sentenceLengthVariance < 5) fallbackScore += 0.2;
    if (linguistic.transitionDensity > 0.3) fallbackScore += 0.2;
    if (linguistic.repetitionRatio > 0.15) fallbackScore += 0.1;
    if (linguistic.vocabularyRichness < 0.6) fallbackScore += 0.1;
    
    results.push(Math.min(fallbackScore, 1.0));
    reasoning.push("Fallback linguistic analysis");
  }

  // Calculate consensus score
  const consensusScore = results.reduce((a, b) => a + b, 0) / results.length;
  
  // Determine if AI-generated based on confidence thresholds
  const isAIGenerated = consensusScore > AI_CONFIDENCE_THRESHOLD;
  
  // Calculate indicators
  const indicators = {
    sentenceStructure: linguistic.sentenceLengthVariance < 5 ? 0.8 : 0.3,
    vocabularyComplexity: linguistic.vocabularyRichness < 0.6 ? 0.7 : 0.4,
    repetitionPatterns: linguistic.repetitionRatio > 0.15 ? 0.8 : 0.2,
    coherence: consensusScore > 0.7 ? 0.9 : 0.6,
    stylisticMarkers: linguistic.transitionDensity > 0.3 ? 0.8 : 0.3
  };

  // Create model consensus description
  const modelConsensus = results.length > 1 
    ? `Consensus of ${results.length} AI models` 
    : "Single model analysis";

  return {
    isAIGenerated,
    confidence: consensusScore,
    reasoning,
    indicators,
    modelConsensus,
    timestamp: new Date().toISOString()
  };
}

// Main API endpoint
export async function POST(req: NextRequest) {
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

    // Rate limiting check (if configured)
    if (validateRateLimitConfig()) {
      const ip = getClientIP(req);
      const { success, limit, reset, remaining } = await aiDetectLimiter.limit(ip);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: reset
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        });
      }
    }

    const body = await req.json();
    
    // Validate input using Zod schema
    const validatedInput = aiDetectSchema.safeParse(body);
    if (!validatedInput.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validatedInput.error.issues
      }, { status: 400 });
    }

    const { text, mode } = validatedInput.data;

    // Perform AI detection
    const detectionResult = await consensusDetection(text);
    
    // Log the detection for analytics (if needed)
    try {
      // NOTE: Database logging temporarily disabled due to schema setup
      // await prisma.aiDetection.create({
      //   data: {
      //     userId: user.id,
      //     inputText: text.slice(0, 1000), // Store first 1000 chars for analysis
      //     isAIGenerated: detectionResult.isAIGenerated,
      //     confidence: detectionResult.confidence,
      //     modelUsed: detectionResult.modelConsensus
      //   }
      // });
      console.log('AI Detection logged:', {
        userId: user.id,
        isAIGenerated: detectionResult.isAIGenerated,
        confidence: detectionResult.confidence
      });
    } catch (dbError) {
      console.error('Failed to log AI detection:', dbError);
      // Don't fail the request if logging fails
    }

    // Return detailed results
    return NextResponse.json({
      success: true,
      ...detectionResult,
      metadata: {
        textLength: text.length,
        processingTime: Date.now(),
        version: '2.0'
      }
    });

  } catch (error) {
    console.error('AI Detection error:', error);
    const errorMessage = error instanceof Error ? error.message : "AI detection failed";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        fallback: {
          isAIGenerated: false,
          confidence: 0.5,
          reasoning: ["Detection service temporarily unavailable"],
          modelConsensus: "Service unavailable"
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint for detection history
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // NOTE: Database query temporarily disabled due to schema setup
    // const detections = await prisma.aiDetection.findMany({
    //   where: { userId: user.id },
    //   orderBy: { createdAt: 'desc' },
    //   take: Math.min(limit, 50),
    //   select: {
    //     id: true,
    //     isAIGenerated: true,
    //     confidence: true,
    //     modelUsed: true,
    //     createdAt: true,
    //     inputText: true
    //   }
    // });
    
    const detections: Array<{
      id: string;
      isAIGenerated: boolean;
      confidence: number;
      modelUsed: string;
      createdAt: Date;
      inputText: string;
    }> = []; // Temporary empty array

    return NextResponse.json({
      success: true,
      detections
    });

  } catch (error) {
    console.error('AI Detection history error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch detection history" },
      { status: 500 }
    );
  }
}