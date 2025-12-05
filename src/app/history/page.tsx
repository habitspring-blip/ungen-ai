"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import DataTable from '@/components/ui/DataTable';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: string;
  title: string;
  type: 'rewrite' | 'ai-detection' | 'grammar';
  date: string;
  words: number;
  model: string;
  status: 'completed' | 'failed';
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'rewrite' | 'ai-detection' | 'grammar'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchHistory();
    }
  }, [user, router]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from different API endpoints
      const [rewriteResponse, aiResponse, grammarResponse] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/ai-detect'),
        fetch('/api/grammar')
      ]);

      const [rewriteData, aiData, grammarData] = await Promise.all([
        rewriteResponse.json(),
        aiResponse.json(),
        grammarResponse.json()
      ]);

      // Combine and format history data
      const combinedHistory: HistoryItem[] = [];

      // Add rewrite history
      if (rewriteData.success && rewriteData.history) {
        combinedHistory.push(...rewriteData.history.map((item: { id: string; originalText?: string; createdAt: string; wordCount?: number; model?: string }) => ({
          id: item.id,
          title: `Rewrite: ${item.originalText?.substring(0, 30) || 'Untitled'}`,
          type: 'rewrite',
          date: item.createdAt,
          words: item.wordCount || 0,
          model: item.model || 'auto',
          status: 'completed'
        })));
      }

      // Add AI detection history
      if (aiData.success && aiData.detections) {
        combinedHistory.push(...aiData.detections.map((item: { id: string; inputText?: string; createdAt: string; modelUsed?: string }) => ({
          id: item.id,
          title: `AI Detection: ${item.inputText?.substring(0, 30) || 'Untitled'}`,
          type: 'ai-detection',
          date: item.createdAt,
          words: item.inputText?.split(/\s+/).length || 0,
          model: item.modelUsed || 'consensus',
          status: 'completed'
        })));
      }

      // Add grammar history
      if (grammarData.success && grammarData.analyses) {
        combinedHistory.push(...grammarData.analyses.map((item: { id: string; inputText?: string; createdAt: string; wordCount?: number }) => ({
          id: item.id,
          title: `Grammar Check: ${item.inputText?.substring(0, 30) || 'Untitled'}`,
          type: 'grammar',
          date: item.createdAt,
          words: item.wordCount || 0,
          model: 'grammar-engine',
          status: 'completed'
        })));
      }

      // Sort by date (newest first)
      combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setHistory(combinedHistory);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    // Filter by type
    if (filterType !== 'all' && item.type !== filterType) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'rewrite': 'Content Rewrite',
      'ai-detection': 'AI Detection',
      'grammar': 'Grammar Check'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'rewrite': 'bg-indigo-100 text-indigo-700',
      'ai-detection': 'bg-purple-100 text-purple-700',
      'grammar': 'bg-emerald-100 text-emerald-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (item: HistoryItem) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
            {getTypeLabel(item.type)}
          </span>
          <span className="font-medium text-slate-900">{item.title}</span>
        </div>
      )
    },
    {
      key: 'words',
      header: 'Words',
      render: (item: HistoryItem) => (
        <span className="font-medium">{item.words.toLocaleString()}</span>
      ),
      className: 'text-right'
    },
    {
      key: 'model',
      header: 'Model',
      render: (item: HistoryItem) => (
        <span className="text-sm text-slate-600">{item.model}</span>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: HistoryItem) => (
        <span className="text-sm text-slate-500">
          {new Date(item.date).toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: HistoryItem) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.status}
        </span>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Activity History</h1>
        <p className="text-slate-600 mt-2">
          Comprehensive record of all your content processing activities
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <PremiumCard
          title="Filter & Search"
          subtitle="Find specific activities in your history"
          gradient="from-white to-slate-50"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Filter Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Activity Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'rewrite' | 'ai-detection' | 'grammar')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Activities</option>
                <option value="rewrite">Content Rewrites</option>
                <option value="ai-detection">AI Detection</option>
                <option value="grammar">Grammar Checks</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'table' | 'cards')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="table">Table View</option>
                <option value="cards">Card View</option>
              </select>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PremiumCard
          title="Total Activities"
          gradient="from-indigo-50 to-purple-50"
        >
          <div className="text-3xl font-bold text-slate-900">
            {history.length.toLocaleString()}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {filteredHistory.length} matching current filters
          </div>
        </PremiumCard>

        <PremiumCard
          title="Total Words"
          gradient="from-emerald-50 to-teal-50"
        >
          <div className="text-3xl font-bold text-slate-900">
            {history.reduce((sum, item) => sum + item.words, 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            processed across all activities
          </div>
        </PremiumCard>

        <PremiumCard
          title="Activity Types"
          gradient="from-amber-50 to-orange-50"
        >
          <div className="space-y-2">
            {['rewrite', 'ai-detection', 'grammar'].map(type => {
              const count = history.filter(item => item.type === type).length;
              if (count === 0) return null;

              return (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-slate-600 capitalize">
                    {getTypeLabel(type)}
                  </span>
                  <span className="font-medium text-slate-900">
                    {count} ({Math.round((count / history.length) * 100)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </PremiumCard>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            📋 Table View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              viewMode === 'cards'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            🃏 Card View
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 mt-4">Loading history...</p>
          </div>
        </div>
      ) : error ? (
        <PremiumCard title="Error" gradient="from-red-50 to-red-100">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <PremiumButton onClick={fetchHistory} size="sm" className="mt-4">
              Retry
            </PremiumButton>
          </div>
        </PremiumCard>
      ) : filteredHistory.length === 0 ? (
        <PremiumCard title="No Results" gradient="from-slate-50 to-slate-100">
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm">No activities found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search query</p>
          </div>
        </PremiumCard>
      ) : viewMode === 'table' ? (
        // Table View
        <PremiumCard title={`History (${filteredHistory.length} items)`}>
          <DataTable
            columns={columns}
            data={filteredHistory}
            onRowClick={(item) => setSelectedItem(item)}
          />
        </PremiumCard>
      ) : (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <PremiumCard
                title={item.title}
                subtitle={new Date(item.date).toLocaleString()}
                gradient="from-white to-slate-50"
              >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="text-sm text-slate-500">
                    {item.words.toLocaleString()} words • {item.model}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-slate-600 capitalize">
                    {item.status}
                  </span>
                </div>
              </div>
            </PremiumCard>
          </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedItem.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {getTypeLabel(selectedItem.type)} • {new Date(selectedItem.date).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-slate-600">Words Processed</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {selectedItem.words.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Model Used</div>
                  <div className="text-lg font-medium text-slate-900">
                    {selectedItem.model}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-slate-600 mb-2">Status</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                  selectedItem.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span className="font-medium">{selectedItem.status}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <PremiumButton
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </PremiumButton>
                <PremiumButton
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement re-process functionality
                    setSelectedItem(null);
                  }}
                >
                  Re-process
                </PremiumButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
