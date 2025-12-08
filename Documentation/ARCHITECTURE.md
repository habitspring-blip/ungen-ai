# System Architecture Overview

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js App (React 18+ with App Router)                   │
│  - Server Components for SEO/Performance                    │
│  - Client Components for Interactivity                      │
│  - Real-time subscriptions via Supabase Realtime           │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────┴──────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│  Next.js API Routes (/app/api/*)                           │
│  - Rate limiting middleware                                 │
│  - Authentication/Authorization                             │
│  - Request validation                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                  SUPABASE BACKEND                           │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐│
│  │   PostgreSQL   │  │  Edge Functions│  │   Storage     ││
│  │   Database     │  │  (Deno Runtime)│  │   (S3-like)   ││
│  └────────────────┘  └────────────────┘  └───────────────┘│
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐│
│  │   Auth/RLS     │  │   Realtime     │  │   Vectors     ││
│  │   Security     │  │   Pub/Sub      │  │   (pgvector)  ││
│  └────────────────┘  └────────────────┘  └───────────────┘│
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│              EXTERNAL AI/ML SERVICES                        │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐│
│  │  Hugging Face  │  │   OpenAI API   │  │  Anthropic    ││
│  │  Inference API │  │   (fallback)   │  │  Claude API   ││
│  └────────────────┘  └────────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 2. Microservices Architecture

### 2.1 Service Decomposition

#### A. Input Handler Service

**Location:** Next.js API Route `/api/input/process`

**Responsibilities:**

- Accept multiple input formats (text, PDF, DOCX, HTML)
- Parse and extract text content
- Validate input length and format
- Queue for preprocessing

**Key Parameters:**

- `MAX_FILE_SIZE`: 10MB
- `SUPPORTED_FORMATS`: ['.txt', '.pdf', '.docx', '.html']
- `MAX_TEXT_LENGTH`: 50,000 words

#### B. Text Preprocessing Service

**Location:** Supabase Edge Function `preprocess-text`

**Responsibilities:**

- Tokenization
- Stop word removal
- Sentence segmentation
- Named Entity Recognition (NER)
- Text normalization

**Key Parameters:**

- `STOPWORD_LIST`: NLTK English stopwords (~179 words)
- `EMBEDDING_MODEL`: "sentence-transformers/all-MiniLM-L6-v2"
- `NER_MODEL`: "dslim/bert-base-NER"
- `MIN_SENTENCE_LENGTH`: 10 words

#### C. Summarization Engine Service

**Location:** Supabase Edge Function `generate-summary`

**Responsibilities:**

- Route to extractive or abstractive model
- Apply user preferences (length, tone)
- Generate summary
- Return with confidence scores

**Key Parameters:**

- **Extractive Weights:** similarity=0.4, position=0.2, length=0.15, keywords=0.15, entities=0.1
- **Abstractive Models:** BART, T5, Pegasus
- **Length Ratios:** Short=0.2, Medium=0.3, Long=0.5
- **Temperature:** 0.7 (balance creativity/consistency)

#### D. Post-Processing Service

**Location:** Supabase Edge Function `post-process`

## 3. Real-Time Processing Flow

### 3.1 End-to-End Workflow

```
USER_SUBMITS_TEXT(text, preferences):

  STEP 1: Input Validation (0-100ms)
    → POST /api/summarize
    → Validate text length and format
    → Apply grammar corrections
    → Prepare for summarization

  STEP 3: Cache Check (50ms)
    → Query cache: SELECT FROM summaries
      WHERE document_hash = hash(text)
      AND config = preferences
      AND created_at > NOW() - INTERVAL '7 days'

    IF cache_hit:
      → Return cached summary immediately
      → SKIP to Step 6
    ELSE:
      → CONTINUE to Step 4

  STEP 4: Summarization (1000-5000ms)
    → POST /api/summarize with config
    → Route to extractive or abstractive engine
    → Call appropriate model/algorithm
    → Generate summary_text
    → Set status = "summarizing"
    → Publish: {event: "summarization_progress", progress: 50%}

  STEP 5: Post-Processing (200-500ms)
    → Grammar check
    → Redundancy removal
    → Format output (bullets/paragraphs)
    → Calculate metrics (ROUGE, compression ratio)
    → Set status = "complete"

  STEP 6: Delivery (50ms)
    → Store summary in database
    → Log usage metrics
    → Publish: {event: "summary_complete", summary_id, summary_text}
    → Return to user

  STEP 7: Analytics Update (async)
    → Update user statistics
    → Generate keyword frequency
    → Compute sentiment
    → Store in analytics tables

TOTAL LATENCY: 2-8 seconds (with cache: <100ms)
```

## 4. Optimization Strategies

### 4.1 Caching Strategy

```
CACHE_STRATEGY:

  // Level 1: In-Memory Cache (Redis/Upstash)
  key_format = "summary:{document_hash}:{config_hash}"
  TTL = 7 days

  FUNCTION getCachedSummary(text, config):
    doc_hash = SHA256(text)
    config_hash = SHA256(JSON.stringify(config))
    cache_key = f"summary:{doc_hash}:{config_hash}"

    result = REDIS.get(cache_key)
    IF result:
      RETURN {cached: true, summary: result}
    ELSE:
      RETURN null

  FUNCTION setCachedSummary(text, config, summary):
    cache_key = buildCacheKey(text, config)
    REDIS.setex(cache_key, 604800, summary)  // 7 days

  // Level 2: Database Cache
  // Already handled by summaries table with created_at index

  // Level 3: CDN Caching (for static resources)
  // Cache model artifacts, embeddings, etc.
```

### 4.2 Batch Processing

```
BATCH_PROCESSOR:

  // For handling multiple documents efficiently
  queue = MessageQueue("summarization_tasks")
  batch_size = 5
  batch_timeout = 10 seconds

  WHILE true:
    tasks = []
    start_time = NOW()

    WHILE len(tasks) < batch_size AND (NOW() - start_time) < batch_timeout:
      task = queue.dequeue(timeout=1)
      IF task:
        tasks.append(task)

    IF tasks NOT EMPTY:
      // Process batch together for GPU efficiency
      document_texts = [t.text for t in tasks]
      summaries = MODEL.batch_generate(document_texts)

      FOR task, summary IN ZIP(tasks, summaries):
        storeSummary(task.document_id, summary)
        notifyUser(task.user_id, task.document_id)
```

### 4.3 Model Optimization

```
MODEL_OPTIMIZATION:

  // Quantization
  model = loadModel("facebook/bart-large-cnn")
  quantized_model = quantize(model, dtype=int8)
  // Reduces size by ~4x, minimal quality loss

  // ONNX Conversion
  onnx_model = convertToONNX(quantized_model)
  // 2-3x faster inference on CPU

  // Distillation (for production)
  student_model = "distilbart-cnn-6-6"  // 2x faster than BART-large

  // Dynamic batching
  FUNCTION optimizedInference(texts):
    IF len(texts) == 1:
      RETURN model(texts[0])  // Single inference
    ELSE:
      RETURN model.batch(texts, batch_size=8)  // Batched
```

## 5. Feedback Loop & Continuous Learning

### 5.1 Feedback Collection Algorithm

```
COLLECT_FEEDBACK(summary_id, user_feedback):

  1. Store feedback in database
     INSERT INTO feedback (summary_id, rating, feedback_type, comments, edited_summary)

  2. IF user provided edited_summary:
       // Create training example
       original_doc = GET document FROM summaries WHERE id = summary_id
       training_example = {
         input: original_doc.text,
         output: user_feedback.edited_summary,
         quality_score: user_feedback.rating,
         feedback_type: user_feedback.feedback_type
       }

       APPEND to training_data_queue

  3. // Update model confidence scores
     IF rating < 3:  // Poor rating
       model_version = GET model_version FROM summaries WHERE id = summary_id
       UPDATE model_versions
       SET negative_feedback_count = negative_feedback_count + 1
       WHERE id = model_version

  4. // Trigger retraining check
     feedback_count = COUNT FROM feedback WHERE created_at > NOW() - INTERVAL '7 days'
     IF feedback_count > RETRAINING_THRESHOLD:
       ENQUEUE(retraining_pipeline, "collect_and_retrain")
```

### 5.2 Retraining Pipeline

```
RETRAINING_PIPELINE:

  STEP 1: Data Collection
    feedback_data = SELECT * FROM feedback
                    WHERE rating IS NOT NULL
                    AND edited_summary IS NOT NULL
                    AND created_at > last_training_date

    training_examples = []
    FOR feedback IN feedback_data:
      summary = GET FROM summaries WHERE id = feedback.summary_id
      document = GET FROM documents WHERE id = summary.document_id

      training_examples.append({
        input: document.original_text,
        target: feedback.edited_summary,
        weight: feedback.rating / 5.0  // Higher rating = more weight
      })

  STEP 2: Data Augmentation
    // Combine with original training data
    full_training_set = original_dataset + training_examples

    // Balance dataset
    full_training_set = balanceDataset(full_training_set)

  STEP 3: Fine-tuning
    model = loadBaseModel("facebook/bart-large-cnn")

    optimizer = AdamW(lr=1e-5)
    epochs = 3

    FOR epoch IN epochs:
      FOR batch IN full_training_set:
        outputs = model(batch.input)
        loss = computeLoss(outputs, batch.target, weight=batch.weight)
        loss.backward()
        optimizer.step()

  STEP 4: Evaluation
    test_metrics = evaluate(model, test_set)

    IF test_metrics.rouge_l > current_model.rouge_l:
      // New model is better
      new_version = deployNewModel(model, test_metrics)
      notifyAdmins("New model version deployed", new_version)
    ELSE:
      logWarning("New model did not improve performance")

  STEP 5: A/B Testing
    // Route 10% of traffic to new model
    setTrafficSplit(new_version, 0.10)

    // Monitor for 7 days
    WAIT 7 days

    // Compare performance
    new_model_metrics = getMetrics(new_version)
    old_model_metrics = getMetrics(current_version)

    IF new_model_metrics.user_satisfaction > old_model_metrics.user_satisfaction:
      setTrafficSplit(new_version, 1.0)  // Full rollout
      archiveModel(old_version)
```

## 6. Performance Targets

### 6.1 Latency Targets

- Input Validation: < 100ms (p95)
- Extractive Summarization: < 1000ms (p95)
- Abstractive Summarization: < 5000ms (p95)
- Post-processing: < 500ms (p95)
- Cache Hit Response: < 100ms (p95)
- End-to-End (no cache): < 6000ms (p95)

## Related Documentation

- [Database Schema](DATABASE_SCHEMA.md)
- [API Endpoints](API_ENDPOINTS.md)
- [Service Decomposition](SERVICES.md)
- [Implementation Algorithms](ALGORITHMS.md)
- [Performance Metrics](PERFORMANCE.md)
