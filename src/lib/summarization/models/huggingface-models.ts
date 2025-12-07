/**
 * Advanced Transformer Models Integration
 * Implements BART, T5, and Pegasus models as specified in the document
 */

import type { SummarizationConfig, SummaryResult } from '../types';

// Hugging Face Inference API configuration
const HF_API_BASE = 'https://api-inference.huggingface.co/models';

// Model configurations as per document specifications
export const ADVANCED_MODELS = {
  // BART models (Bidirectional Auto-Regressive Transformer)
  'facebook/bart-large-cnn': {
    type: 'abstractive' as const,
    description: 'High-quality abstractive summarization',
    maxLength: 1024,
    optimalInput: 512,
    cost: 0.001, // per request
    quality: 0.9,
    speed: 0.7
  },
  'facebook/bart-base': {
    type: 'abstractive' as const,
    description: 'Balanced quality and speed',
    maxLength: 512,
    optimalInput: 256,
    cost: 0.0008,
    quality: 0.8,
    speed: 0.8
  },

  // T5 models (Text-to-Text Transfer Transformer)
  't5-base': {
    type: 'abstractive' as const,
    description: 'Versatile text-to-text generation',
    maxLength: 512,
    optimalInput: 256,
    cost: 0.0009,
    quality: 0.85,
    speed: 0.75
  },
  't5-small': {
    type: 'abstractive' as const,
    description: 'Fast, lightweight T5 variant',
    maxLength: 256,
    optimalInput: 128,
    cost: 0.0006,
    quality: 0.7,
    speed: 0.9
  },

  // Pegasus models (Pre-training with Extracted Gap-sentences)
  'google/pegasus-xsum': {
    type: 'abstractive' as const,
    description: 'Optimized for extreme summarization',
    maxLength: 64,
    optimalInput: 512,
    cost: 0.0012,
    quality: 0.95,
    speed: 0.6
  },
  'google/pegasus-large': {
    type: 'abstractive' as const,
    description: 'High-quality Pegasus model',
    maxLength: 256,
    optimalInput: 512,
    cost: 0.001,
    quality: 0.9,
    speed: 0.7
  },

  // Distilled models for optimization (as mentioned in document)
  'sshleifer/distilbart-cnn-6-6': {
    type: 'abstractive' as const,
    description: 'Distilled BART - 2x faster than BART-large',
    maxLength: 256,
    optimalInput: 256,
    cost: 0.0005,
    quality: 0.75,
    speed: 0.95
  }
} as const;

export type ModelId = keyof typeof ADVANCED_MODELS;

/**
 * Select optimal model based on configuration and constraints
 */
export function selectOptimalModel(config: SummarizationConfig, inputLength: number): ModelId {
  const { mode, quality } = config;

  // For extractive mode, we don't use these models
  if (mode === 'extractive') {
    throw new Error('Advanced transformer models are for abstractive summarization only');
  }

  // Filter models by type
  const candidates = Object.entries(ADVANCED_MODELS)
    .filter(([_, model]) => model.type === mode)
    .map(([id, model]) => ({ id: id as ModelId, ...model }));

  if (candidates.length === 0) {
    throw new Error(`No models available for mode: ${mode}`);
  }

  // Score candidates based on quality preference and input length
  const scored = candidates.map(model => {
    let score = 0;

    // Quality preference (0-40 points)
    if (quality === 'premium') {
      score += model.quality * 40;
    } else if (quality === 'standard') {
      score += model.quality * 30 + model.speed * 10;
    } else { // creative
      score += model.quality * 20 + model.speed * 20;
    }

    // Input length compatibility (0-30 points)
    const lengthRatio = inputLength / model.optimalInput;
    if (lengthRatio <= 1.5 && lengthRatio >= 0.5) {
      score += 30;
    } else if (lengthRatio <= 2 && lengthRatio >= 0.3) {
      score += 20;
    } else {
      score += 10;
    }

    // Cost efficiency (0-30 points) - prefer cheaper models
    score += (1 - model.cost / 0.0012) * 30;

    return { ...model, score };
  });

  // Return highest scoring model
  scored.sort((a, b) => b.score - a.score);
  return scored[0].id;
}

/**
 * Sanitize text to fix malformed escape sequences
 */
function sanitizeText(text: string): string {
  // Replace incomplete escape sequences with escaped versions
  return text
    // Fix incomplete \u sequences (must have 4 hex digits)
    .replace(/\\u([0-9a-fA-F]{0,3})(?![0-9a-fA-F])/g, '\\\\u$1')
    // Fix incomplete \x sequences (must have 2 hex digits)
    .replace(/\\x([0-9a-fA-F]{0,1})(?![0-9a-fA-F])/g, '\\\\x$1')
    // Fix lone backslashes at end of string
    .replace(/\\$/, '\\\\');
}

/**
 * Safely truncate text without breaking escape sequences or Unicode characters
 */
function safeTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  let truncated = text.substring(0, maxLength);
  
  // Check for incomplete escape sequences (e.g., \u, \x at the end)
  const lastBackslash = truncated.lastIndexOf('\\');
  if (lastBackslash > truncated.length - 6) {
    truncated = truncated.substring(0, lastBackslash);
  }
  
  // Check for incomplete UTF-16 surrogate pairs
  const lastChar = truncated.charCodeAt(truncated.length - 1);
  if (lastChar >= 0xD800 && lastChar <= 0xDBFF) {
    truncated = truncated.substring(0, truncated.length - 1);
  }
  
  return truncated;
}

/**
 * Generate abstractive summary using advanced transformer models
 */
export async function generateAbstractiveSummary(
  text: string,
  config: SummarizationConfig,
  modelId: ModelId,
  apiKey?: string
): Promise<SummaryResult> {
  const startTime = Date.now();
  const model = ADVANCED_MODELS[modelId];

  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  // Prepare input text (truncate if too long)
  let processedText = sanitizeText(text); // Sanitize first to fix malformed escapes
  
  if (processedText.length > model.maxLength) {
    const keepStart = Math.floor(model.maxLength * 0.7);
    const keepEnd = Math.floor(model.maxLength * 0.3);
    
    // Use safe truncation to avoid breaking escape sequences
    const startPart = safeTruncate(processedText, keepStart);
    const endPart = processedText.substring(Math.max(0, processedText.length - keepEnd));
    
    processedText = startPart + '\n...[truncated]...\n' + endPart;
  }

  // Build prompt based on tone (as per document)
  const prompt = buildPrompt(processedText, config);

  try {
    // Call Hugging Face Inference API
    const response = await callHuggingFaceAPI(modelId, prompt, {
      max_length: config.maxLength || 150,
      min_length: config.minLength || 50,
      temperature: 0.7,
      do_sample: true,
      top_k: 50,
      top_p: 0.95
    }, apiKey);

    const summary = response.generated_text || response.summary || response[0]?.generated_text;

    if (!summary) {
      throw new Error('No summary generated by model');
    }

    // Post-process as per document
    const processedSummary = postProcessSummary(summary, config);

    return {
      summary: processedSummary,
      method: 'abstractive',
      config,
      metrics: {
        compressionRatio: calculateCompressionRatio(text, processedSummary),
        wordCount: countWords(processedSummary),
        sentenceCount: countSentences(processedSummary),
        readabilityScore: calculateFleschKincaid(processedSummary),
        coherence: 0.8, // Placeholder - would need advanced calculation
        rouge1: calculateSimpleRouge(text, processedSummary)
      },
      processingTime: Date.now() - startTime,
      confidence: response.confidence || 0.8
    };

  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error(`Model generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call Hugging Face Inference API
 */
interface HuggingFaceParameters {
  max_length?: number;
  min_length?: number;
  temperature?: number;
  do_sample?: boolean;
  top_k?: number;
  top_p?: number;
  repetition_penalty?: number;
  length_penalty?: number;
}

interface HuggingFaceResponse {
  generated_text?: string;
  summary?: string;
  confidence?: number;
  [key: string]: unknown;
}

type HuggingFaceAPIResponse = HuggingFaceResponse | HuggingFaceResponse[];

async function callHuggingFaceAPI(
  modelId: string,
  inputs: string,
  parameters: HuggingFaceParameters,
  apiKey?: string
): Promise<HuggingFaceAPIResponse> {
  const HF_TOKEN = apiKey || process.env.HUGGINGFACE_API_KEY;

  if (!HF_TOKEN) {
    throw new Error('Hugging Face API key not configured');
  }

  const response = await fetch(`${HF_API_BASE}/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs,
      parameters,
      options: {
        wait_for_model: true,
        use_cache: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Build prompt based on tone (as per document)
 */
function buildPrompt(text: string, config: SummarizationConfig): string {
  const { tone } = config;

  let prefix = '';
  switch (tone) {
    case 'formal':
      prefix = 'Provide a formal, professional summary of the following text:';
      break;
    case 'casual':
      prefix = 'Summarize this text in simple, everyday language:';
      break;
    case 'academic':
      prefix = 'Provide an academic summary of the following text:';
      break;
    case 'simple':
      prefix = 'Summarize this in very simple terms:';
      break;
    default:
      prefix = 'Summarize the following text:';
  }

  return `${prefix}\n\n${text}\n\nSummary:`;
}

/**
 * Post-process summary (as per document)
 */
function postProcessSummary(summary: string, config: SummarizationConfig): string {
  let processed = summary.trim();

  // Remove redundant sentences (basic implementation)
  const sentences = processed.split(/[.!?]+/).filter(s => s.trim().length > 10);
  processed = sentences.slice(0, 5).join('. ') + '.'; // Limit to 5 sentences

  // Enforce length constraints
  if (config.maxLength && processed.length > config.maxLength) {
    processed = processed.substring(0, config.maxLength).trim();
    // Try to end at sentence boundary
    const lastPeriod = processed.lastIndexOf('.');
    if (lastPeriod > processed.length * 0.8) {
      processed = processed.substring(0, lastPeriod + 1);
    }
  }

  return processed;
}

/**
 * Utility functions (simplified implementations)
 */
function calculateCompressionRatio(original: string, summary: string): number {
  return countWords(summary) / countWords(original);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function calculateFleschKincaid(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);
  if (words === 0 || sentences === 0) return 0;

  // Simplified Flesch-Kincaid calculation
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (text.length / words / 5);
}

function calculateSimpleRouge(original: string, summary: string): number {
  // Very simplified ROUGE-1 approximation
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const summaryWords = new Set(summary.toLowerCase().split(/\s+/));

  const intersection = new Set([...originalWords].filter(x => summaryWords.has(x)));
  return intersection.size / originalWords.size;
}