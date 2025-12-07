# Database Schema Documentation

## Overview

The application uses Supabase (PostgreSQL) as the primary database with Row Level Security (RLS) enabled for all tables. The schema is designed for high-performance text processing, real-time analytics, and secure multi-tenant operations.

## Core Tables

### 1. Profiles Table

Extends Supabase's `auth.users` table with profile data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  api_key TEXT UNIQUE,
  usage_quota INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**

- Primary key on `id`
- Unique index on `api_key`

**RLS Policies:**

- Users can only read/update their own profile

### 2. Documents Table

Stores original documents and their preprocessing metadata.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  preprocessed JSONB,
  file_name TEXT,
  file_type TEXT,
  language TEXT,
  status TEXT CHECK (status IN ('uploading', 'preprocessing', 'ready', 'summarizing', 'complete', 'error')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields Explanation:**

- `original_text`: Raw text content (up to 50,000 words)
- `preprocessed`: JSON containing tokenized data, embeddings, entities
- `metadata`: File statistics, processing times, checksums
- `status`: Processing pipeline state

**Indexes:**

- `idx_documents_user_id` on `user_id`
- `idx_documents_status` on `status`
- `idx_documents_created_at` on `created_at`

**RLS Policies:**

- Users can only access their own documents
- Service role can access all documents for processing

### 3. Summaries Table

Stores generated summaries with quality metrics.

```sql
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  method TEXT CHECK (method IN ('extractive', 'abstractive')),
  config JSONB,  -- Stores {length, tone, focus, etc.}
  metrics JSONB, -- Stores {rouge, bleu, compression_ratio, etc.}
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields Explanation:**

- `config`: User preferences (length, tone, format)
- `metrics`: Quality scores (ROUGE, compression ratio, readability)
- `model_version`: Which AI model/version generated the summary

**Indexes:**

- `idx_summaries_document_id` on `document_id`
- `idx_summaries_user_id` on `user_id`
- `idx_summaries_created_at` on `created_at`

### 4. Feedback Table

User feedback for continuous learning and model improvement.

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT CHECK (feedback_type IN ('useful', 'incomplete', 'too_technical', 'too_simple', 'factual_error')),
  edited_summary TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields Explanation:**

- `rating`: 1-5 star rating
- `feedback_type`: Categorized feedback for analysis
- `edited_summary`: User-corrected version (for training data)

**Indexes:**

- `idx_feedback_summary_id` on `summary_id`
- `idx_feedback_user_id` on `user_id`
- `idx_feedback_created_at` on `created_at`

### 5. Usage Logs Table

Analytics and billing tracking.

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT,  -- 'summarize', 'export', 'feedback'
  document_id UUID REFERENCES documents(id),
  summary_id UUID REFERENCES summaries(id),
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields Explanation:**

- `processing_time_ms`: Performance monitoring
- `tokens_used`: Cost calculation basis

**Indexes:**

- `idx_usage_logs_user_id` on `user_id`
- `idx_usage_logs_created_at` on `created_at`

### 6. Model Versions Table

Model registry for versioning and A/B testing.

```sql
CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_type TEXT CHECK (model_type IN ('extractive', 'abstractive')),
  version TEXT NOT NULL,
  endpoint_url TEXT,
  config JSONB,
  performance_metrics JSONB,  -- {avg_rouge: 0.45, avg_bleu: 0.32}
  is_active BOOLEAN DEFAULT FALSE,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields Explanation:**

- `performance_metrics`: ROUGE scores, latency, user satisfaction
- `is_active`: Currently deployed version

## Performance Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_summaries_user_created ON summaries(user_id, created_at DESC);
CREATE INDEX idx_documents_user_status ON documents(user_id, status);
CREATE INDEX idx_feedback_rating_created ON feedback(rating, created_at DESC);

-- JSONB indexes for metadata queries
CREATE INDEX idx_documents_metadata_gin ON documents USING GIN (metadata);
CREATE INDEX idx_summaries_config_gin ON summaries USING GIN (config);
CREATE INDEX idx_summaries_metrics_gin ON summaries USING GIN (metrics);

-- Full-text search indexes
CREATE INDEX idx_documents_text_search ON documents USING GIN (to_tsvector('english', original_text));
CREATE INDEX idx_summaries_text_search ON summaries USING GIN (to_tsvector('english', summary_text));
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Documents: Users can only see their own
CREATE POLICY "Users can only see their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

-- Summaries: Users can only see their own
CREATE POLICY "Users can only see their own summaries"
  ON summaries FOR SELECT
  USING (auth.uid() = user_id);

-- Feedback: Users can only see their own
CREATE POLICY "Users can only see their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usage logs: Users can only see their own
CREATE POLICY "Users can only see their own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);
```

## Data Relationships

```
profiles (1) ──── (many) documents
    │                      │
    │                      │
    └─── (many) summaries ─┘
           │
           │
           └─── (many) feedback
                    │
                    │
                    └─── (many) usage_logs
```

## Migration Strategy

### Zero-Downtime Deployments

1. **Additive Changes Only**: New columns are nullable
2. **Backfill Data**: Background jobs populate new columns
3. **Update Application**: Deploy app that uses new schema
4. **Make Columns Required**: After backfill completion

### Example Migration

```sql
-- Step 1: Add new column as nullable
ALTER TABLE summaries ADD COLUMN processing_time_ms INTEGER;

-- Step 2: Backfill existing data
UPDATE summaries SET processing_time_ms = 1000 WHERE processing_time_ms IS NULL;

-- Step 3: Make column required
ALTER TABLE summaries ALTER COLUMN processing_time_ms SET NOT NULL;
```

## Backup and Recovery

### Automated Backups

- Daily full backups via Supabase
- Point-in-time recovery available
- Cross-region replication for disaster recovery

### Data Retention

- Documents: 1 year
- Summaries: 2 years
- Feedback: 2 years
- Usage logs: 3 years

## Performance Considerations

### Query Optimization

- Use `EXPLAIN ANALYZE` for query planning
- Prefer indexed columns in WHERE clauses
- Use JSONB operators for metadata queries
- Implement pagination for large result sets

### Connection Pooling

- Supabase handles connection pooling automatically
- Application uses connection pooling via Prisma
- Edge functions have built-in connection limits

### Caching Strategy

- Application-level caching with Redis/Upstash
- Database query result caching
- CDN caching for static assets

## Monitoring and Alerts

### Key Metrics to Monitor

- Query performance (slow queries > 1000ms)
- Table sizes and growth rates
- Index usage and bloat
- RLS policy violations
- Connection pool utilization

### Alert Thresholds

- Query latency > 5000ms
- Table size > 80% of available storage
- Connection pool utilization > 90%
- Error rate > 5%
