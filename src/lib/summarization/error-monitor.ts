/**
 * Error Handling and Monitoring Service
 * Comprehensive error classification, logging, and alerting system
 */

import { createClient } from '@/lib/supabase/server';

interface ErrorContext {
  userId?: string;
  action: string;
  component: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

interface ErrorClassification {
  type: 'network' | 'validation' | 'processing' | 'external_api' | 'database' | 'authentication' | 'rate_limit' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
  internalMessage: string;
}

export class ErrorMonitor {
  private errorCounts = new Map<string, { count: number; lastOccurrence: Date }>();
  private alertThresholds = {
    errorRate: 0.05, // 5% error rate triggers alert
    consecutiveErrors: 5,
    criticalErrors: 1,
  };

  /**
   * Handle and classify errors
   */
  async handleError(error: Error, context: ErrorContext): Promise<{
    classification: ErrorClassification;
    shouldRetry: boolean;
    logId: string;
  }> {
    const classification = this.classifyError(error, context);
    const shouldRetry = this.shouldRetryError(classification, context);

    // Log error
    const logId = await this.logError(error, classification, context);

    // Update error counts
    this.updateErrorCounts(classification.type);

    // Check for alerts
    await this.checkAlerts(classification, context);

    // Trigger recovery actions if needed
    if (classification.severity === 'critical') {
      await this.triggerCriticalAlert(error, context);
    }

    return { classification, shouldRetry, logId };
  }

  /**
   * Classify error type and severity
   */
  private classifyError(error: Error, context: ErrorContext): ErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') ||
        errorMessage.includes('timeout') || errorName.includes('aborterror')) {
      return {
        type: 'network',
        severity: 'medium',
        retryable: true,
        userMessage: 'Network connection issue. Please try again.',
        internalMessage: 'Network connectivity problem',
      };
    }

    // API errors
    if (errorMessage.includes('api') || errorMessage.includes('anthropic') ||
        errorMessage.includes('huggingface') || errorMessage.includes('claude')) {
      return {
        type: 'external_api',
        severity: errorMessage.includes('rate limit') ? 'medium' : 'high',
        retryable: !errorMessage.includes('authentication') && !errorMessage.includes('quota'),
        userMessage: 'AI service temporarily unavailable. Please try again.',
        internalMessage: 'External API failure',
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') ||
        errorMessage.includes('required') || errorMessage.includes('length')) {
      return {
        type: 'validation',
        severity: 'low',
        retryable: false,
        userMessage: 'Please check your input and try again.',
        internalMessage: 'Input validation failed',
      };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('supabase') ||
        errorMessage.includes('postgres') || errorName.includes('postgerror')) {
      return {
        type: 'database',
        severity: 'high',
        retryable: true,
        userMessage: 'Service temporarily unavailable. Please try again.',
        internalMessage: 'Database connectivity or query issue',
      };
    }

    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') || errorMessage.includes('token')) {
      return {
        type: 'authentication',
        severity: 'medium',
        retryable: false,
        userMessage: 'Please log in again.',
        internalMessage: 'Authentication or authorization failure',
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota') ||
        errorMessage.includes('too many requests')) {
      return {
        type: 'rate_limit',
        severity: 'low',
        retryable: true,
        userMessage: 'Too many requests. Please wait and try again.',
        internalMessage: 'Rate limit exceeded',
      };
    }

    // Processing errors
    if (errorMessage.includes('processing') || errorMessage.includes('algorithm') ||
        context.component === 'summarization-engine') {
      return {
        type: 'processing',
        severity: 'medium',
        retryable: true,
        userMessage: 'Processing failed. Please try again.',
        internalMessage: 'Algorithm or processing error',
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      severity: 'medium',
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
      internalMessage: 'Unclassified error',
    };
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetryError(classification: ErrorClassification, context: ErrorContext): boolean {
    if (!classification.retryable) return false;

    // Don't retry certain actions
    const nonRetryableActions = ['authentication', 'validation'];
    if (nonRetryableActions.includes(context.action)) return false;

    // Implement exponential backoff logic
    return true;
  }

  /**
   * Log error to database
   */
  private async logError(
    error: Error,
    classification: ErrorClassification,
    context: ErrorContext
  ): Promise<string> {
    const supabase = await createClient();

    const logId = crypto.randomUUID();

    const { error: logError } = await supabase
      .from('error_logs')
      .insert({
        id: logId,
        user_id: context.userId,
        error_type: classification.type,
        severity: classification.severity,
        component: context.component,
        action: context.action,
        message: error.message,
        stack_trace: error.stack,
        correlation_id: context.correlationId,
        metadata: context.metadata,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        ip_address: context.metadata?.ipAddress as string,
      });

    if (logError) {
      console.error('Failed to log error:', logError);
    }

    return logId;
  }

  /**
   * Update error count tracking
   */
  private updateErrorCounts(errorType: string): void {
    const existing = this.errorCounts.get(errorType);
    const now = new Date();

    if (existing) {
      existing.count++;
      existing.lastOccurrence = now;
    } else {
      this.errorCounts.set(errorType, { count: 1, lastOccurrence: now });
    }
  }

  /**
   * Check if alerts should be triggered
   */
  private async checkAlerts(classification: ErrorClassification, context: ErrorContext): Promise<void> {
    // Check consecutive errors
    const errorType = classification.type;
    const errorCount = this.errorCounts.get(errorType);

    if (errorCount && errorCount.count >= this.alertThresholds.consecutiveErrors) {
      await this.triggerAlert('consecutive_errors', {
        errorType,
        count: errorCount.count,
        lastOccurrence: errorCount.lastOccurrence,
        component: context.component,
      });
    }

    // Check error rate (simplified - would need total request count)
    // This would be implemented with proper metrics collection
  }

  /**
   * Trigger critical alert
   */
  private async triggerCriticalAlert(error: Error, context: ErrorContext): Promise<void> {
    console.error('CRITICAL ERROR:', {
      error: error.message,
      stack: error.stack,
      context,
    });

    // In production, this would:
    // 1. Send alerts to monitoring systems (DataDog, Sentry, etc.)
    // 2. Notify on-call engineers
    // 3. Trigger automatic mitigation actions
    // 4. Log to external monitoring services

    await this.triggerAlert('critical_error', {
      error: error.message,
      component: context.component,
      action: context.action,
      userId: context.userId,
      correlationId: context.correlationId,
    });
  }

  /**
   * Trigger general alert
   */
  private async triggerAlert(alertType: string, data: Record<string, unknown>): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('alerts')
      .insert({
        id: crypto.randomUUID(),
        alert_type: alertType,
        severity: 'high',
        message: `Alert: ${alertType}`,
        data,
        created_at: new Date(),
      });

    if (error) {
      console.error('Failed to create alert:', error);
    }

    // In production, also send to external monitoring
    console.warn('ALERT TRIGGERED:', alertType, data);
  }

  /**
   * Get error statistics
   */
  async getErrorStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByComponent: Record<string, number>;
    topErrors: Array<{ message: string; count: number }>;
    errorRate: number;
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
      .from('error_logs')
      .select('error_type, component, message')
      .gte('created_at', startTime.toISOString());

    if (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsByComponent: {},
        topErrors: [],
        errorRate: 0,
      };
    }

    const totalErrors = data.length;

    // Count by type
    const errorsByType: Record<string, number> = {};
    data.forEach(log => {
      errorsByType[log.error_type] = (errorsByType[log.error_type] || 0) + 1;
    });

    // Count by component
    const errorsByComponent: Record<string, number> = {};
    data.forEach(log => {
      errorsByComponent[log.component] = (errorsByComponent[log.component] || 0) + 1;
    });

    // Top errors
    const errorMessages: Record<string, number> = {};
    data.forEach(log => {
      errorMessages[log.message] = (errorMessages[log.message] || 0) + 1;
    });

    const topErrors = Object.entries(errorMessages)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate error rate (simplified - would need total request count)
    const errorRate = 0; // Placeholder

    return {
      totalErrors,
      errorsByType,
      errorsByComponent,
      topErrors,
      errorRate,
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    errorRate: number;
    lastError: Date | null;
    issues: string[];
  }> {
    const stats = await this.getErrorStats('hour');

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check error rate
    if (stats.errorRate > 0.1) {
      status = 'unhealthy';
      issues.push('High error rate detected');
    } else if (stats.errorRate > 0.05) {
      status = 'degraded';
      issues.push('Elevated error rate');
    }

    // Check for critical components
    const criticalComponents = ['summarization-engine', 'input-handler'];
    for (const component of criticalComponents) {
      const componentErrors = stats.errorsByComponent[component] || 0;
      if (componentErrors > 10) {
        status = 'unhealthy';
        issues.push(`High error count in ${component}`);
      }
    }

    return {
      status,
      uptime: Date.now(), // Would track actual uptime
      errorRate: stats.errorRate,
      lastError: null, // Would track from logs
      issues,
    };
  }

  /**
   * Create error boundary for React components
   */
  createErrorBoundary(componentName: string) {
    return class ErrorBoundary extends Error {
      constructor(error: Error, errorInfo: { componentStack: string }) {
        super(error.message);
        this.name = 'ReactErrorBoundary';

        // Log React errors
        this.handleError(error, {
          action: 'render',
          component: componentName,
          metadata: { componentStack: errorInfo.componentStack },
          timestamp: new Date(),
          correlationId: crypto.randomUUID(),
        });
      }

      handleError = this.handleError.bind(this);
    };
  }
}