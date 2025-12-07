/**
 * Security Manager Service
 * Comprehensive security measures including input sanitization, content filtering, and data protection
 */

import { createClient } from '@/lib/supabase/server';

interface SecurityConfig {
  maxInputLength: number;
  allowedFileTypes: string[];
  blockedKeywords: string[];
  contentFiltering: boolean;
  encryptionEnabled: boolean;
  auditLogging: boolean;
}

interface SanitizationResult {
  sanitized: string;
  warnings: string[];
  blocked: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ContentAnalysis {
  containsPII: boolean;
  containsHarmful: boolean;
  containsSpam: boolean;
  riskScore: number;
  flaggedContent: string[];
}

export class SecurityManager {
  private config: SecurityConfig = {
    maxInputLength: 50000,
    allowedFileTypes: ['.txt', '.pdf', '.docx', '.html', '.md'],
    blockedKeywords: [
      'password', 'credit card', 'social security', 'ssn',
      'confidential', 'classified', 'secret', 'internal use only'
    ],
    contentFiltering: true,
    encryptionEnabled: true,
    auditLogging: true,
  };

  private readonly harmfulPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /<object[^>]*>[\s\S]*?<\/object>/gi,
    /<embed[^>]*>[\s\S]*?<\/embed>/gi,
  ];

  private readonly spamPatterns = [
    /\b(?:viagra|casino|lottery|winner|prize)\b/gi,
    /(?:http|https|www\.)\S+/gi, // URLs
    /\b\d{10,}\b/g, // Long numbers (potential phone numbers)
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Emails
  ];

  private readonly piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
    /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g, // Phone number
    /\b\d{5}(?:[-\s]\d{4})?\b/g, // ZIP code
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // Dates
  ];

  /**
   * Sanitize input text
   */
  sanitizeInput(input: string, context: 'text' | 'file' | 'url' = 'text'): SanitizationResult {
    let sanitized = input;
    const warnings: string[] = [];
    let blocked = false;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Length validation
    if (input.length > this.config.maxInputLength) {
      warnings.push(`Input exceeds maximum length of ${this.config.maxInputLength} characters`);
      riskLevel = 'medium';
      sanitized = input.substring(0, this.config.maxInputLength);
    }

    // Remove harmful content
    for (const pattern of this.harmfulPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
        warnings.push('Potentially harmful content removed');
        riskLevel = 'high';
      }
    }

    // Check for blocked keywords
    for (const keyword of this.config.blockedKeywords) {
      if (sanitized.toLowerCase().includes(keyword.toLowerCase())) {
        warnings.push(`Content contains blocked keyword: ${keyword}`);
        riskLevel = 'high';
      }
    }

    // Content analysis
    const analysis = this.analyzeContent(sanitized);
    if (analysis.containsHarmful) {
      warnings.push('Content flagged as potentially harmful');
      riskLevel = 'critical';
      blocked = true;
    }

    if (analysis.containsPII) {
      warnings.push('Content may contain personally identifiable information');
      riskLevel = 'high';
    }

    if (analysis.containsSpam) {
      warnings.push('Content flagged as potential spam');
      riskLevel = 'medium';
    }

    // Log security event
    if (warnings.length > 0) {
      this.logSecurityEvent('input_sanitization', {
        context,
        originalLength: input.length,
        sanitizedLength: sanitized.length,
        warnings,
        riskLevel,
        blocked,
      });
    }

    return {
      sanitized,
      warnings,
      blocked,
      riskLevel,
    };
  }

  /**
   * Analyze content for security risks
   */
  private analyzeContent(content: string): ContentAnalysis {
    const lowerContent = content.toLowerCase();
    const flaggedContent: string[] = [];

    let containsPII = false;
    let containsHarmful = false;
    let containsSpam = false;
    let riskScore = 0;

    // Check PII patterns
    for (const pattern of this.piiPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        containsPII = true;
        riskScore += 30;
        flaggedContent.push(...matches.slice(0, 3)); // Limit flagged items
      }
    }

    // Check harmful patterns
    for (const pattern of this.harmfulPatterns) {
      if (pattern.test(content)) {
        containsHarmful = true;
        riskScore += 50;
        break; // One harmful pattern is enough
      }
    }

    // Check spam patterns
    for (const pattern of this.spamPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) { // Multiple spam indicators
        containsSpam = true;
        riskScore += 20;
        break;
      }
    }

    // Additional risk scoring
    if (content.length > 10000) riskScore += 10; // Long content
    if (lowerContent.includes('confidential') || lowerContent.includes('internal')) riskScore += 15;

    return {
      containsPII,
      containsHarmful,
      containsSpam,
      riskScore: Math.min(riskScore, 100),
      flaggedContent,
    };
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File): {
    valid: boolean;
    errors: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // File type validation
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.config.allowedFileTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not allowed`);
      riskLevel = 'high';
    }

    // File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`File size ${file.size} exceeds maximum of ${maxSize} bytes`);
      riskLevel = 'medium';
    }

    // File name validation
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
      riskLevel = 'high';
    }

    // MIME type validation
    const allowedMimeTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/html',
      'text/markdown',
    ];

    if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
      errors.push(`MIME type ${file.type} is not allowed`);
      riskLevel = 'medium';
    }

    return {
      valid: errors.length === 0,
      errors,
      riskLevel,
    };
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return data;
    }

    // In production, use proper encryption
    // For now, use base64 as placeholder
    try {
      return btoa(data);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return encryptedData;
    }

    // In production, use proper decryption
    // For now, use base64 as placeholder
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  /**
   * Generate secure API key
   */
  generateSecureApiKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    userId?: string;
    permissions?: string[];
  }> {
    if (!apiKey || apiKey.length !== 64) {
      return { valid: false };
    }

    try {
      const supabase = await createClient();

      // Check if API key exists and is active
      const { data, error } = await supabase
        .from('api_keys')
        .select('user_id, permissions, expires_at, revoked')
        .eq('key_hash', await this.hashApiKey(apiKey))
        .single();

      if (error || !data) {
        return { valid: false };
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false };
      }

      // Check if revoked
      if (data.revoked) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: data.user_id,
        permissions: data.permissions || [],
      };
    } catch (error) {
      console.error('API key validation failed:', error);
      return { valid: false };
    }
  }

  /**
   * Hash API key for storage
   */
  private async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check IP-based rate limiting
   */
  async checkIPRateLimit(ipAddress: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    const supabase = await createClient();

    // Get recent requests from this IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo.toISOString());

    if (error) {
      console.error('IP rate limit check failed:', error);
      return { allowed: true, remaining: 100, resetTime: new Date(Date.now() + 3600000) };
    }

    const maxRequestsPerHour = 100;
    const requestCount = data.length;
    const remaining = Math.max(0, maxRequestsPerHour - requestCount);
    const allowed = requestCount < maxRequestsPerHour;

    return {
      allowed,
      remaining,
      resetTime: new Date(Date.now() + 3600000),
    };
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    eventType: string,
    details: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.auditLogging) return;

    try {
      const supabase = await createClient();

      await supabase
        .from('security_logs')
        .insert({
          event_type: eventType,
          details,
          ip_address: details.ipAddress as string,
          user_agent: details.userAgent as string,
          created_at: new Date(),
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalEvents: number;
    blockedRequests: number;
    highRiskContent: number;
    topThreats: Array<{ type: string; count: number }>;
  }> {
    const supabase = await createClient();

    // Calculate time range
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
    }

    const { data, error } = await supabase
      .from('security_logs')
      .select('event_type, details')
      .gte('created_at', startTime.toISOString());

    if (error) {
      console.error('Failed to get security stats:', error);
      return {
        totalEvents: 0,
        blockedRequests: 0,
        highRiskContent: 0,
        topThreats: [],
      };
    }

    const totalEvents = data.length;
    const blockedRequests = data.filter(log => log.details?.blocked === true).length;
    const highRiskContent = data.filter(log =>
      (log.details as any)?.riskLevel === 'high' || (log.details as any)?.riskLevel === 'critical'
    ).length;

    // Top threats
    const threatCount: Record<string, number> = {};
    data.forEach(log => {
      const type = log.event_type;
      threatCount[type] = (threatCount[type] || 0) + 1;
    });

    const topThreats = Object.entries(threatCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents,
      blockedRequests,
      highRiskContent,
      topThreats,
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}