/**
 * Summarization Engine - Improved Version
 * Core algorithms for extractive and abstractive summarization
 */

import type { 
  SummarizationConfig, 
  SummaryResult, 
  ProcessedDocument, 
  ExtractiveSentence, 
  NamedEntity 
} from './types';
import { createSummaryMetrics } from './utils/metrics';

// Configuration constants
const DEFAULT_CONFIG = {
  models: {
    claude: 'claude-3-sonnet-20240229',
    cloudflare: '@cf/meta/llama-3.1-8b-instruct'
  },
  tokenLimits: {
    short: 150,
    medium: 300,
    long: 500,
    custom: 300
  },
  cacheSize: 100,
  maxRetries: 3,
  retryDelay: 1000
};

interface CacheEntry {
  result: SummaryResult;
  timestamp: number;
}

export class SummarizationEngine {
  private summaryCache = new Map<string, CacheEntry>();
  private readonly isServerSide: boolean;
  
  constructor() {
    // Detect if running in server environment
    this.isServerSide = typeof process !== 'undefined' && 
                        process.versions != null && 
                        process.versions.node != null;
  }

  /**
   * Generate summary based on configuration
   */
  async generateSummary(
    text: string,
    processedData: ProcessedDocument,
    config: SummarizationConfig
  ): Promise<SummaryResult> {
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new Error('Input text cannot be empty');
    }

    if (text.length > 100000) {
      throw new Error('Input text exceeds maximum length of 100,000 characters');
    }

    // Check cache
    const cacheKey = this.getCacheKey(text, config);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    let summary: string;
    let method: string;

    try {
      switch (config.mode) {
        case 'extractive':
          ({ summary, method } = await this.extractiveSummarization(processedData, config));
          break;
        case 'abstractive':
          ({ summary, method } = await this.abstractiveSummarization(text, config));
          break;
        case 'hybrid':
          ({ summary, method } = await this.hybridSummarization(text, processedData, config));
          break;
        case 'paraphrase':
          ({ summary, method } = await this.paraphraseSummarization(text, config));
          break;
        default:
          throw new Error(`Unsupported summarization mode: ${config.mode}`);
      }
    } catch (error) {
      console.error('Summarization error:', error);
      // Fallback to extractive if other modes fail
      if (config.mode !== 'extractive') {
        ({ summary, method } = await this.extractiveSummarization(processedData, {
          ...config,
          mode: 'extractive'
        }));
        method += ' (fallback)';
      } else {
        throw error;
      }
    }

    const processingTime = Date.now() - startTime;
    const metrics = createSummaryMetrics(text, summary, processingTime);

    const result: SummaryResult = {
      summary,
      method,
      config,
      metrics,
      processingTime,
      confidence: this.calculateConfidence(metrics),
      modelVersion: '1.0.0', // TODO: Get from model registry
    };

    // Cache the result
    this.addToCache(cacheKey, result);

    return result;
  }

  /**
   * Extractive summarization using sentence scoring
   */
  private async extractiveSummarization(
    processedData: ProcessedDocument,
    config: SummarizationConfig
  ): Promise<{ summary: string; method: string }> {
    const sentences = processedData.sentences;
    
    if (!sentences || sentences.length === 0) {
      throw new Error('No sentences found in processed document');
    }

    const embeddings = processedData.embeddings || [];

    // Score sentences
    const scoredSentences = this.scoreSentences(sentences, embeddings, processedData, config);

    // Select top sentences
    const targetCount = this.calculateTargetSentenceCount(sentences.length, config);
    const selectedSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)
      .sort((a, b) => a.index - b.index); // Maintain original order

    const summary = selectedSentences.map(s => s.sentence).join(' ');

    return {
      summary,
      method: 'extractive',
    };
  }

  /**
   * Abstractive summarization using AI models
   */
  private async abstractiveSummarization(
    text: string,
    config: SummarizationConfig
  ): Promise<{ summary: string; method: string }> {
    // Check if we can use AI APIs
    if (!this.isServerSide) {
      throw new Error('Abstractive summarization requires server-side execution');
    }

    const prompt = this.buildAbstractivePrompt(text, config);
    const summary = await this.callSummarizationModel(prompt, config);

    return {
      summary,
      method: 'abstractive',
    };
  }

  /**
   * Hybrid summarization combining extractive and abstractive
   */
  private async hybridSummarization(
    text: string,
    processedData: ProcessedDocument,
    config: SummarizationConfig
  ): Promise<{ summary: string; method: string }> {
    // For very long documents, use hierarchical approach
    if (text.length > 10000) {
      return this.hierarchicalSummarization(text, processedData, config);
    }

    // First do extractive to get key sentences
    const extractiveResult = await this.extractiveSummarization(processedData, {
      ...config,
      length: 'medium'
    });

    // Then use abstractive to refine
    const refinedConfig = { ...config, mode: 'abstractive' as const };
    const abstractiveResult = await this.abstractiveSummarization(
      extractiveResult.summary, 
      refinedConfig
    );

    return {
      summary: abstractiveResult.summary,
      method: 'hybrid',
    };
  }

  /**
   * Hierarchical summarization for long documents
   */
  private async hierarchicalSummarization(
    text: string,
    processedData: ProcessedDocument,
    config: SummarizationConfig
  ): Promise<{ summary: string; method: string }> {
    // Split into chunks
    const chunkSize = 2000;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    // Summarize each chunk
    const chunkSummaries = await Promise.all(
      chunks.map(chunk => 
        this.abstractiveSummarization(chunk, {
          ...config,
          length: 'short'
        })
      )
    );

    // Combine and summarize again
    const combinedText = chunkSummaries.map(cs => cs.summary).join(' ');
    const finalSummary = await this.abstractiveSummarization(combinedText, config);

    return {
      summary: finalSummary.summary,
      method: 'hierarchical',
    };
  }

  /**
   * Paraphrase-based summarization
   */
  private async paraphraseSummarization(
    text: string,
    config: SummarizationConfig
  ): Promise<{ summary: string; method: string }> {
    if (!this.isServerSide) {
      throw new Error('Paraphrase summarization requires server-side execution');
    }

    // Build paraphrase prompt
    const prompt = `Rewrite the following text in a more concise way while preserving all key information. Use different words and sentence structures.

Style: ${config.tone || 'neutral'}
Target length: ${config.length}

Original text:
${text}

Paraphrased version:`;

    const summary = await this.callSummarizationModel(prompt, config);

    return {
      summary,
      method: 'paraphrase',
    };
  }

  /**
   * Score sentences for extractive summarization
   */
  private scoreSentences(
    sentences: string[],
    embeddings: number[][],
    processedData: ProcessedDocument,
    config: SummarizationConfig
  ): ExtractiveSentence[] {
    const documentEmbedding = this.calculateDocumentEmbedding(embeddings);

    return sentences.map((sentence, index) => {
      // Safe embedding access
      const sentenceEmbedding = embeddings[index] || null;
      const entityCount = this.countEntitiesInSentence(sentence, processedData.entities || []);

      // Multiple scoring factors
      const similarityScore = sentenceEmbedding && documentEmbedding
        ? this.cosineSimilarity(sentenceEmbedding, documentEmbedding)
        : 0.5; // Default middle score if no embeddings

      const positionScore = this.calculatePositionScore(index, sentences.length);
      const lengthScore = this.calculateLengthScore(sentence);
      const keywordScore = this.calculateKeywordScore(sentence, config.focus);
      const entityScore = sentence.length > 0 ? entityCount / sentence.length : 0;

      // Weighted combination
      const weights = {
        similarity: 0.35,
        position: 0.25,
        length: 0.15,
        keyword: 0.15,
        entity: 0.10,
      };

      const totalScore = (
        weights.similarity * similarityScore +
        weights.position * positionScore +
        weights.length * lengthScore +
        weights.keyword * keywordScore +
        weights.entity * entityScore
      );

      return {
        sentence,
        score: totalScore,
        index,
        position: index,
        length: sentence.length,
        entities: entityCount,
      };
    });
  }

  /**
   * Calculate document-level embedding (centroid)
   */
  private calculateDocumentEmbedding(embeddings: number[][]): number[] | null {
    if (!embeddings || embeddings.length === 0) return null;

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      if (!embedding || embedding.length !== dimensions) continue;
      
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }

    // Average
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length;
    }

    return centroid;
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Calculate position-based score
   */
  private calculatePositionScore(index: number, totalSentences: number): number {
    if (totalSentences <= 1) return 1;
    
    // Exponential decay from start, with boost for conclusion
    const startScore = Math.exp(-index / (totalSentences * 0.3));
    const endBoost = index > totalSentences * 0.8 ? 0.2 : 0;
    
    return Math.min(1, startScore + endBoost);
  }

  /**
   * Calculate length-based score
   */
  private calculateLengthScore(sentence: string): number {
    const words = sentence.trim().split(/\s+/).length;
    const optimalLength = 15;

    // Gaussian-like scoring around optimal length
    const distance = Math.abs(words - optimalLength);
    return Math.exp(-distance * distance / 50); // sigma = 5
  }

  /**
   * Calculate keyword relevance score
   */
  private calculateKeywordScore(sentence: string, focusKeywords?: string[]): number {
    if (!focusKeywords || focusKeywords.length === 0) return 0.5;

    const sentenceLower = sentence.toLowerCase();
    const matches = focusKeywords.filter(keyword =>
      sentenceLower.includes(keyword.toLowerCase())
    );

    return matches.length / focusKeywords.length;
  }

  /**
   * Count entities in a sentence
   */
  private countEntitiesInSentence(sentence: string, entities: NamedEntity[]): number {
    if (!entities || entities.length === 0) return 0;
    
    return entities.filter(entity =>
      sentence.includes(entity.text)
    ).length;
  }

  /**
   * Calculate target number of sentences
   */
  private calculateTargetSentenceCount(totalSentences: number, config: SummarizationConfig): number {
    if (config.length === 'custom' && config.maxLength) {
      // Estimate words per sentence (avg ~15)
      const targetWords = config.maxLength;
      const estimatedSentences = Math.ceil(targetWords / 15);
      return Math.max(1, Math.min(estimatedSentences, totalSentences));
    }

    const ratio = {
      short: 0.2,
      medium: 0.3,
      long: 0.5,
    }[config.length] || 0.3;

    return Math.max(1, Math.min(Math.ceil(totalSentences * ratio), totalSentences));
  }

  /**
   * Build prompt for abstractive summarization
   */
  private buildAbstractivePrompt(text: string, config: SummarizationConfig): string {
    const toneInstructions = {
      formal: 'Use formal, academic language with proper terminology.',
      casual: 'Use conversational, everyday language that\'s easy to understand.',
      neutral: 'Use clear, professional language without being overly formal or casual.',
      simple: 'Use simple words and short sentences. Avoid jargon.',
      academic: 'Use academic and technical terminology appropriate for scholarly writing.',
      angry: 'Use angry, frustrated language with strong emotional intensity.',
      sad: 'Use melancholic, sorrowful language that conveys sadness and emotion.',
      inspirational: 'Use motivational, uplifting language that inspires and encourages.',
      sarcastic: 'Use ironic, mocking language with subtle sarcasm and wit.',
      witty: 'Use clever, humorous language with sharp intelligence and wordplay.',
      enthusiastic: 'Use energetic, excited language that shows passion and enthusiasm.',
      serious: 'Use grave, solemn language that conveys importance and seriousness.',
      humorous: 'Use light-hearted, funny language that entertains and amuses.',
      optimistic: 'Use hopeful, positive language that looks forward to good outcomes.',
      pessimistic: 'Use cynical, negative language that expresses doubt and concern.',
      passionate: 'Use intense, fervent language that shows deep emotion and commitment.',
      diplomatic: 'Use tactful, careful language that avoids offense and maintains harmony.',
      assertive: 'Use confident, direct language that expresses opinions firmly.',
      empathetic: 'Use understanding, compassionate language that shows care for others.',
      critical: 'Use analytical, evaluative language that examines and judges carefully.',
      encouraging: 'Use supportive, motivating language that builds confidence and hope.',
    };

    const lengthInstructions = {
      short: 'Create a brief summary of 50-100 words.',
      medium: 'Create a balanced summary of 100-200 words.',
      long: 'Create a detailed summary of 200-400 words covering all key points.',
      custom: `Create a summary of approximately ${config.maxLength || 150} words.`,
    };

    const focusSection = config.focus && config.focus.length > 0
      ? `\nEmphasize these topics: ${config.focus.join(', ')}`
      : '';

    return `You are an expert summarizer. Create a high-quality summary that captures the essential information.

Requirements:
- Style: ${toneInstructions[config.tone] || toneInstructions.neutral}
- Length: ${lengthInstructions[config.length] || lengthInstructions.medium}${focusSection}
- Focus on main ideas and key facts
- Preserve important details and context
- Maintain logical flow

Text to summarize:
${text}

Provide only the summary, no preamble or meta-commentary.`;
  }

  /**
   * Call external summarization model with retry logic
   */
  private async callSummarizationModel(
    prompt: string, 
    config: SummarizationConfig
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < DEFAULT_CONFIG.maxRetries; attempt++) {
      try {
        const summary = await this.callAIAPI(prompt, config);
        
        if (summary && summary.trim().length > 0) {
          return summary;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`API attempt ${attempt + 1} failed:`, error);
        
        // Wait before retrying
        if (attempt < DEFAULT_CONFIG.maxRetries - 1) {
          await this.sleep(DEFAULT_CONFIG.retryDelay * (attempt + 1));
        }
      }
    }

    // All retries failed, use fallback
    console.error('All API attempts failed:', lastError);
    throw new Error(`AI API calls failed after ${DEFAULT_CONFIG.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Call AI API using existing infrastructure
   */
  private async callAIAPI(prompt: string, config: SummarizationConfig): Promise<string> {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

    // Prefer Claude for better quality
    if (ANTHROPIC_API_KEY) {
      return this.callClaudeAPI(prompt, config);
    }

    // Fallback to Cloudflare
    if (CF_API_TOKEN && CF_ACCOUNT_ID) {
      return this.callCloudflareAPI(prompt, config);
    }

    throw new Error('No AI API keys configured. Please set ANTHROPIC_API_KEY or CLOUDFLARE credentials.');
  }

  /**
   * Call Claude API for summarization
   */
  private async callClaudeAPI(prompt: string, config: SummarizationConfig): Promise<string> {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    // Dynamic token limits based on input length
    const maxTokens = this.calculateTokenLimit(prompt, config);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: DEFAULT_CONFIG.models.claude,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text?.trim() || '';
    
    if (!summary) {
      throw new Error('Claude API returned empty response');
    }

    return summary;
  }

  /**
   * Call Cloudflare AI API for summarization
   */
  private async callCloudflareAPI(prompt: string, config: SummarizationConfig): Promise<string> {
    const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
      throw new Error('Cloudflare API credentials not configured');
    }

    const maxTokens = this.calculateTokenLimit(prompt, config);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${DEFAULT_CONFIG.models.cloudflare}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional summarizer. Provide clear, concise, accurate summaries.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Cloudflare API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const summary = data.result?.response?.trim() || data.response?.trim() || '';
    
    if (!summary) {
      throw new Error('Cloudflare API returned empty response');
    }

    return summary;
  }

  /**
   * Calculate appropriate token limit based on input and config
   */
  private calculateTokenLimit(prompt: string, config: SummarizationConfig): number {
    // Estimate input tokens (rough: 1 token ≈ 4 chars)
    const estimatedInputTokens = prompt.length / 4;
    
    // Base limits from config
    const baseLimit = DEFAULT_CONFIG.tokenLimits[config.length] || 300;
    
    // Scale up for longer inputs
    const scaleFactor = Math.min(2, estimatedInputTokens / 1000);
    
    return Math.ceil(baseLimit * Math.max(1, scaleFactor));
  }

  /**
   * Calculate confidence score for the summary
   */
  private calculateConfidence(metrics: SummaryResult['metrics']): number {
    const coherenceWeight = 0.3;
    const readabilityWeight = 0.2;
    const compressionWeight = 0.3;
    const coverageWeight = 0.2;

    const coherence = metrics.coherence || 0.5;
    const readability = Math.min((metrics.readabilityScore || 30) / 50, 1);
    
    // Prefer moderate compression (0.3-0.5)
    const compressionRatio = metrics.compressionRatio || 0.3;
    const compression = 1 - Math.abs(compressionRatio - 0.4) / 0.6;
    
    // Use ROUGE or word overlap as coverage metric
    const coverage = metrics.rouge1 || 0.5;

    return Math.max(0, Math.min(1, 
      coherenceWeight * coherence +
      readabilityWeight * readability +
      compressionWeight * compression +
      coverageWeight * coverage
    ));
  }

  /**
   * Cache management
   */
  private getCacheKey(text: string, config: SummarizationConfig): string {
    const textHash = this.simpleHash(text);
    const configStr = JSON.stringify({
      mode: config.mode,
      length: config.length,
      tone: config.tone,
      focus: config.focus
    });
    return `${textHash}-${this.simpleHash(configStr)}`;
  }

  private getFromCache(key: string): SummaryResult | null {
    const entry = this.summaryCache.get(key);
    if (!entry) return null;

    // Cache for 1 hour
    const maxAge = 3600000;
    if (Date.now() - entry.timestamp > maxAge) {
      this.summaryCache.delete(key);
      return null;
    }

    return entry.result;
  }

  private addToCache(key: string, result: SummaryResult): void {
    // Limit cache size
    if (this.summaryCache.size >= DEFAULT_CONFIG.cacheSize) {
      const firstKey = this.summaryCache.keys().next().value;
      this.summaryCache.delete(firstKey);
    }

    this.summaryCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Utility: Sleep for given milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (for testing or memory management)
   */
  public clearCache(): void {
    this.summaryCache.clear();
  }
}