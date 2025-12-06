/**
 * Smart Prompt Builder - Contextual Injection Engine
 *
 * This module constructs intelligent prompts by combining user intent,
 * linguistic analysis results, and style samples into optimized prompts
 * for LLM processing.
 */

import type { TextStats } from './1_FastAnalyzer';

export type RewriteRequest = {
  text: string;           // The text to be processed
  intent: 'humanize' | 'summarize' | 'expand' | 'simplify' | 'grammar';
  targetTone: string;     // e.g., 'professional', 'casual', 'assertive'
  targetLength: 'short' | 'medium' | 'long';
  // Mock for RAG retrieval: Assume RAG retrieves these samples
  styleSamples: string[]; // Few-shot examples of user's preferred writing style
};

/**
 * Builds an intelligent prompt by combining intent, diagnosis, and style DNA.
 * Uses the linguistic stats to provide specific, actionable instructions to the LLM.
 *
 * @param request - The rewrite request with user specifications
 * @param stats - Linguistic analysis results from FastAnalyzer
 * @returns Optimized prompt string for LLM processing
 */
export function buildIntelligentPrompt(request: RewriteRequest, stats: TextStats): string {
  // System prompt establishes the LLM's role
  const systemPrompt = `You are an Expert Human Editor with 20+ years of professional writing experience.
Your task is to rewrite the provided text according to the user's specifications.
You excel at maintaining the author's voice while improving clarity, flow, and impact.

CRITICAL INSTRUCTIONS:
- Output ONLY the rewritten text - no explanations, no meta-commentary
- Preserve the core meaning and key information
- Maintain factual accuracy
- Adapt to the specified tone and intent
- Follow the style examples provided as your writing DNA`;

  // Build user prompt with three key components
  let userPrompt = '';

  // 1. INTENT: Primary task specification
  userPrompt += `PRIMARY TASK: ${getIntentDescription(request.intent)}\n\n`;

  // 2. DIAGNOSIS: Specific instructions based on linguistic analysis
  userPrompt += `CONTENT ANALYSIS & REQUIREMENTS:\n`;
  userPrompt += getDiagnosisInstructions(stats);
  userPrompt += `\n`;

  // 3. STYLE DNA: Few-shot examples from user's writing style
  if (request.styleSamples && request.styleSamples.length > 0) {
    userPrompt += `WRITING STYLE DNA (ADHERE TO THIS VOICE):\n`;
    request.styleSamples.forEach((sample, index) => {
      userPrompt += `Example ${index + 1}: "${sample}"\n`;
    });
    userPrompt += `\n`;
  }

  // 4. Tone and length specifications
  userPrompt += `TONE: ${request.targetTone}\n`;
  userPrompt += `LENGTH: ${getLengthDescription(request.targetLength)}\n\n`;

  // 5. Original text to rewrite
  userPrompt += `ORIGINAL TEXT TO REWRITE:\n${request.text}\n\n`;

  // 6. Final instruction
  userPrompt += `REWRITTEN TEXT:`;

  return `${systemPrompt}\n\n---\n\n${userPrompt}`;
}

/**
 * Converts intent enum to human-readable description
 */
function getIntentDescription(intent: RewriteRequest['intent']): string {
  const descriptions = {
    humanize: 'Transform this text to sound more natural and human-written, reducing any robotic or AI-like qualities',
    summarize: 'Condense this text while preserving all key information and main points',
    expand: 'Elaborate on this text by adding relevant details, examples, and explanations while maintaining the core message',
    simplify: 'Make this text easier to understand by using simpler words and clearer sentence structures',
    grammar: 'Fix grammatical errors, improve sentence structure, and enhance overall writing quality'
  };

  return descriptions[intent];
}

/**
 * Generates specific diagnosis instructions based on linguistic analysis
 */
function getDiagnosisInstructions(stats: TextStats): string {
  const instructions: string[] = [];

  // Passive voice diagnosis
  if (stats.passiveScore > 20) {
    instructions.push(`CRITICAL: Drastically reduce passive voice from ${stats.passiveScore.toFixed(1)}% to below 5%. Convert passive constructions to active voice.`);
  } else if (stats.passiveScore > 10) {
    instructions.push(`MODERATE: Reduce passive voice from ${stats.passiveScore.toFixed(1)}% to improve engagement.`);
  }

  // Sentence variance diagnosis
  if (stats.sentenceVariance < 20) {
    instructions.push(`CRITICAL: Add significant sentence length variation. Current variance (${stats.sentenceVariance.toFixed(1)}) is too uniform. Mix short, medium, and long sentences for natural rhythm.`);
  } else if (stats.sentenceVariance < 40) {
    instructions.push(`MODERATE: Increase sentence variety. Current variance (${stats.sentenceVariance.toFixed(1)}) could be more dynamic.`);
  }

  // Jargon density diagnosis
  if (stats.jargonDensity > 30) {
    instructions.push(`MODERATE: Reduce complex vocabulary density from ${stats.jargonDensity.toFixed(1)}%. Use simpler alternatives where appropriate while maintaining accuracy.`);
  } else if (stats.jargonDensity < 5) {
    instructions.push(`OPTIONAL: Consider adding some precise terminology if the subject matter warrants it. Current density: ${stats.jargonDensity.toFixed(1)}%.`);
  }

  // Combine instructions
  if (instructions.length === 0) {
    return 'Text analysis shows good balance. Maintain current quality while applying the primary task.';
  }

  return instructions.join(' ');
}

/**
 * Converts length enum to descriptive instruction
 */
function getLengthDescription(length: RewriteRequest['targetLength']): string {
  const descriptions = {
    short: 'Significantly shorter - remove redundancies and focus on essentials',
    medium: 'Approximately same length - maintain balance between conciseness and completeness',
    long: 'Expanded version - add relevant details, examples, and explanations'
  };

  return descriptions[length];
}