/**
 * Validation Utilities
 * Input validation and sanitization functions
 */

import type { DocumentMetadata, SummarizationConfig } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate document input
 */
export function validateDocumentInput(text: string, fileName?: string): DocumentMetadata {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!text || typeof text !== 'string') {
    errors.push('Text must be a non-empty string');
  }

  if (text && text.length === 0) {
    errors.push('Text cannot be empty');
  }

  if (text && text.length > 50000) {
    warnings.push('Text exceeds recommended length of 50,000 characters');
  }

  // Calculate word count
  const wordCount = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;

  // Estimate reading time (average 200 words per minute)
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  // Basic language detection (placeholder)
  const language = 'en'; // Would use proper language detection

  // Calculate basic metrics
  const sentenceCount = text ? (text.match(/[.!?]+/g) || []).length : 0;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  return {
    wordCount,
    sentenceCount,
    characterCount: text?.length || 0,
    language,
    readingTimeMinutes,
    avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
    fileName: fileName || 'untitled.txt',
    fileSize: text?.length || 0,
    mimeType: getMimeType(fileName),
    createdAt: new Date(),
    checksum: generateChecksum(text),
  };
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string): boolean {
  if (!fileName) return false;

  const extension = fileName.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['txt', 'pdf', 'docx', 'html', 'md', 'rtf'];

  return allowedExtensions.includes(extension || '');
}

/**
 * Validate summarization configuration
 */
export function validateSummarizationConfig(config: Partial<SummarizationConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Mode validation
  if (config.mode && !['extractive', 'abstractive', 'hybrid', 'paraphrase'].includes(config.mode)) {
    errors.push('Invalid summarization mode');
  }

  // Quality validation
  if (config.quality && !['standard', 'premium', 'creative'].includes(config.quality)) {
    errors.push('Invalid quality setting');
  }

  // Tone validation
  if (config.tone && !['formal', 'casual', 'academic', 'simple', 'neutral'].includes(config.tone)) {
    errors.push('Invalid tone setting');
  }

  // Length validation
  if (config.length && !['short', 'medium', 'long', 'custom'].includes(config.length)) {
    errors.push('Invalid length setting');
  }

  // Custom length validation
  if (config.length === 'custom') {
    if (!config.maxLength || config.maxLength < 10) {
      errors.push('Custom length requires maxLength of at least 10');
    }
    if (config.maxLength && config.maxLength > 1000) {
      warnings.push('Custom maxLength exceeds recommended limit of 1000');
    }
  }

  // Compression ratio validation
  if (config.compressionRatio !== undefined) {
    if (config.compressionRatio < 0.1 || config.compressionRatio > 1.0) {
      errors.push('Compression ratio must be between 0.1 and 1.0');
    }
  }

  // Focus keywords validation
  if (config.focusKeywords && config.focusKeywords.length > 10) {
    warnings.push('Too many focus keywords may reduce summarization quality');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get MIME type from filename
 */
function getMimeType(fileName?: string): string {
  if (!fileName) return 'text/plain';

  const extension = fileName.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'html': 'text/html',
    'htm': 'text/html',
    'md': 'text/markdown',
    'rtf': 'application/rtf',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Generate checksum for content
 */
function generateChecksum(text: string): string {
  // Simple checksum - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // API key should be 64 character hex string
  return /^[a-f0-9]{64}$/i.test(apiKey);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize text input
 */
export function sanitizeTextInput(text: string): string {
  if (!text) return '';

  // Remove excessive whitespace
  let sanitized = text.replace(/\s+/g, ' ').trim();

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Limit length
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000);
  }

  return sanitized;
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}