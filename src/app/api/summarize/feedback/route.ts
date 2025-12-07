/**
 * Feedback API for Summarization
 * Collects user feedback for continuous learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AdvancedSummarizer } from '@/lib/summarization';
import { validateFeedbackData } from '@/lib/summarization/utils/validation';
import type { FeedbackData } from '@/lib/summarization/types';

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
    const {
      summaryId,
      rating,
      feedbackType,
      editedSummary,
      comments
    } = body;

    // Validate feedback data
    const feedback: FeedbackData = {
      summaryId,
      userId: user.id,
      rating,
      type: feedbackType,
      editedSummary,
      comments,
    };

    if (!validateFeedbackData(feedback)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    // Store feedback in database
    const feedbackRecord = await prisma.feedback.create({
      data: {
        summaryId,
        userId: user.id,
        rating,
        feedbackType,
        editedSummary,
        comments,
      }
    });

    // Submit feedback to summarizer for learning
    await summarizer.submitFeedback(feedback);

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId: user.id,
        action: 'feedback',
        summaryId
      }
    });

    return NextResponse.json({
      success: true,
      feedback_id: feedbackRecord.id,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Feedback API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/summarize/feedback - Get user's feedback history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const feedback = await prisma.feedback.findMany({
      where: { userId: user.id },
      include: {
        summary: {
          select: {
            id: true,
            summaryText: true,
            method: true,
            metrics: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.feedback.count({
      where: { userId: user.id }
    });

    return NextResponse.json({
      success: true,
      feedback: feedback.map(f => ({
        id: f.id,
        rating: f.rating,
        feedback_type: f.feedbackType,
        edited_summary: f.editedSummary,
        comments: f.comments,
        created_at: f.createdAt,
        summary: f.summary
      })),
      total,
      has_more: offset + limit < total
    });

  } catch (error) {
    console.error('Get feedback API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}