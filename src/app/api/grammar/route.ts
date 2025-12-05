import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// -------------------------------------------------------
// ENHANCED GRAMMAR ENGINE - SUPERIOR TO QUILLBOT
// -------------------------------------------------------

const CF_API_KEY = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Types for grammar analysis
interface GrammarError {
  type: string;
  message: string;
  suggestion: string;
  position: {
    start: number;
    end: number;
  };
  severity: 'error' | 'warning' | 'info';
  rule: string;
}

interface GrammarResult {
  score: number; // 0-100
  errors: GrammarError[];
  suggestions: string[];
  readabilityScore: number;
  complexityLevel: 'simple' | 'moderate' | 'complex';
  toneAnalysis: string;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
}

// Advanced grammar rules database
const GRAMMAR_RULES = {
  // Common grammar errors
  common: [
    {
      pattern: /\bi\b(?=\s+am)/g,
      message: "Use 'I' instead of 'i'",
      suggestion: "I",
      rule: "capitalization"
    },
    {
      pattern: /\bits\b(?=\s+(?:the|my|your|his|her|our))/g,
      message: "Use 'it's' (it is) or 'its' (possessive)",
      suggestion: (context: string) => {
        const words = context.split(/\s+/);
        const itsIndex = words.findIndex((w: string) => w.toLowerCase() === 'its');
        if (itsIndex < words.length - 1) {
          const nextWord = words[itsIndex + 1].toLowerCase();
          return ['the', 'my', 'your', 'his', 'her', 'our', 'a', 'an'].includes(nextWord) ? 'its' : "it's";
        }
        return "it's";
      },
      rule: "pronoun_contraction"
    },
    {
      pattern: /\byour\b(?=\s+(?:going|re|ll|d|ve))/g,
      message: "Use 'you're' (you are) or 'your' (possessive)",
      suggestion: (context: string) => {
        const words = context.split(/\s+/);
        const yourIndex = words.findIndex((w: string) => w.toLowerCase() === 'your');
        if (yourIndex < words.length - 1) {
          const nextWord = words[yourIndex + 1].toLowerCase();
          return ['going', 're', 'll', 'd', 've'].includes(nextWord) ? "you're" : 'your';
        }
        return "you're";
      },
      rule: "pronoun_contraction"
    },
    {
      pattern: /\bthere\b(?=\s+is\b|\s+are\b)/g,
      message: "Check subject-verb agreement",
      suggestion: (context: string) => {
        // This is a simplified check - in practice, you'd need more sophisticated logic
        const words = context.split(/\s+/);
        const thereIndex = words.findIndex((w: string) => w.toLowerCase() === 'there');
        if (thereIndex < words.length - 1) {
          const nextWord = words[thereIndex + 1].toLowerCase();
          return nextWord === 'is' ? "there's" : "there are";
        }
        return "there";
      },
      rule: "subject_verb_agreement"
    }
  ],

  // Punctuation rules
  punctuation: [
    {
      pattern: /\s+,/g,
      message: "Remove space before comma",
      suggestion: ",",
      rule: "comma_spacing"
    },
    {
      pattern: /,(\s*[.!?])/g,
      message: "Remove comma before period",
      suggestion: "$1",
      rule: "comma_before_period"
    },
    {
      pattern: /\s+\./g,
      message: "Remove space before period",
      suggestion: ".",
      rule: "period_spacing"
    },
    {
      pattern: /(\w)(\s+)(\?)/g,
      message: "Remove space before question mark",
      suggestion: "$1?",
      rule: "question_mark_spacing"
    },
    {
      pattern: /(\w)(\s+)(!)/g,
      message: "Remove space before exclamation",
      suggestion: "$1!",
      rule: "exclamation_spacing"
    }
  ],

  // Advanced style rules
  style: [
    {
      pattern: /\b(really|very|extremely|quite|totally|absolutely)\s+(\w+)/gi,
      message: "Consider removing intensifiers for stronger writing",
      suggestion: (context: string) => {
        const match = context.match(/\b(really|very|extremely|quite|totally|absolutely)\s+(\w+)/i);
        if (match) {
          return match[2]; // Return just the adjective/adverb
        }
        return context;
      },
      rule: "intensifier_reduction"
    },
    {
      pattern: /\b(in order to|due to the fact that|at this point in time)\b/gi,
      message: "Use simpler alternatives",
      suggestion: {
        "in order to": "to",
        "due to the fact that": "because",
        "at this point in time": "now"
      },
      rule: "wordiness_reduction"
    },
    {
      pattern: /\b(utilize|leverage|optimize|streamline)\b/gi,
      message: "Consider using simpler, more direct words",
      suggestion: {
        "utilize": "use",
        "leverage": "use",
        "optimize": "improve",
        "streamline": "simplify"
      },
      rule: "jargon_simplification"
    }
  ],

  // Capitalization rules
  capitalization: [
    {
      pattern: /(^|[.!?]\s+)([a-z])/g,
      message: "Capitalize the first letter of each sentence",
      suggestion: (match: string, p1: string, p2: string) => p1 + p2.toUpperCase(),
      rule: "sentence_capitalization"
    },
    {
      pattern: /\b(i)\b(?!\s+(?:am|was|will|have|had|do|does|did|can|could|should|would|must))/g,
      message: "Use 'I' (capitalized) when referring to yourself",
      suggestion: "I",
      rule: "pronoun_capitalization"
    }
  ]
};

// Advanced readability calculation (Flesch-Kincaid + additional factors)
function calculateReadability(text: string): { score: number; level: 'simple' | 'moderate' | 'complex' } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease Score
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  // Convert to 0-100 scale
  const normalizedScore = Math.max(0, Math.min(100, fleschScore));
  
  let level: 'simple' | 'moderate' | 'complex';
  if (normalizedScore >= 70) level = "simple";
  else if (normalizedScore >= 40) level = "moderate";
  else level = "complex";

  return { score: normalizedScore, level };
}

// Syllable counting algorithm
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// Advanced grammar checking
function checkGrammar(text: string): GrammarError[] {
  const errors: GrammarError[] = [];
  
  // Apply each set of rules
  Object.entries(GRAMMAR_RULES).forEach(([category, rules]) => {
    rules.forEach(rule => {
      const matches = Array.from(text.matchAll(rule.pattern));
      
      matches.forEach(match => {
        const matchText = match[0];
        const startIndex = match.index || 0;
        const endIndex = startIndex + matchText.length;
        
        let suggestion: string;
        if (typeof rule.suggestion === 'function') {
          suggestion = rule.suggestion(text, matchText, '') || matchText;
        } else if (typeof rule.suggestion === 'object' && rule.suggestion !== null) {
          const suggestionObj = rule.suggestion as Record<string, string | undefined>;
          suggestion = suggestionObj[matchText.toLowerCase()] || matchText;
        } else {
          suggestion = rule.suggestion || matchText;
        }
        
        errors.push({
          type: category,
          message: rule.message,
          suggestion,
          position: { start: startIndex, end: endIndex },
          severity: category === 'common' ? 'error' : 'warning',
          rule: rule.rule
        });
      });
    });
  });

  return errors;
}

// AI-powered grammar enhancement using Cloudflare
async function enhanceWithAI(text: string, errors: GrammarError[]): Promise<string[]> {
  if (!CF_API_KEY || !CF_ACCOUNT_ID) {
    return ["AI enhancement service unavailable"];
  }

  const prompt = `
Analyze this text for advanced writing improvements beyond basic grammar:

Text: ${text}

Current issues found: ${errors.length}

Provide 3-5 specific, actionable suggestions for improvement focusing on:
1. Clarity and conciseness
2. Word choice and vocabulary
3. Sentence structure and flow
4. Tone and style
5. Professional writing standards

Respond with a JSON array of suggestions:
["suggestion 1", "suggestion 2", "suggestion 3"]
`;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an expert writing coach. Respond with valid JSON array only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 400
        })
      }
    );

    const data = await response.json();
    const output = data?.result?.response || data?.result?.output || "";
    
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI enhancement error:", error);
  }

  return ["AI enhancement service temporarily unavailable"];
}

// Tone analysis
function analyzeTone(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  
  const toneIndicators = {
    professional: ['therefore', 'however', 'furthermore', 'consequently', 'additionally', 'in conclusion', 'thus'],
    casual: ['hey', 'yeah', 'okay', 'cool', 'awesome', 'pretty', 'sort of'],
    academic: ['research', 'analysis', 'evidence', 'hypothesis', 'methodology', 'significant', 'therefore'],
    friendly: ['great', 'wonderful', 'fantastic', 'amazing', 'love', 'enjoy', 'pleased'],
    formal: ['regarding', 'concerning', 'accordingly', 'whereas', 'nevertheless', 'furthermore', 'hence'],
    enthusiastic: ['excellent', 'outstanding', 'remarkable', 'incredible', 'fantastic', 'superb', 'brilliant']
  };
  
  let maxTone = 'neutral';
  let maxScore = 0;
  
  Object.entries(toneIndicators).forEach(([tone, indicators]) => {
    const score = indicators.reduce((count, indicator) => {
      return count + words.filter(word => word.includes(indicator) || indicator.includes(word)).length;
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      maxTone = tone;
    }
  });
  
  return maxTone === 'neutral' ? 'balanced' : maxTone;
}

// Main grammar analysis function
async function analyzeGrammar(text: string): Promise<GrammarResult> {
  const errors = checkGrammar(text);
  const readability = calculateReadability(text);
  const tone = analyzeTone(text);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate base score (100 - error penalties)
  let score = 100;
  
  errors.forEach(error => {
    switch (error.severity) {
      case 'error':
        score -= error.type === 'common' ? 5 : 3;
        break;
      case 'warning':
        score -= 2;
        break;
      case 'info':
        score -= 1;
        break;
    }
  });
  
  score = Math.max(0, Math.min(100, score));
  
  // Add readability factor
  if (readability.score < 40) score -= 10;
  else if (readability.score > 80) score += 5;
  
  // Get AI suggestions
  const suggestions = await enhanceWithAI(text, errors);
  
  return {
    score,
    errors,
    suggestions,
    readabilityScore: readability.score,
    complexityLevel: readability.level,
    toneAnalysis: tone,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: words.length / sentences.length
  };
}

// Main API endpoint
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
    const { text, mode = 'full' } = body;

    if (!text?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Text is required for grammar analysis' 
      }, { status: 400 });
    }

    if (text.length > 15000) {
      return NextResponse.json({
        success: false,
        error: 'Text too long for grammar analysis (max 15,000 characters)'
      }, { status: 400 });
    }

    // Perform comprehensive grammar analysis
    const startTime = Date.now();
    const result = await analyzeGrammar(text);
    const processingTime = Date.now() - startTime;
    
    // Log the analysis for analytics
    try {
      // NOTE: Database logging temporarily disabled due to schema setup
      // await prisma.grammarAnalysis.create({
      //   data: {
      //     userId: user.id,
      //     inputText: text.slice(0, 2000), // Store first 2000 chars
      //     errors: result.errors,
      //     suggestions: result.suggestions,
      //     score: result.score,
      //     readabilityScore: result.readabilityScore,
      //     complexityLevel: result.complexityLevel,
      //     toneAnalysis: result.toneAnalysis
      //   }
      // });
      console.log('Grammar analysis logged:', {
        userId: user.id,
        score: result.score,
        readabilityScore: result.readabilityScore,
        complexityLevel: result.complexityLevel
      });
    } catch (dbError) {
      console.error('Failed to log grammar analysis:', dbError);
      // Don't fail the request if logging fails
    }

    // Return comprehensive results
    return NextResponse.json({
      success: true,
      ...result,
      processingTime,
      metadata: {
        version: '2.0',
        engine: 'Enhanced Grammar Engine v2.0',
        rulesApplied: Object.keys(GRAMMAR_RULES).length
      }
    });

  } catch (error) {
    console.error('Grammar analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : "Grammar analysis failed";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        fallback: {
          score: 50,
          errors: [],
          suggestions: ["Grammar analysis service temporarily unavailable"],
          readabilityScore: 50,
          complexityLevel: 'moderate',
          toneAnalysis: 'neutral'
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint for grammar analysis history
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
    // const analyses = await prisma.grammarAnalysis.findMany({
    //   where: { userId: user.id },
    //   orderBy: { createdAt: 'desc' },
    //   take: Math.min(limit, 50),
    //   select: {
    //     id: true,
    //     score: true,
    //     readabilityScore: true,
    //     complexityLevel: true,
    //     toneAnalysis: true,
    //     createdAt: true,
    //     inputText: true
    //   }
    // });
    
    const analyses: Array<{
      id: string;
      score: number;
      readabilityScore: number;
      complexityLevel: string;
      toneAnalysis: string;
      createdAt: Date;
      inputText: string;
    }> = []; // Temporary empty array

    return NextResponse.json({
      success: true,
      analyses
    });

  } catch (error) {
    console.error('Grammar analysis history error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch grammar analysis history" },
      { status: 500 }
    );
  }
}