/**
 * Post-Processing Service
 * Polishes and refines generated summaries
 */

import type { SummaryResult, SummarizationConfig } from './types';

export class PostProcessor {
  /**
   * Process and polish a summary
   */
  async processSummary(summary: SummaryResult, config: SummarizationConfig): Promise<SummaryResult> {
    let processedSummary = summary.summary;

    // Apply post-processing steps in order
    processedSummary = this.enforceLengthConstraints(processedSummary, config);
    processedSummary = this.fixGrammarAndFluency(processedSummary);
    processedSummary = this.removeRedundancy(processedSummary);
    processedSummary = this.resolveCoReferences(processedSummary);
    processedSummary = this.formatOutput(processedSummary, config);

    // Update metrics
    const updatedMetrics = {
      ...summary.metrics,
      wordCount: this.countWords(processedSummary),
      sentenceCount: this.countSentences(processedSummary),
    };

    return {
      ...summary,
      summary: processedSummary,
      metrics: updatedMetrics,
    };
  }

  /**
   * Enforce length constraints
   */
  private enforceLengthConstraints(text: string, config: SummarizationConfig): string {
    const words = text.split(/\s+/);
    const currentLength = words.length;

    // Check max length
    if (config.maxLength && currentLength > config.maxLength) {
      return this.truncateAtSentence(text, config.maxLength);
    }

    // Check min length
    if (config.minLength && currentLength < config.minLength) {
      // For now, just return as-is. In production, could expand.
      return text;
    }

    return text;
  }

  /**
   * Truncate text at sentence boundary near target length
   */
  private truncateAtSentence(text: string, targetWords: number): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    let wordCount = 0;
    let result = '';

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      if (wordCount + sentenceWords > targetWords) {
        break;
      }
      result += sentence.trim() + '. ';
      wordCount += sentenceWords;
    }

    return result.trim();
  }

  /**
   * Fix basic grammar and fluency issues
   */
  private fixGrammarAndFluency(text: string): string {
    let processed = text;

    // Fix common spacing issues
    processed = processed.replace(/\s+/g, ' ');
    processed = processed.replace(/\s*\.\s*/g, '. ');
    processed = processed.replace(/\s*\,\s*/g, ', ');

    // Fix capitalization
    processed = this.fixCapitalization(processed);

    // Remove extra punctuation
    processed = processed.replace(/([.!?]){2,}/g, '$1');

    // Fix common contractions and spacing
    processed = processed.replace(/\s+'t\b/g, "'t");
    processed = processed.replace(/\s+'s\b/g, "'s");
    processed = processed.replace(/\s+'re\b/g, "'re");

    return processed.trim();
  }

  /**
   * Fix sentence capitalization
   */
  private fixCapitalization(text: string): string {
    return text.replace(/(?:^|[.!?]\s*)(\w)/g, (match, firstLetter) => {
      return match.replace(firstLetter, firstLetter.toUpperCase());
    });
  }

  /**
   * Remove redundant sentences and phrases
   */
  private removeRedundancy(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length <= 1) return text;

    const uniqueSentences: string[] = [];
    const seen = new Set<string>();

    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().trim();

      // Simple similarity check - in production use embeddings
      const isDuplicate = Array.from(seen).some(existing =>
        this.calculateSimilarity(normalized, existing) > 0.8
      );

      if (!isDuplicate) {
        uniqueSentences.push(sentence.trim());
        seen.add(normalized);
      }
    }

    return uniqueSentences.join('. ') + (uniqueSentences.length > 0 ? '.' : '');
  }

  /**
   * Simple similarity calculation for redundancy detection
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Resolve co-references (simplified)
   */
  private resolveCoReferences(text: string): string {
    // Basic pronoun resolution - in production use NLP libraries
    const processed = text;

    // Simple patterns for common cases
    const patterns = [
      // Replace "it" with potential antecedents when clear
      // This is very basic - real co-reference resolution is complex
    ];

    // For now, just ensure pronoun consistency
    return processed;
  }

  /**
   * Format output based on configuration
   */
  private formatOutput(text: string, config: SummarizationConfig): string {
    // For now, just return the text
    // Could add bullet points, numbered lists, etc. based on config
    return text;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count sentences in text
   */
  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }

  /**
   * Advanced post-processing with AI assistance
   */
  async enhanceWithAI(summary: SummaryResult, config: SummarizationConfig): Promise<SummaryResult> {
    // This would use AI to further improve the summary
    // For example, call a model to rephrase awkward sentences

    const prompt = `Please improve the fluency and clarity of this summary while maintaining its meaning:

${summary.summary}

Improved summary:`;

    try {
      // This would call an AI model
      // const enhanced = await callAIModel(prompt, config);
      // For now, return original
      return summary;
    } catch (error) {
      console.warn('AI enhancement failed, returning original:', error);
      return summary;
    }
  }

  /**
   * Validate summary quality
   */
  validateQuality(summary: SummaryResult): {
    isValid: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 1.0;

    // Check length
    if (summary.metrics.wordCount < 10) {
      issues.push('Summary too short');
      score -= 0.3;
    }

    // Check coherence
    if (summary.metrics.coherence && summary.metrics.coherence < 0.3) {
      issues.push('Low coherence detected');
      score -= 0.2;
    }

    // Check readability
    if (summary.metrics.readability < 30) {
      issues.push('Readability score too low');
      score -= 0.1;
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score),
    };
  }
}