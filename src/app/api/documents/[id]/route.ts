import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/documents/[id] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: documentId } = await params;

    // Get document with related data
    const document = await (prisma as any).document.findUnique({
      where: {
        id: documentId,
        userId: user.id
      },
      include: {
        summaries: {
          select: {
            id: true,
            method: true,
            modelVersion: true,
            confidence: true,
            createdAt: true,
            _count: {
              select: { feedback: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { summaries: true }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        file_name: document.fileName,
        file_type: document.fileType,
        status: document.status,
        original_text: document.originalText,
        metadata: {
          word_count: document.wordCount,
          character_count: document.characterCount,
          language: document.language,
          created_at: document.createdAt,
          updated_at: document.updatedAt
        },
        preprocessed: document.preprocessed,
        summaries: document.summaries.map(summary => ({
          id: summary.id,
          method: summary.method,
          model_version: summary.modelVersion,
          confidence: summary.confidence,
          feedback_count: summary._count.feedback,
          created_at: summary.createdAt
        })),
        summary_count: document._count.summaries
      }
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: documentId } = await params;

    // Check if document exists and belongs to user
    const document = await (prisma as any).document.findUnique({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete document (cascade will handle related records)
    await (prisma as any).document.delete({
      where: { id: documentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}