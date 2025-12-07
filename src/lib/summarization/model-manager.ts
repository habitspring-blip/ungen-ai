/**
 * Model Manager
 * Handles model variants, selection, and performance tracking
 */

import type { ModelVariant, FeedbackData } from './types';

export class ModelManager {
  private models: ModelVariant[] = [
    {
      id: 'claude-haiku',
      name: 'Claude Haiku',
      type: 'abstractive',
      provider: 'anthropic',
      modelId: 'claude-3-5-haiku-20241022',
      cost: 0.00025, // per 1K tokens
      quality: 0.8,
      speed: 0.9,
      isActive: true,
      config: {
        maxTokens: 4096,
        temperature: 0.7,
      },
    },
    {
      id: 'claude-sonnet',
      name: 'Claude Sonnet',
      type: 'abstractive',
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      cost: 0.003, // per 1K tokens
      quality: 0.95,
      speed: 0.7,
      isActive: true,
      config: {
        maxTokens: 4096,
        temperature: 0.7,
      },
    },
    {
      id: 'extractive-basic',
      name: 'Extractive Basic',
      type: 'extractive',
      provider: 'local',
      modelId: 'extractive-v1',
      cost: 0, // Free
      quality: 0.7,
      speed: 1.0,
      isActive: true,
      config: {},
    },
  ];

  /**
   * Get active models
   */
  getActiveModels(): ModelVariant[] {
    return this.models.filter(model => model.isActive);
  }

  /**
   * Select best model based on requirements
   */
  selectModel(type: 'extractive' | 'abstractive', quality: 'standard' | 'premium' | 'creative'): ModelVariant | null {
    const candidates = this.models.filter(model =>
      model.type === type && model.isActive
    );

    if (candidates.length === 0) return null;

    // Select based on quality preference
    switch (quality) {
      case 'premium':
        return candidates.sort((a, b) => b.quality - a.quality)[0];
      case 'creative':
        return candidates.sort((a, b) => b.quality - a.quality)[0]; // Same as premium for now
      default: // standard
        return candidates.sort((a, b) => a.cost - b.cost)[0]; // Cheapest
    }
  }

  /**
   * Process feedback for model improvement
   */
  async processFeedback(feedback: FeedbackData): Promise<void> {
    // Store feedback for analysis
    console.log(`Processing feedback for model improvement:`, feedback);

    // In production, this would:
    // 1. Store feedback in database
    // 2. Analyze patterns
    // 3. Trigger retraining if needed
    // 4. Update model performance metrics
  }

  /**
   * Update model performance metrics
   */
  updateModelMetrics(modelId: string, metrics: { quality: number; speed: number; cost: number }): void {
    const model = this.models.find(m => m.id === modelId);
    if (model) {
      // Update with weighted average
      const weight = 0.1; // Learning rate
      model.quality = model.quality * (1 - weight) + metrics.quality * weight;
      model.speed = model.speed * (1 - weight) + metrics.speed * weight;
      model.cost = model.cost * (1 - weight) + metrics.cost * weight;
    }
  }

  /**
   * Get model performance statistics
   */
  getModelStats() {
    return this.models.map(model => ({
      id: model.id,
      name: model.name,
      performance: {
        quality: model.quality,
        speed: model.speed,
        cost: model.cost,
      },
      usage: 0, // Would track actual usage
    }));
  }
}