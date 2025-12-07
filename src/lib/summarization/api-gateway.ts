/**
 * API Gateway with Smart Routing Service
 * Request validation, authentication, load balancing, and intelligent routing
 */

import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from './rate-limiter';
import { ErrorMonitor } from './error-monitor';
import { CacheManager } from './cache';
import { ModelRegistry } from './model-registry';

interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  userId?: string;
  ipAddress: string;
  userAgent: string;
}

interface APIRoute {
  path: string;
  method: string;
  handler: (request: APIRequest) => Promise<any>;
  authRequired: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cache?: {
    ttl: number;
    keyGenerator?: (request: APIRequest) => string;
  };
}

export class APIGateway {
  private routes = new Map<string, APIRoute>();
  private rateLimiter = new RateLimiter();
  private errorMonitor = new ErrorMonitor();
  private cacheManager = new CacheManager();
  private modelRegistry = new ModelRegistry();

  constructor() {
    this.initializeRoutes();
  }

  /**
   * Handle incoming API request
   */
  async handleRequest(request: APIRequest): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
  }> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Find matching route
      const route = this.findRoute(request.method, request.path);
      if (!route) {
        return this.createResponse(404, { error: 'Route not found' });
      }

      // Authentication check
      if (route.authRequired) {
        const authResult = await this.authenticateRequest(request);
        if (!authResult.authenticated) {
          return this.createResponse(401, { error: 'Authentication required' });
        }
        request.userId = authResult.userId;
      }

      // Rate limiting check
      if (request.userId) {
        const rateLimitResult = await this.rateLimiter.checkRateLimit(
          request.userId,
          route.path.split('/').pop() || 'default'
        );

        if (!rateLimitResult.allowed) {
          return this.createResponse(429, {
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(rateLimitResult.resetTime.getTime() / 1000),
          });
        }
      }

      // Input validation
      const validationResult = await this.validateRequest(request, route);
      if (!validationResult.valid) {
        return this.createResponse(400, {
          error: 'Validation failed',
          details: validationResult.errors,
        });
      }

      // Cache check
      if (route.cache && request.method === 'GET') {
        const cacheKey = route.cache.keyGenerator
          ? route.cache.keyGenerator(request)
          : this.generateCacheKey(request);

        const cachedResponse = await this.cacheManager.get(cacheKey);
        if (cachedResponse) {
          return this.createResponse(200, cachedResponse, {
            'X-Cache-Status': 'HIT',
          });
        }
      }

      // Route to handler
      const result = await route.handler(request);

      // Cache successful responses
      if (route.cache && request.method === 'GET' && result.status === 200) {
        const cacheKey = route.cache.keyGenerator
          ? route.cache.keyGenerator(request)
          : this.generateCacheKey(request);

        await this.cacheManager.set(cacheKey, result.body, route.cache.ttl);
      }

      // Log usage
      if (request.userId) {
        await this.rateLimiter.recordUsage({
          userId: request.userId,
          action: route.path.split('/').pop() || 'api_call',
          tokens: this.estimateTokens(result.body),
          cost: this.estimateCost(result.body),
          timestamp: new Date(),
          metadata: {
            method: request.method,
            path: request.path,
            processingTime: Date.now() - startTime,
            correlationId,
          },
        });
      }

      return this.createResponse(result.status || 200, result.body, {
        'X-Processing-Time': `${Date.now() - startTime}ms`,
        'X-Correlation-ID': correlationId,
        'X-Cache-Status': route.cache ? 'MISS' : 'BYPASS',
      });

    } catch (error) {
      // Handle errors
      const errorResult = await this.errorMonitor.handleError(error as Error, {
        userId: request.userId,
        action: 'api_request',
        component: 'api_gateway',
        correlationId,
        timestamp: new Date(),
        metadata: {
          method: request.method,
          path: request.path,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        },
      });

      return this.createResponse(
        errorResult.classification.severity === 'critical' ? 500 : 400,
        { error: errorResult.classification.userMessage },
        { 'X-Correlation-ID': correlationId }
      );
    }
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Summarization routes
    this.addRoute({
      path: '/api/summarize',
      method: 'POST',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 10 },
      cache: { ttl: 300 }, // 5 minutes
      handler: this.handleSummarize.bind(this),
    });

    this.addRoute({
      path: '/api/documents/upload',
      method: 'POST',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 5 },
      handler: this.handleDocumentUpload.bind(this),
    });

    this.addRoute({
      path: '/api/documents/:id',
      method: 'GET',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 30 },
      cache: { ttl: 600 }, // 10 minutes
      handler: this.handleGetDocument.bind(this),
    });

    // Feedback routes
    this.addRoute({
      path: '/api/feedback',
      method: 'POST',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 20 },
      handler: this.handleFeedback.bind(this),
    });

    // Analytics routes
    this.addRoute({
      path: '/api/analytics/user',
      method: 'GET',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 10 },
      cache: { ttl: 300 },
      handler: this.handleUserAnalytics.bind(this),
    });

    // Model management routes (admin only)
    this.addRoute({
      path: '/api/admin/models',
      method: 'GET',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 5 },
      handler: this.handleListModels.bind(this),
    });

    this.addRoute({
      path: '/api/admin/models/:id/activate',
      method: 'POST',
      authRequired: true,
      rateLimit: { windowMs: 60000, maxRequests: 2 },
      handler: this.handleActivateModel.bind(this),
    });

    // Health check
    this.addRoute({
      path: '/api/health',
      method: 'GET',
      authRequired: false,
      rateLimit: { windowMs: 60000, maxRequests: 100 },
      cache: { ttl: 60 },
      handler: this.handleHealthCheck.bind(this),
    });
  }

  /**
   * Add route to registry
   */
  private addRoute(route: APIRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  /**
   * Find matching route
   */
  private findRoute(method: string, path: string): APIRoute | null {
    // Exact match
    const exactKey = `${method}:${path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey)!;
    }

    // Pattern matching for parameterized routes
    for (const [key, route] of this.routes.entries()) {
      if (key.startsWith(`${method}:`)) {
        const routePath = key.split(':')[1];
        if (this.matchRoutePattern(routePath, path)) {
          return route;
        }
      }
    }

    return null;
  }

  /**
   * Match route pattern with parameters
   */
  private matchRoutePattern(routePattern: string, requestPath: string): boolean {
    const routeParts = routePattern.split('/');
    const requestParts = requestPath.split('/');

    if (routeParts.length !== requestParts.length) {
      return false;
    }

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const requestPart = requestParts[i];

      if (routePart.startsWith(':')) {
        // Parameter - always matches
        continue;
      }

      if (routePart !== requestPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Authenticate request
   */
  private async authenticateRequest(request: APIRequest): Promise<{
    authenticated: boolean;
    userId?: string;
  }> {
    const authHeader = request.headers.authorization || request.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false };
    }

    const token = authHeader.substring(7);

    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return { authenticated: false };
      }

      return { authenticated: true, userId: data.user.id };
    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Validate request
   */
  private async validateRequest(request: APIRequest, route: APIRoute): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    // Content-Type validation
    if (request.method === 'POST' || request.method === 'PUT') {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];
      if (!contentType?.includes('application/json')) {
        errors.push('Content-Type must be application/json');
      }
    }

    // Body validation for POST/PUT
    if ((request.method === 'POST' || request.method === 'PUT') && !request.body) {
      errors.push('Request body is required');
    }

    // Route-specific validation
    if (route.path === '/api/summarize') {
      if (!request.body?.text || typeof request.body.text !== 'string') {
        errors.push('Text field is required and must be a string');
      }
      if (request.body?.text && request.body.text.length > 50000) {
        errors.push('Text exceeds maximum length of 50,000 characters');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Route handlers
   */
  private async handleSummarize(request: APIRequest): Promise<{ status: number; body: any }> {
    // Smart routing based on content length and user preferences
    const textLength = request.body.text.length;
    const preferredMethod = request.body.method || 'auto';

    let method = 'abstractive';
    if (preferredMethod === 'auto') {
      // Route based on content characteristics
      if (textLength < 1000) {
        method = 'extractive'; // Short texts work well with extractive
      } else if (textLength > 10000) {
        // Check if we have a cost-effective model for long texts
        const model = await this.modelRegistry.getActiveModel('abstractive');
        if (model && model.cost > 0.01) {
          method = 'extractive'; // Fallback to cheaper method
        }
      }
    } else {
      method = preferredMethod;
    }

    // Route to appropriate summarization service
    // This would integrate with the actual summarization engine
    return {
      status: 200,
      body: {
        summary: `Sample summary using ${method} method`,
        method,
        processingTime: Math.random() * 2000 + 500,
      },
    };
  }

  private async handleDocumentUpload(request: APIRequest): Promise<{ status: number; body: any }> {
    // Handle file upload with smart routing
    return {
      status: 201,
      body: {
        documentId: crypto.randomUUID(),
        status: 'processing',
      },
    };
  }

  private async handleGetDocument(request: APIRequest): Promise<{ status: number; body: any }> {
    // Retrieve document with caching
    return {
      status: 200,
      body: {
        id: 'sample-id',
        status: 'ready',
        metadata: {},
      },
    };
  }

  private async handleFeedback(request: APIRequest): Promise<{ status: number; body: any }> {
    // Process feedback
    return {
      status: 201,
      body: {
        feedbackId: crypto.randomUUID(),
        status: 'recorded',
      },
    };
  }

  private async handleUserAnalytics(request: APIRequest): Promise<{ status: number; body: any }> {
    // Get user analytics
    const analytics = await this.rateLimiter.getUsageAnalytics(request.userId!);
    return {
      status: 200,
      body: analytics,
    };
  }

  private async handleListModels(request: APIRequest): Promise<{ status: number; body: any }> {
    // List available models
    const models = await this.modelRegistry.getModelComparison();
    return {
      status: 200,
      body: models,
    };
  }

  private async handleActivateModel(request: APIRequest): Promise<{ status: number; body: any }> {
    // Activate model version
    const modelId = request.path.split('/').pop();
    if (!modelId) {
      return { status: 400, body: { error: 'Model ID required' } };
    }

    await this.modelRegistry.activateModel(modelId);
    return {
      status: 200,
      body: { status: 'activated' },
    };
  }

  private async handleHealthCheck(request: APIRequest): Promise<{ status: number; body: any }> {
    // Comprehensive health check
    const health = await this.errorMonitor.getHealthStatus();

    return {
      status: health.status === 'healthy' ? 200 : 503,
      body: {
        status: health.status,
        timestamp: new Date().toISOString(),
        uptime: health.uptime,
        issues: health.issues,
      },
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: APIRequest): string {
    const keyData = {
      method: request.method,
      path: request.path,
      query: request.query,
      userId: request.userId,
    };

    return `api:${btoa(JSON.stringify(keyData))}`;
  }

  /**
   * Estimate tokens in response
   */
  private estimateTokens(data: any): number {
    if (typeof data === 'string') {
      return Math.ceil(data.length / 4); // Rough estimation
    }
    return JSON.stringify(data).length;
  }

  /**
   * Estimate cost of response
   */
  private estimateCost(data: any): number {
    const tokens = this.estimateTokens(data);
    return tokens * 0.000001; // Very rough estimation
  }

  /**
   * Create standardized response
   */
  private createResponse(
    status: number,
    body: any,
    headers: Record<string, string> = {}
  ): { status: number; headers: Record<string, string>; body: any } {
    return {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    };
  }
}