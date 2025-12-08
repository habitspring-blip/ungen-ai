/**
 * Advanced Summarization API
 * RESTful endpoints for text and file summarization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AdvancedSummarizer } from '@/lib/summarization';
import { RealTimeProcessor } from '@/lib/summarization/real-time-processor';
import { validateSummarizationConfig } from '@/lib/summarization/utils/validation';
import type { SummarizationConfig, SummaryResult, FeedbackData } from '@/lib/summarization/types';

// Initialize services
const summarizer = new AdvancedSummarizer();
const realTimeProcessor = new RealTimeProcessor();

// POST /api/summarize - Generate summary from text
export async function POST(request: NextRequest) {
  let jobId: string | undefined;

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      text,
      document_id,
      config = {},
      mode = 'abstractive',
      quality = 'standard',
      tone = 'neutral',
      length = 'medium',
      format = 'paragraphs'
    } = body;

    // Validate input - either text or document_id required
    if (!text && !document_id) {
      return NextResponse.json(
        { success: false, error: 'Either text or document_id is required' },
        { status: 400 }
      );
    }

    if (text && (!text.trim() || text.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Text must be non-empty' },
        { status: 400 }
      );
    }

    if (text && text.length > 200000) {
      return NextResponse.json(
        { success: false, error: 'Text exceeds maximum length of 200,000 characters' },
        { status: 400 }
      );
    }

    // Get text from document if document_id provided
    let finalText = text;
    if (document_id && !text) {
      console.log('Fetching document content for ID:', document_id);
      const document = await (prisma as any).document.findUnique({
        where: { id: document_id, userId: user.id },
        select: { originalText: true, fileName: true }
      });

      if (!document) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }

      finalText = document.originalText;
      console.log('Retrieved document text length:', finalText?.length || 0, 'for file:', document.fileName);

      if (!finalText || finalText.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document contains no readable text. Please upload a document with text content.' },
          { status: 400 }
        );
      }
    }

    // Generate unique job ID for progress tracking
    const jobId = `summarize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Start real-time progress tracking
    await realTimeProcessor.startSummarizationJob(jobId, user.id);

    // Build configuration
    const summarizationConfig: Partial<SummarizationConfig> = {
      mode,
      quality,
      tone,
      length,
      outputFormat: format,
      ...config,
    };

    // Update progress: Input validation complete
    await realTimeProcessor.updateProgress(jobId, 10, 'Input validation complete', 'validation');

    // Update progress: Starting summarization
    await realTimeProcessor.updateProgress(jobId, 20, 'Starting summarization process', 'preprocessing');

    // Generate summary with progress callbacks
    const result = await summarizer.summarizeText(finalText!, summarizationConfig, user.id);

    // Debug: Log the result to see what's happening
    console.log('Summarization result:', {
      hasSummary: !!result.summary,
      summaryLength: result.summary?.length || 0,
      method: result.method,
      processingTime: result.processingTime
    });

    // Update progress: Summarization complete
    await realTimeProcessor.updateProgress(jobId, 80, 'Summarization complete, storing results', 'postprocessing');

    // Store in database
    const summaryId = await storeSummary(user.id, finalText!, result, document_id);

    // Update progress: Storage complete
    await realTimeProcessor.updateProgress(jobId, 90, 'Results stored successfully', 'storage');

    // Log usage
    await logUsage(user.id, 'summarize', document_id, summaryId, result.processingTime, result.metrics.wordCount);

    // Complete the job
    await realTimeProcessor.completeJob(jobId, { summaryId, result });

    return NextResponse.json({
      success: true,
      data: {
        summary_id: summaryId,
        summary: result.summary,
        method: result.method,
        metrics: result.metrics,
        config: result.config,
        processingTime: result.processingTime,
        confidence: result.confidence,
        model_version: result.modelVersion
      }
    });

  } catch (error) {
    console.error('Summarization API error:', error);

    // Fail the real-time job if it was started
    if (typeof jobId !== 'undefined') {
      await realTimeProcessor.failJob(jobId, error instanceof Error ? error.message : 'Internal server error');
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to store summary in database
async function storeSummary(userId: string, originalText: string, result: SummaryResult, documentId?: string): Promise<string> {
  try {
    let docId = documentId;

    // Create document if not provided
    if (!docId) {
      const wordCount = originalText.split(/\s+/).length;
      const characterCount = originalText.length;

      const document = await (prisma as any).document.create({
        data: {
          userId,
          originalText,
          status: 'ready',
          language: 'en',
          metadata: {
            wordCount,
            characterCount,
            language: 'en',
            createdAt: new Date()
          }
        }
      });
      docId = document.id;
    }

    // Store summary
    const summary = await (prisma as any).summary.create({
      data: {
        documentId: docId,
        userId,
        summaryText: result.summary,
        method: result.method,
        config: result.config,
        metrics: result.metrics,
        modelVersion: result.modelVersion,
        processingTime: result.processingTime,
        confidence: result.confidence
      }
    });

    return summary.id;

  } catch (error) {
    console.error('Failed to store summary:', error);
    throw error; // Re-throw to fail the API call
  }
}

// Helper function to log usage
async function logUsage(userId: string, action: string, documentId?: string, summaryId?: string, processingTime?: number, tokensUsed?: number) {
  try {
    await (prisma as any).usageLog.create({
      data: {
        userId,
        action,
        documentId,
        summaryId,
        processingTime: processingTime,
        tokensUsed
      }
    });
  } catch (error) {
    console.error('Failed to log usage:', error);
    // Don't throw - logging failure shouldn't break the API
  }
}