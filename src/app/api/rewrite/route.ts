import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma'



// -------------------------------------------------------
// ENVIRONMENT VARIABLES
// -------------------------------------------------------
const CF_API_KEY = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// -------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------
const MAX_TEXT_LENGTH = 15000;

// -------------------------------------------------------
// TYPES
// -------------------------------------------------------
type SemanticProfile = {
  intent: string;
  audience: string;
  emotion: string;
  writingType: string;
  formalityLevel: number;
  complexity: number;
  sentimentPolarity: number;
  keyTopics: string[];
  rhetoricalDevices: string[];
  voiceCharacteristics: string[];
};

type LinguisticAnalysis = {
  avgSentenceLength: number;
  vocabularyRichness: number;
  passiveVoicePercentage: number;
  readabilityScore: number;
  paragraphStructure: string;
  transitionQuality: number;
};

type RewriteStrategy = {
  approach: string;
  focusAreas: string[];
  avoidances: string[];
  enhancements: string[];
  humanizationTechniques: string[];
};

// -------------------------------------------------------
// BASIC LINGUISTIC ANALYSIS ENGINE
// -------------------------------------------------------
function analyzeLinguistics(text: string): LinguisticAnalysis {
  const sentences = text.split(/[.!?]+/).filter(x => x.trim().length > 0);
  const words = text.split(/\s+/).filter(x => x.length > 0);

  const avgSentenceLength = words.length / Math.max(1, sentences.length);

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabularyRichness = uniqueWords.size / Math.max(1, words.length);

  const passiveIndicators =
    text.match(/\b(am|is|are|was|were|been|being)\s+\w+ed\b/gi) || [];
  const passiveVoicePercentage =
    (passiveIndicators.length / Math.max(1, sentences.length)) * 100;

  const syllables = words.reduce((sum, w) => sum + estimateSyllables(w), 0);
  const readabilityScore =
    206.835 -
    1.015 * avgSentenceLength -
    84.6 * (syllables / Math.max(1, words.length));

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  const transitions =
    text.match(
      /\b(however|therefore|moreover|furthermore|consequently|thus|nevertheless|additionally|hence)\b/gi
    ) || [];

  const transitionQuality = Math.min(
    (transitions.length / Math.max(1, paragraphs.length)) * 10,
    10
  );

  return {
    avgSentenceLength,
    vocabularyRichness,
    passiveVoicePercentage,
    readabilityScore,
    paragraphStructure: paragraphs.length > 1 ? "multi" : "single",
    transitionQuality
  };
}

function estimateSyllables(word: string): number {
  word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const match = word.match(/[aeiouy]{1,2}/g);
  return match ? match.length : 1;
}

// -------------------------------------------------------
// SEMANTIC PROFILE (Cloudflare)
// -------------------------------------------------------
async function extractSemanticProfile(text: string): Promise<SemanticProfile> {
  const prompt = `
Return ONLY JSON in this format:
{
  "intent": "",
  "audience": "",
  "emotion": "",
  "writingType": "",
  "formalityLevel": 5,
  "complexity": 5,
  "sentimentPolarity": 0,
  "keyTopics": [],
  "rhetoricalDevices": [],
  "voiceCharacteristics": []
}

Text:
${text.slice(0, 1000)}
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
              { role: "system", content: "Return STRICT JSON only." },
              { role: "user", content: prompt }
            ]
          })
        }
      );

      const raw = await response.text();
      const parsed = JSON.parse(raw);

      const output =
        parsed?.result?.response ||
        parsed?.result?.output ||
        parsed?.result?.message ||
        "";

      // Extract JSON inside markdown or as plain body
      const jsonMatch =
        output.match(/```json\s*([\s\S]*?)```/) ||
        output.match(/\{[\s\S]*\}/);

      if (!jsonMatch) continue;

      const obj = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (obj.intent) return obj as SemanticProfile;
    } catch {
      continue;
    }
  }

  return {
    intent: "inform",
    audience: "general",
    emotion: "neutral",
    writingType: "statement",
    formalityLevel: 5,
    complexity: 5,
    sentimentPolarity: 0,
    keyTopics: [],
    rhetoricalDevices: [],
    voiceCharacteristics: []
  };
}

// -------------------------------------------------------
// STRATEGY SYNTHESIS
// -------------------------------------------------------
function synthesizeRewriteStrategy(
  style: string,
  semantic: SemanticProfile,
  linguistic: LinguisticAnalysis,
  strictness: number
): RewriteStrategy {
  const base: RewriteStrategy = {
    approach: "Humanised rewrite with natural voice",
    focusAreas: ["Clarity", "Flow", "Engagement"],
    avoidances: ["Repetition", "AI tone", "Robotic transitions"],
    enhancements: ["Stronger verbs", "Better pacing", "Cleaner structure"],
    humanizationTechniques: [
      "Natural rhythm",
      "Conversational tone",
      "Varied sentence lengths"
    ]
  };

  if (strictness >= 4) {
    base.enhancements.push("Deep restructuring", "New narrative flow");
  }

  if (semantic.complexity >= 7) {
    base.focusAreas.push("Preserve precision");
  }

  if (linguistic.readabilityScore < 50) {
    base.enhancements.push("Simplify language", "Break long sentences");
  }

  return base;
}

// -------------------------------------------------------
// MASTER PROMPT
// -------------------------------------------------------
function buildPrompt(
  text: string,
  tone: string,
  strictness: number,
  context: string,
  strategy: RewriteStrategy,
  semantic: SemanticProfile,
  linguistic: LinguisticAnalysis
): string {
  return `
Rewrite the following text following these rules:

Tone: ${tone}
Strictness: ${strictness}/5
Approach: ${strategy.approach}

Avoid:
${strategy.avoidances.map(x => "- " + x).join("\n")}

Focus on:
${strategy.focusAreas.map(x => "- " + x).join("\n")}

Enhance with:
${strategy.enhancements.map(x => "- " + x).join("\n")}

Humanization:
${strategy.humanizationTechniques.map(x => "- " + x).join("\n")}

${context ? `Context: ${context}` : ""}

TEXT TO REWRITE:
${text}

Return ONLY the rewritten text. No explanation.
`;
}

// -------------------------------------------------------
// EXECUTION: CLOUDLARE
// -------------------------------------------------------
async function runCloudflare(prompt: string): Promise<string> {
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
              {
                role: "system",
                content: "You rewrite text. Return only the rewritten text."
              },
              { role: "user", content: prompt }
            ]
          })
        }
      );

      const raw = await response.text();
      const data = JSON.parse(raw);

      if (data.errors?.length) continue;

      const output =
        data?.result?.response || data?.result?.output || data?.result?.message;

      if (output && output.length > 10) return output.trim();
    } catch {}
  }

  throw new Error("Cloudflare failed");
}

// -------------------------------------------------------
// EXECUTION: CLAUDE
// -------------------------------------------------------
async function runClaude(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data?.content?.[0]?.text;

  if (!text) throw new Error("Claude returned empty output");

  return text.trim();
}

// -------------------------------------------------------
// WORD COUNT HELPER
// -------------------------------------------------------
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
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
    const {
      text,
      tone = "neutral",
      strictness = 1,
      model = "auto",
      context = "",
      style = "humanised",
      title = null
    } = body;

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: "Text required" });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Max length ${MAX_TEXT_LENGTH}`
      });
    }

    const [semantic, linguistic] = await Promise.all([
      extractSemanticProfile(text),
      Promise.resolve(analyzeLinguistics(text))
    ]);

    const strategy = synthesizeRewriteStrategy(
      style,
      semantic,
      linguistic,
      strictness
    );

    const prompt = buildPrompt(
      text,
      tone,
      strictness,
      context,
      strategy,
      semantic,
      linguistic
    );

    // ---------- Model Selection ----------
    let output = "";
    let selected = model;

    if (model === "auto") {
      selected =
        strictness >= 4 || text.length > 2500 ? "claude" : "cloudflare";
    }

    try {
      output =
        selected === "cloudflare" || selected === "cf"
          ? await runCloudflare(prompt)
          : await runClaude(prompt);
    } catch (err) {
      if ((selected === "cloudflare" || selected === "cf") && ANTHROPIC_API_KEY) {
        selected = "claude";
        output = await runClaude(prompt);
      } else if (selected === "claude" && CF_API_KEY) {
        selected = "cloudflare";
        output = await runCloudflare(prompt);
      } else {
        throw err;
      }
    }

    // ---------- Save to Database & Deduct Credits ----------
    const wordCount = countWords(output);
    
    try {
      // Ensure user exists in database
      const userRecord = await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
          credits: 50000, // Default starting credits
        },
      });

      // Check if user has enough credits
      if (userRecord.credits < wordCount) {
        return NextResponse.json({
          success: false,
          error: `Insufficient credits. You need ${wordCount} credits but only have ${userRecord.credits}.`
        }, { status: 403 });
      }

      // Deduct credits and create rewrite record in a transaction
      await prisma.$transaction([
        // Deduct credits
        prisma.user.update({
          where: { id: user.id },
          data: {
            credits: {
              decrement: wordCount
            }
          }
        }),
        // Create rewrite record
        prisma.rewrite.create({
          data: {
            userId: user.id,
            title: title,
            modelType: selected,
            inputText: text,
            outputText: output,
            wordCount: wordCount,
          },
        })
      ]);

      const newCredits = userRecord.credits - wordCount;
      console.log(`✅ Saved rewrite for user ${user.id}: ${wordCount} words used, ${newCredits} credits remaining`);
    } catch (dbError) {
      console.error('Database save error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save rewrite or deduct credits'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      output,
      metadata: {
        model: selected,
        formality: semantic.formalityLevel,
        readability: linguistic.readabilityScore,
        wordCount: wordCount,
      }
    });
  } catch (err: any) {
    console.error('Rewrite error:', err);
    return NextResponse.json(
      { success: false, error: err.message || "Rewrite failed" },
      { status: 500 }
    );
  }
}