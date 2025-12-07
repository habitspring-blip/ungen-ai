/**
 * Cost Optimization Service
 * Implements intelligent cost-saving techniques for AI summarization
 */

import type { SummarizationConfig } from './types';

export class CostOptimizer {
  /**
   * Optimize text before sending to AI models
   * Implements intelligent truncation and preprocessing
   */
  optimizeInput(text: string, config: SummarizationConfig): {
    optimizedText: string;
    originalLength: number;
    optimizedLength: number;
    savings: number;
  } {
    const originalLength = text.length;
    let optimizedText = text;

    // Apply cost optimization techniques in order
    optimizedText = this.intelligentTruncation(optimizedText, config);
    optimizedText = this.removeRedundantContent(optimizedText);
    optimizedText = this.compressWhitespace(optimizedText);

    const optimizedLength = optimizedText.length;
    const savings = ((originalLength - optimizedLength) / originalLength) * 100;

    return {
      optimizedText,
      originalLength,
      optimizedLength,
      savings,
    };
  }

  /**
   * Intelligent truncation - keep start and end, discard middle for long texts
   */
  private intelligentTruncation(text: string, config: SummarizationConfig): string {
    const maxLength = this.getMaxLengthForConfig(config);

    if (text.length <= maxLength) {
      return text;
    }

    // For abstractive summarization, we can truncate more aggressively
    if (config.mode === 'abstractive') {
      const keepStart = Math.floor(maxLength * 0.7);
      const keepEnd = Math.floor(maxLength * 0.3);

      const start = text.substring(0, keepStart);
      const end = text.substring(text.length - keepEnd);

      return `${start}\n\n[...content truncated for efficiency...]\n\n${end}`;
    }

    // For extractive, keep more content
    return text.substring(0, maxLength);
  }

  /**
   * Remove redundant or low-value content
   */
  private removeRedundantContent(text: string): string {
    let optimized = text;

    // Remove excessive whitespace
    optimized = optimized.replace(/\n{3,}/g, '\n\n');
    optimized = optimized.replace(/ {2,}/g, ' ');

    // Remove common boilerplate (basic implementation)
    const boilerplate = [
      /disclaimer:.*/gi,
      /terms of use:.*/gi,
      /privacy policy:.*/gi,
      /copyright.*/gi,
    ];

    boilerplate.forEach(pattern => {
      optimized = optimized.replace(pattern, '');
    });

    return optimized;
  }

  /**
   * Compress whitespace and normalize formatting
   */
  private compressWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();
  }

  /**
   * Get maximum input length based on configuration and cost constraints
   */
  private getMaxLengthForConfig(config: SummarizationConfig): number {
    // Base limits by mode
    const baseLimits = {
      extractive: 10000,  // Extractive can handle longer text
      abstractive: 5000,  // Abstractive is more expensive
      hybrid: 7500,
      paraphrase: 3000,
    };

    const baseLimit = baseLimits[config.mode] || 5000;

    // Adjust based on quality and length requirements
    let multiplier = 1.0;

    if (config.quality === 'premium') multiplier *= 0.8; // Shorter for premium
    if (config.length === 'long') multiplier *= 0.9;
    if (config.length === 'short') multiplier *= 1.2;

    return Math.floor(baseLimit * multiplier);
  }

  /**
   * Select optimal model based on input characteristics and cost
   */
  selectOptimalModel(text: string, config: SummarizationConfig): {
    provider: 'anthropic' | 'openai' | 'huggingface';
    model: string;
    estimatedCost: number;
    reasoning: string;
  } {
    const textLength = text.length;
    const wordCount = text.split(/\s+/).length;

    // For very short texts, use cheaper models
    if (wordCount < 100) {
      return {
        provider: 'huggingface',
        model: 'distilbart-cnn-6-6',
        estimatedCost: 0.001,
        reasoning: 'Short text - using lightweight model',
      };
    }

    // For medium texts, use balanced approach
    if (wordCount < 500) {
      if (config.quality === 'premium') {
        return {
          provider: 'anthropic',
          model: 'claude-3-haiku',
          estimatedCost: 0.002,
          reasoning: 'Medium text with premium quality - Claude Haiku',
        };
      } else {
        return {
          provider: 'huggingface',
          model: 'facebook/bart-large-cnn',
          estimatedCost: 0.005,
          reasoning: 'Medium text - BART model',
        };
      }
    }

    // For long texts, use most efficient model
    return {
      provider: 'anthropic',
      model: 'claude-3-haiku',
      estimatedCost: 0.003,
      reasoning: 'Long text - efficient Claude model',
    };
  }

  /**
   * Optimize API parameters for cost efficiency
   */
  optimizeParameters(config: SummarizationConfig, textLength: number): Partial<SummarizationConfig> {
    const optimized = { ...config };

    // Adjust temperature for cost - lower temperature = more deterministic = cheaper
    if (config.mode === 'abstractive') {
      optimized.temperature = Math.min(config.temperature || 0.7, 0.5);
    }

    // Optimize length parameters
    if (config.maxLength) {
      // Reduce max length for cost savings
      optimized.maxLength = Math.min(config.maxLength, Math.floor(textLength * 0.3));
    }

    return optimized;
  }

  /**
   * Implement batch processing for multiple requests
   */
  async batchProcess(requests: Array<{
    text: string;
    config: SummarizationConfig;
    id: string;
  }>): Promise<Array<{
    id: string;
    optimizedText: string;
    savings: number;
  }>> {
    // Group similar requests for batch processing
    const batches = this.groupSimilarRequests(requests);

    const results = [];

    for (const batch of batches) {
      // Process batch together for efficiency
      const batchResults = await Promise.all(
        batch.map(async (request) => {
          const optimization = this.optimizeInput(request.text, request.config);
          return {
            id: request.id,
            optimizedText: optimization.optimizedText,
            savings: optimization.savings,
          };
        })
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Group similar requests for batch processing
   */
  private groupSimilarRequests(requests: Array<{
    text: string;
    config: SummarizationConfig;
    id: string;
  }>): Array<Array<{
    text: string;
    config: SummarizationConfig;
    id: string;
  }>> {
    // Simple grouping by mode and length
    const groups: Record<string, Array<{
      text: string;
      config: SummarizationConfig;
      id: string;
    }>> = {};

    requests.forEach(request => {
      const key = `${request.config.mode}-${request.config.length}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(request);
    });

    return Object.values(groups);
  }

  /**
   * Calculate cost savings and efficiency metrics
   */
  calculateEfficiencyMetrics(
    originalRequests: number,
    optimizedRequests: number,
    originalCost: number,
    optimizedCost: number
  ): {
    costSavings: number;
    costSavingsPercentage: number;
    efficiency: number;
  } {
    const costSavings = originalCost - optimizedCost;
    const costSavingsPercentage = originalCost > 0 ? (costSavings / originalCost) * 100 : 0;
    const efficiency = optimizedRequests > 0 ? originalRequests / optimizedRequests : 1;

    return {
      costSavings,
      costSavingsPercentage,
      efficiency,
    };
  }

  /**
   * Get cost optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    return [
      'Use extractive summarization for factual content to reduce costs',
      'Implement caching to avoid redundant API calls',
      'Batch similar requests together for efficiency',
      'Use intelligent truncation for long documents',
      'Select appropriate model size based on content complexity',
      'Optimize prompt length and specificity',
      'Implement request deduplication',
      'Use streaming responses to reduce perceived latency',
    ];
  }
}