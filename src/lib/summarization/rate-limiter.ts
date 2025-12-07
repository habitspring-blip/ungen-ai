/**
 * Rate Limiting and Usage Tracking Service
 * Implements per-user quotas, sliding window rate limiting, and usage analytics
 */

import { createClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
}

interface UsageRecord {
  userId: string;
  action: string;
  tokens: number;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class RateLimiter {
  private defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  };

  /**
   * Check if user is within rate limits
   */
  async checkRateLimit(userId: string, action: string = 'summarize'): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    blockedUntil?: Date;
  }> {
    const config = this.getConfigForAction(action);
    const supabase = await createClient();

    // Check if user is currently blocked
    const { data: blockData } = await supabase
      .from('user_blocks')
      .select('blocked_until')
      .eq('user_id', userId)
      .gt('blocked_until', new Date())
      .single();

    if (blockData) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        blockedUntil: new Date(blockData.blocked_until),
      };
    }

    // Count requests in current window
    const windowStart = new Date(Date.now() - config.windowMs);

    const { data: usageData, error } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('Rate limit check failed:', error);
      // Allow request on error to avoid blocking legitimate users
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(Date.now() + config.windowMs),
      };
    }

    const requestCount = usageData.length;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const allowed = requestCount < config.maxRequests;

    // If limit exceeded, block user
    if (!allowed && config.blockDurationMs) {
      await this.blockUser(userId, config.blockDurationMs);
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(Date.now() + config.windowMs),
    };
  }

  /**
   * Record usage for analytics and billing
   */
  async recordUsage(record: UsageRecord): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: record.userId,
        action: record.action,
        document_id: record.metadata?.documentId as string,
        summary_id: record.metadata?.summaryId as string,
        processing_time_ms: record.metadata?.processingTime as number,
        tokens_used: record.tokens,
        created_at: record.timestamp,
      });

    if (error) {
      console.error('Failed to record usage:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }

    // Update user's quota usage
    await this.updateUserQuota(record.userId, record.action);
  }

  /**
   * Get user's current quota status
   */
  async getQuotaStatus(userId: string): Promise<{
    monthlyUsage: number;
    monthlyLimit: number;
    remaining: number;
    resetDate: Date;
    isPremium: boolean;
  }> {
    const supabase = await createClient();

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('api_key, usage_quota')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      return {
        monthlyUsage: 0,
        monthlyLimit: 100,
        remaining: 100,
        resetDate: this.getNextMonthReset(),
        isPremium: false,
      };
    }

    // Calculate monthly usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: usageData, error: usageError } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());

    const monthlyUsage = usageError ? 0 : usageData.length;
    const monthlyLimit = profile.usage_quota || 100;
    const remaining = Math.max(0, monthlyLimit - monthlyUsage);

    return {
      monthlyUsage,
      monthlyLimit,
      remaining,
      resetDate: this.getNextMonthReset(),
      isPremium: !!profile.api_key, // Simple premium check
    };
  }

  /**
   * Check if user has quota remaining
   */
  async hasQuota(userId: string, action: string = 'summarize'): Promise<boolean> {
    const quotaStatus = await this.getQuotaStatus(userId);
    return quotaStatus.remaining > 0;
  }

  /**
   * Get usage analytics for a user
   */
  async getUsageAnalytics(userId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageProcessingTime: number;
    requestsByAction: Record<string, number>;
    dailyUsage: Array<{ date: string; count: number }>;
  }> {
    const supabase = await createClient();

    // Calculate period start
    const periodStart = new Date();
    switch (period) {
      case 'day':
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case 'month':
        periodStart.setDate(1);
        break;
    }

    const { data, error } = await supabase
      .from('usage_logs')
      .select('action, tokens_used, processing_time_ms, created_at')
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get usage analytics:', error);
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageProcessingTime: 0,
        requestsByAction: {},
        dailyUsage: [],
      };
    }

    // Aggregate data
    const totalRequests = data.length;
    const totalTokens = data.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
    const totalCost = data.reduce((sum, log) => sum + this.calculateCost(log.tokens_used || 0, log.action), 0);
    const averageProcessingTime = totalRequests > 0
      ? data.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / totalRequests
      : 0;

    // Requests by action
    const requestsByAction: Record<string, number> = {};
    data.forEach(log => {
      requestsByAction[log.action] = (requestsByAction[log.action] || 0) + 1;
    });

    // Daily usage
    const dailyUsage: Record<string, number> = {};
    data.forEach(log => {
      const date = log.created_at.split('T')[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    const dailyUsageArray = Object.entries(dailyUsage)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageProcessingTime,
      requestsByAction,
      dailyUsage: dailyUsageArray,
    };
  }

  /**
   * Get system-wide usage statistics
   */
  async getSystemUsageStats(period: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalRequests: number;
    totalUsers: number;
    averageResponseTime: number;
    errorRate: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    const supabase = await createClient();

    // Calculate period start
    const periodStart = new Date();
    switch (period) {
      case 'hour':
        periodStart.setHours(periodStart.getHours() - 1);
        break;
      case 'day':
        periodStart.setDate(periodStart.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7);
        break;
    }

    const { data, error } = await supabase
      .from('usage_logs')
      .select('user_id, action, processing_time_ms')
      .gte('created_at', periodStart.toISOString());

    if (error) {
      console.error('Failed to get system usage stats:', error);
      return {
        totalRequests: 0,
        totalUsers: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topActions: [],
      };
    }

    const totalRequests = data.length;
    const uniqueUsers = new Set(data.map(log => log.user_id));
    const totalUsers = uniqueUsers.size;

    const validResponseTimes = data
      .map(log => log.processing_time_ms)
      .filter(time => time && time > 0);

    const averageResponseTime = validResponseTimes.length > 0
      ? validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length
      : 0;

    // Top actions
    const actionCount: Record<string, number> = {};
    data.forEach(log => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCount)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests,
      totalUsers,
      averageResponseTime,
      errorRate: 0, // Would need error logs to calculate
      topActions,
    };
  }

  /**
   * Block user for exceeding rate limits
   */
  private async blockUser(userId: string, durationMs: number): Promise<void> {
    const supabase = await createClient();
    const blockedUntil = new Date(Date.now() + durationMs);

    const { error } = await supabase
      .from('user_blocks')
      .upsert({
        user_id: userId,
        blocked_until: blockedUntil,
        reason: 'rate_limit_exceeded',
      });

    if (error) {
      console.error('Failed to block user:', error);
    }
  }

  /**
   * Update user's quota usage
   */
  private async updateUserQuota(userId: string, action: string): Promise<void> {
    // This would update a user's quota counter
    // For now, we'll rely on counting from usage_logs
  }

  /**
   * Get rate limit config for specific action
   */
  private getConfigForAction(action: string): RateLimitConfig {
    const configs: Record<string, RateLimitConfig> = {
      summarize: { windowMs: 60 * 1000, maxRequests: 10 },
      upload: { windowMs: 60 * 1000, maxRequests: 5 },
      feedback: { windowMs: 60 * 1000, maxRequests: 20 },
      default: this.defaultConfig,
    };

    return configs[action] || configs.default;
  }

  /**
   * Calculate cost for usage (simplified)
   */
  private calculateCost(tokens: number, action: string): number {
    const rates: Record<string, number> = {
      summarize: 0.0001, // $0.0001 per token
      upload: 0.00005,
      feedback: 0.00001,
    };

    return tokens * (rates[action] || rates.summarize);
  }

  /**
   * Get next month reset date
   */
  private getNextMonthReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}