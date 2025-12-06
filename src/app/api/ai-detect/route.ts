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
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
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
    sentenceStructure: { score: number; description: string };
    vocabularyComplexity: { score: number; description: string };
    repetitionPatterns: { score: number; description: string };
    transitionUsage: { score: number; description: string };
    perplexity: { score: number; description: string };
    burstiness: { score: number; description: string };
    sentiment: { score: number; description: string };
    readability: { score: number; description: string };
    coherence: number;
    stylisticMarkers: number;
  };
  modelConsensus: string;
  timestamp: string;
}

// Type for linguistic analysis results
interface LinguisticAnalysis {
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  vocabularyRichness: number;
  repetitionRatio: number;
  transitionDensity: number;
  perplexityScore: number;
  burstinessScore: number;
  sentimentScore: number;
  readabilityScore: number;
  totalWords: number;
  totalSentences: number;
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

  // NEW: Perplexity analysis (AI text tends to have lower perplexity)
  const perplexityScore = calculatePerplexity(text);

  // NEW: Burstiness analysis (AI text tends to be less bursty)
  const burstinessScore = calculateBurstiness(sentenceLengths);

  // NEW: Sentiment analysis (AI text often has neutral sentiment)
  const sentimentScore = analyzeSentiment(text);

  // NEW: Readability analysis (AI text often has higher readability)
  const readabilityScore = calculateReadability(text, words.length, sentences.length);

  return {
    avgSentenceLength,
    sentenceLengthVariance,
    vocabularyRichness,
    repetitionRatio,
    transitionDensity,
    perplexityScore,
    burstinessScore,
    sentimentScore,
    readabilityScore,
    totalWords: words.length,
    totalSentences: sentences.length
  };
}

// NEW: Perplexity calculation (measure of text predictability)
function calculatePerplexity(text: string): number {
  // Simple heuristic for perplexity - lower values indicate more predictable (AI-like) text
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  // Calculate type-token ratio (TTR)
  const ttr = uniqueWords.size / words.length;

  // Calculate hapax legomena ratio (words that appear only once)
  const hapaxCount = Array.from(uniqueWords).filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return (text.match(regex) || []).length === 1;
  }).length;
  const hapaxRatio = hapaxCount / uniqueWords.size;

  // Simple perplexity heuristic (lower = more AI-like)
  // AI text tends to have lower TTR and lower hapax ratio
  const perplexity = 1 / (ttr * (1 + hapaxRatio));

  // Normalize to 0-1 range
  return Math.min(Math.max(perplexity * 0.1, 0), 1);
}

// NEW: Burstiness calculation (measure of sentence length variation)
function calculateBurstiness(sentenceLengths: number[]): number {
  if (sentenceLengths.length <= 1) return 0.5;

  // Calculate mean and standard deviation
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length);

  // Calculate coefficient of variation (CV)
  const cv = stdDev / mean;

  // Burstiness score - higher CV means more bursty (human-like)
  // AI text tends to have lower burstiness (more uniform sentence lengths)
  const burstiness = Math.min(cv * 2, 1);

  return burstiness;
}

// NEW: Sentiment analysis
function analyzeSentiment(text: string): number {
  // Simple sentiment analysis using word lists
  const positiveWords = ['happy', 'joy', 'love', 'excellent', 'great', 'wonderful', 'amazing', 'fantastic'];
  const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst'];

  const textLower = text.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    positiveCount += (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
  });

  negativeWords.forEach(word => {
    negativeCount += (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
  });

  // Sentiment score: -1 (negative) to +1 (positive)
  // AI text often has neutral sentiment (close to 0)
  const sentiment = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);

  // Normalize to -1 to 1 range and convert to 0-1 for consistency
  return (sentiment + 1) / 2;
}

// NEW: Readability analysis using Flesch-Kincaid formula
function calculateReadability(text: string, wordCount: number, sentenceCount: number): number {
  // Count syllables (simple approximation)
  let syllableCount = 0;
  const words = text.split(/\s+/).filter(w => w.length > 0);

  words.forEach(word => {
    const wordLower = word.toLowerCase();
    if (wordLower.endsWith('es') || wordLower.endsWith('ed')) {
      syllableCount += 1;
    } else {
      // Count vowel groups as syllables
      const vowelGroups = wordLower.match(/[aeiouy]+/g);
      syllableCount += vowelGroups ? vowelGroups.length : 1;
    }
  });

  // Flesch-Kincaid Reading Ease formula
  // Score: 0-100 (higher = easier to read)
  // AI text often has higher readability scores
  const fleschScore = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);

  // Convert to 0-1 scale (higher = more readable/AI-like)
  return Math.min(Math.max(fleschScore / 100, 0), 1);
}

// AI Detection using Cloudflare Workers AI
async function cloudflareAIDetection(text: string): Promise<{ score: number; reasoning: string[] }> {
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
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
            Authorization: `Bearer ${CF_API_TOKEN}`,
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

// Enhanced Multimodal AI Detection with High-End Linguistic Models
async function consensusDetection(text: string): Promise<DetectionResult> {
  const linguistic = analyzeLinguisticPatterns(text);

  const results: number[] = [];
  const reasoning: string[] = [];

  try {
    // Multimodal approach: Use both AI models and advanced linguistic analysis
    const [cloudflareResult, claudeResult] = await Promise.allSettled([
      cloudflareAIDetection(text),
      claudeAIDetection(text)
    ]);

    // Process Cloudflare result
    if (cloudflareResult.status === 'fulfilled') {
      results.push(cloudflareResult.value.score);
      reasoning.push(...cloudflareResult.value.reasoning.map(r => `Cloudflare: ${r}`));
    }

    // Process Claude result
    if (claudeResult.status === 'fulfilled') {
      results.push(claudeResult.value.score);
      reasoning.push(...claudeResult.value.reasoning.map(r => `Claude: ${r}`));
    }

    // If AI models fail, use advanced linguistic analysis
    if (results.length === 0) {
      // Multimodal linguistic analysis using all advanced features
      const linguisticScore = calculateMultimodalLinguisticScore(linguistic);
      results.push(linguisticScore);
      reasoning.push("Advanced multimodal linguistic analysis");
    }

  } catch (error) {
    console.error("Consensus detection error:", error);
    // Fallback to multimodal linguistic analysis
    const linguisticScore = calculateMultimodalLinguisticScore(linguistic);
    results.push(linguisticScore);
    reasoning.push("Multimodal linguistic analysis fallback");
  }

  // Calculate weighted consensus score
  const consensusScore = calculateWeightedConsensusScore(results, linguistic);

  // Determine if AI-generated based on enhanced confidence thresholds
  const isAIGenerated = consensusScore > AI_CONFIDENCE_THRESHOLD;

  // Calculate comprehensive indicators using all advanced metrics
  const indicators = calculateComprehensiveIndicators(linguistic, consensusScore);

  // Create detailed model consensus description
  const modelConsensus = getModelConsensusDescription(results.length);

  return {
    isAIGenerated,
    confidence: consensusScore,
    reasoning,
    indicators,
    modelConsensus,
    timestamp: new Date().toISOString()
  };
}

// NEW: Multimodal linguistic scoring using all advanced features
function calculateMultimodalLinguisticScore(linguistic: LinguisticAnalysis): number {
  // Weighted scoring based on multiple linguistic features
  // Each feature contributes differently to AI detection

  // Sentence structure analysis (AI tends to have uniform sentence lengths)
  const sentenceStructureScore = linguistic.sentenceLengthVariance < 5 ? 0.8 : 0.3;

  // Vocabulary analysis (AI tends to use less varied vocabulary)
  const vocabularyScore = linguistic.vocabularyRichness < 0.6 ? 0.7 : 0.4;

  // Repetition analysis (AI tends to repeat phrases)
  const repetitionScore = linguistic.repetitionRatio > 0.15 ? 0.8 : 0.2;

  // Transition word analysis (AI tends to overuse transitions)
  const transitionScore = linguistic.transitionDensity > 0.3 ? 0.8 : 0.3;

  // Perplexity analysis (AI text tends to be more predictable)
  const perplexityScore = 1 - linguistic.perplexityScore; // Lower perplexity = more AI-like

  // Burstiness analysis (AI text tends to be less bursty)
  const burstinessScore = 1 - linguistic.burstinessScore; // Lower burstiness = more AI-like

  // Sentiment analysis (AI text tends to be neutral)
  const sentimentScore = Math.abs(linguistic.sentimentScore - 0.5) * 2; // Neutral sentiment = more AI-like

  // Readability analysis (AI text tends to have higher readability)
  const readabilityScore = linguistic.readabilityScore; // Higher readability = more AI-like

  // Weighted average with different importance for each feature
  const weightedScore = (
    sentenceStructureScore * 0.20 +  // 20% weight
    vocabularyScore * 0.15 +        // 15% weight
    repetitionScore * 0.15 +         // 15% weight
    transitionScore * 0.10 +        // 10% weight
    perplexityScore * 0.15 +        // 15% weight
    burstinessScore * 0.10 +        // 10% weight
    sentimentScore * 0.05 +         // 5% weight
    readabilityScore * 0.10         // 10% weight
  );

  // Normalize and adjust based on text length
  const lengthFactor = Math.min(linguistic.totalWords / 100, 1);
  const finalScore = Math.min(Math.max(weightedScore * (0.8 + lengthFactor * 0.2), 0), 1);

  return finalScore;
}

// NEW: Weighted consensus scoring
function calculateWeightedConsensusScore(modelScores: number[], linguistic: LinguisticAnalysis): number {
  if (modelScores.length === 0) {
    return calculateMultimodalLinguisticScore(linguistic);
  }

  // If we have model scores, use them as primary indicators
  const modelConsensus = modelScores.reduce((a, b) => a + b, 0) / modelScores.length;

  // Blend with linguistic analysis for more robust detection
  const linguisticScore = calculateMultimodalLinguisticScore(linguistic);

  // Weighted blend: 70% models, 30% linguistic (if models available)
  const blendedScore = modelConsensus * 0.7 + linguisticScore * 0.3;

  return Math.min(Math.max(blendedScore, 0), 1);
}

// NEW: Comprehensive indicators calculation
function calculateComprehensiveIndicators(linguistic: LinguisticAnalysis, consensusScore: number) {
  return {
    sentenceStructure: {
      score: linguistic.sentenceLengthVariance < 5 ? 0.8 : 0.3,
      description: `Sentence length variance: ${linguistic.sentenceLengthVariance.toFixed(2)}`
    },
    vocabularyComplexity: {
      score: linguistic.vocabularyRichness < 0.6 ? 0.7 : 0.4,
      description: `Vocabulary richness: ${linguistic.vocabularyRichness.toFixed(2)}`
    },
    repetitionPatterns: {
      score: linguistic.repetitionRatio > 0.15 ? 0.8 : 0.2,
      description: `Repetition ratio: ${linguistic.repetitionRatio.toFixed(2)}`
    },
    transitionUsage: {
      score: linguistic.transitionDensity > 0.3 ? 0.8 : 0.3,
      description: `Transition density: ${linguistic.transitionDensity.toFixed(2)}`
    },
    perplexity: {
      score: 1 - linguistic.perplexityScore,
      description: `Perplexity: ${linguistic.perplexityScore.toFixed(2)} (lower = more AI-like)`
    },
    burstiness: {
      score: 1 - linguistic.burstinessScore,
      description: `Burstiness: ${linguistic.burstinessScore.toFixed(2)} (lower = more AI-like)`
    },
    sentiment: {
      score: Math.abs(linguistic.sentimentScore - 0.5) * 2,
      description: `Sentiment: ${linguistic.sentimentScore.toFixed(2)} (neutral = more AI-like)`
    },
    readability: {
      score: linguistic.readabilityScore,
      description: `Readability: ${linguistic.readabilityScore.toFixed(2)} (higher = more AI-like)`
    },
    coherence: consensusScore > 0.7 ? 0.9 : 0.6,
    stylisticMarkers: linguistic.transitionDensity > 0.3 ? 0.8 : 0.3
  };
}

// NEW: Enhanced model consensus description
function getModelConsensusDescription(modelCount: number): string {
  if (modelCount >= 2) {
    return `Multimodal consensus of ${modelCount} high-end AI models with advanced linguistic analysis`;
  } else if (modelCount === 1) {
    return "Single high-end AI model with advanced linguistic analysis";
  } else {
    return "Advanced multimodal linguistic analysis (no AI models available)";
  }
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