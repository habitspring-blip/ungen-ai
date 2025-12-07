/**
 * Hybrid/Abstractive Summary Pipeline
 * Combines extractive draft + AI-assisted abstractive rewriting + polishing
 */

import type { SummaryResult, SummarizationConfig } from './types';
import { callLLM, getEmbeddings, cosineSimilarity } from './ai-utils';
import { resolveCoreferences } from './coref-utils';

export class HybridPostProcessor {
  /**
   * Main entry point
   */
  async process(summary: SummaryResult, config: SummarizationConfig): Promise<SummaryResult> {
    // Step 1: Enforce basic length constraints
    let processed = this.enforceLength(summary.summary, config);

    // Step 2: Remove simple redundancies
    processed = this.removeSimpleRedundancy(processed);

    // Step 3: Resolve co-references for clarity
    processed = await resolveCoreferences(processed);

    // Step 4: Generate semantic embedding vector
    const sentenceEmbeddings = await getEmbeddings(processed);

    // Step 5: Remove semantic duplicates
    processed = this.removeSemanticRedundancy(processed, sentenceEmbeddings, 0.85);

    // Step 6: Feed to LLM for true abstractive rewriting
    processed = await this.abstractiveRewrite(processed, summary.originalText, config);

    // Step 7: Polishing – grammar, fluency, capitalization
    processed = this.polishText(processed);

    // Step 8: Update metrics
    const updatedMetrics = {
      ...summary.metrics,
      wordCount: this.countWords(processed),
      sentenceCount: this.countSentences(processed),
      // Optional: semantic coverage score, readability, etc.
    };

    return {
      ...summary,
      summary: processed,
      metrics: updatedMetrics,
    };
  }

  /** ----------------- Core Steps ----------------- */

  private enforceLength(text: string, config: SummarizationConfig): string {
    const words = text.split(/\s+/);
    if (config.maxLength && words.length > config.maxLength) {
      return this.truncateAtSentence(text, config.maxLength);
    }
    return text;
  }

  private truncateAtSentence(text: string, targetWords: number): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    let wordCount = 0, result = '';
    for (const sentence of sentences) {
      const len = sentence.trim().split(/\s+/).length;
      if (wordCount + len > targetWords) break;
      result += sentence.trim() + '. ';
      wordCount += len;
    }
    return result.trim();
  }

  private removeSimpleRedundancy(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const seen = new Set<string>();
    return sentences.filter(s => {
      const normalized = s.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    }).join('. ') + '.';
  }

  private async removeSemanticRedundancy(text: string, embeddings: number[][], threshold: number): Promise<string> {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const keep: string[] = [];
    const keepEmbeddings: number[][] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sim = keepEmbeddings.some(e => cosineSimilarity(e, embeddings[i]) > threshold);
      if (!sim) {
        keep.push(sentences[i].trim());
        keepEmbeddings.push(embeddings[i]);
      }
    }

    return keep.join('. ') + '.';
  }

  private async abstractiveRewrite(draft: string, original: string, config: SummarizationConfig): Promise<string> {
    const prompt = `
      Rewrite the draft summary to make it fluent, concise, and cover all important points from the original text.
      Original Text: ${original}
      Draft Summary: ${draft}
      Improved Summary:
    `;
    try {
      const rewritten = await callLLM(prompt, { maxTokens: config.maxTokens || 300 });
      return rewritten.trim();
    } catch (err) {
      console.warn('Abstractive rewriting failed, returning draft:', err);
      return draft;
    }
  }

  private polishText(text: string): string {
    let processed = text.replace(/\s+/g, ' ').replace(/\s*([.,!?])\s*/g, '$1 ').trim();
    processed = this.fixCapitalization(processed);
    return processed;
  }

  private fixCapitalization(text: string): string {
    return text.replace(/(?:^|[.!?]\s*)(\w)/g, (_, c) => c.toUpperCase());
  }

  private countWords(text: string) { return text.split(/\s+/).filter(Boolean).length; }
  private countSentences(text: string) { return text.split(/[.!?]+/).filter(s => s.trim()).length; }
}
