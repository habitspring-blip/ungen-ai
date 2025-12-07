import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// -------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------
const MAX_TEXT_LENGTH = 10000;

// Simulated plagiarism database (in real app, this would connect to actual services)
const COMMON_PHRASES = [
  "in conclusion",
  "furthermore",
  "however",
  "therefore",
  "according to",
  "research shows",
  "experts agree",
  "it is important to",
  "many people believe",
  "studies have shown"
];

// -------------------------------------------------------
// PLAGIARISM ANALYSIS FUNCTIONS
// -------------------------------------------------------
function analyzePlagiarism(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  // Simple plagiarism detection simulation
  const flaggedSentences: Array<{ sentence: string; score: number; matches: string[] }> = [];
  const uniquePhrases: Array<{ phrase: string; frequency: number }> = [];

  // Check for common phrases
  sentences.forEach((sentence, index) => {
    const sentenceLower = sentence.toLowerCase();
    const matches: string[] = [];

    COMMON_PHRASES.forEach(phrase => {
      if (sentenceLower.includes(phrase)) {
        matches.push(phrase);
      }
    });

    if (matches.length > 0) {
      const score = Math.min(100, matches.length * 20 + Math.random() * 30);
      flaggedSentences.push({
        sentence: sentence.trim(),
        score: Math.round(score),
        matches
      });
    }
  });

  // Check for repetitive phrases
  const phraseMap: { [key: string]: number } = {};
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    phraseMap[phrase] = (phraseMap[phrase] || 0) + 1;
  }

  Object.entries(phraseMap).forEach(([phrase, count]) => {
    if (count > 2) {
      uniquePhrases.push({ phrase, frequency: count });
    }
  });

  // Calculate overall plagiarism score
  const baseScore = (flaggedSentences.length / sentences.length) * 100;
  const repetitionPenalty = (uniquePhrases.length / words.length) * 1000;
  const overallScore = Math.min(100, Math.max(0, baseScore + repetitionPenalty + Math.random() * 20));

  return {
    overallScore: Math.round(overallScore),
    flaggedSentences: flaggedSentences.slice(0, 10), // Top 10 flagged sentences
    uniquePhrases: uniquePhrases.slice(0, 5), // Top 5 repetitive phrases
    riskLevel: getRiskLevel(overallScore),
    suggestions: generateSuggestions(overallScore, flaggedSentences.length, uniquePhrases.length)
  };
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 20) return 'low';
  if (score < 40) return 'medium';
  if (score < 70) return 'high';
  return 'critical';
}

function generateSuggestions(score: number, flaggedCount: number, repetitionCount: number): string[] {
  const suggestions = [];

  if (score > 50) {
    suggestions.push("High plagiarism risk detected. Consider rewriting the entire content.");
  }

  if (flaggedCount > 5) {
    suggestions.push("Multiple sentences contain common phrases. Paraphrase these sections.");
  }

  if (repetitionCount > 3) {
    suggestions.push("Repetitive phrases detected. Vary your language and sentence structure.");
  }

  if (score < 30) {
    suggestions.push("Content appears original. Minor adjustments may improve uniqueness.");
  }

  suggestions.push("Use the rewrite feature to generate alternative phrasing.");
  suggestions.push("Cite sources properly if using external content.");

  return suggestions;
}

// -------------------------------------------------------
// REWRITE SUGGESTIONS
// -------------------------------------------------------
async function generateRewriteSuggestions(text: string, flaggedSentences: Array<{ sentence: string }>, userId: string) {
  const suggestions: Array<{ original: string; rewritten: string }> = [];

  for (const flagged of flaggedSentences.slice(0, 3)) { // Limit to 3 suggestions
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: flagged.sentence,
          intent: 'humanize',
          targetTone: 'neutral',
          targetLength: 'medium'
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let rewritten = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            rewritten += decoder.decode(value);
          }

          suggestions.push({
            original: flagged.sentence,
            rewritten: rewritten.trim()
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate rewrite suggestion:', error);
    }
  }

  return suggestions;
}

// -------------------------------------------------------
// MAIN ROUTE HANDLER
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
    const { text, generateSuggestions: shouldGenerateSuggestions = false } = body;

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

    // Analyze for plagiarism
    const plagiarismAnalysis = analyzePlagiarism(text);

    // Generate rewrite suggestions if requested
    let rewriteSuggestions: Array<{ original: string; rewritten: string }> = [];
    if (shouldGenerateSuggestions && plagiarismAnalysis.flaggedSentences.length > 0) {
      rewriteSuggestions = await generateRewriteSuggestions(text, plagiarismAnalysis.flaggedSentences, user.id);
    }

    const result = {
      success: true,
      analysis: plagiarismAnalysis,
      rewriteSuggestions,
      summary: {
        totalSentences: text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length,
        flaggedSentences: plagiarismAnalysis.flaggedSentences.length,
        riskLevel: plagiarismAnalysis.riskLevel,
        overallScore: plagiarismAnalysis.overallScore
      }
    };

    return NextResponse.json(result);

  } catch (err: unknown) {
    console.error('Plagiarism analysis error:', err);
    const errorMessage = err instanceof Error ? err.message : "Plagiarism analysis failed";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}