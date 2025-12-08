import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock search results from different sources
const mockSearchResults = {
  googleScholar: [
    {
      id: 'gs-1',
      title: 'Advanced Machine Learning Techniques for Academic Research',
      authors: ['Smith, J.', 'Johnson, A.'],
      year: 2024,
      journal: 'Nature Machine Intelligence',
      doi: '10.1038/s42256-024-00123-x',
      abstract: 'This comprehensive review explores cutting-edge machine learning approaches...',
      source: 'Google Scholar',
      relevance: 0.95,
      citations: 45
    },
    {
      id: 'gs-2',
      title: 'Citation Analysis Using Deep Learning Methods',
      authors: ['Williams, B.', 'Davis, M.'],
      year: 2023,
      journal: 'Journal of Informetrics',
      doi: '10.1016/j.joi.2023.101234',
      abstract: 'We present novel deep learning architectures for analyzing citation networks...',
      source: 'Google Scholar',
      relevance: 0.89,
      citations: 23
    }
  ],
  semanticScholar: [
    {
      id: 'ss-1',
      title: 'Neural Citation Recommendation Systems',
      authors: ['Chen, H.', 'Garcia, L.'],
      year: 2024,
      journal: 'ACM Transactions on Information Systems',
      doi: '10.1145/3456789',
      abstract: 'This paper introduces a neural network-based approach to citation recommendation...',
      source: 'Semantic Scholar',
      relevance: 0.87,
      citations: 67
    }
  ],
  crossref: [
    {
      id: 'cr-1',
      title: 'Bibliometric Analysis of Research Trends',
      authors: ['Taylor, S.', 'Brown, R.'],
      year: 2023,
      journal: 'Scientometrics',
      doi: '10.1007/s11192-023-04567-8',
      abstract: 'A comprehensive bibliometric analysis of emerging research trends...',
      source: 'CrossRef',
      relevance: 0.82,
      citations: 34
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sources = searchParams.get('sources')?.split(',') || ['googleScholar', 'semanticScholar', 'crossref'];
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Simulate search across different sources
    let allResults: any[] = [];

    sources.forEach(source => {
      if (mockSearchResults[source as keyof typeof mockSearchResults]) {
        const sourceResults = mockSearchResults[source as keyof typeof mockSearchResults]
          .filter(result =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.abstract.toLowerCase().includes(query.toLowerCase()) ||
            result.authors.some(author => author.toLowerCase().includes(query.toLowerCase()))
          )
          .map(result => ({
            ...result,
            relevance: result.relevance * (Math.random() * 0.2 + 0.9) // Add some randomness
          }));

        allResults = allResults.concat(sourceResults);
      }
    });

    // Sort by relevance and limit results
    allResults.sort((a, b) => b.relevance - a.relevance);
    const limitedResults = allResults.slice(0, limit);

    // Group by source for response
    const groupedResults = {
      googleScholar: limitedResults.filter(r => r.source === 'Google Scholar'),
      semanticScholar: limitedResults.filter(r => r.source === 'Semantic Scholar'),
      crossref: limitedResults.filter(r => r.source === 'CrossRef'),
      total: limitedResults.length
    };

    return NextResponse.json({
      query,
      sources,
      results: groupedResults,
      searchId: `search-${Date.now()}`
    });

  } catch (error) {
    console.error('Search error:', error);
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

    const { searchId, referenceIds } = await request.json();

    if (!referenceIds || !Array.isArray(referenceIds)) {
      return NextResponse.json({ error: 'Reference IDs are required' }, { status: 400 });
    }

    // Mock implementation - in real app, this would save search results
    // and allow bulk import of selected references

    const mockImported = referenceIds.map(id => ({
      id: `imported-${id}`,
      status: 'success',
      message: 'Reference imported successfully'
    }));

    return NextResponse.json({
      success: true,
      imported: mockImported,
      totalImported: mockImported.length
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}