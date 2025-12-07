"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface CitationResult {
  analysis: {
    totalSentences: number;
    potentialSources: Array<{ sentence: string; index: number; needsCitation: boolean; reason: string }>;
    quotesCount: number;
    academicTermsCount: number;
  };
  citation: string;
  inTextCitations: Array<{ position: number; citation: string }>;
  style: string;
  formattedText: string;
}

export default function CitationGeneratorPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CitationResult | null>(null);
  const [history, setHistory] = useState<Array<{
    originalText: string;
    citation: string;
    style: string;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // Citation form data
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'ama'>('apa');
  const [sourceInfo, setSourceInfo] = useState({
    title: '',
    author: '',
    year: '',
    publisher: '',
    url: '',
    doi: ''
  });

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleCitationGeneration = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/citation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          style: citationStyle,
          sourceInfo
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);

        // Add to history
        setHistory(prev => [
          {
            originalText: text.substring(0, 100) + '...',
            citation: data.citation,
            style: data.style,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 9) // Keep only last 10 items
        ]);
      } else {
        setError(data.error || 'Citation generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      console.error('Citation generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const citationStyles = [
    { key: 'apa' as const, label: 'APA (7th Edition)', description: 'American Psychological Association' },
    { key: 'mla' as const, label: 'MLA (9th Edition)', description: 'Modern Language Association' },
    { key: 'chicago' as const, label: 'Chicago (17th Edition)', description: 'Chicago Manual of Style' },
    { key: 'harvard' as const, label: 'Harvard', description: 'Harvard Referencing Style' },
    { key: 'ieee' as const, label: 'IEEE', description: 'Institute of Electrical and Electronics Engineers' },
    { key: 'ama' as const, label: 'AMA', description: 'American Medical Association' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Citation Generator</h1>
        <p className="text-slate-600 mt-2">
          Generate proper citations and analyze your text for academic referencing needs
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Generate Citations
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Citation History
          </button>
        </div>
      </div>

      {/* Citation Generation Interface */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <PremiumCard
              title="Text to Analyze"
              subtitle="Paste or type content that needs citations"
              gradient="from-white to-slate-50"
            >
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your academic or research text here..."
                  className="w-full h-48 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {text.length} characters • {text.split(/\s+/).filter(w => w.length > 0).length} words
                  </div>
                </div>
              </div>
            </PremiumCard>

            {/* Citation Style Selection */}
            <PremiumCard
              title="Citation Style"
              subtitle="Choose your preferred citation format"
              gradient="from-blue-50 to-indigo-50"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {citationStyles.map((style) => (
                  <button
                    key={style.key}
                    onClick={() => setCitationStyle(style.key)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      citationStyle === style.key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{style.description}</div>
                  </button>
                ))}
              </div>
            </PremiumCard>

            {/* Source Information */}
            <PremiumCard
              title="Source Information"
              subtitle="Provide details for citation generation"
              gradient="from-green-50 to-emerald-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={sourceInfo.title}
                    onChange={(e) => setSourceInfo(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Article or book title"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={sourceInfo.author}
                    onChange={(e) => setSourceInfo(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name(s)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={sourceInfo.year}
                    onChange={(e) => setSourceInfo(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="Publication year"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={sourceInfo.publisher}
                    onChange={(e) => setSourceInfo(prev => ({ ...prev, publisher: e.target.value }))}
                    placeholder="Publisher name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={sourceInfo.url}
                    onChange={(e) => setSourceInfo(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">DOI</label>
                  <input
                    type="text"
                    value={sourceInfo.doi}
                    onChange={(e) => setSourceInfo(prev => ({ ...prev, doi: e.target.value }))}
                    placeholder="10.xxxx/xxxxx"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <PremiumButton
                  onClick={handleCitationGeneration}
                  disabled={loading || !text.trim()}
                  size="md"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60" strokeDashoffset="20" />
                      </svg>
                      Analyzing & Generating...
                    </>
                  ) : 'Generate Citations'}
                </PremiumButton>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
            </PremiumCard>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {result ? (
              <PremiumCard
                title="Citation Results"
                subtitle={`Generated: ${new Date().toLocaleString()}`}
                gradient="from-purple-50 to-pink-50"
              >
                <div className="space-y-6">
                  {/* Citation Style */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Citation Style</div>
                    <div className="text-lg font-semibold text-purple-700">{result.style}</div>
                  </div>

                  {/* Generated Citation */}
                  {result.citation && (
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Full Citation</div>
                      <div className="p-3 bg-white/50 rounded-lg border text-sm text-slate-800 font-mono">
                        {result.citation}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.citation)}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a1 1 0 01-1-1z" />
                        </svg>
                        Copy Citation
                      </button>
                    </div>
                  )}

                  {/* Analysis Summary */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Text Analysis</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sentences:</span>
                        <span className="font-medium">{result.analysis.totalSentences}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Potential sources:</span>
                        <span className="font-medium">{result.analysis.potentialSources.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quotes found:</span>
                        <span className="font-medium">{result.analysis.quotesCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* In-text Citations */}
                  {result.inTextCitations.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-600 mb-2">In-text Citations</div>
                      <div className="space-y-1">
                        {result.inTextCitations.slice(0, 3).map((citation, index) => (
                          <div key={index} className="text-xs text-slate-700 bg-white/30 p-2 rounded">
                            {citation.citation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard
                title="Citation Results"
                subtitle="Generate citations to see results"
                gradient="from-slate-50 to-slate-100"
              >
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-sm">Citation results will appear here</p>
                  <p className="text-xs mt-1">Enter text and source info, then click Generate Citations</p>
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <PremiumCard
          title="Citation History"
          subtitle="Recent citation generations"
        >
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 mb-2">
                        {item.originalText}
                      </div>
                      <div className="text-sm text-slate-700 mb-2 font-mono bg-slate-50 p-2 rounded">
                        {item.citation}
                      </div>
                      <div className="text-xs text-slate-500">
                        Style: {item.style} • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.citation)}
                      className="ml-4 px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm">No citation history yet</p>
              <p className="text-xs mt-1">Your recent citations will appear here</p>
            </div>
          )}
        </PremiumCard>
      )}
    </div>
  );
}