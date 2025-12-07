/**
 * Model Registry and Versioning System
 * Manages model versions, performance tracking, and seamless updates
 */

import type { ModelVariant } from './types';
import { createClient } from '@/lib/supabase/server';

export class ModelRegistry {
  private activeModels = new Map<string, ModelVariant>();

  /**
   * Register a new model version
   */
  async registerModel(model: Omit<ModelVariant, 'id'>): Promise<ModelVariant> {
    const supabase = await createClient();

    const modelData = {
      ...model,
      id: crypto.randomUUID(),
      isActive: model.isActive ?? false,
      config: model.config || {},
    };

    const { data, error } = await supabase
      .from('model_versions')
      .insert({
        id: modelData.id,
        model_name: modelData.name,
        model_type: modelData.type,
        version: this.generateVersion(modelData),
        endpoint_url: modelData.modelId, // Store model ID as endpoint for now
        config: modelData.config,
        performance_metrics: {
          quality: modelData.quality,
          speed: modelData.speed,
          cost: modelData.cost,
        },
        is_active: modelData.isActive,
        deployed_at: modelData.isActive ? new Date() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to register model:', error);
      throw new Error('Failed to register model');
    }

    const registeredModel: ModelVariant = {
      id: data.id,
      name: data.model_name,
      type: data.model_type,
      provider: model.provider,
      modelId: data.endpoint_url,
      cost: model.cost,
      quality: model.quality,
      speed: model.speed,
      isActive: data.is_active,
      config: data.config,
    };

    // Cache active models
    if (registeredModel.isActive) {
      this.activeModels.set(registeredModel.id, registeredModel);
    }

    return registeredModel;
  }

  /**
   * Get active model for a specific type
   */
  async getActiveModel(type: ModelVariant['type']): Promise<ModelVariant | null> {
    // Check cache first
    for (const model of this.activeModels.values()) {
      if (model.type === type && model.isActive) {
        return model;
      }
    }

    // Query database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('model_versions')
      .select('*')
      .eq('model_type', type)
      .eq('is_active', true)
      .order('deployed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const model: ModelVariant = {
      id: data.id,
      name: data.model_name,
      type: data.model_type,
      provider: this.inferProvider(data.endpoint_url),
      modelId: data.endpoint_url,
      cost: data.performance_metrics?.cost || 0,
      quality: data.performance_metrics?.quality || 0,
      speed: data.performance_metrics?.speed || 0,
      isActive: data.is_active,
      config: data.config || {},
    };

    // Cache it
    this.activeModels.set(model.id, model);

    return model;
  }

  /**
   * Activate a model version (deactivate others of same type)
   */
  async activateModel(modelId: string): Promise<void> {
    const supabase = await createClient();

    // Get model details
    const { data: modelData, error: fetchError } = await supabase
      .from('model_versions')
      .select('*')
      .eq('id', modelId)
      .single();

    if (fetchError || !modelData) {
      throw new Error('Model not found');
    }

    // Deactivate all models of the same type
    await supabase
      .from('model_versions')
      .update({ is_active: false })
      .eq('model_type', modelData.model_type);

    // Activate the target model
    const { error: updateError } = await supabase
      .from('model_versions')
      .update({
        is_active: true,
        deployed_at: new Date(),
      })
      .eq('id', modelId);

    if (updateError) {
      throw new Error('Failed to activate model');
    }

    // Update cache
    await this.refreshCache();
  }

  /**
   * Update model performance metrics
   */
  async updateMetrics(modelId: string, metrics: {
    quality?: number;
    speed?: number;
    cost?: number;
    latency?: number;
    accuracy?: number;
  }): Promise<void> {
    const supabase = await createClient();

    // Get current metrics
    const { data: currentData, error: fetchError } = await supabase
      .from('model_versions')
      .select('performance_metrics')
      .eq('id', modelId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch current metrics:', fetchError);
      return;
    }

    const currentMetrics = currentData?.performance_metrics || {};
    const updatedMetrics = { ...currentMetrics, ...metrics };

    // Update metrics
    const { error: updateError } = await supabase
      .from('model_versions')
      .update({
        performance_metrics: updatedMetrics,
      })
      .eq('id', modelId);

    if (updateError) {
      console.error('Failed to update metrics:', updateError);
    }

    // Update cache
    const cachedModel = this.activeModels.get(modelId);
    if (cachedModel) {
      cachedModel.quality = updatedMetrics.quality || cachedModel.quality;
      cachedModel.speed = updatedMetrics.speed || cachedModel.speed;
      cachedModel.cost = updatedMetrics.cost || cachedModel.cost;
    }
  }

  /**
   * Get model performance comparison
   */
  async getModelComparison(type?: ModelVariant['type']): Promise<Array<{
    model: ModelVariant;
    metrics: Record<string, unknown>;
    version: string;
  }>> {
    const supabase = await createClient();

    let query = supabase
      .from('model_versions')
      .select('*')
      .order('deployed_at', { ascending: false });

    if (type) {
      query = query.eq('model_type', type);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('Failed to get model comparison:', error);
      return [];
    }

    return data.map(row => ({
      model: {
        id: row.id,
        name: row.model_name,
        type: row.model_type,
        provider: this.inferProvider(row.endpoint_url),
        modelId: row.endpoint_url,
        cost: row.performance_metrics?.cost || 0,
        quality: row.performance_metrics?.quality || 0,
        speed: row.performance_metrics?.speed || 0,
        isActive: row.is_active,
        config: row.config || {},
      },
      metrics: row.performance_metrics || {},
      version: row.version,
    }));
  }

  /**
   * Fallback to previous model version on failure
   */
  async fallbackModel(currentModelId: string, type: ModelVariant['type']): Promise<ModelVariant | null> {
    const supabase = await createClient();

    // Get previous active model of same type
    const { data, error } = await supabase
      .from('model_versions')
      .select('*')
      .eq('model_type', type)
      .eq('is_active', false)
      .order('deployed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('No fallback model available');
      return null;
    }

    // Log the fallback
    console.log(`Falling back from ${currentModelId} to ${data.id}`);

    // Temporarily activate fallback model
    await this.activateModel(data.id);

    return {
      id: data.id,
      name: data.model_name,
      type: data.model_type,
      provider: this.inferProvider(data.endpoint_url),
      modelId: data.endpoint_url,
      cost: data.performance_metrics?.cost || 0,
      quality: data.performance_metrics?.quality || 0,
      speed: data.performance_metrics?.speed || 0,
      isActive: true,
      config: data.config || {},
    };
  }

  /**
   * Get model health status
   */
  async getModelHealth(): Promise<Array<{
    modelId: string;
    name: string;
    status: 'healthy' | 'degraded' | 'failed';
    lastUsed: Date | null;
    errorRate: number;
  }>> {
    const supabase = await createClient();

    // This would typically aggregate from usage logs
    // For now, return basic health status
    const { data, error } = await supabase
      .from('model_versions')
      .select('id, model_name, deployed_at')
      .order('deployed_at', { ascending: false });

    if (error) {
      console.error('Failed to get model health:', error);
      return [];
    }

    return data.map(row => ({
      modelId: row.id,
      name: row.model_name,
      status: 'healthy' as const, // Simplified
      lastUsed: row.deployed_at,
      errorRate: 0, // Would be calculated from logs
    }));
  }

  /**
   * Generate version string
   */
  private generateVersion(model: ModelVariant): string {
    const timestamp = Date.now();
    const provider = model.provider.slice(0, 3).toUpperCase();
    const type = model.type.slice(0, 3).toUpperCase();
    return `${provider}-${type}-${timestamp}`;
  }

  /**
   * Infer provider from model ID
   */
  private inferProvider(modelId: string): ModelVariant['provider'] {
    if (modelId.includes('claude') || modelId.includes('anthropic')) {
      return 'anthropic';
    }
    if (modelId.includes('gpt') || modelId.includes('openai')) {
      return 'openai';
    }
    return 'huggingface';
  }

  /**
   * Refresh cache from database
   */
  private async refreshCache(): Promise<void> {
    this.activeModels.clear();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('model_versions')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to refresh cache:', error);
      return;
    }

    data.forEach(row => {
      const model: ModelVariant = {
        id: row.id,
        name: row.model_name,
        type: row.model_type,
        provider: this.inferProvider(row.endpoint_url),
        modelId: row.endpoint_url,
        cost: row.performance_metrics?.cost || 0,
        quality: row.performance_metrics?.quality || 0,
        speed: row.performance_metrics?.speed || 0,
        isActive: row.is_active,
        config: row.config || {},
      };

      this.activeModels.set(model.id, model);
    });
  }
}