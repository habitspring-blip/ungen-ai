import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalReferences: 247,
    totalLibraries: 4,
    totalCitations: 156,
    storageUsed: 524288000, // 500MB
    storageLimit: 1073741824, // 1GB
    activeUsers: 1,
    recentActivity: 23
  },
  usage: {
    referencesAdded: {
      daily: [5, 8, 12, 7, 15, 9, 11],
      weekly: [45, 52, 48, 61],
      monthly: [180, 195, 210, 225, 240, 247]
    },
    citationsGenerated: {
      daily: [12, 18, 25, 14, 32, 19, 22],
      weekly: [98, 115, 108, 134],
      monthly: [380, 410, 445, 465, 490, 520]
    },
    searchesPerformed: {
      daily: [8, 12, 15, 9, 18, 11, 14],
      weekly: [67, 78, 72, 89],
      monthly: [280, 305, 325, 345, 365, 385]
    }
  },
  topLibraries: [
    { name: 'PhD Thesis', references: 89, citations: 67, color: '#10b981' },
    { name: 'Team Research Project', references: 156, citations: 89, color: '#f59e0b' },
    { name: 'My Library', references: 15, citations: 12, color: '#6366f1' }
  ],
  topTags: [
    { tag: 'machine learning', count: 45, color: '#3b82f6' },
    { tag: 'citations', count: 38, color: '#ef4444' },
    { tag: 'research', count: 32, color: '#10b981' },
    { tag: 'AI', count: 28, color: '#f59e0b' },
    { tag: 'academic writing', count: 24, color: '#8b5cf6' }
  ],
  citationStyles: [
    { style: 'APA', count: 89, percentage: 57 },
    { style: 'MLA', count: 34, percentage: 22 },
    { style: 'Chicago', count: 23, percentage: 15 },
    { style: 'Harvard', count: 10, percentage: 6 }
  ],
  activityFeed: [
    { action: 'reference_added', details: 'Added "Machine Learning Approaches"', timestamp: '2024-01-15T14:30:00Z' },
    { action: 'citation_generated', details: 'Generated APA citation', timestamp: '2024-01-15T14:25:00Z' },
    { action: 'library_created', details: 'Created "Literature Review" library', timestamp: '2024-01-15T14:20:00Z' },
    { action: 'search_performed', details: 'Searched for "neural networks"', timestamp: '2024-01-15T14:15:00Z' },
    { action: 'pdf_uploaded', details: 'Uploaded research-paper.pdf', timestamp: '2024-01-15T14:10:00Z' }
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
    const period = searchParams.get('period') || 'month'; // day, week, month
    const metric = searchParams.get('metric'); // optional specific metric

    let analyticsData = { ...mockAnalytics };

    // Filter data based on period if needed
    if (period === 'week') {
      analyticsData.usage = {
        referencesAdded: { ...analyticsData.usage.referencesAdded, daily: analyticsData.usage.referencesAdded.weekly },
        citationsGenerated: { ...analyticsData.usage.citationsGenerated, daily: analyticsData.usage.citationsGenerated.weekly },
        searchesPerformed: { ...analyticsData.usage.searchesPerformed, daily: analyticsData.usage.searchesPerformed.weekly }
      };
    } else if (period === 'day') {
      // Keep daily data as is
    }

    // Return specific metric if requested
    if (metric) {
      return NextResponse.json({
        [metric]: analyticsData[metric as keyof typeof analyticsData],
        period
      });
    }

    return NextResponse.json({
      ...analyticsData,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}