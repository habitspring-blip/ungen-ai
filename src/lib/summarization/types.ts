/**
 * Core Types for AI Summarization System
 */

export interface DocumentMetadata {
  id?: string;
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  language: string;
  readingTimeMinutes: number;
  avgSentenceLength: number;
  fileName: string;
  fileSize: number;
  fileType?: string;
  mimeType: string;
  originalLength?: number;
  createdAt: Date;
  checksum: string;
  uploadTime?: Date;
}

export interface NamedEntity {
  text: string;
  type: 'PERSON' | 'ORG' | 'GPE' | 'DATE' | 'MONEY' | 'PERCENT' | 'TIME' | 'QUANTITY' | 'ORDINAL' | 'CARDINAL' | 'MISC';
  confidence: number;
  start: number;
  end: number;
}

export interface ExtractiveSentence {
  sentence: string;
  score: number;
  index: number;
  position: number;
  length: number;
  entities: number;
}

export interface DocumentStats {
  totalDocuments: number;
  processedDocuments: number;
  averageProcessingTime: number;
  totalTokens: number;
  languageDistribution: Record<string, number>;
}

export interface EvaluationResult {
  rouge1: number;
  rouge2: number;
  rougeL: number;
  bleu: number;
  semanticSimilarity: number;
  coherence: number;
  compressionRatio: number;
  entityPreservation: number;
  factualConsistency: number;
  overallScore: number;
}

export interface ProcessedDocument {
  id: string;
  originalText: string;
  sentences: string[];
  tokens: string[];
  entities: NamedEntity[];
  embeddings: Array<{
    sentence: string;
    embedding: number[];
    position: number;
    length: number;
  }>;
  metadata: DocumentMetadata;
  processedAt: Date;
}

export interface SummarizationConfig {
  mode: 'extractive' | 'abstractive' | 'hybrid' | 'paraphrase';
  quality: 'standard' | 'premium' | 'creative';
  tone: 'formal' | 'casual' | 'academic' | 'simple' | 'neutral';
  length: 'short' | 'medium' | 'long' | 'custom';
  intent?: 'summarize' | 'grammar' | 'simplify' | 'humanize' | 'expand';
  compressionRatio?: number;
  maxLength?: number;
  minLength?: number;
  focus?: string[];
  focusKeywords?: string[];
  outputFormat?: 'paragraphs' | 'bullets';
  temperature?: number;
  model?: string;
}

export interface SummaryMetrics {
  compressionRatio: number;
  wordCount: number;
  sentenceCount: number;
  readabilityScore: number;
  coherence?: number;
  processingTime: number;
  confidence: number;
  rouge1?: number;
  rouge2?: number;
  rougeL?: number;
  bleu?: number;
  semanticSimilarity?: number;
}

export interface SummaryResult {
  summary: string;
  method: string;
  config: SummarizationConfig;
  metrics: SummaryMetrics;
  modelVersion: string;
  processingTime: number;
  confidence: number;
}

export interface FeedbackData {
  summaryId: string;
  userId: string;
  rating: number; // 1-5
  type?: 'useful' | 'incomplete' | 'too_technical' | 'too_simple' | 'factual_error' | 'other';
  feedbackType: 'useful' | 'incomplete' | 'too_technical' | 'too_simple' | 'factual_error' | 'other';
  editedSummary?: string;
  comments?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ModelVariant {
  id: string;
  name: string;
  type: 'extractive' | 'abstractive' | 'hybrid';
  version: string;
  endpoint: string;
  config: Record<string, any>;
  performance: {
    avgProcessingTime: number;
    accuracy: number;
    cost: number;
    lastUsed: Date;
    quality?: number;
    speed?: number;
  };
  provider?: string;
  modelId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
}

export interface UsageLog {
  id: string;
  userId: string;
  action: string;
  documentId?: string;
  summaryId?: string;
  processingTimeMs?: number;
  tokensUsed?: number;
  cost?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ErrorLog {
  id: string;
  userId?: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  action?: string;
  message: string;
  stackTrace?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  resolved: boolean;
  createdAt: Date;
}

export interface ProcessingJob {
  id: string;
  userId: string;
  jobType: 'summarize' | 'upload' | 'batch' | 'feedback_processing';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  jobData: Record<string, any>;
  resultData?: Record<string, any>;
  errorMessage?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  createdAt: Date;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  cacheHitRate: number;
  cacheMissRate: number;
  totalCost: number;
  costPerRequest: number;
  userSatisfaction: number;
  activeUsers: number;
  requestsPerSecond: number;
  queueLength: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  threshold: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}