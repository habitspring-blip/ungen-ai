import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock data for references
const mockReferences = [
  {
    id: 'ref-1',
    libraryId: 'lib-1',
    userId: 'user-1',
    citationKey: 'Smith2024_MachineLearning',
    type: 'article',
    title: 'Machine Learning Approaches for Citation Analysis',
    authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
    year: 2024,
    journal: 'Journal of Academic Research',
    volume: '15',
    issue: '2',
    pages: '123-145',
    publisher: 'Academic Press',
    doi: '10.1234/jar.2024.001',
    isbn: null,
    url: 'https://example.com/paper1',
    abstract: 'This paper explores machine learning techniques for analyzing citation patterns in academic literature...',
    keywords: ['machine learning', 'citations', 'academic research'],
    tags: ['machine learning', 'citations', 'research'],
    pdfUrl: '/api/documents/ref-1/pdf',
    pdfFileSize: 2048576,
    fullTextContent: 'Full text content for search...',
    notes: 'Important paper for methodology section',
    citationCount: 12,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    library: { name: 'My Library', color: '#6366f1' },
    annotations: [],
    _count: { citations: 3, annotations: 5 }
  },
  {
    id: 'ref-2',
    libraryId: 'lib-2',
    userId: 'user-1',
    citationKey: 'Davis2023_ImpactAI',
    type: 'article',
    title: 'The Impact of AI on Academic Writing',
    authors: ['Davis, M.', 'Brown, R.'],
    year: 2023,
    journal: 'AI in Education Review',
    volume: '8',
    issue: '1',
    pages: '45-67',
    publisher: 'Tech Education Press',
    doi: '10.5678/aier.2023.045',
    isbn: null,
    url: 'https://example.com/paper2',
    abstract: 'This study examines how artificial intelligence tools are transforming academic writing practices...',
    keywords: ['AI', 'academic writing', 'technology'],
    tags: ['AI', 'academic writing', 'technology'],
    pdfUrl: '/api/documents/ref-2/pdf',
    pdfFileSize: 1536000,
    fullTextContent: 'Full text content for search...',
    notes: 'Good reference for discussion section',
    citationCount: 8,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    library: { name: 'PhD Thesis', color: '#10b981' },
    annotations: [],
    _count: { citations: 2, annotations: 3 }
  },
  {
    id: 'ref-3',
    libraryId: 'lib-3',
    userId: 'user-1',
    citationKey: 'Garcia2024_Bibliometric',
    type: 'article',
    title: 'Citation Management Tools: A Comparative Study',
    authors: ['Garcia, L.', 'Chen, H.'],
    year: 2024,
    journal: 'Scientometrics',
    volume: '12',
    issue: '3',
    pages: '201-225',
    publisher: 'Springer',
    doi: '10.9876/scient.2024.078',
    isbn: null,
    url: 'https://example.com/paper3',
    abstract: 'A comprehensive comparison of popular citation management tools...',
    keywords: ['citation tools', 'bibliometrics', 'research tools'],
    tags: ['citation tools', 'bibliometrics', 'comparison'],
    pdfUrl: null,
    pdfFileSize: null,
    fullTextContent: 'Full text content for search...',
    notes: 'Excellent comparative analysis',
    citationCount: 15,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-10T09:15:00Z',
    library: { name: 'Team Research Project', color: '#f59e0b' },
    annotations: [],
    _count: { citations: 5, annotations: 0 }
  }
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get('libraryId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredReferences = mockReferences.filter(ref => ref.userId === user.id);

    if (libraryId) {
      filteredReferences = filteredReferences.filter(ref => ref.libraryId === libraryId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredReferences = filteredReferences.filter(ref =>
        ref.title.toLowerCase().includes(searchLower) ||
        ref.authors.some(author => author.toLowerCase().includes(searchLower)) ||
        ref.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        ref.fullTextContent?.toLowerCase().includes(searchLower)
      );
    }

    const paginatedReferences = filteredReferences.slice(offset, offset + limit);

    return NextResponse.json({
      references: paginatedReferences,
      pagination: {
        total: filteredReferences.length,
        limit,
        offset,
        hasMore: offset + limit < filteredReferences.length
      }
    });
  } catch (error) {
    console.error('Error fetching references:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      libraryId,
      title,
      authors,
      year,
      journal,
      volume,
      issue,
      pages,
      publisher,
      doi,
      isbn,
      url,
      abstract,
      keywords,
      tags,
      type = 'article'
    } = data;

    if (!libraryId || !title) {
      return NextResponse.json({ error: 'Library ID and title are required' }, { status: 400 });
    }

    // Generate citation key
    const citationKey = `${authors?.[0]?.split(',')[0] || 'Unknown'}${year || 'NoDate'}_${title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`;

    const newReference = {
      id: `ref-${Date.now()}`,
      libraryId,
      userId: user.id,
      citationKey,
      type,
      title,
      authors: authors || [],
      year,
      journal,
      volume,
      issue,
      pages,
      publisher,
      doi,
      isbn,
      url,
      abstract,
      keywords: keywords || [],
      tags: tags || [],
      pdfUrl: null,
      pdfFileSize: null,
      fullTextContent: '',
      notes: '',
      citationCount: 0,
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      library: { name: 'New Library', color: '#6366f1' },
      annotations: [],
      _count: { citations: 0, annotations: 0 }
    };

    // Add to mock data
    mockReferences.push(newReference);

    return NextResponse.json({ reference: newReference }, { status: 201 });
  } catch (error) {
    console.error('Error creating reference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}