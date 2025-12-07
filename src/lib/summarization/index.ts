/**
 * Advanced AI Summarizer Library
 * Universal algorithms for text summarization, paraphrasing, and analysis
 *
 * This library provides production-grade summarization capabilities that can be
 * reused across different products and services.
 */

// Core Types
export * from './types';

// Core Services
// Temporarily commented out due to TypeScript compilation issues
// export { InputHandler } from './input-handler';
// export { TextProcessor } from './text-processor';
// export { SummarizationEngine } from './summarization-engine';
// export { PostProcessor } from './post-processor';
// export { EvaluationEngine } from './evaluation';
// export { FeedbackManager } from './feedback-manager';
// export { CostOptimizer } from './cost-optimizer';
// export { ModelRegistry } from './model-registry';
// export { RateLimiter } from './rate-limiter';
// export { ErrorMonitor } from './error-monitor';
// export { RealTimeProcessor } from './real-time-processor';
// export { DatabaseOptimizer } from './database-optimizer';
// export { APIGateway } from './api-gateway';
// export { SecurityManager } from './security-manager';
// export { PerformanceDashboard } from './performance-dashboard';

// Utilities
export { CacheManager } from './cache';
export { ModelManager } from './model-manager';

// Main Summarizer Class
export { AdvancedSummarizer } from './summarizer';

// Constants
export const SUMMARIZATION_CONSTANTS = {
  MAX_TEXT_LENGTH: 50000,
  MAX_SUMMARY_LENGTH: 1000,
  DEFAULT_COMPRESSION_RATIO: 0.3,
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  BATCH_SIZE: 5,
  MAX_CONCURRENT_REQUESTS: 10,
} as const;

// Utility Functions
export { calculateCompressionRatio } from './utils/metrics';
export { validateSummarizationConfig } from './utils/validation';
export { generateCacheKey } from './utils/cache';

// Re-export commonly used types for convenience
export type {
  SummarizationConfig,
  SummaryResult,
  DocumentMetadata,
  ProcessedDocument,
  FeedbackData,
  ModelVariant,
} from './types';