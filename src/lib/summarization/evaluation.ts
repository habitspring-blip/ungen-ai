/**
 * Evaluation Metrics for Summarization Quality Assessment
 * Implements ROUGE, semantic similarity, coherence, and other quality metrics
 */

import type { EvaluationResult, SummaryResult } from './types';

export class EvaluationEngine {
  /**
   * Comprehensive evaluation of summary quality
   */
  async evaluateSummary(
    originalText: string,
    summary: string,
    referenceSummary?: string
  ): Promise<EvaluationResult> {
    // ROUGE scores (if reference available)
    const rougeScores = referenceSummary
      ? this.calculateROUGE(summary, referenceSummary)
      : { rouge1: 0, rouge2: 0, rougeL: 0 };

    // BLEU score (if reference available)
    const bleu = referenceSummary ? this.calculateBLEU(summary, referenceSummary) : 0;

    // Semantic similarity
    const semanticSimilarity = await this.calculateSemanticSimilarity(originalText, summary);

    // Coherence score
    const coherence = this.calculateCoherence(summary);

    // Compression ratio
    const compressionRatio = originalText.length > 0 ? summary.length / originalText.length : 0;

    // Entity preservation
    const entityPreservation = this.calculateEntityPreservation(originalText, summary);

    // Factual consistency
    const factualConsistency = await this.checkFactualConsistency(originalText, summary);

    // Overall score (weighted combination)
    const overallScore = this.calculateOverallScore({
      rouge1: rougeScores.rouge1,
      rouge2: rougeScores.rouge2,
      rougeL: rougeScores.rougeL,
      bleu,
      semanticSimilarity,
      coherence,
      compressionRatio,
      entityPreservation,
      factualConsistency
    });

    return {
      rouge1: rougeScores.rouge1,
      rouge2: rougeScores.rouge2,
      rougeL: rougeScores.rougeL,
      bleu,
      semanticSimilarity,
      coherence,
      compressionRatio,
      entityPreservation,
      factualConsistency,
      overallScore
    };
  }

  /**
   * Calculate ROUGE scores (Recall-Oriented Understudy for Gisting Evaluation)
   */
  private calculateROUGE(summary: string, reference: string): { rouge1: number; rouge2: number; rougeL: number } {
    const summaryTokens = this.tokenizeForROUGE(summary);
    const referenceTokens = this.tokenizeForROUGE(reference);

    const rouge1 = this.calculateROUGEScore(summaryTokens, referenceTokens, 1);
    const rouge2 = this.calculateROUGEScore(summaryTokens, referenceTokens, 2);
    const rougeL = this.calculateROUGEL(summaryTokens, referenceTokens);

    return { rouge1, rouge2, rougeL };
  }

  /**
   * Calculate ROUGE-N score
   */
  private calculateROUGEScore(summaryTokens: string[], referenceTokens: string[], n: number): number {
    const summaryNGrams = this.generateNGrams(summaryTokens, n);
    const referenceNGrams = this.generateNGrams(referenceTokens, n);

    if (summaryNGrams.size === 0) return 0;

    let matches = 0;
    for (const ngram of summaryNGrams) {
      if (referenceNGrams.has(ngram)) {
        matches++;
      }
    }

    return matches / summaryNGrams.size;
  }

  /**
   * Calculate ROUGE-L (Longest Common Subsequence)
   */
  private calculateROUGEL(summaryTokens: string[], referenceTokens: string[]): number {
    const lcsLength = this.longestCommonSubsequence(summaryTokens, referenceTokens);
    return summaryTokens.length > 0 ? lcsLength / summaryTokens.length : 0;
  }

  /**
   * Calculate BLEU score
   */
  private calculateBLEU(candidate: string, reference: string): number {
    const candidateTokens = candidate.toLowerCase().split(/\s+/);
    const referenceTokens = reference.toLowerCase().split(/\s+/);

    // Simple BLEU implementation (unigram precision)
    const candidateSet = new Set(candidateTokens);
    let matches = 0;

    for (const token of candidateSet) {
      if (referenceTokens.includes(token)) {
        matches++;
      }
    }

    const precision = candidateSet.size > 0 ? matches / candidateSet.size : 0;

    // Brevity penalty
    const bp = candidateTokens.length <= referenceTokens.length ? 1 :
               Math.exp(1 - referenceTokens.length / candidateTokens.length);

    return bp * precision;
  }

  /**
   * Calculate semantic similarity using embeddings
   */
  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    // Simple TF-IDF based similarity as fallback
    // In production, this would use sentence transformers
    const tokens1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const tokens2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Calculate coherence score
   */
  private calculateCoherence(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 1) return 1.0;

    let coherenceScore = 0;
    let pairCount = 0;

    for (let i = 0; i < sentences.length - 1; i++) {
      const sentence1 = sentences[i];
      const sentence2 = sentences[i + 1];

      // Simple coherence based on word overlap
      const words1 = new Set(sentence1.toLowerCase().split(/\s+/));
      const words2 = new Set(sentence2.toLowerCase().split(/\s+/));

      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);

      const similarity = intersection.size / union.size;
      coherenceScore += similarity;
      pairCount++;
    }

    return pairCount > 0 ? coherenceScore / pairCount : 1.0;
  }

  /**
   * Calculate entity preservation score
   */
  private calculateEntityPreservation(originalText: string, summary: string): number {
    // Simple entity extraction (capitalized words)
    const extractEntities = (text: string): string[] => {
      const words = text.split(/\s+/);
      return words.filter(word =>
        word.length > 2 &&
        word[0] === word[0].toUpperCase() &&
        !['The', 'A', 'An', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For', 'Of', 'With', 'By'].includes(word)
      );
    };

    const originalEntities = new Set(extractEntities(originalText));
    const summaryEntities = new Set(extractEntities(summary));

    if (originalEntities.size === 0) return 1.0;

    const preservedEntities = new Set([...originalEntities].filter(entity => summaryEntities.has(entity)));
    return preservedEntities.size / originalEntities.size;
  }

  /**
   * Check factual consistency
   */
  private async checkFactualConsistency(originalText: string, summary: string): Promise<number> {
    // Simple factual consistency check
    // In production, this would use QA models or factual verification

    // Extract key facts from original (simplified)
    const originalFacts = this.extractKeyFacts(originalText);
    const summaryFacts = this.extractKeyFacts(summary);

    if (originalFacts.length === 0) return 1.0;

    let consistentFacts = 0;
    for (const fact of summaryFacts) {
      if (originalFacts.some(of => this.factsMatch(fact, of))) {
        consistentFacts++;
      }
    }

    return consistentFacts / summaryFacts.length;
  }

  /**
   * Calculate overall evaluation score
   */
  private calculateOverallScore(metrics: {
    rouge1: number;
    rouge2: number;
    rougeL: number;
    bleu: number;
    semanticSimilarity: number;
    coherence: number;
    compressionRatio: number;
    entityPreservation: number;
    factualConsistency: number;
  }): number {
    // Weighted combination of all metrics
    const weights = {
      rouge1: 0.15,
      rouge2: 0.15,
      rougeL: 0.10,
      bleu: 0.10,
      semanticSimilarity: 0.20,
      coherence: 0.10,
      compressionRatio: 0.05, // Optimal compression (not too short/long)
      entityPreservation: 0.10,
      factualConsistency: 0.05
    };

    // Normalize compression ratio (optimal around 0.2-0.4)
    const normalizedCompression = Math.max(0, 1 - Math.abs(metrics.compressionRatio - 0.3) * 2);

    const score = (
      weights.rouge1 * metrics.rouge1 +
      weights.rouge2 * metrics.rouge2 +
      weights.rougeL * metrics.rougeL +
      weights.bleu * metrics.bleu +
      weights.semanticSimilarity * metrics.semanticSimilarity +
      weights.coherence * metrics.coherence +
      weights.compressionRatio * normalizedCompression +
      weights.entityPreservation * metrics.entityPreservation +
      weights.factualConsistency * metrics.factualConsistency
    );

    return Math.min(Math.max(score, 0), 1); // Clamp to [0, 1]
  }

  /**
   * Tokenize text for ROUGE evaluation
   */
  private tokenizeForROUGE(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Generate n-grams from tokens
   */
  private generateNGrams(tokens: string[], n: number): Set<string> {
    const ngrams = new Set<string>();
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(' ');
      ngrams.add(ngram);
    }
    return ngrams;
  }

  /**
   * Calculate longest common subsequence
   */
  private longestCommonSubsequence(tokens1: string[], tokens2: string[]): number {
    const m = tokens1.length;
    const n = tokens2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokens1[i - 1] === tokens2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Extract key facts from text (simplified)
   */
  private extractKeyFacts(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    // Return first few sentences as "facts"
    return sentences.slice(0, Math.min(3, sentences.length));
  }

  /**
   * Check if two facts match (simplified)
   */
  private factsMatch(fact1: string, fact2: string): boolean {
    const words1 = new Set(fact1.toLowerCase().split(/\s+/));
    const words2 = new Set(fact2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size > 0.5; // 50% overlap
  }

  /**
   * Evaluate summary against multiple references
   */
  async evaluateAgainstMultipleReferences(
    originalText: string,
    summary: string,
    referenceSummaries: string[]
  ): Promise<EvaluationResult> {
    if (referenceSummaries.length === 0) {
      return this.evaluateSummary(originalText, summary);
    }

    // Evaluate against each reference and take the best score
    const evaluations = await Promise.all(
      referenceSummaries.map(ref => this.evaluateSummary(originalText, summary, ref))
    );

    // Return the best evaluation
    return evaluations.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    );
  }
}