/**
 * Metrics calculation utilities for summarization evaluation
 */

import type { SummaryMetrics } from '../types';

/**
 * Calculate compression ratio between original and summary
 */
export function calculateCompressionRatio(originalText: string, summaryText: string): number {
  const originalWords = countWords(originalText);
  const summaryWords = countWords(summaryText);
  return summaryWords / originalWords;
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count sentences in text
 */
export function countSentences(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  // Simple sentence splitting - can be enhanced with NLP libraries
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Calculate Flesch-Kincaid readability score
 */
export function calculateFleschKincaid(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countSyllables(text);

  if (words === 0 || sentences === 0) return 0;

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.max(0, Math.min(20, grade)); // Clamp between 0-20
}

/**
 * Simple syllable counting (approximate)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let syllables = 0;

  for (const word of words) {
    if (word.length <= 3) {
      syllables += 1;
    } else {
      // Count vowel groups
      const vowels = word.match(/[aeiouy]+/g);
      syllables += vowels ? vowels.length : 1;
    }
  }

  return syllables;
}

/**
 * Calculate semantic similarity using simple word overlap
 * In production, this would use embeddings
 */
export function calculateSemanticSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Calculate coherence score based on sentence transitions
 */
export function calculateCoherence(sentences: string[]): number {
  if (sentences.length <= 1) return 1.0;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < sentences.length - 1; i++) {
    const similarity = calculateSemanticSimilarity(sentences[i], sentences[i + 1]);
    totalSimilarity += similarity;
    comparisons++;
  }

  return totalSimilarity / comparisons;
}

/**
 * Create comprehensive metrics for a summary
 */
export function createSummaryMetrics(
  originalText: string,
  summaryText: string,
  processingTime: number
): SummaryMetrics {
  return {
    compressionRatio: calculateCompressionRatio(originalText, summaryText),
    wordCount: countWords(summaryText),
    sentenceCount: countSentences(summaryText),
    readability: calculateFleschKincaid(summaryText),
    coherence: calculateCoherence(summaryText.split(/[.!?]+/).filter(s => s.trim())),
    // ROUGE, BLEU, and other advanced metrics would be calculated here
    // For now, using simplified versions
    rouge1: calculateSemanticSimilarity(originalText, summaryText),
    semanticSimilarity: calculateSemanticSimilarity(originalText, summaryText),
  };
}