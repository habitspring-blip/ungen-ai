# Service Decomposition Details

## Input Validation Service

**Location:** Next.js API Route `/api/summarize`

### Responsibilities

- Accept direct text input
- Validate text length and format
- Apply basic grammar corrections
- Prepare text for summarization

### Algorithm Flow

```
INPUT_VALIDATOR(text, config):
  1. Validate text length > 0 and < MAX_TEXT_LENGTH
  2. IF text.trim().length == 0:
       RETURN error("Text input is required")

  3. // Apply grammar corrections
     corrected_text = applyGrammarCorrections(text)

  4. // Basic text preprocessing
     cleaned_text = normalizeWhitespace(corrected_text)
     cleaned_text = removeExcessiveNewlines(cleaned_text)

  5. metadata = {
       original_length: text.length,
       word_count: countWords(cleaned_text),
       language: detectLanguage(cleaned_text),
       processed_at: NOW(),
       user_id: getCurrentUser()
     }

  6. RETURN {text: cleaned_text, metadata, config}
```

### Key Parameters

- `MAX_TEXT_LENGTH`: 200,000 characters
- `MIN_TEXT_LENGTH`: 10 characters

---

## Text Preprocessing Service

**Location:** Supabase Edge Function `preprocess-text`

### Responsibilities

- Tokenization
- Stop word removal
- Sentence segmentation
- Named Entity Recognition (NER)
- Text normalization

### Algorithm Flow

```
PREPROCESS(document_id):
  1. text = FETCH from Supabase.documents WHERE id = document_id

  2. // Sentence Segmentation
     sentences = sentenceTokenize(text)
     // Using regex or NLP library for sentence boundaries

  3. // Tokenization
     FOR EACH sentence IN sentences:
       tokens = wordTokenize(sentence)
       tokens = toLowerCase(tokens)
       tokens = removeStopWords(tokens)  // NLTK stopwords
       tokens = stemOrLemmatize(tokens)   // Porter/Snowball stemmer

  4. // Named Entity Recognition
     entities = extractEntities(text)
     // Extract: PERSON, ORG, GPE, DATE, MONEY, etc.

  5. // Create sentence embeddings for extractive mode
     sentence_embeddings = []
     FOR EACH sentence IN sentences:
       embedding = computeEmbedding(sentence)  // Use sentence-transformers
       sentence_embeddings.append({
         sentence: sentence,
         embedding: embedding,
         position: index,
         length: sentence.length
       })

  6. preprocessed_data = {
       sentences: sentences,
       tokens: tokens,
       entities: entities,
       embeddings: sentence_embeddings,
       stats: {
         sentence_count: len(sentences),
         avg_sentence_length: mean([len(s) for s in sentences])
       }
     }

  7. UPDATE Supabase.documents
     SET preprocessed = preprocessed_data,
         status = "ready_for_summarization"
     WHERE id = document_id

  8. PUBLISH realtime_channel("preprocessing_complete", document_id)
```

### Key Parameters

- `STOPWORD_LIST`: NLTK English stopwords (~179 words)
- `EMBEDDING_MODEL`: "sentence-transformers/all-MiniLM-L6-v2"
- `NER_MODEL`: "dslim/bert-base-NER"
- `MIN_SENTENCE_LENGTH`: 10 words

---

## Summarization Engine Service

**Location:** Supabase Edge Function `generate-summary`

### Responsibilities

- Route to extractive or abstractive model
- Apply user preferences (length, tone)
- Generate summary
- Return with confidence scores

### Extractive Summarization Algorithm

```
EXTRACTIVE_SUMMARIZE(document_id, config):
  // Config: {target_length: 0.3, focus_keywords: [], min_score: 0.5}

  1. data = FETCH preprocessed_data FROM Supabase.documents
  2. sentences = data.sentences
  3. embeddings = data.sentence_embeddings

  4. // Compute document embedding (centroid)
     doc_embedding = MEAN(embeddings)

  5. // Score each sentence
     scores = []
     FOR i, sentence_data IN ENUMERATE(embeddings):

       // Factor 1: Similarity to document centroid
       similarity = cosineSimilarity(sentence_data.embedding, doc_embedding)

       // Factor 2: Position bias (earlier sentences weighted higher)
       position_score = 1.0 / (1.0 + log(i + 1))

       // Factor 3: Length normalization
       length_score = MIN(1.0, sentence_data.length / AVG_SENTENCE_LENGTH)

       // Factor 4: Keyword presence
       keyword_score = 0
       IF focus_keywords NOT EMPTY:
         keyword_score = countKeywords(sentence_data.sentence, focus_keywords) / len(focus_keywords)

       // Factor 5: Entity density
       entity_score = countEntities(sentence_data.sentence) / sentence_data.length

       // Combined score (weighted)
       total_score = (
         0.40 * similarity +
         0.20 * position_score +
         0.15 * length_score +
         0.15 * keyword_score +
         0.10 * entity_score
       )

       scores.append({
         sentence: sentence_data.sentence,
         score: total_score,
         index: i
       })

  6. // Sort by score descending
     scores.sort(key=lambda x: x.score, reverse=True)

  7. // Select top sentences up to target_length
     target_sentence_count = CEIL(len(sentences) * config.target_length)
     selected = scores[:target_sentence_count]

  8. // Re-order selected sentences by original position (maintain flow)
     selected.sort(key=lambda x: x.index)

  9. summary = JOIN([s.sentence for s in selected], " ")

  10. RETURN {
        summary: summary,
        method: "extractive",
        sentence_indices: [s.index for s in selected],
        avg_score: MEAN([s.score for s in selected])
      }
```

### Abstractive Summarization Algorithm

```
ABSTRACTIVE_SUMMARIZE(document_id, config):
  // Config: {max_length: 150, min_length: 50, tone: "formal", temperature: 0.7}

  1. data = FETCH preprocessed_data FROM Supabase.documents
  2. text = data.original_text

  3. // Prepare prompt based on tone
     prompt = buildPrompt(text, config.tone)

     FUNCTION buildPrompt(text, tone):
       IF tone == "formal":
         prefix = "Provide a formal, professional summary of the following text:"
       ELSE IF tone == "casual":
         prefix = "Summarize this text in simple, everyday language:"
       ELSE:
         prefix = "Summarize the following text:"

       RETURN prefix + "\n\n" + text + "\n\nSummary:"

  4. // Call transformer model
     // Option 1: Hugging Face Inference API
     response = callHuggingFaceAPI(
       model="facebook/bart-large-cnn",  // or "google/pegasus-xsum", "t5-base"
       inputs=prompt,
       parameters={
         max_length: config.max_length,
         min_length: config.min_length,
         temperature: config.temperature,
         do_sample: True,
         top_k: 50,
         top_p: 0.95
       }
     )

     // Option 2: Use Anthropic Claude API via Supabase function
     // response = callClaudeAPI(prompt, config)

  5. summary = response.generated_text

  6. // Post-process
     summary = removeRedundancy(summary)
     summary = fixGrammar(summary)
     summary = enforceLength(summary, config.max_length)

  7. RETURN {
       summary: summary,
       method: "abstractive",
       model: "bart-large-cnn",
       confidence: response.confidence_score
     }
```

### Key Parameters

- **Extractive Weights:** similarity=0.4, position=0.2, length=0.15, keywords=0.15, entities=0.1
- **Abstractive Models:** BART, T5, Pegasus
- **Length Ratios:** Short=0.2, Medium=0.3, Long=0.5
- **Temperature:** 0.7 (balance creativity/consistency)

---

## Post-Processing Service

**Location:** Supabase Edge Function `post-process`

### Algorithm Flow

```
POST_PROCESS(summary, config):
  1. // Enforce length constraints
     IF config.enforce_max_length AND summary.length > config.max_length:
       summary = truncateAtSentence(summary, config.max_length)

  2. // Fix grammar and fluency
     summary = fixGrammar(summary)
     // Use LanguageTool API or simple rule-based fixes

  3. // Remove redundancy
     sentences = sentenceTokenize(summary)
     unique_sentences = removeDuplicateSentences(sentences, threshold=0.85)
     summary = JOIN(unique_sentences, " ")

  4. // Co-reference resolution
     summary = resolvePronouns(summary)
     // Ensure "he/she/it" have clear antecedents

  5. // Format based on output_format
     IF config.output_format == "bullets":
       summary = convertToBullets(summary)
     ELSE IF config.output_format == "paragraphs":
       summary = formatParagraphs(summary)

  6. // Add metadata
     metadata = {
       word_count: countWords(summary),
       sentence_count: len(sentences),
       readability_score: calculateFleschKincaid(summary),
       processed_at: NOW()
     }

  7. RETURN {summary, metadata}
```

---

## Model Selection and Cost Optimization

### Cost-Aware Model Routing

```
SELECT_MODEL(intent, user_plan, text_length):
  // Cost optimization based on user plan and task complexity

  IF user_plan == "free":
    // Always use cheapest option for free users
    RETURN { provider: "cloudflare", model: "llama-3.1-8b", cost: 0.001 }

  ELSE IF intent == "grammar_check" OR intent == "simplify":
    // Simple tasks use cheaper models
    RETURN { provider: "cloudflare", model: "llama-3.1-8b", cost: 0.002 }

  ELSE IF text_length < 1000 AND intent == "summarize":
    // Short texts use efficient models
    RETURN { provider: "cloudflare", model: "llama-3.1-8b", cost: 0.003 }

  ELSE:
    // Complex tasks use high-quality models
    RETURN { provider: "anthropic", model: "claude-3-5-sonnet", cost: 0.015 }

  // Apply team discounts and volume pricing
  final_cost = applyDiscounts(base_cost, user_plan, team_size)
  RETURN model_config with final_cost
```

### Dynamic Batching

```
OPTIMIZE_BATCH(requests):
  // Group similar requests for efficient processing

  batches = groupByModelAndConfig(requests)

  FOR EACH batch IN batches:
    IF batch.size > 1:
      // Process as batch for GPU efficiency
      results = model.batch_process(batch.texts, batch.config)
      // Cost per request decreases with batch size
      cost_per_request = base_cost / sqrt(batch.size)
    ELSE:
      // Single request processing
      results = model.process_single(batch.texts[0], batch.config)
      cost_per_request = base_cost

    // Distribute results back to individual requests
    distributeResults(batch.requests, results, cost_per_request)
```

---

## Quality Assurance Pipeline

### Automated Quality Checks

```
QUALITY_CHECK(summary, original_text, config):
  metrics = {}

  // 1. ROUGE Score (Recall-Oriented Understudy for Gisting Evaluation)
  rouge_scores = computeROUGE(summary, reference_summary)
  metrics.rouge_1 = rouge_scores.rouge_1.f_measure
  metrics.rouge_2 = rouge_scores.rouge_2.f_measure
  metrics.rouge_l = rouge_scores.rouge_l.f_measure

  // 2. Semantic Similarity
  original_embedding = computeEmbedding(original_text)
  summary_embedding = computeEmbedding(summary)
  metrics.semantic_similarity = cosineSimilarity(original_embedding, summary_embedding)

  // 3. Readability Analysis
  metrics.readability = calculateFleschKincaid(summary)
  metrics.complexity_level = assessComplexity(summary)

  // 4. Factual Consistency
  metrics.factual_consistency = checkFactualConsistency(original_text, summary)

  // 5. Tone Analysis
  metrics.tone_match = analyzeToneMatch(summary, config.tone)

  // 6. Length Compliance
  metrics.length_compliance = checkLengthCompliance(summary, config.length)

  // Overall quality score
  metrics.overall_score = weightedAverage(metrics, QUALITY_WEIGHTS)

  RETURN metrics
```

### Quality Thresholds

```javascript
const QUALITY_THRESHOLDS = {
  rouge_1: { min: 0.6, target: 0.75 },
  semantic_similarity: { min: 0.7, target: 0.85 },
  readability: { min: 40, target: 60 }, // Flesch score
  factual_consistency: { min: 0.8, target: 0.95 },
  overall_score: { min: 0.65, target: 0.8 },
};
```

---

## Error Handling and Recovery

### Circuit Breaker Pattern

```
CIRCUIT_BREAKER(service_name):
  state = "CLOSED"  // CLOSED, OPEN, HALF_OPEN
  failure_count = 0
  last_failure_time = null
  success_count = 0

  FUNCTION callService(request):
    IF state == "OPEN":
      IF timeSince(last_failure_time) > TIMEOUT:
        state = "HALF_OPEN"
      ELSE:
        RETURN fallbackResponse()

    TRY:
      response = service.call(request)
      onSuccess()
      RETURN response
    CATCH error:
      onFailure()
      IF state == "HALF_OPEN":
        state = "OPEN"
      RETURN fallbackResponse()

  FUNCTION onSuccess():
    failure_count = 0
    IF state == "HALF_OPEN":
      success_count++
      IF success_count >= SUCCESS_THRESHOLD:
        state = "CLOSED"
        success_count = 0

  FUNCTION onFailure():
    failure_count++
    last_failure_time = NOW()
    IF failure_count >= FAILURE_THRESHOLD:
      state = "OPEN"
```

### Fallback Strategies

```
FALLBACK_STRATEGY(original_request, error):
  // Multi-level fallback system

  IF error.type == "API_RATE_LIMIT":
    // Wait and retry with exponential backoff
    RETURN retryWithBackoff(original_request)

  ELSE IF error.type == "MODEL_UNAVAILABLE":
    // Switch to alternative model
    RETURN routeToAlternativeModel(original_request)

  ELSE IF error.type == "NETWORK_ERROR":
    // Use cached response if available
    cached = checkCache(original_request)
    IF cached:
      RETURN cached
    ELSE:
      RETURN simplifiedResponse(original_request)

  ELSE:
    // Generic fallback
    RETURN generateBasicSummary(original_request)
```

---

## Performance Monitoring

### Real-Time Metrics Collection

```
METRICS_COLLECTOR:
  // Collect performance data for all services

  FUNCTION recordRequest(service, request, response, duration):
    metrics = {
      service_name: service,
      request_size: calculateSize(request),
      response_size: calculateSize(response),
      processing_time: duration,
      success: response.success,
      error_type: response.error?.type,
      model_used: response.model,
      cost_incurred: response.cost,
      timestamp: NOW()
    }

    // Store in time-series database
    timeSeriesDB.insert("performance_metrics", metrics)

    // Update real-time dashboards
    updateDashboards(metrics)

    // Trigger alerts if thresholds exceeded
    checkAlerts(metrics)

  FUNCTION calculatePercentiles(metric_name, time_window):
    // Calculate p50, p95, p99 for performance monitoring
    data = timeSeriesDB.query(metric_name, time_window)
    RETURN {
      p50: percentile(data, 50),
      p95: percentile(data, 95),
      p99: percentile(data, 99),
      avg: mean(data)
    }
```

### Service Health Checks

```
HEALTH_CHECK(service_name):
  checks = {
    database: checkDatabaseConnection(),
    cache: checkRedisConnection(),
    external_apis: checkAPIEndpoints(),
    queue: checkQueueDepth(),
    memory: checkMemoryUsage(),
    cpu: checkCPUUsage()
  }

  overall_health = determineOverallHealth(checks)

  RETURN {
    service: service_name,
    status: overall_health, // "healthy", "degraded", "unhealthy"
    checks: checks,
    timestamp: NOW(),
    version: getCurrentVersion()
  }
```
