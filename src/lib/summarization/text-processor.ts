/**
 * Text Preprocessing Service
 * Implements tokenization, sentence segmentation, NER, and embeddings
 */

import type { ProcessedDocument, NamedEntity, DocumentStats } from './types';
import { LanguageDetector } from './utils/language-detection';
import natural from 'natural';
import { pipeline } from '@xenova/transformers';

export class TextProcessor {
  private languageDetector: LanguageDetector;
  private tokenizer: natural.WordTokenizer;
  private nerPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;
  private embeddingPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

  constructor() {
    this.languageDetector = new LanguageDetector();
    this.tokenizer = new natural.WordTokenizer();
    this.initializePipelines();
  }

  /**
   * Initialize ML pipelines (lazy loading)
   */
  private async initializePipelines() {
    try {
      // Initialize NER pipeline
      this.nerPipeline = await pipeline('token-classification', 'dslim/bert-base-NER');

      // Initialize sentence embedding pipeline
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      console.warn('Failed to initialize ML pipelines:', error);
      // Continue without ML pipelines - use fallback methods
    }
  }

  /**
   * Process document text into structured format
   */
  async processDocument(documentId: string, text: string): Promise<ProcessedDocument> {
    // Sentence segmentation
    const sentences = this.segmentSentences(text);

    // Tokenization
    const tokens = sentences.map(sentence => this.tokenizeSentence(sentence));

    // Named Entity Recognition
    const entities = await this.extractEntities(text);

    // Generate embeddings for extractive summarization
    const embeddings = await this.generateEmbeddings(sentences);

    // Calculate statistics
    const stats = this.calculateStats(sentences, tokens, text);

    const processedDoc: ProcessedDocument = {
      sentences,
      tokens,
      entities,
      embeddings,
      stats,
    };

    // Store processed data in database
    await this.storeProcessedDocument(documentId, processedDoc);

    return processedDoc;
  }

  /**
   * Get linguistic statistics for summarization engine
   */
  getLinguisticStats(text: string): {
    avgSentenceLength: number;
    sentenceLengthVariance: number;
    vocabularyRichness: number;
    repetitionRatio: number;
    transitionDensity: number;
    perplexityScore: number;
    burstinessScore: number;
    sentimentScore: number;
    readabilityScore: number;
    totalWords: number;
    totalSentences: number;
  } {
    const sentences = this.segmentSentences(text);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    // Sentence length analysis
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const sentenceLengthVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;

    // Vocabulary analysis
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyRichness = uniqueWords.size / words.length;

    // Repetition patterns
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      const normalized = word.toLowerCase().replace(/[^\w]/g, '');
      if (normalized.length > 3) {
        wordFreq[normalized] = (wordFreq[normalized] || 0) + 1;
      }
    });

    const repeatedWords = Object.entries(wordFreq).filter(([, count]) => count > 2).length;
    const repetitionRatio = repeatedWords / uniqueWords.size;

    // Transition word analysis
    const transitions = [
      'furthermore', 'moreover', 'additionally', 'consequently', 'therefore',
      'however', 'nevertheless', 'nonetheless', 'meanwhile', 'similarly',
      'likewise', 'in contrast', 'on the other hand', 'for example', 'for instance'
    ];

    const transitionCount = transitions.reduce((count, transition) => {
      return count + (text.toLowerCase().match(new RegExp(transition, 'g')) || []).length;
    }, 0);

    const transitionDensity = transitionCount / sentences.length;

    // Perplexity analysis (simplified)
    const perplexityScore = this.calculatePerplexity(text);

    // Burstiness analysis
    const burstinessScore = this.calculateBurstiness(sentenceLengths);

    // Sentiment analysis (simplified)
    const sentimentScore = this.analyzeSentiment(text);

    // Readability analysis
    const readabilityScore = this.calculateReadability(sentences);

    return {
      avgSentenceLength,
      sentenceLengthVariance,
      vocabularyRichness,
      repetitionRatio,
      transitionDensity,
      perplexityScore,
      burstinessScore,
      sentimentScore,
      readabilityScore,
      totalWords: words.length,
      totalSentences: sentences.length
    };
  }

  /**
   * Calculate perplexity score (simplified)
   */
  private calculatePerplexity(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    const ttr = uniqueWords.size / words.length;
    const hapaxCount = Array.from(uniqueWords).filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return (text.match(regex) || []).length === 1;
    }).length;
    const hapaxRatio = hapaxCount / uniqueWords.size;

    const perplexity = 1 / (ttr * (1 + hapaxRatio));
    return Math.min(Math.max(perplexity * 0.1, 0), 1);
  }

  /**
   * Calculate burstiness score
   */
  private calculateBurstiness(sentenceLengths: number[]): number {
    if (sentenceLengths.length <= 1) return 0.5;

    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length);
    const cv = stdDev / mean;
    const burstiness = Math.min(cv * 2, 1);

    return burstiness;
  }

  /**
   * Analyze sentiment (simplified)
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = ['happy', 'joy', 'love', 'excellent', 'great', 'wonderful', 'amazing', 'fantastic'];
    const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst'];

    const textLower = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      positiveCount += (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    });

    negativeWords.forEach(word => {
      negativeCount += (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    });

    const sentiment = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
    return (sentiment + 1) / 2; // Normalize to 0-1
  }

  /**
   * Advanced sentence segmentation with boundary detection
   */
  private segmentSentences(text: string): string[] {
    const sentences: string[] = [];
    let buffer = "";
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1] || '';
      const prevChar = text[i - 1] || '';

      buffer += char;

      // Handle quotes
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }

      // Sentence boundary detection
      if (this.isSentenceBoundary(char, nextChar, prevChar, inQuotes)) {
        const sentence = buffer.trim();
        if (sentence.length > 10) { // Filter out very short sentences
          sentences.push(sentence);
        }
        buffer = "";
      }
    }

    // Handle remaining buffer
    if (buffer.trim().length > 10) {
      sentences.push(buffer.trim());
    }

    return sentences;
  }

  /**
   * Check if current position is a sentence boundary
   */
  private isSentenceBoundary(char: string, nextChar: string, prevChar: string, inQuotes: boolean): boolean {
    // Don't break sentences inside quotes
    if (inQuotes) return false;

    // Primary sentence endings
    if (!['.', '!', '?'].includes(char)) return false;

    // Check for abbreviations
    if (char === '.' && this.isAbbreviation(prevChar, nextChar)) return false;

    // Check for decimal numbers
    if (char === '.' && /\d/.test(prevChar) && /\d/.test(nextChar)) return false;

    // Check if next character is lowercase (continuation)
    if (nextChar && nextChar === nextChar.toLowerCase() && /[a-z]/.test(nextChar)) return false;

    return true;
  }

  /**
   * Check if period is part of an abbreviation
   */
  private isAbbreviation(prevChar: string, nextChar: string): boolean {
    const abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Inc', 'Corp', 'Ltd', 'Co', 'PhD', 'MD'];
    // This is a simplified check - in production, you'd use a more comprehensive list
    return abbreviations.some(abbr => prevChar.includes(abbr.slice(-1)));
  }

  /**
   * Tokenize a sentence into words
   */
  private tokenizeSentence(sentence: string): string[] {
    const tokens = this.tokenizer.tokenize(sentence) || [];

    // Remove stop words and normalize
    return tokens
      .map(token => token.toLowerCase())
      .filter(token => token.length > 1)
      .filter(token => !this.isStopWord(token));
  }

  /**
   * Check if token is a stop word
   */
  private isStopWord(token: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'this', 'that', 'these', 'those', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must'
    ]);
    return stopWords.has(token.toLowerCase());
  }

  /**
   * Extract named entities from text
   */
  private async extractEntities(text: string): Promise<NamedEntity[]> {
    if (!this.nerPipeline) {
      return this.fallbackEntityExtraction(text);
    }

    try {
      const results = await this.nerPipeline(text);
      const entities: NamedEntity[] = [];

      // Process NER results
      let currentEntity: Partial<NamedEntity> | null = null;

      for (const result of results) {
        const label = result.entity;
        const isBegin = label.startsWith('B-');
        const isInside = label.startsWith('I-');
        const entityType = label.replace(/^[BI]-/, '');

        if (isBegin || (!isInside && !isBegin)) {
          // Save previous entity if exists
          if (currentEntity) {
            entities.push(currentEntity as NamedEntity);
          }

          // Start new entity
          currentEntity = {
            text: result.word,
            type: this.mapEntityType(entityType),
            start: result.start,
            end: result.end,
            confidence: result.score,
          };
        } else if (isInside && currentEntity) {
          // Continue current entity
          currentEntity.text += result.word.replace(/^##/, '');
          currentEntity.end = result.end;
        }
      }

      // Save last entity
      if (currentEntity) {
        entities.push(currentEntity as NamedEntity);
      }

      return entities;
    } catch (error) {
      console.warn('NER pipeline failed, using fallback:', error);
      return this.fallbackEntityExtraction(text);
    }
  }

  /**
   * Fallback entity extraction using regex patterns
   */
  private fallbackEntityExtraction(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];

    // Simple regex patterns for common entities
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'PERSON' as const },
      { regex: /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|GmbH)\b/g, type: 'ORG' as const },
      { regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: 'DATE' as const },
      { regex: /\b\d{4}\b/g, type: 'DATE' as const },
    ];

    for (const { regex, type } of patterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type,
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.7,
        });
      }
    }

    return entities;
  }

  /**
   * Map NER model labels to our entity types
   */
  private mapEntityType(label: string): NamedEntity['type'] {
    const mapping: Record<string, NamedEntity['type']> = {
      'PERSON': 'PERSON',
      'ORGANIZATION': 'ORG',
      'ORG': 'ORG',
      'LOCATION': 'GPE',
      'GPE': 'GPE',
      'MONEY': 'MONEY',
      'DATE': 'DATE',
      'PERCENT': 'PERCENT',
    };
    return mapping[label] || 'OTHER';
  }

  /**
   * Generate sentence embeddings for extractive summarization
   */
  private async generateEmbeddings(sentences: string[]): Promise<number[][]> {
    if (!this.embeddingPipeline) {
      return sentences.map(() => []); // Return empty arrays as fallback
    }

    try {
      const embeddings: number[][] = [];

      // Process sentences in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < sentences.length; i += batchSize) {
        const batch = sentences.slice(i, i + batchSize);
        const batchEmbeddings = await this.embeddingPipeline(batch, { pooling: 'mean', normalize: true });

        for (const embedding of batchEmbeddings) {
          embeddings.push(Array.from(embedding.data));
        }
      }

      return embeddings;
    } catch (error) {
      console.warn('Embedding generation failed:', error);
      return sentences.map(() => []);
    }
  }

  /**
   * Calculate document statistics
   */
  private calculateStats(sentences: string[], tokens: string[][], originalText: string): DocumentStats {
    const totalWords = tokens.flat().length;
    const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;
    const language = this.languageDetector.detect(originalText);

    return {
      sentenceCount: sentences.length,
      avgSentenceLength,
      totalWords,
      language: language.language,
      readabilityScore: this.calculateReadability(sentences),
    };
  }

  /**
   * Calculate basic readability score (simplified Flesch-Kincaid)
   */
  private calculateReadability(sentences: string[]): number {
    if (sentences.length === 0) return 0;

    const totalWords = sentences.join(' ').split(/\s+/).length;
    const totalSentences = sentences.length;
    const avgWordsPerSentence = totalWords / totalSentences;

    // Simplified readability formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (totalSentences / totalWords));

    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
  }

  /**
   * Store processed document in database
   */
  private async storeProcessedDocument(documentId: string, processedDoc: ProcessedDocument): Promise<void> {
    const { prisma } = await import('@/lib/prisma');

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          preprocessed: processedDoc,
          status: 'ready',
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('Failed to store processed document:', error);
      throw new Error('Failed to store processed document');
    }
  }
}