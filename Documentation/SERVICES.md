# Service Decomposition Details

## Microservices Architecture

This document details the decomposition of the AI summarizer into specialized microservices, each handling specific aspects of the text processing pipeline.

## 1. Input Handler Service

### Location

**Next.js API Route:** `/api/input/process`

### Responsibilities

- Accept multiple input formats (text, PDF, DOCX, HTML)
- Parse and extract text content
- Validate input length and format
- Queue for preprocessing

### Algorithm Flow

```
INPUT_HANDLER(file, metadata):
  1. Validate file type ∈ {txt, pdf, docx, html}
  2. IF file_size > MAX_SIZE:
       RETURN error("File too large")

  3. SWITCH file_type:
       CASE 'pdf':
         text = extractPDFText(file)
       CASE 'docx':
         text = extractDOCXText(file)
       CASE 'html':
         text = stripHTMLTags(file)
       DEFAULT:
         text = readPlainText(file)

  4. metadata = {
       original_length: text.length,
       word_count: countWords(text),
       language: detectLanguage(text),
       upload_time: NOW(),
       user_id: getCurrentUser()
     }

  5. document_id = generateUUID()
  6. STORE in Supabase.documents(document_id, text, metadata)
  7. ENQUEUE(preprocessing_queue, document_id)
  8. RETURN {document_id, status: "queued"}
```

### Key Parameters

- `MAX_FILE_SIZE`: 10MB
- `SUPPORTED_FORMATS`: ['.txt', '.pdf', '.docx', '.html']
- `MAX_TEXT_LENGTH`: 50,000 words

### Dependencies

- `mammoth`: DOCX parsing
- `pdf-parse`: PDF text extraction
- `jsdom`: HTML parsing

## 2. Text Preprocessing Service

### Location

**Supabase Edge Function:** `preprocess-text`

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

### Performance Characteristics

- **CPU Intensive**: Runs on Edge Functions for parallel processing
- **Memory Usage**: ~50MB per document
- **Execution Time**: 500-2000ms depending on document length

## 3. Summarization Engine Service

### Location

**Supabase Edge Function:** `generate-summary`

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

## 4. Post-Processing Service

### Location

**Supabase Edge Function:** `post-process`

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

## 5. Cache Management Service

### Location

**Redis/Upstash Integration**

### Responsibilities

- Cache generated summaries
- Cache preprocessed data
- Implement TTL-based expiration
- Handle cache invalidation

### Cache Strategy

```
CACHE_KEY_FORMAT:
  summary:{document_hash}:{config_hash}
  preprocessing:{document_id}
  embeddings:{document_id}

CACHE_TTL:
  summaries: 7 days
  preprocessing: 30 days
  embeddings: 30 days

INVALIDATION_EVENTS:
  - User feedback submission (clear related caches)
  - Model version updates (clear all caches)
  - Document updates (clear document-specific caches)
```

## 6. Feedback Collection Service

### Location

**Next.js API Route:** `/api/feedback`

### Responsibilities

- Collect user ratings and feedback
- Store feedback for analysis
- Trigger retraining pipelines
- Update model performance metrics

### Algorithm Flow

```
COLLECT_FEEDBACK(summary_id, user_feedback):

  1. Store feedback in database
     INSERT INTO feedback (summary_id, rating, feedback_type, comments, edited_summary)

  2. IF user provided edited_summary:
       // Create training example
       original_doc = GET document FROM summaries WHERE id = summary_id
       training_example = {
         input: original_doc.text,
         target: user_feedback.edited_summary,
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

## 7. Analytics and Monitoring Service

### Location

**Supabase Edge Functions + Database**

### Responsibilities

- Track usage metrics
- Monitor system performance
- Generate user analytics
- Alert on anomalies

### Key Metrics Tracked

```
USER_METRICS:
  - Total summaries generated
  - Average processing time
  - Preferred summarization methods
  - Usage patterns by time/day

SYSTEM_METRICS:
  - API response times (p50, p95, p99)
  - Error rates by endpoint
  - Cache hit/miss ratios
  - Model performance scores

BUSINESS_METRICS:
  - User retention rates
  - Feature adoption rates
  - Revenue per user
  - Customer satisfaction scores
```

## 8. Model Management Service

### Location

**Admin Dashboard + Database**

### Responsibilities

- Version control for AI models
- A/B testing framework
- Performance monitoring
- Automated model updates

### Model Lifecycle

```
MODEL_DEPLOYMENT:
  1. Train new model version
  2. Evaluate on test set
  3. Deploy to staging environment
  4. Run A/B test (10% traffic)
  5. Monitor performance metrics
  6. Gradual rollout if successful
  7. Archive old version

PERFORMANCE_MONITORING:
  - ROUGE scores comparison
  - User satisfaction ratings
  - Processing latency
  - Error rates
  - Cost per request
```

## Service Communication Patterns

### Synchronous Communication

- REST API calls between Next.js and Supabase
- Direct database queries
- Real-time subscriptions via Supabase Realtime

### Asynchronous Communication

- Queue-based processing (preprocessing, summarization)
- Event-driven architecture (status updates)
- Background job processing (analytics, retraining)

### Data Flow Patterns

```
USER_REQUEST → API_GATEWAY → SERVICE_ROUTER → PROCESSING_QUEUE
                                                       ↓
CACHE_CHECK → {HIT: RETURN_CACHED} | {MISS: PROCESS}
                                                       ↓
PREPROCESSING → SUMMARIZATION → POST_PROCESSING → CACHE_STORE
                                                       ↓
RESPONSE ← REAL_TIME_UPDATES ← STATUS_BROADCAST
```

## Error Handling and Resilience

### Circuit Breaker Pattern

```
FOR EACH external_service_call:
  IF circuit_breaker.is_open():
    RETURN fallback_response

  TRY:
    response = call_external_service()
    circuit_breaker.record_success()
    RETURN response
  EXCEPT timeout OR error:
    circuit_breaker.record_failure()
    IF circuit_breaker.should_open():
      circuit_breaker.open()
    RETURN fallback_response
```

### Retry Logic with Exponential Backoff

```
MAX_RETRIES = 3
BASE_DELAY = 1000ms

FOR attempt IN 1..MAX_RETRIES:
  TRY:
    RETURN call_service()
  EXCEPT retryable_error:
    IF attempt < MAX_RETRIES:
      delay = BASE_DELAY * (2 ^ (attempt - 1))
      WAIT delay + random_jitter()
    ELSE:
      RAISE final_error
```

### Fallback Strategies

- **Model Fallbacks**: Cloudflare → Anthropic → Local implementation
- **Cache Fallbacks**: Redis → Database → Fresh computation
- **Service Fallbacks**: Primary service → Backup service → Degraded mode

## Scaling Considerations

### Horizontal Scaling

- **Stateless Services**: API routes can be scaled horizontally
- **Stateful Services**: Use external state stores (Supabase, Redis)
- **Edge Functions**: Automatically scale with request volume

### Vertical Scaling

- **Memory Intensive**: Preprocessing and embedding generation
- **CPU Intensive**: Model inference and text processing
- **I/O Intensive**: Database queries and file processing

### Auto-scaling Triggers

- CPU utilization > 70%
- Memory usage > 80%
- Queue depth > 100 items
- Response time > 2000ms (p95)
