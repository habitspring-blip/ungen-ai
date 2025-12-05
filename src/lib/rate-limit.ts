import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Create Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute per IP
  analytics: true,
  prefix: 'rate-limit',
});

// Helper function to extract IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Different rate limits for different endpoints
export const rateLimitConfigs = {
  // AI Detection - more restrictive
  aiDetect: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 detections per minute
    message: 'Too many AI detection requests. Please wait before trying again.'
  },
  
  // Payment endpoints - most restrictive
  payments: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 payment attempts per minute
    message: 'Too many payment requests. Please wait before trying again.'
  },
  
  // General API - standard limit
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Too many requests. Please wait before trying again.'
  },
  
  // Health checks - very permissive
  health: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 health checks per minute
    message: 'Rate limit exceeded for health checks.'
  }
};

// Create specific rate limiters for different use cases
export const aiDetectLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(rateLimitConfigs.aiDetect.maxRequests, `${rateLimitConfigs.aiDetect.windowMs} ms`),
  analytics: true,
  prefix: 'rate-limit-ai',
});

export const paymentsLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(rateLimitConfigs.payments.maxRequests, `${rateLimitConfigs.payments.windowMs} ms`),
  analytics: true,
  prefix: 'rate-limit-payments',
});

export const healthLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(rateLimitConfigs.health.maxRequests, `${rateLimitConfigs.health.windowMs} ms`),
  analytics: true,
  prefix: 'rate-limit-health',
});

// Environment validation for rate limiting
export function validateRateLimitConfig() {
  const requiredEnvVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Rate limiting environment variables missing:', missing);
    return false;
  }
  
  return true;
}