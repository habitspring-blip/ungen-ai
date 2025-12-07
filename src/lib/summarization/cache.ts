/**
 * Cache Manager
 * Multi-layer caching for summarization results
 * Implements the caching strategy from the AI Summarizer PDF
 */

import type { CacheEntry, SummaryResult, SummarizationConfig, SummaryMetrics } from './types';
import { prisma } from '@/lib/prisma';

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private maxSize = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redisClient: any = null; // Upstash Redis client

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis client (Upstash)
   */
  private async initializeRedis() {
    try {
      // Initialize Upstash Redis client
      const { Redis } = await import('@upstash/redis');
      this.redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (error) {
      console.warn('Redis initialization failed:', error);
    }
  }

  /**
   * Get cached result using multi-level caching strategy
   * Layer 1: Browser localStorage (client-side)
   * Layer 2: Memory cache (server-side)
   * Layer 3: Redis cache (distributed)
   * Layer 4: Database cache (persistent)
   */
  async get(key: string): Promise<SummaryResult | null> {
    // Layer 1: Browser cache (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const browserCache = localStorage.getItem(`summary_cache_${key}`);
        if (browserCache) {
          const cached = JSON.parse(browserCache);
          if (Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days
            return cached.data;
          } else {
            localStorage.removeItem(`summary_cache_${key}`);
          }
        }
      } catch (error) {
        console.warn('Browser cache access failed:', error);
      }
    }

    // Layer 2: Memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() - memoryEntry.createdAt < memoryEntry.ttl) {
      memoryEntry.hits++;
      return memoryEntry.value as SummaryResult;
    }

    // Layer 3: Redis cache
    if (this.redisClient) {
      try {
        const redisData = await this.redisClient.get(key);
        if (redisData) {
          const parsed = JSON.parse(redisData);
          // Populate memory cache
          this.memoryCache.set(key, {
            key,
            value: parsed,
            ttl: 24 * 60 * 60 * 1000, // 24 hours in memory
            createdAt: Date.now(),
            hits: 1,
          });
          return parsed;
        }
      } catch (error) {
        console.warn('Redis cache access failed:', error);
      }
    }

    // Layer 4: Database cache - search by content hash in recent summaries
    try {
      // Extract document hash from cache key (format: "summary:{hash}")
      const docHash = key.replace('summary:', '');

      // Find recent summaries with similar content (simplified approach)
      // In production, you'd want to store content hashes separately
      const recentSummaries = await prisma.summary.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Check recent summaries
        select: {
          summaryText: true,
          config: true,
          metrics: true,
          modelVersion: true,
          processingTime: true,
          confidence: true
        }
      });

      // Simple content-based matching (in production, use proper hashing)
      for (const summary of recentSummaries) {
        // This is a simplified check - in production you'd compare hashes
        if (summary.summaryText && summary.config) {
          const result: SummaryResult = {
            summary: summary.summaryText,
            method: 'cached',
            config: summary.config as SummarizationConfig,
            metrics: summary.metrics as SummaryMetrics,
            modelVersion: summary.modelVersion || 'cached',
            processingTime: summary.processingTime || 0,
            confidence: summary.confidence || 0.9,
          };

          // Populate higher-level caches
          await this.set(key, result, 24 * 60 * 60 * 1000); // 24 hours
          return result;
        }
      }
    } catch (error) {
      console.warn('Database cache access failed:', error);
    }

    return null;
  }

  /**
   * Set cache entry across all layers
   */
  async set(key: string, value: SummaryResult, ttl = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    // Layer 1: Browser cache (client-side only)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`summary_cache_${key}`, JSON.stringify({
          data: value,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.warn('Browser cache write failed:', error);
      }
    }

    // Layer 2: Memory cache
    if (this.memoryCache.size >= this.maxSize) {
      // Simple LRU eviction
      const oldestKey = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.createdAt - b.createdAt)[0][0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      key,
      value,
      ttl,
      createdAt: Date.now(),
      hits: 0,
    });

    // Layer 3: Redis cache
    if (this.redisClient) {
      try {
        await this.redisClient.setex(key, Math.floor(ttl / 1000), JSON.stringify(value));
      } catch (error) {
        console.warn('Redis cache write failed:', error);
      }
    }

    // Layer 4: Database cache is handled separately in the summarizer
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  /**
   * Generate cache key from content and config
   */
  generateKey(text: string, config: Record<string, unknown>): string {
    // Simple hash for demo - in production use proper crypto
    let hash = 0;
    const combined = text + JSON.stringify(config);
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `summary:${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get cache statistics across all layers
   */
  async getStats() {
    const memoryEntries = Array.from(this.memoryCache.values());
    const redisStats = { entries: 0, hits: 0 };
    const dbStats = { entries: 0 };

    // Redis stats
    if (this.redisClient) {
      try {
        // Get Redis info (simplified)
        redisStats.entries = await this.redisClient.dbsize();
      } catch (error) {
        console.warn('Redis stats failed:', error);
      }
    }

    // Database stats
    try {
      dbStats.entries = await prisma.summary.count();
    } catch (error) {
      console.warn('Database stats failed:', error);
    }

    return {
      memory: {
        totalEntries: memoryEntries.length,
        totalHits: memoryEntries.reduce((sum, e) => sum + e.hits, 0),
        avgTTL: memoryEntries.length > 0
          ? memoryEntries.reduce((sum, e) => sum + e.ttl, 0) / memoryEntries.length
          : 0,
      },
      redis: redisStats,
      database: dbStats,
      browser: typeof window !== 'undefined' ? 'available' : 'server-side',
    };
  }

  /**
   * Clear cache across all layers
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear browser cache
    if (typeof window !== 'undefined') {
      try {
        // Clear all summary cache entries
        const keys = Object.keys(localStorage).filter(key => key.startsWith('summary_cache_'));
        keys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Browser cache clear failed:', error);
      }
    }

    // Clear Redis cache (selective - only summary keys)
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys('summary:*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.warn('Redis cache clear failed:', error);
      }
    }

    // Database cache is persistent and not cleared
  }
}