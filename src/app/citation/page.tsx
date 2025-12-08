"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

// Mock data for demonstration - will be replaced with real data from Supabase
interface Library {
  id: string;
  name: string;
  description: string;
  color: string;
  referenceCount: number;
  isShared: boolean;
}

interface Reference {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  doi?: string;
  tags: string[];
  hasPdf: boolean;
  citationCount: number;
  lastModified: string;
}

export default function CitationDashboardPage() {
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showCitationStyles, setShowCitationStyles] = useState(false);
  const [selectedCitationStyle, setSelectedCitationStyle] = useState('apa');
  const [previewReference, setPreviewReference] = useState<Reference | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showReferenceDetail, setShowReferenceDetail] = useState(false);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'bibtex' | 'ris' | 'csv' | 'json'>('bibtex');
  const [exportScope, setExportScope] = useState<'current' | 'library' | 'all'>('current');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [activityFeed, setActivityFeed] = useState<Array<{
    id: string;
    user: string;
    action: string;
    target: string;
    timestamp: string;
    type: 'add' | 'edit' | 'delete' | 'share' | 'comment';
  }>>([
    {
      id: '1',
      user: 'Dr. Sarah Chen',
      action: 'added reference',
      target: '"Machine Learning Approaches for Citation Analysis"',
      timestamp: '2024-01-15T10:30:00Z',
      type: 'add'
    },
    {
      id: '2',
      user: 'John Doe',
      action: 'edited metadata for',
      target: '"The Impact of AI on Academic Writing"',
      timestamp: '2024-01-15T09:45:00Z',
      type: 'edit'
    },
    {
      id: '3',
      user: 'Dr. Sarah Chen',
      action: 'shared library',
      target: '"PhD Thesis" with 3 collaborators',
      timestamp: '2024-01-15T08:20:00Z',
      type: 'share'
    }
  ]);

  const [onlineUsers, setOnlineUsers] = useState<Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'away' | 'busy';
    currentLibrary?: string;
  }>>([
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      status: 'online',
      currentLibrary: 'PhD Thesis'
    },
    {
      id: '2',
      name: 'John Doe',
      status: 'online',
      currentLibrary: 'Team Research Project'
    },
    {
      id: '3',
      name: 'Prof. Michael Johnson',
      status: 'away',
      currentLibrary: 'PhD Thesis'
    }
  ]);

  const [comments, setComments] = useState<Array<{
    id: string;
    referenceId: string;
    user: string;
    content: string;
    timestamp: string;
    mentions: string[];
  }>>([]);
  const [newComment, setNewComment] = useState('');
  const [showNetworkVisualization, setShowNetworkVisualization] = useState(false);
  const [showDiscoveryEngine, setShowDiscoveryEngine] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryResults, setDiscoveryResults] = useState<Array<{
    id: string;
    title: string;
    authors: string[];
    year: number;
    journal: string;
    doi: string;
    abstract: string;
    source: string;
    relevance: number;
  }>>([]);
  const [showTrendsDashboard, setShowTrendsDashboard] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'new-paper' | 'citation-update' | 'trending-topic';
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
  }>>([
    {
      id: '1',
      type: 'new-paper',
      title: 'New paper in your field',
      description: '"Advanced Neural Citation Models" by Chen et al. matches your research interests',
      timestamp: '2024-01-15T14:30:00Z',
      read: false
    },
    {
      id: '2',
      type: 'citation-update',
      title: 'Citation milestone reached',
      description: 'Your paper "Machine Learning Approaches" has reached 50 citations',
      timestamp: '2024-01-15T12:15:00Z',
      read: false
    },
    {
      id: '3',
      type: 'trending-topic',
      title: 'Trending topic alert',
      description: 'Interest in "Federated Learning" has increased 45% this week',
      timestamp: '2024-01-15T10:00:00Z',
      read: true
    }
  ]);

  // Phase 3: Writing Assistant Features
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const [writingText, setWritingText] = useState('');
  const [grammarCheckResults, setGrammarCheckResults] = useState<Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    position: number;
    length: number;
  }>>([]);
  const [plagiarismResults, setPlagiarismResults] = useState<{
    score: number;
    matches: Array<{
      source: string;
      similarity: number;
      text: string;
    }>;
  } | null>(null);
  const [paraphraseSuggestions, setParaphraseSuggestions] = useState<string[]>([]);
  const [showEnterpriseSettings, setShowEnterpriseSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Mock libraries data
  const libraries: Library[] = [
    {
      id: 'all',
      name: 'All References',
      description: 'All your references across libraries',
      color: '#6366f1',
      referenceCount: 247,
      isShared: false
    },
    {
      id: 'phd-thesis',
      name: 'PhD Thesis',
      description: 'References for my dissertation research',
      color: '#10b981',
      referenceCount: 89,
      isShared: false
    },
    {
      id: 'team-project',
      name: 'Team Research Project',
      description: 'Shared references with lab colleagues',
      color: '#f59e0b',
      referenceCount: 156,
      isShared: true
    },
    {
      id: 'book-chapter',
      name: 'Book Chapter',
      description: 'References for upcoming publication',
      color: '#ef4444',
      referenceCount: 23,
      isShared: false
    }
  ];

  // Mock references data
  const references: Reference[] = [
    {
      id: '1',
      title: 'Machine Learning Approaches for Citation Analysis',
      authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
      year: 2024,
      journal: 'Journal of Academic Research',
      doi: '10.1234/jar.2024.001',
      tags: ['machine learning', 'citations', 'research'],
      hasPdf: true,
      citationCount: 12,
      lastModified: '2024-01-15'
    },
    {
      id: '2',
      title: 'The Impact of AI on Academic Writing',
      authors: ['Davis, M.', 'Brown, R.'],
      year: 2023,
      journal: 'AI in Education Review',
      doi: '10.5678/aier.2023.045',
      tags: ['AI', 'academic writing', 'technology'],
      hasPdf: true,
      citationCount: 8,
      lastModified: '2024-01-12'
    },
    {
      id: '3',
      title: 'Citation Management Tools: A Comparative Study',
      authors: ['Wilson, K.', 'Garcia, L.', 'Chen, H.'],
      year: 2024,
      journal: 'Library Science Today',
      tags: ['citation tools', 'libraries', 'comparison'],
      hasPdf: false,
      citationCount: 15,
      lastModified: '2024-01-10'
    },
    {
      id: '4',
      title: 'Open Access Publishing and Citation Metrics',
      authors: ['Taylor, S.'],
      year: 2023,
      journal: 'Open Science Journal',
      doi: '10.9876/osj.2023.078',
      tags: ['open access', 'publishing', 'metrics'],
      hasPdf: true,
      citationCount: 6,
      lastModified: '2024-01-08'
    }
  ];

  const quickActions = [
    {
      id: 'browser-import',
      title: 'Import from Browser',
      description: 'One-click import from academic sites',
      icon: '🌐',
      action: () => console.log('Browser import')
    },
    {
      id: 'upload-pdf',
      title: 'Upload PDF',
      description: 'Drag & drop or browse for PDFs',
      icon: '📄',
      action: () => console.log('Upload PDF')
    },
    {
      id: 'add-manual',
      title: 'Add Manually',
      description: 'Enter reference details manually',
      icon: '✏️',
      action: () => console.log('Add manual')
    },
    {
      id: 'import-doi',
      title: 'Import by DOI',
      description: 'Quick import using DOI or URL',
      icon: '🔗',
      action: () => console.log('Import DOI')
    }
  ];

  const citationStyles = [
    {
      id: 'apa',
      name: 'APA (7th Edition)',
      description: 'American Psychological Association',
      example: 'Smith, J., Johnson, A., & Williams, B. (2024). Machine learning approaches for citation analysis. Journal of Academic Research, 15(2), 123-145. https://doi.org/10.1234/jar.2024.001'
    },
    {
      id: 'mla',
      name: 'MLA (9th Edition)',
      description: 'Modern Language Association',
      example: 'Smith, John, et al. "Machine Learning Approaches for Citation Analysis." Journal of Academic Research, vol. 15, no. 2, 2024, pp. 123-145.'
    },
    {
      id: 'chicago',
      name: 'Chicago (17th Edition)',
      description: 'Chicago Manual of Style',
      example: 'Smith, John, Amanda Johnson, and Brian Williams. "Machine Learning Approaches for Citation Analysis." Journal of Academic Research 15, no. 2 (2024): 123-145.'
    },
    {
      id: 'harvard',
      name: 'Harvard',
      description: 'Harvard Referencing Style',
      example: 'Smith, J., Johnson, A. and Williams, B. (2024) Machine learning approaches for citation analysis. Journal of Academic Research, 15(2), pp.123-145.'
    },
    {
      id: 'ieee',
      name: 'IEEE',
      description: 'Institute of Electrical and Electronics Engineers',
      example: '[1] J. Smith, A. Johnson, and B. Williams, "Machine learning approaches for citation analysis," Journal of Academic Research, vol. 15, no. 2, pp. 123-145, 2024.'
    },
    {
      id: 'ama',
      name: 'AMA',
      description: 'American Medical Association',
      example: 'Smith J, Johnson A, Williams B. Machine learning approaches for citation analysis. Journal of Academic Research. 2024;15(2):123-145.'
    }
  ];

  const filteredReferences = references.filter(ref =>
    ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ref.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
    ref.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentLibrary = libraries.find(lib => lib.id === selectedLibrary);

  const generateAISummary = async (reference: Reference) => {
    setGeneratingSummary(true);
    // Mock AI summary generation - in real implementation, this would call an AI API
    setTimeout(() => {
      const mockSummary = `This paper explores machine learning approaches for citation analysis in academic research. The authors present a comprehensive framework for analyzing citation patterns and developing predictive models for research impact assessment. Key findings include improved accuracy in citation prediction and novel methodologies for scholarly network analysis. The study contributes to the growing field of computational social science and provides practical tools for researchers and institutions.`;
      setAiSummary(mockSummary);
      setGeneratingSummary(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CitePro</h1>
            <p className="text-slate-600">Smart citations for modern researchers</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Citation Style Selector */}
            <button
              onClick={() => setShowCitationStyles(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              {citationStyles.find(s => s.id === selectedCitationStyle)?.name || 'APA'}
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Discovery Engine Button */}
            <button
              onClick={() => setShowDiscoveryEngine(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Discover
            </button>

            {/* Network Visualization Button */}
            <button
              onClick={() => setShowNetworkVisualization(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Network
            </button>

            {/* Research Trends Button */}
            <button
              onClick={() => setShowTrendsDashboard(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Trends
            </button>

            {/* Alerts Button */}
            <button
              onClick={() => setShowAlerts(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all relative"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Alerts
              {alerts.filter(a => !a.read).length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {alerts.filter(a => !a.read).length}
                  </span>
                </div>
              )}
            </button>

            {/* Writing Assistant Button */}
            <button
              onClick={() => setShowWritingAssistant(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write
            </button>

            {/* Enterprise Settings Button */}
            <button
              onClick={() => setShowEnterpriseSettings(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Enterprise
            </button>

            {/* Analytics Button */}
            <button
              onClick={() => setShowAnalytics(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>

            {/* Activity Feed Button */}
            <button
              onClick={() => setShowActivityFeed(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all relative"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Activity
              {/* Activity indicator dot */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {/* New Reference Button */}
            <PremiumButton size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Reference
            </PremiumButton>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Libraries Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 transform transition-transform md:relative md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Mobile Close Button */}
          <div className="flex justify-end mb-4 md:hidden">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Libraries</h2>
            <div className="space-y-2">
              {libraries.map((library) => (
                <button
                  key={library.id}
                  onClick={() => setSelectedLibrary(library.id)}
                  className={`group w-full text-left p-3 rounded-lg transition-all ${
                    selectedLibrary === library.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: library.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {library.name}
                        </div>
                        {library.isShared && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {library.referenceCount} references
                      </div>
                    </div>
                    {library.id !== 'all' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Library
            </button>
          </div>

          {/* Online Collaborators */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Online Now</h2>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'away' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {user.name}
                    </div>
                    {user.currentLibrary && (
                      <div className="text-xs text-slate-500 truncate">
                        in {user.currentLibrary}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {onlineUsers.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No collaborators online
              </p>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-700">
                    {action.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {action.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* References Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {currentLibrary?.name || 'All References'}
                </h2>
                <p className="text-slate-600">
                  {filteredReferences.length} references
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                <button
                  onClick={() => setActiveView('grid')}
                  className={`p-2 rounded ${
                    activeView === 'grid'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveView('list')}
                  className={`p-2 rounded ${
                    activeView === 'list'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* References Display */}
            {activeView === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReferences.map((reference) => (
                  <div
                    key={reference.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedReference(reference);
                      setEditingReference(null);
                      setShowReferenceDetail(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                          {reference.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {reference.authors.join(', ')} ({reference.year})
                        </p>
                      </div>
                      {reference.hasPdf && (
                        <button
                          onClick={() => {
                            setPdfUrl(`/api/documents/${reference.id}/pdf`); // Mock PDF URL
                            setShowPdfViewer(true);
                          }}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                          title="View PDF"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5ZM15 3.5V7H18.5L15 3.5ZM7 4V20H17V9H13V4H7Z"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {reference.journal && (
                      <p className="text-xs text-slate-500 mb-2">
                        {reference.journal}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {reference.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {reference.tags.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                            +{reference.tags.length - 2}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400">
                        {reference.citationCount} citations
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReferences.map((reference) => (
                  <div
                    key={reference.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedReference(reference);
                      setEditingReference(null);
                      setShowReferenceDetail(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 mb-1">
                          {reference.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>{reference.authors.join(', ')}</span>
                          <span>({reference.year})</span>
                          {reference.journal && <span>{reference.journal}</span>}
                          <span>{reference.citationCount} citations</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {reference.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {reference.hasPdf && (
                          <button
                            onClick={() => {
                              setPdfUrl(`/api/documents/${reference.id}/pdf`); // Mock PDF URL
                              setShowPdfViewer(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600"
                            title="View PDF"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5ZM15 3.5V7H18.5L15 3.5ZM7 4V20H17V9H13V4H7Z"/>
                            </svg>
                          </button>
                        )}

                        <button className="p-2 text-slate-400 hover:text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredReferences.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No references found</h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first reference'}
                </p>
                <PremiumButton size="sm">
                  Add Your First Reference
                </PremiumButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citation Styles Modal */}
      {showCitationStyles && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Citation Styles</h2>
              <button
                onClick={() => setShowCitationStyles(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Choose Citation Style</h3>
                <p className="text-slate-600">Select a citation style to use for your references and exports.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {citationStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedCitationStyle(style.id);
                      setShowCitationStyles(false);
                    }}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedCitationStyle === style.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{style.name}</h4>
                      {selectedCitationStyle === style.id && (
                        <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{style.description}</p>
                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded font-mono">
                      {style.example}
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-medium text-slate-900 mb-4">Preview with Sample Reference</h4>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600 mb-2">Selected style: {citationStyles.find(s => s.id === selectedCitationStyle)?.name}</div>
                  <div className="text-sm font-mono text-slate-800 bg-white p-3 rounded border">
                    {citationStyles.find(s => s.id === selectedCitationStyle)?.example}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowCitationStyles(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <PremiumButton
                onClick={() => setShowCitationStyles(false)}
                size="sm"
              >
                Apply Style
              </PremiumButton>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">PDF Viewer</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 h-[calc(90vh-80px)]">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reference Detail Modal */}
      {showReferenceDetail && selectedReference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingReference ? 'Edit Reference' : 'Reference Details'}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {selectedReference.authors.join(', ')} ({selectedReference.year})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!editingReference ? (
                  <button
                    onClick={() => setEditingReference(selectedReference)}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingReference(null)}
                      className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 rounded-lg transition-all">
                      Save Changes
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowReferenceDetail(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metadata Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Metadata</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    {editingReference ? (
                      <input
                        type="text"
                        value={editingReference.title}
                        onChange={(e) => setEditingReference(prev => prev ? {...prev, title: e.target.value} : null)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedReference.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Authors</label>
                    {editingReference ? (
                      <input
                        type="text"
                        value={editingReference.authors.join(', ')}
                        onChange={(e) => setEditingReference(prev => prev ? {...prev, authors: e.target.value.split(', ')} : null)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedReference.authors.join(', ')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                      {editingReference ? (
                        <input
                          type="number"
                          value={editingReference.year}
                          onChange={(e) => setEditingReference(prev => prev ? {...prev, year: parseInt(e.target.value)} : null)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedReference.year}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Journal</label>
                      {editingReference ? (
                        <input
                          type="text"
                          value={editingReference.journal || ''}
                          onChange={(e) => setEditingReference(prev => prev ? {...prev, journal: e.target.value} : null)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedReference.journal || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">DOI</label>
                    {editingReference ? (
                      <input
                        type="text"
                        value={editingReference.doi || ''}
                        onChange={(e) => setEditingReference(prev => prev ? {...prev, doi: e.target.value} : null)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedReference.doi || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                    {editingReference ? (
                      <input
                        type="text"
                        value={editingReference.tags.join(', ')}
                        onChange={(e) => setEditingReference(prev => prev ? {...prev, tags: e.target.value.split(', ')} : null)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedReference.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Citations Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Actions & Citations</h3>

                  {/* Citation Preview */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Citation Preview</label>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">{citationStyles.find(s => s.id === selectedCitationStyle)?.name}</div>
                      <div className="text-sm font-mono text-slate-800">
                        {citationStyles.find(s => s.id === selectedCitationStyle)?.example}
                      </div>
                    </div>
                    <button className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a1 1 0 01-1-1z" />
                      </svg>
                      Copy Citation
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quick Actions</label>
                    <div className="space-y-2">
                      {selectedReference.hasPdf && (
                        <button
                          onClick={() => {
                            setPdfUrl(`/api/documents/${selectedReference.id}/pdf`);
                            setShowPdfViewer(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5ZM15 3.5V7H18.5L15 3.5ZM7 4V20H17V9H13V4H7Z"/>
                          </svg>
                          View PDF
                        </button>
                      )}

                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Reference
                      </button>

                      <button
                        onClick={() => generateAISummary(selectedReference)}
                        disabled={generatingSummary}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingSummary ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Generate AI Summary
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {aiSummary && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">AI Summary</label>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-800 leading-relaxed">
                          {aiSummary}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                            Copy Summary
                          </button>
                          <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                            Regenerate
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related Articles */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Related Articles</label>
                    <div className="space-y-2">
                      {[
                        {
                          title: 'Deep Learning Approaches to Citation Network Analysis',
                          authors: ['Chen, H.', 'Zhang, Y.'],
                          year: 2024,
                          relevance: 92
                        },
                        {
                          title: 'Machine Learning for Academic Impact Prediction',
                          authors: ['Rodriguez, M.', 'Kim, S.'],
                          year: 2023,
                          relevance: 87
                        },
                        {
                          title: 'Neural Citation Models: A Survey',
                          authors: ['Thompson, L.', 'Garcia, P.'],
                          year: 2024,
                          relevance: 83
                        }
                      ].map((article, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {article.title}
                            </div>
                            <div className="text-xs text-slate-600">
                              {article.authors.join(', ')} ({article.year})
                            </div>
                          </div>
                          <div className="ml-2 flex items-center gap-2">
                            <span className="text-xs text-slate-500">{article.relevance}%</span>
                            <button className="text-xs text-indigo-600 hover:text-indigo-700">
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Comments</label>
                    <div className="space-y-3">
                      {/* Existing Comments */}
                      {comments.filter(c => c.referenceId === selectedReference.id).map((comment) => (
                        <div key={comment.id} className="bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-indigo-700">
                                {comment.user.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-slate-900">{comment.user}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment... Use @ to mention collaborators"
                          className="w-full text-sm border-0 resize-none focus:outline-none"
                          rows={2}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-slate-500">
                            Press Enter to post, @ to mention
                          </div>
                          <button
                            onClick={() => {
                              if (newComment.trim()) {
                                const comment = {
                                  id: Date.now().toString(),
                                  referenceId: selectedReference.id,
                                  user: 'You',
                                  content: newComment,
                                  timestamp: new Date().toISOString(),
                                  mentions: []
                                };
                                setComments(prev => [...prev, comment]);
                                setNewComment('');
                              }
                            }}
                            disabled={!newComment.trim()}
                            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded transition-all"
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Statistics</label>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Citations:</span>
                        <span className="font-medium">{selectedReference.citationCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Last modified:</span>
                        <span className="font-medium">{new Date(selectedReference.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Export References</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Export Scope */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">What to export</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="current"
                      checked={exportScope === 'current'}
                      onChange={(e) => setExportScope(e.target.value as typeof exportScope)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">Current library ({currentLibrary?.referenceCount || 0} references)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={(e) => setExportScope(e.target.value as typeof exportScope)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">All libraries ({references.length} references)</span>
                  </label>
                </div>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Export format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'bibtex' as const, name: 'BibTeX', description: 'LaTeX bibliography' },
                    { id: 'ris' as const, name: 'RIS', description: 'Research Information Systems' },
                    { id: 'csv' as const, name: 'CSV', description: 'Comma-separated values' },
                    { id: 'json' as const, name: 'JSON', description: 'JavaScript Object Notation' }
                  ].map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        exportFormat === format.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-900">{format.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Citation Style for BibTeX/RIS */}
              {(exportFormat === 'bibtex' || exportFormat === 'ris') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Citation style</label>
                  <select
                    value={selectedCitationStyle}
                    onChange={(e) => setSelectedCitationStyle(e.target.value as typeof selectedCitationStyle)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {citationStyles.map((style) => (
                      <option key={style.id} value={style.id}>{style.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <PremiumButton
                onClick={() => {
                  // Mock export functionality
                  const data = exportScope === 'current' ? filteredReferences : references;
                  console.log(`Exporting ${data.length} references in ${exportFormat} format`);
                  setShowExportModal(false);
                  // In real implementation, this would trigger a download
                }}
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export {exportScope === 'current' ? filteredReferences.length : references.length} References
              </PremiumButton>
            </div>
          </div>
        </div>
      )}

      {/* Share Library Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Share Library</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Share <strong>{currentLibrary?.name}</strong> with collaborators. They'll be able to access all references in this library.
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="colleague@university.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Permission Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Permission level</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="view"
                      checked={sharePermission === 'view'}
                      onChange={(e) => setSharePermission(e.target.value as typeof sharePermission)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-2">
                      <div className="text-sm font-medium text-slate-700">Can view</div>
                      <div className="text-xs text-slate-500">Read-only access to references</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="edit"
                      checked={sharePermission === 'edit'}
                      onChange={(e) => setSharePermission(e.target.value as typeof sharePermission)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-2">
                      <div className="text-sm font-medium text-slate-700">Can edit</div>
                      <div className="text-xs text-slate-500">Can add, edit, and delete references</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="admin"
                      checked={sharePermission === 'admin'}
                      onChange={(e) => setSharePermission(e.target.value as typeof sharePermission)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-2">
                      <div className="text-sm font-medium text-slate-700">Admin</div>
                      <div className="text-xs text-slate-500">Full control including sharing settings</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Current Collaborators (Mock) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current collaborators</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-700">JD</span>
                      </div>
                      <span className="text-sm text-slate-700">john.doe@university.edu</span>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">Can edit</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <PremiumButton
                onClick={() => {
                  // Mock sharing functionality
                  console.log(`Sharing library with ${shareEmail} (${sharePermission} permission)`);
                  setShowShareModal(false);
                  setShareEmail('');
                  setSharePermission('view');
                }}
                disabled={!shareEmail.trim()}
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Send Invitation
              </PremiumButton>
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed Modal */}
      {showActivityFeed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Activity Feed</h2>
              <button
                onClick={() => setShowActivityFeed(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'add' ? 'bg-green-100 text-green-600' :
                        activity.type === 'edit' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'delete' ? 'bg-red-100 text-red-600' :
                        activity.type === 'share' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'add' && <span>+</span>}
                        {activity.type === 'edit' && <span>✏️</span>}
                        {activity.type === 'delete' && <span>🗑️</span>}
                        {activity.type === 'share' && <span>👥</span>}
                        {activity.type === 'comment' && <span>💬</span>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium text-slate-700">{activity.target}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {activityFeed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Citation Network Visualization Modal */}
      {showNetworkVisualization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Citation Network</h2>
              <button
                onClick={() => setShowNetworkVisualization(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                {/* Network Visualization */}
                <div className="lg:col-span-3 bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-900">Citation Connections</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
                        Zoom In
                      </button>
                      <button className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
                        Zoom Out
                      </button>
                      <button className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Simple Network Visualization */}
                  <div className="relative h-96 bg-white rounded border border-slate-200 overflow-hidden">
                    {/* Mock network nodes and connections */}
                    <svg className="w-full h-full" viewBox="0 0 600 400">
                      {/* Connection lines */}
                      <line x1="150" y1="150" x2="300" y2="200" stroke="#e2e8f0" strokeWidth="2" />
                      <line x1="300" y1="200" x2="450" y2="150" stroke="#e2e8f0" strokeWidth="2" />
                      <line x1="300" y1="200" x2="300" y2="300" stroke="#e2e8f0" strokeWidth="2" />
                      <line x1="150" y1="150" x2="300" y2="300" stroke="#e2e8f0" strokeWidth="2" />

                      {/* Nodes */}
                      <circle cx="150" cy="150" r="20" fill="#6366f1" />
                      <circle cx="300" cy="200" r="25" fill="#10b981" />
                      <circle cx="450" cy="150" r="18" fill="#f59e0b" />
                      <circle cx="300" cy="300" r="20" fill="#ef4444" />

                      {/* Labels */}
                      <text x="150" y="155" textAnchor="middle" className="text-xs fill-white font-medium">ML</text>
                      <text x="300" y="205" textAnchor="middle" className="text-xs fill-white font-medium">AI</text>
                      <text x="450" y="155" textAnchor="middle" className="text-xs fill-white font-medium">CIT</text>
                      <text x="300" y="305" textAnchor="middle" className="text-xs fill-white font-medium">RES</text>
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-sm border">
                      <div className="text-xs font-medium text-slate-900 mb-2">Legend</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          <span>Machine Learning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <span>AI Research</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span>Citation Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Research Methods</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-3">Network Stats</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-slate-900">Total Papers</div>
                        <div className="text-2xl font-bold text-indigo-600">247</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-slate-900">Connections</div>
                        <div className="text-2xl font-bold text-emerald-600">1,432</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-slate-900">Avg Citations</div>
                        <div className="text-2xl font-bold text-amber-600">5.8</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-3">Top Cited Papers</h3>
                    <div className="space-y-2">
                      {references.slice(0, 3).map((ref, index) => (
                        <div key={ref.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                          <div className="text-sm font-medium text-slate-500">#{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {ref.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {ref.citationCount} citations
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-3">Filter Options</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="text-indigo-600" defaultChecked />
                        <span className="ml-2 text-sm text-slate-700">Show co-citations</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="text-indigo-600" defaultChecked />
                        <span className="ml-2 text-sm text-slate-700">Show references</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="text-indigo-600" />
                        <span className="ml-2 text-sm text-slate-700">Show abstracts</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Discovery Engine Modal */}
      {showDiscoveryEngine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Smart Discovery</h2>
              <button
                onClick={() => setShowDiscoveryEngine(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                {/* Search Interface */}
                <div className="lg:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search Query</label>
                    <input
                      type="text"
                      value={discoveryQuery}
                      onChange={(e) => setDiscoveryQuery(e.target.value)}
                      placeholder="machine learning citations..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search Sources</label>
                    <div className="space-y-2">
                      {[
                        { id: 'google-scholar', name: 'Google Scholar', icon: '🎓' },
                        { id: 'pubmed', name: 'PubMed', icon: '🏥' },
                        { id: 'semantic-scholar', name: 'Semantic Scholar', icon: '🧠' },
                        { id: 'crossref', name: 'CrossRef', icon: '🔗' },
                        { id: 'core', name: 'CORE', icon: '📚' }
                      ].map((source) => (
                        <label key={source.id} className="flex items-center">
                          <input type="checkbox" className="text-indigo-600" defaultChecked />
                          <span className="ml-2 text-sm text-slate-700">{source.icon} {source.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                    <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>Any time</option>
                      <option>Past year</option>
                      <option>Past 5 years</option>
                      <option>Past 10 years</option>
                      <option>Custom range</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sort by</label>
                    <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>Relevance</option>
                      <option>Publication date</option>
                      <option>Citation count</option>
                      <option>Author</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      // Mock search results
                      setDiscoveryResults([
                        {
                          id: '1',
                          title: 'Advanced Citation Analysis Using Machine Learning Techniques',
                          authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
                          year: 2024,
                          journal: 'Journal of Information Science',
                          doi: '10.1234/jis.2024.002',
                          abstract: 'This paper presents novel machine learning approaches for analyzing citation patterns in academic literature...',
                          source: 'Google Scholar',
                          relevance: 95
                        },
                        {
                          id: '2',
                          title: 'Neural Networks for Citation Prediction and Impact Assessment',
                          authors: ['Davis, M.', 'Chen, H.'],
                          year: 2024,
                          journal: 'AI in Research',
                          doi: '10.5678/air.2024.015',
                          abstract: 'We introduce a deep learning framework for predicting citation counts and assessing research impact...',
                          source: 'Semantic Scholar',
                          relevance: 89
                        },
                        {
                          id: '3',
                          title: 'Bibliometric Analysis of Citation Networks in Computer Science',
                          authors: ['Garcia, L.', 'Brown, R.', 'Taylor, S.'],
                          year: 2023,
                          journal: 'Scientometrics',
                          doi: '10.9876/scient.2023.045',
                          abstract: 'This study examines citation networks in computer science using advanced bibliometric methods...',
                          source: 'CrossRef',
                          relevance: 82
                        }
                      ]);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
                  >
                    Search
                  </button>
                </div>

                {/* Results */}
                <div className="lg:col-span-3">
                  {discoveryResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900">
                          Found {discoveryResults.length} results
                        </h3>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900">
                            Import All
                          </button>
                          <button className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700">
                            Save Search
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {discoveryResults.map((result) => (
                          <div key={result.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-900 mb-1 line-clamp-2">
                                  {result.title}
                                </h4>
                                <div className="text-xs text-slate-600 mb-2">
                                  {result.authors.join(', ')} • {result.year} • {result.journal}
                                </div>
                                <div className="text-xs text-slate-500 mb-2">
                                  DOI: {result.doi} • Source: {result.source}
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-3">
                                  {result.abstract}
                                </p>
                              </div>
                              <div className="ml-4 flex flex-col items-end gap-2">
                                <div className="text-xs text-slate-500">
                                  {result.relevance}% relevant
                                </div>
                                <div className="flex gap-1">
                                  <button className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded">
                                    Import
                                  </button>
                                  <button className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded">
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Discover New Research</h3>
                      <p className="text-slate-500 mb-6 max-w-md">
                        Search across Google Scholar, PubMed, Semantic Scholar, and other academic databases to find relevant papers for your research.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span>🎓</span>
                          <span>Google Scholar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🏥</span>
                          <span>PubMed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🧠</span>
                          <span>Semantic Scholar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📚</span>
                          <span>CORE</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Research Trends Dashboard Modal */}
      {showTrendsDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Research Trends</h2>
              <button
                onClick={() => setShowTrendsDashboard(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Publication Trends */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Publication Trends</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Machine Learning</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded">
                          <div className="w-16 h-2 bg-indigo-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">+24%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">AI Research</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded">
                          <div className="w-14 h-2 bg-emerald-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">+18%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Citation Analysis</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded">
                          <div className="w-12 h-2 bg-amber-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">+12%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Research Methods</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded">
                          <div className="w-10 h-2 bg-red-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">+8%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emerging Topics */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Emerging Topics</h3>
                  <div className="space-y-3">
                    {[
                      { topic: 'Large Language Models', growth: '+156%', status: 'hot' },
                      { topic: 'Federated Learning', growth: '+89%', status: 'rising' },
                      { topic: 'Explainable AI', growth: '+67%', status: 'rising' },
                      { topic: 'Quantum Computing', growth: '+45%', status: 'steady' },
                      { topic: 'Edge AI', growth: '+34%', status: 'steady' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-slate-900">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.status === 'hot' ? 'bg-red-100 text-red-700' :
                            item.status === 'rising' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-sm font-medium text-slate-900">{item.growth}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citation Velocity */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Citation Velocity</h3>
                  <div className="space-y-3">
                    {references.slice(0, 4).map((ref, index) => (
                      <div key={ref.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {ref.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {ref.authors[0]} et al. ({ref.year})
                          </div>
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {[12, 8, 15, 6][index]}/month
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Research Impact */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Field Impact</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 mb-1">8.4</div>
                      <div className="text-sm text-slate-600">Avg. Citations per Paper</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">23%</div>
                      <div className="text-sm text-slate-600">Open Access Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-600 mb-1">156</div>
                      <div className="text-sm text-slate-600">Papers This Month</div>
                    </div>
                  </div>
                </div>

                {/* Trend Alerts */}
                <div className="bg-slate-50 p-4 rounded-lg lg:col-span-2">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Trend Alerts</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Rising Topic: Transformer Architecture</div>
                        <div className="text-sm text-slate-600">Publications in this area have increased 67% in the last quarter</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Citation Spike: Neural Networks Paper</div>
                        <div className="text-sm text-slate-600">Recent paper gaining 45 citations per week</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">New Research Area: AI Ethics</div>
                        <div className="text-sm text-slate-600">Emerging field with growing interdisciplinary interest</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Writing Assistant Modal */}
      {showWritingAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Writing Assistant</h2>
              <button
                onClick={() => setShowWritingAssistant(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex h-[calc(90vh-120px)]">
              {/* Writing Area */}
              <div className="flex-1 p-6 border-r border-slate-200">
                <div className="mb-4">
                  <textarea
                    value={writingText}
                    onChange={(e) => setWritingText(e.target.value)}
                    placeholder="Start writing your research paper, thesis, or article... The AI assistant will help with citations, grammar, and style."
                    className="w-full h-96 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
                    <span>{writingText.length} characters • {writingText.split(/\s+/).filter(w => w.length > 0).length} words</span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded">
                        Save Draft
                      </button>
                      <button className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded">
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      // Mock grammar check
                      setGrammarCheckResults([
                        { type: 'error', message: 'Subject-verb agreement issue', position: 45, length: 8 },
                        { type: 'warning', message: 'Consider using active voice', position: 120, length: 15 },
                        { type: 'suggestion', message: 'More concise alternative available', position: 200, length: 12 }
                      ]);
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition"
                  >
                    <div className="text-sm font-medium text-blue-900">Grammar Check</div>
                    <div className="text-xs text-blue-700">AI-powered proofreading</div>
                  </button>

                  <button
                    onClick={() => {
                      // Mock plagiarism check
                      setPlagiarismResults({
                        score: 12,
                        matches: [
                          { source: 'similar-paper-2023.pdf', similarity: 8, text: 'Machine learning approaches...' },
                          { source: 'research-article-2022.pdf', similarity: 4, text: 'Citation analysis methods...' }
                        ]
                      });
                    }}
                    className="p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left transition"
                  >
                    <div className="text-sm font-medium text-green-900">Plagiarism Check</div>
                    <div className="text-xs text-green-700">Cross-reference database</div>
                  </button>

                  <button
                    onClick={() => {
                      // Mock paraphrasing
                      setParaphraseSuggestions([
                        'Artificial intelligence techniques provide innovative solutions for analyzing citation data.',
                        'Modern computational methods offer new perspectives on academic reference patterns.',
                        'Advanced algorithms present fresh approaches to scholarly citation examination.'
                      ]);
                    }}
                    className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left transition"
                  >
                    <div className="text-sm font-medium text-purple-900">Paraphrase</div>
                    <div className="text-xs text-purple-700">AI rewriting assistant</div>
                  </button>

                  <button className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition">
                    <div className="text-sm font-medium text-amber-900">Literature Review</div>
                    <div className="text-xs text-amber-700">Auto-generate drafts</div>
                  </button>
                </div>
              </div>

              {/* Results Panel */}
              <div className="w-96 p-6 overflow-y-auto">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Analysis Results</h3>

                {/* Grammar Check Results */}
                {grammarCheckResults.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Grammar & Style ({grammarCheckResults.length})
                    </h4>
                    <div className="space-y-2">
                      {grammarCheckResults.map((result, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          result.type === 'error' ? 'bg-red-50 border-red-200' :
                          result.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="text-sm font-medium text-slate-900">{result.message}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Position: {result.position}-{result.position + result.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plagiarism Results */}
                {plagiarismResults && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Plagiarism Check
                    </h4>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">{plagiarismResults.score}%</div>
                      <div className="text-sm text-green-700 mb-3">Overall similarity score</div>
                      <div className="space-y-2">
                        {plagiarismResults.matches.map((match, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <div className="font-medium text-slate-900">{match.similarity}% match</div>
                            <div className="text-slate-600 truncate">{match.source}</div>
                            <div className="text-slate-500 italic">"{match.text}"</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Paraphrase Suggestions */}
                {paraphraseSuggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Paraphrase Suggestions
                    </h4>
                    <div className="space-y-2">
                      {paraphraseSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="text-sm text-slate-900 mb-2">{suggestion}</div>
                          <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                            Use this
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Gap Analysis */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Research Gap Analysis</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-sm text-slate-700 mb-3">
                      Based on your writing and citations, here are potential research gaps:
                    </div>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Limited studies on long-term citation prediction accuracy</li>
                      <li>• Need for cross-disciplinary citation pattern analysis</li>
                      <li>• Gap in real-time citation network visualization tools</li>
                    </ul>
                  </div>
                </div>

                {/* Export Options */}
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Export Options</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['PDF', 'Word', 'LaTeX', 'Markdown', 'HTML'].map((format) => (
                      <button
                        key={format}
                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                      >
                        Export as {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}