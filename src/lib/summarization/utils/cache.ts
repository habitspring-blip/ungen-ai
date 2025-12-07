/**
 * Cache Utilities
 * Cache key generation and management functions
 */

/**
 * Generate cache key from input parameters
 */
export function generateCacheKey(input: string, config: Record<string, any>): string {
  // Create a deterministic key from input and config
  const inputHash = simpleHash(input);
  const configHash = simpleHash(JSON.stringify(config));

  return `summary:${inputHash}:${configHash}`;
}

/**
 * Generate cache key for API responses
 */
export function generateApiCacheKey(method: string, path: string, params: Record<string, any>): string {
  const paramsHash = simpleHash(JSON.stringify(params));
  return `api:${method}:${path}:${paramsHash}`;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Check if cache entry is expired
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Calculate expiration date
 */
export function getExpirationDate(ttlSeconds: number): Date {
  return new Date(Date.now() + ttlSeconds * 1000);
}

/**
 * Get cache TTL based on content type
 */
export function getCacheTTL(contentType: string): number {
  const ttls: Record<string, number> = {
    'summary': 7 * 24 * 60 * 60, // 7 days
    'analytics': 60 * 60, // 1 hour
    'health': 5 * 60, // 5 minutes
    'user': 24 * 60 * 60, // 1 day
    'model': 6 * 60 * 60, // 6 hours
  };

  return ttls[contentType] || 60 * 60; // Default 1 hour
}

/**
 * Compress cache value for storage
 */
export function compressCacheValue(value: any): string {
  // Simple compression - in production use proper compression
  return JSON.stringify(value);
}

/**
 * Decompress cache value
 */
export function decompressCacheValue(compressed: string): any {
  try {
    return JSON.parse(compressed);
  } catch {
    return null;
  }
}

/**
 * Get cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  size: number;
  avgTTL: number;
}

export function calculateCacheStats(
  hits: number,
  misses: number,
  size: number,
  avgTTL: number
): CacheStats {
  const totalRequests = hits + misses;
  const hitRate = totalRequests > 0 ? hits / totalRequests : 0;

  return {
    hits,
    misses,
    totalRequests,
    hitRate,
    size,
    avgTTL,
  };
}

/**
 * Clean expired cache entries
 */
export function shouldCleanCache(lastCleaned: Date, cleanInterval: number = 60 * 60 * 1000): boolean {
  return Date.now() - lastCleaned.getTime() > cleanInterval;
}

/**
 * Get cache priority for eviction
 */
export function getCachePriority(accessCount: number, lastAccessed: Date, ttl: number): number {
  const age = Date.now() - lastAccessed.getTime();
  const timeToLive = ttl * 1000;

  // Priority based on access frequency and remaining TTL
  const accessScore = Math.log(accessCount + 1);
  const ttlScore = 1 - (age / timeToLive);

  return accessScore * 0.7 + ttlScore * 0.3;
}