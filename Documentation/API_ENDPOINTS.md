# API Endpoints Documentation

## Overview

The API follows RESTful conventions with JSON request/response formats. All endpoints require authentication via Supabase JWT tokens and implement rate limiting.

## Authentication

All API endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <supabase_jwt_token>
```

## Core API Routes

### 1. Document Management

#### GET `/api/documents/:id`

Retrieve document details and status.

**Response:**

```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "status": "ready",
    "file_name": "document.pdf",
    "metadata": {
      "word_count": 1500,
      "language": "en",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "preprocessed": {
      "sentences": ["..."],
      "entities": ["..."]
    }
  }
}
```

#### GET `/api/documents`

List user's documents with pagination.

**Query Parameters:**

- `limit`: Number of documents (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status ('ready', 'processing', etc.)

**Response:**

```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "file_name": "doc1.pdf",
      "status": "ready",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "has_more": true
}
```

### 2. Summarization

#### POST `/api/summarize`

Generate a summary from text or document.

**Request Body:**

```json
{
  "text": "Optional direct text input...",
  "document_id": "uuid", // Alternative to text
  "config": {
    "mode": "extractive" | "abstractive",
    "length": "short" | "medium" | "long",
    "tone": "formal" | "casual" | "neutral",
    "focus_keywords": ["keyword1", "keyword2"],
    "output_format": "paragraphs" | "bullets"
  }
}
```

**Response:**

```json
{
  "success": true,
  "summary_id": "uuid",
  "summary": "Generated summary text...",
  "method": "abstractive",
  "metrics": {
    "compression_ratio": 0.25,
    "word_count": 125,
    "readability_score": 65.5,
    "confidence": 0.87
  },
  "processing_time": 2500
}
```

**Rate Limits:**

- Free tier: 1000 words/day
- Pro tier: 50,000 words/month
- Enterprise: 500,000 words/month

#### GET `/api/summaries/:id`

Retrieve a generated summary.

**Response:**

```json
{
  "success": true,
  "summary": {
    "id": "uuid",
    "document_id": "uuid",
    "summary_text": "...",
    "method": "abstractive",
    "config": {
      /* original config */
    },
    "metrics": {
      /* quality metrics */
    },
    "model_version": "bart-large-cnn-v1",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/summaries`

List user's summaries with pagination.

**Query Parameters:**

- `limit`: Number of summaries (default: 20)
- `offset`: Pagination offset
- `document_id`: Filter by document
- `method`: Filter by method ('extractive', 'abstractive')

### 3. Feedback System

#### POST `/api/feedback`

Submit feedback on a summary.

**Request Body:**

```json
{
  "summary_id": "uuid",
  "rating": 4, // 1-5 stars
  "feedback_type": "useful" | "incomplete" | "too_technical" | "too_simple" | "factual_error",
  "comments": "Optional detailed feedback",
  "edited_summary": "User's corrected version (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "feedback_id": "uuid",
  "message": "Feedback submitted successfully"
}
```

#### GET `/api/feedback`

Get user's feedback history.

**Query Parameters:**

- `limit`: Number of feedback items
- `rating`: Filter by rating (1-5)

### 4. Analytics and Usage

#### GET `/api/analytics/user`

Get user's usage analytics.

**Response:**

```json
{
  "success": true,
  "analytics": {
    "total_summaries": 45,
    "total_words_processed": 75000,
    "average_rating": 4.2,
    "usage_by_month": [
      {
        "month": "2024-01",
        "summaries": 12,
        "words": 15000
      }
    ],
    "preferred_methods": {
      "extractive": 60,
      "abstractive": 40
    }
  }
}
```

#### GET `/api/analytics/performance`

Get system performance metrics (admin only).

**Response:**

```json
{
  "success": true,
  "metrics": {
    "avg_response_time": 1200,
    "p95_response_time": 2500,
    "error_rate": 0.02,
    "cache_hit_rate": 85,
    "active_users": 150,
    "requests_per_second": 12
  }
}
```

### 5. Model Management (Admin Only)

#### GET `/api/admin/models`

List available AI models and versions.

**Response:**

```json
{
  "success": true,
  "models": [
    {
      "id": "uuid",
      "name": "BART Large CNN",
      "type": "abstractive",
      "version": "v2.1",
      "is_active": true,
      "performance_metrics": {
        "rouge_1": 0.45,
        "rouge_2": 0.32,
        "avg_latency": 1800
      },
      "deployed_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/admin/models/:id/activate`

Activate a specific model version.

**Response:**

```json
{
  "success": true,
  "message": "Model version activated successfully"
}
```

### 6. Payment and Billing

#### POST `/api/payments/create-checkout`

Create a Stripe checkout session.

**Request Body:**

```json
{
  "plan": "pro" | "enterprise",
  "billing_cycle": "monthly" | "annual",
  "coupon": "WELCOME10", // optional
  "team_size": 5 // optional, for enterprise
}
```

**Response:**

```json
{
  "success": true,
  "session_id": "cs_...",
  "url": "https://checkout.stripe.com/...",
  "message": "Redirect user to payment URL"
}
```

#### GET `/api/payments/history`

Get user's payment history.

**Response:**

```json
{
  "success": true,
  "payments": [
    {
      "id": "uuid",
      "amount": 999, // in cents
      "status": "succeeded",
      "plan_type": "pro",
      "billing_cycle": "monthly",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 7. Real-time Subscriptions

#### WebSocket `/api/realtime`

Subscribe to real-time updates.

**Channels:**

- `document:{document_id}` - Document processing updates
- `user:{user_id}` - User-specific notifications

**Message Format:**

```json
{
  "event": "document_status_changed",
  "payload": {
    "document_id": "uuid",
    "status": "ready",
    "progress": 100
  }
}
```

### 8. Health and Monitoring

#### GET `/api/health`

System health check.

**Response:**

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "ai_models": "healthy",
    "stripe": "healthy"
  },
  "metrics": {
    "uptime": 99.9,
    "response_time_avg": 450,
    "error_rate": 0.01
  }
}
```

#### GET `/api/health/detailed`

Detailed health metrics (admin only).

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE", // e.g., "RATE_LIMIT_EXCEEDED"
  "details": {
    /* Additional error context */
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid request data
- `RESOURCE_NOT_FOUND` - Entity doesn't exist
- `QUOTA_EXCEEDED` - Usage limit reached
- `SERVICE_UNAVAILABLE` - External service failure

## Rate Limiting

Rate limits are enforced per user based on their plan:

| Endpoint Pattern   | Free Tier | Pro Tier | Enterprise |
| ------------------ | --------- | -------- | ---------- |
| `/api/summarize`   | 10/min    | 50/min   | 200/min    |
| `/api/documents/*` | 5/min     | 20/min   | 100/min    |
| `/api/feedback`    | 10/min    | 50/min   | 200/min    |
| All others         | 30/min    | 100/min  | 500/min    |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support cursor-based pagination:

**Request:**

```
GET /api/documents?limit=20&cursor=eyJpZCI6IjEyMyJ9
```

**Response:**

```json
{
  "data": [...],
  "has_more": true,
  "next_cursor": "eyJpZCI6IjQ1NiJ9"
}
```

## Versioning

API versioning is handled via URL paths:

- Current version: No prefix (defaults to v1)
- Future versions: `/api/v2/summarize`

## CORS Configuration

CORS is configured to allow:

- Origins: Configured domains + localhost for development
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With
- Credentials: true (for cookies/auth)

## Request/Response Compression

- Requests > 1KB are automatically compressed
- Responses > 2KB use gzip compression
- Content-Type: `application/json`
- Accept-Encoding: `gzip, deflate`
