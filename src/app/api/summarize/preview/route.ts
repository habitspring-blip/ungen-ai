/**
 * Preview Summarization API
 * Lightweight endpoint for real-time preview generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdvancedSummarizer } from '@/lib/summarization';

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

    const body = await request.json();
    const { text, config = {} } = body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 10000) { // Limit for preview
      return NextResponse.json(
        { success: false, error: 'Text too long for preview' },
        { status: 400 }
      );
    }

    // Use extractive mode for faster preview (no API calls)
    const previewConfig = {
      mode: 'extractive',
      length: 'short',
      ...config
    };

    // Generate preview summary
    const result = await summarizer.summarizeText(text, previewConfig, user.id);

    return NextResponse.json({
      success: true,
      summary: result.summary,
      method: result.method,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('Preview API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Preview generation failed';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}