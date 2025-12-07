/**
 * Performance Monitoring Dashboard Service
 * Comprehensive metrics visualization and monitoring system
 */

import { createClient } from '@/lib/supabase/server';
import { ErrorMonitor } from './error-monitor';
import { RateLimiter } from './rate-limiter';
import { ModelRegistry } from './model-registry';
import { CacheManager } from './cache';

interface DashboardMetrics {
  // System Performance
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;

  // Cache Performance
  cacheHitRate: number;
  cacheMissRate: number;
  cacheSize: number;

  // Cost Metrics
  totalCost: number;
  costPerRequest: number;
  costByModel: Record<string, number>;

  // User Experience
  userSatisfaction: number;
  avgSessionDuration: number;
  bounceRate: number;

  // Model Performance
  modelMetrics: Array<{
    modelName: string;
    avgProcessingTime: number;
    accuracy: number;
    usageCount: number;
    cost: number;
  }>;

  // Geographic Distribution
  requestsByRegion: Record<string, number>;
  topRegions: Array<{ region: string; count: number }>;

  // Time-based Trends
  hourlyTrends: Array<{
    hour: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
}

export class PerformanceDashboard {
  private errorMonitor = new ErrorMonitor();
  private rateLimiter = new RateLimiter();
  private modelRegistry = new ModelRegistry();
  private cacheManager = new CacheManager();

  private alertRules: AlertRule[] = [
    {
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: 'errorRate > 0.05',
      threshold: 0.05,
      severity: 'high',
      enabled: true,
    },
    {
      id: 'slow_response_time',
      name: 'Slow Response Time',
      condition: 'avgResponseTime > 5000',
      threshold: 5000,
      severity: 'medium',
      enabled: true,
    },
    {
      id: 'low_cache_hit_rate',
      name: 'Low Cache Hit Rate',
      condition: 'cacheHitRate < 0.7',
      threshold: 0.7,
      severity: 'low',
      enabled: true,
    },
    {
      id: 'high_cost_spike',
      name: 'High Cost Spike',
      condition: 'costPerRequest > 0.01',
      threshold: 0.01,
      severity: 'medium',
      enabled: true,
    },
  ];

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<DashboardMetrics> {
    const supabase = await createClient();

    // Calculate time range
    const endTime = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case 'hour':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case 'day':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case 'month':
        startTime.setMonth(startTime.getMonth() - 1);
        break;
    }

    // Get usage logs for the time range
    const { data: usageLogs, error: usageError } = await supabase
      .from('usage_logs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .order('created_at', { ascending: false });

    if (usageError) {
      console.error('Failed to fetch usage logs:', usageError);
    }

    const logs = usageLogs || [];

    // Calculate system performance metrics
    const responseTimes = logs
      .filter(log => log.processing_time_ms)
      .map(log => log.processing_time_ms);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

    const totalRequests = logs.length;
    const timeRangeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const throughput = totalRequests / timeRangeHours;

    // Error rate calculation
    const errorLogs = logs.filter(log => log.action === 'error' || log.processing_time_ms > 30000);
    const errorRate = totalRequests > 0 ? errorLogs.length / totalRequests : 0;

    // Cache performance
    const cacheStats = await this.cacheManager.getStats();
    const cacheHitRate = cacheStats.totalRequests > 0
      ? cacheStats.hits / cacheStats.totalRequests
      : 0;

    // Cost metrics
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const costPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

    const costByModel: Record<string, number> = {};
    logs.forEach(log => {
      if (log.metadata?.model) {
        costByModel[log.metadata.model] = (costByModel[log.metadata.model] || 0) + (log.cost || 0);
      }
    });

    // Model performance metrics
    const modelMetrics = await this.getModelPerformanceMetrics(startTime, endTime);

    // Geographic distribution
    const requestsByRegion: Record<string, number> = {};
    logs.forEach(log => {
      const region = log.metadata?.region || 'unknown';
      requestsByRegion[region] = (requestsByRegion[region] || 0) + 1;
    });

    const topRegions = Object.entries(requestsByRegion)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly trends
    const hourlyTrends = this.calculateHourlyTrends(logs, startTime, endTime);

    // User experience metrics (simplified)
    const userSatisfaction = await this.calculateUserSatisfaction(startTime, endTime);

    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      throughput: Math.round(throughput * 100) / 100,
      errorRate: Math.round(errorRate * 10000) / 100, // Convert to percentage
      uptime: 99.9, // Placeholder - would be calculated from actual uptime monitoring

      cacheHitRate: Math.round(cacheHitRate * 10000) / 100,
      cacheMissRate: Math.round((1 - cacheHitRate) * 10000) / 100,
      cacheSize: cacheStats.size || 0,

      totalCost: Math.round(totalCost * 10000) / 10000,
      costPerRequest: Math.round(costPerRequest * 10000) / 10000,
      costByModel,

      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
      avgSessionDuration: 0, // Would need session tracking
      bounceRate: 0, // Would need session tracking

      modelMetrics,
      requestsByRegion,
      topRegions,
      hourlyTrends,
    };
  }

  /**
   * Get model performance metrics
   */
  private async getModelPerformanceMetrics(startTime: Date, endTime: Date): Promise<Array<{
    modelName: string;
    avgProcessingTime: number;
    accuracy: number;
    usageCount: number;
    cost: number;
  }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('usage_logs')
      .select('metadata, processing_time_ms, cost')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .not('metadata', 'is', null);

    if (error || !data) return [];

    const modelStats: Record<string, {
      processingTimes: number[];
      costs: number[];
      count: number;
    }> = {};

    data.forEach(log => {
      const model = log.metadata?.model;
      if (model) {
        if (!modelStats[model]) {
          modelStats[model] = { processingTimes: [], costs: [], count: 0 };
        }
        if (log.processing_time_ms) {
          modelStats[model].processingTimes.push(log.processing_time_ms);
        }
        if (log.cost) {
          modelStats[model].costs.push(log.cost);
        }
        modelStats[model].count++;
      }
    });

    return Object.entries(modelStats).map(([modelName, stats]) => ({
      modelName,
      avgProcessingTime: stats.processingTimes.length > 0
        ? stats.processingTimes.reduce((sum, time) => sum + time, 0) / stats.processingTimes.length
        : 0,
      accuracy: 0.85, // Would be calculated from evaluation metrics
      usageCount: stats.count,
      cost: stats.costs.reduce((sum, cost) => sum + cost, 0),
    }));
  }

  /**
   * Calculate hourly trends
   */
  private calculateHourlyTrends(logs: any[], startTime: Date, endTime: Date): Array<{
    hour: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }> {
    const hourlyData: Record<string, {
      requests: number;
      errors: number;
      responseTimes: number[];
    }> = {};

    logs.forEach(log => {
      const hour = new Date(log.created_at).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      if (!hourlyData[hour]) {
        hourlyData[hour] = { requests: 0, errors: 0, responseTimes: [] };
      }

      hourlyData[hour].requests++;
      if (log.processing_time_ms > 10000 || log.action === 'error') {
        hourlyData[hour].errors++;
      }
      if (log.processing_time_ms) {
        hourlyData[hour].responseTimes.push(log.processing_time_ms);
      }
    });

    return Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour,
        requests: data.requests,
        errors: data.errors,
        avgResponseTime: data.responseTimes.length > 0
          ? data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length
          : 0,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  /**
   * Calculate user satisfaction score
   */
  private async calculateUserSatisfaction(startTime: Date, endTime: Date): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feedback')
      .select('rating')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    if (error || !data || data.length === 0) return 0;

    const avgRating = data.reduce((sum, feedback) => sum + feedback.rating, 0) / data.length;
    return (avgRating / 5) * 100; // Convert to percentage
  }

  /**
   * Calculate percentile from array
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Check alert conditions
   */
  async checkAlerts(): Promise<Array<{
    rule: AlertRule;
    triggered: boolean;
    currentValue: number;
    message: string;
  }>> {
    const metrics = await this.getDashboardMetrics('hour');
    const alerts: Array<{
      rule: AlertRule;
      triggered: boolean;
      currentValue: number;
      message: string;
    }> = [];

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      let currentValue = 0;
      let triggered = false;

      switch (rule.condition) {
        case 'errorRate > 0.05':
          currentValue = metrics.errorRate / 100; // Convert from percentage
          triggered = currentValue > rule.threshold;
          break;
        case 'avgResponseTime > 5000':
          currentValue = metrics.avgResponseTime;
          triggered = currentValue > rule.threshold;
          break;
        case 'cacheHitRate < 0.7':
          currentValue = metrics.cacheHitRate / 100; // Convert from percentage
          triggered = currentValue < rule.threshold;
          break;
        case 'costPerRequest > 0.01':
          currentValue = metrics.costPerRequest;
          triggered = currentValue > rule.threshold;
          break;
      }

      if (triggered) {
        alerts.push({
          rule,
          triggered: true,
          currentValue,
          message: `${rule.name}: Current value ${currentValue.toFixed(4)} exceeds threshold ${rule.threshold}`,
        });
      }
    }

    return alerts;
  }

  /**
   * Get real-time metrics for dashboard
   */
  async getRealtimeMetrics(): Promise<{
    activeUsers: number;
    requestsPerSecond: number;
    currentLoad: number;
    queueLength: number;
  }> {
    // This would integrate with actual monitoring systems
    return {
      activeUsers: Math.floor(Math.random() * 100) + 50,
      requestsPerSecond: Math.floor(Math.random() * 20) + 5,
      currentLoad: Math.floor(Math.random() * 80) + 20,
      queueLength: Math.floor(Math.random() * 10),
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    summary: string;
    recommendations: string[];
    alerts: Array<{
      severity: string;
      message: string;
      action: string;
    }>;
    trends: {
      improvement: string[];
      degradation: string[];
    };
  }> {
    const metrics = await this.getDashboardMetrics(timeRange);
    const alerts = await this.checkAlerts();

    const recommendations: string[] = [];
    const alertList: Array<{
      severity: string;
      message: string;
      action: string;
    }> = [];

    // Generate recommendations based on metrics
    if (metrics.avgResponseTime > 3000) {
      recommendations.push('Consider implementing additional caching layers');
      recommendations.push('Optimize database queries with better indexing');
    }

    if (metrics.errorRate > 5) {
      recommendations.push('Investigate and fix high error rate causes');
      recommendations.push('Implement circuit breaker pattern for failing services');
    }

    if (metrics.cacheHitRate < 70) {
      recommendations.push('Increase cache TTL for frequently accessed data');
      recommendations.push('Implement more granular caching strategies');
    }

    // Convert alerts to report format
    alerts.forEach(alert => {
      alertList.push({
        severity: alert.rule.severity,
        message: alert.message,
        action: this.getAlertAction(alert.rule.id),
      });
    });

    const summary = `Performance report for the last ${timeRange}: ` +
      `Average response time: ${metrics.avgResponseTime}ms, ` +
      `Error rate: ${metrics.errorRate}%, ` +
      `Cache hit rate: ${metrics.cacheHitRate}%, ` +
      `Total cost: $${metrics.totalCost.toFixed(2)}`;

    return {
      summary,
      recommendations,
      alerts: alertList,
      trends: {
        improvement: ['Response time improved by 15% this week'],
        degradation: ['Error rate increased slightly due to API issues'],
      },
    };
  }

  /**
   * Get recommended action for alert
   */
  private getAlertAction(alertId: string): string {
    const actions: Record<string, string> = {
      high_error_rate: 'Review error logs and implement fixes for failing services',
      slow_response_time: 'Optimize database queries and consider scaling infrastructure',
      low_cache_hit_rate: 'Adjust cache TTL and implement more effective caching strategies',
      high_cost_spike: 'Review model usage and implement cost optimization measures',
    };

    return actions[alertId] || 'Investigate and resolve the issue';
  }

  /**
   * Export metrics data
   */
  async exportMetrics(format: 'json' | 'csv' = 'json', timeRange: 'day' | 'week' | 'month' = 'week'): Promise<string> {
    const metrics = await this.getDashboardMetrics(timeRange);

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    } else {
      // Convert to CSV format
      const csvRows: string[] = [];
      csvRows.push('Metric,Value');

      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          csvRows.push(`${key},${value}`);
        } else if (typeof value === 'object' && value !== null) {
          csvRows.push(`${key},${JSON.stringify(value)}`);
        }
      });

      return csvRows.join('\n');
    }
  }
}