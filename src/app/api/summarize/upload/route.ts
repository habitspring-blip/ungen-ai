/**
 * File Upload API for Summarization
 * Handles file uploads and initiates summarization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdvancedSummarizer } from '@/lib/summarization';
import { validateSummarizationConfig } from '@/lib/summarization/utils/validation';
import type { SummarizationConfig, SummaryResult } from '@/lib/summarization/types';

const summarizer = new AdvancedSummarizer();

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configData = formData.get('config') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Parse configuration
    let config: Partial<SummarizationConfig> = {};
    if (configData) {
      try {
        config = JSON.parse(configData);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid configuration JSON' },
          { status: 400 }
        );
      }
    }

    // Generate summary from file
    const result = await summarizer.summarizeFile(file, config, user.id);

    // Store in database
    await storeFileSummary(user.id, file, result);

    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary,
        method: result.method,
        metrics: result.metrics,
        config: result.config,
        processingTime: result.processingTime,
        confidence: result.confidence,
        fileName: file.name,
        fileSize: file.size,
      }
    });

  } catch (error) {
    console.error('File summarization API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to store file summary
async function storeFileSummary(userId: string, file: File, result: SummaryResult) {
  try {
    const supabase = await createClient();

    // Store document with file metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        original_text: result.summary, // Store summary as we don't store full file content
        file_name: file.name,
        file_type: file.type || file.name.split('.').pop(),
        status: 'ready',
      })
      .select()
      .single();

    if (docError) throw docError;

    // Store summary
    const { error: summaryError } = await supabase
      .from('summaries')
      .insert({
        document_id: document.id,
        user_id: userId,
        summary_text: result.summary,
        method: result.method,
        config: result.config,
        metrics: result.metrics,
        model_version: result.modelVersion,
      });

    if (summaryError) throw summaryError;

  } catch (error) {
    console.error('Failed to store file summary:', error);
  }
}