import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AdvancedSummarizer } from '@/lib/summarization';

// POST /api/documents - Upload document for processing
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

    // Validate file type - now includes images
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/html',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    const allowedExtensions = /\.(txt|pdf|doc|docx|html|jpg|jpeg|png|gif|webp|bmp|tiff)$/i;

    if (!allowedTypes.includes(file.type) && !file.name.match(allowedExtensions)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Supported: PDF, Word, Text, HTML, and images (JPG, PNG, GIF, WebP, BMP, TIFF)' },
        { status: 400 }
      );
    }

    // Process file
    const summarizer = new AdvancedSummarizer();
    const result = await summarizer.processFile(file, user.id);

    return NextResponse.json({
      success: true,
      document_id: result.documentId,
      status: result.status,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Document upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Document upload failed';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/documents/:id - Get document content
// GET /api/documents - List user's documents
export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const isSingleDocument = pathname.includes('/api/documents/') && !pathname.endsWith('/api/documents');

  if (isSingleDocument) {
    // Get single document content
    const documentId = pathname.split('/api/documents/')[1];

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

      // Get document
      const document = await (prisma as any).document.findFirst({
        where: {
          id: documentId,
          userId: user.id
        },
        select: {
          id: true,
          originalText: true,
          fileName: true,
          fileType: true,
          status: true,
          wordCount: true,
          characterCount: true,
          language: true,
          createdAt: true,
          metadata: true
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
          original_text: document.originalText,
          file_name: document.fileName,
          file_type: document.fileType,
          status: document.status,
          metadata: {
            word_count: document.wordCount,
            character_count: document.characterCount,
            language: document.language,
            ...document.metadata
          },
          created_at: document.createdAt
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

  // List user's documents
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query
    const where: { userId: string; status?: string } = { userId: user.id };
    if (status) {
      where.status = status;
    }

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      (prisma as any).document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          fileName: true,
          fileType: true,
          status: true,
          wordCount: true,
          characterCount: true,
          language: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { summaries: true }
          }
        }
      }),
      (prisma as any).document.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        file_name: doc.fileName,
        file_type: doc.fileType,
        status: doc.status,
        metadata: {
          word_count: doc.wordCount,
          character_count: doc.characterCount,
          language: doc.language
        },
        summary_count: doc._count.summaries,
        created_at: doc.createdAt,
        updated_at: doc.updatedAt
      })),
      total,
      has_more: offset + limit < total
    });

  } catch (error) {
    console.error('Documents list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}