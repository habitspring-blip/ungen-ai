/**
 * Fast Linguistic Analyzer - CPU-Bound Text Analysis
 *
 * This module provides high-performance, synchronous text analysis using
 * regular expressions and basic string manipulation. No LLM calls are made here.
 *
 * Optimized for speed and efficiency to support real-time analysis.
 */

export type TextStats = {
  passiveScore: number;     // 0-100. % of sentences in passive voice
  sentenceVariance: number; // Low score = robotic, High score = human-like rhythm
  jargonDensity: number;    // % of specialized/complex words
};

/**
 * Analyzes text linguistically using CPU-bound operations only.
 * Returns three key metrics for intelligent prompt engineering.
 *
 * @param text - The input text to analyze
 * @returns TextStats object with passiveScore, sentenceVariance, and jargonDensity
 */
export function getLinguisticStats(text: string): TextStats {
  if (!text || text.trim().length === 0) {
    return {
      passiveScore: 0,
      sentenceVariance: 0,
      jargonDensity: 0
    };
  }

  // Split into sentences (basic sentence boundary detection)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  if (sentences.length === 0 || words.length === 0) {
    return {
      passiveScore: 0,
      sentenceVariance: 0,
      jargonDensity: 0
    };
  }

  // 1. PASSIVE VOICE SCORE (0-100)
  // Look for passive voice indicators: "is/are/was/were + past participle"
  const passiveIndicators = text.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi) || [];
  const passiveScore = Math.min((passiveIndicators.length / sentences.length) * 100, 100);

  // 2. SENTENCE VARIANCE (0-100)
  // Measure sentence length variation (human writing has more variance)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;

  // Calculate variance (standard deviation normalized)
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // Normalize to 0-100 scale (higher variance = more human-like)
  const sentenceVariance = Math.min((stdDev / avgLength) * 100, 100);

  // 3. JARGON DENSITY (0-100)
  // Count words with 3+ syllables or technical indicators
  const syllablesPerWord = words.map(word => estimateSyllables(word.toLowerCase()));
  const complexWords = syllablesPerWord.filter(syllables => syllables >= 3).length;
  const jargonDensity = (complexWords / words.length) * 100;

  return {
    passiveScore: Math.round(passiveScore * 100) / 100, // Round to 2 decimal places
    sentenceVariance: Math.round(sentenceVariance * 100) / 100,
    jargonDensity: Math.round(jargonDensity * 100) / 100
  };
}

/**
 * Estimates syllable count for a word using vowel patterns.
 * Simple heuristic optimized for performance.
 *
 * @param word - The word to analyze
 * @returns Estimated syllable count
 */
function estimateSyllables(word: string): number {
  if (!word || word.length === 0) return 0;

  // Remove common endings that don't count as syllables
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups (simplified syllable counting)
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}