import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { getLinguisticStats } from '@/lib/engine/enhanced/1_FastAnalyzer';

// -------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------
const MAX_TEXT_LENGTH = 10000;

// Common SEO keywords and phrases
const SEO_KEYWORDS = [
  'best', 'top', 'guide', 'how to', 'tips', 'review', 'comparison',
  'ultimate', 'complete', 'essential', 'proven', 'effective', 'powerful'
];

// -------------------------------------------------------
// SEO ANALYSIS FUNCTIONS
// -------------------------------------------------------
function analyzeSEOContent(text: string) {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Keyword density analysis
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) { // Ignore short words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const topKeywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      density: Math.round((count / wordCount) * 10000) / 100
    }));

  // Readability score (simplified)
  const avgWordsPerSentence = wordCount / sentences.length;
  const readabilityScore = Math.max(0, Math.min(100,
    100 - (avgWordsPerSentence - 15) * 2
  ));

  // SEO suggestions
  const suggestions = [];

  if (wordCount < 300) {
    suggestions.push("Content is too short for optimal SEO. Aim for 300+ words.");
  }

  if (readabilityScore < 60) {
    suggestions.push("Improve readability by using shorter sentences and simpler words.");
  }

  if (!text.toLowerCase().includes('?')) {
    suggestions.push("Add questions to engage readers and improve SEO.");
  }

  if (topKeywords.length < 3) {
    suggestions.push("Include more relevant keywords naturally in your content.");
  }

  return {
    wordCount,
    topKeywords,
    readabilityScore,
    suggestions,
    titleSuggestions: generateTitleSuggestions(text),
    metaDescription: generateMetaDescription(text),
    internalLinks: suggestInternalLinks(text),
    headingStructure: analyzeHeadings(text)
  };
}

function generateTitleSuggestions(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const firstSentence = sentences[0]?.trim() || '';

  const suggestions = [
    firstSentence.substring(0, 60),
    `The Ultimate Guide to ${extractMainTopic(text)}`,
    `How to ${extractAction(text)} - Complete Guide`,
    `${extractMainTopic(text)}: What You Need to Know`
  ];

  return suggestions.filter(title => title.length > 10 && title.length < 70);
}

function generateMetaDescription(text: string): string {
  const firstSentence = text.split(/[.!?]+/)[0]?.trim() || '';
  if (firstSentence.length > 100) {
    return firstSentence.substring(0, 155) + '...';
  }
  return firstSentence + ' ' + (text.split(/[.!?]+/)[1]?.trim() || '').substring(0, 100);
}

function extractMainTopic(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);

  const topics = words
    .filter(word => word.length > 4 && !commonWords.has(word))
    .slice(0, 3);

  return topics.join(' ').replace(/\b\w/g, l => l.toUpperCase());
}

function extractAction(text: string): string {
  const actions = ['create', 'build', 'make', 'write', 'design', 'develop', 'improve', 'optimize'];
  const words = text.toLowerCase().split(/\s+/);

  for (const action of actions) {
    if (words.includes(action)) {
      return action + ' ' + extractMainTopic(text).toLowerCase();
    }
  }

  return 'achieve your goals';
}

function suggestInternalLinks(text: string): string[] {
  const topics = extractMainTopic(text).toLowerCase().split(' ');
  return topics.map(topic => `/${topic}-guide`);
}

function analyzeHeadings(text: string): { structure: string[], suggestions: string[] } {
  const lines = text.split('\n');
  const headings = lines.filter(line =>
    line.trim().startsWith('#') ||
    line.trim().match(/^[A-Z][^.!?]*$/) && line.trim().length < 100
  );

  const suggestions = [];
  if (!headings.some(h => h.includes('#'))) {
    suggestions.push("Add H1 and H2 headings for better SEO structure.");
  }
  if (headings.length < 2) {
    suggestions.push("Include more subheadings to break up content.");
  }

  return {
    structure: headings.slice(0, 5),
    suggestions
  };
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
    const { text } = body;

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

    // Check user credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User data not found'
      }, { status: 404 });
    }

    // Calculate credit cost (5 credits per word, minimum 100)
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
    const creditCost = Math.max(100, wordCount * 5);

    if (userData.credits < creditCost) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        requiredCredits: creditCost,
        availableCredits: userData.credits
      }, { status: 402 });
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: userData.credits - creditCost })
      .eq('id', user.id);

    if (updateError) {
      console.error('Credit deduction error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits'
      }, { status: 500 });
    }

    // Analyze content for SEO
    const seoAnalysis = analyzeSEOContent(text);

    // Generate optimized version using rewrite API
    const optimizedText = await generateSEOOptimizedText(text, seoAnalysis, user.id);

    const result = {
      success: true,
      originalAnalysis: seoAnalysis,
      optimizedText,
      improvements: {
        addedKeywords: seoAnalysis.topKeywords.slice(0, 3).map(k => k.word),
        readabilityImprovement: Math.round(seoAnalysis.readabilityScore),
        wordCountIncrease: optimizedText.split(/\s+/).length - seoAnalysis.wordCount
      }
    };

    return NextResponse.json(result);

  } catch (err: unknown) {
    console.error('SEO analysis error:', err);
    const errorMessage = err instanceof Error ? err.message : "SEO analysis failed";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to generate SEO-optimized text
async function generateSEOOptimizedText(text: string, analysis: { topKeywords: Array<{ word: string }> }, userId: string): Promise<string> {
  try {
    // Use the existing rewrite API with SEO-focused prompt
    const seoPrompt = `Optimize the following content for SEO. Improve keyword usage, readability, and engagement while maintaining the original meaning. Add relevant subheadings if appropriate. Focus on: ${analysis.topKeywords.slice(0, 3).map((k: { word: string }) => k.word).join(', ')}.

Content to optimize:
${text}`;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rewrite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}` // Pass user context
      },
      body: JSON.stringify({
        text: seoPrompt,
        intent: 'humanize',
        targetTone: 'professional',
        targetLength: 'medium'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate optimized text');
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response stream available");
    }

    const decoder = new TextDecoder();
    let streamedContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      streamedContent += chunk;
    }

    return streamedContent;
  } catch (error) {
    console.error('SEO optimization generation failed:', error);
    return text; // Return original text if optimization fails
  }
}