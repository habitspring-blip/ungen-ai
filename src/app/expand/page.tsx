"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface ExpansionResult {
  expandedText: string;
  originalWordCount: number;
  expandedWordCount: number;
  expansionRatio: number;
  addedSections: string[];
}

export default function LongFormPlusPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExpansionResult | null>(null);
  const [history, setHistory] = useState<Array<{
    originalText: string;
    expandedText: string;
    expansionRatio: number;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expand' | 'history'>('expand');
  const [targetLength, setTargetLength] = useState<'long' | 'extensive'>('long');

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleExpand = async () => {
    if (!text.trim()) {
      setError('Please enter text to expand');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          intent: 'expand',
          targetTone: 'professional',
          targetLength
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        streamedContent += chunk;
      }

      // Process the expansion
      const originalWords = text.trim().split(/\s+/).length;
      const expandedWords = streamedContent.trim().split(/\s+/).length;
      const expansionRatio = Math.round((expandedWords / originalWords - 1) * 100);

      const expansionResult: ExpansionResult = {
        expandedText: streamedContent,
        originalWordCount: originalWords,
        expandedWordCount: expandedWords,
        expansionRatio,
        addedSections: identifyAddedSections(text, streamedContent)
      };

      setResult(expansionResult);

      // Add to history
      setHistory(prev => [
        {
          originalText: text.substring(0, 100) + '...',
          expandedText: streamedContent.substring(0, 100) + '...',
          expansionRatio,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9) // Keep only last 10 items
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Expansion failed. Please try again.');
      console.error('Expansion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const identifyAddedSections = (original: string, expanded: string): string[] => {
    // Simple heuristic: look for sentences in expanded that aren't in original
    const originalSentences = original.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const expandedSentences = expanded.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    const added = expandedSentences.filter(sentence =>
      !originalSentences.some(orig => orig.includes(sentence.substring(0, 20)))
    ).slice(0, 5);

    return added;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">LongForm Plus</h1>
        <p className="text-slate-600 mt-2">
          Expand your content into comprehensive essays, reports, and long-form articles
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('expand')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'expand'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Expand Content
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Expansion History
          </button>
        </div>
      </div>

      {/* Expansion Interface */}
      {activeTab === 'expand' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <PremiumCard
              title="Content to Expand"
              subtitle="Paste or type the text you want to expand into longer form"
              gradient="from-white to-slate-50"
            >
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to expand into a longer, more detailed version..."
                  className="w-full h-64 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {/* Length Selection */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">Target Length:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTargetLength('long')}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        targetLength === 'long'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Long (250-400 words)
                    </button>
                    <button
                      onClick={() => setTargetLength('extensive')}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        targetLength === 'extensive'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Extensive (400-500 words)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {text.length} characters • {text.split(/\s+/).filter(w => w.length > 0).length} words
                  </div>

                  <PremiumButton
                    onClick={handleExpand}
                    disabled={loading || !text.trim()}
                    size="md"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60" strokeDashoffset="20" />
                        </svg>
                        Expanding...
                      </>
                    ) : 'Expand Content'}
                  </PremiumButton>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            </PremiumCard>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {result ? (
              <PremiumCard
                title="Expansion Results"
                subtitle={`Generated: ${new Date().toLocaleString()}`}
                gradient="from-blue-50 to-cyan-50"
              >
                <div className="space-y-6">
                  {/* Expansion Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{result.expandedWordCount}</div>
                      <div className="text-xs text-slate-500">Total Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-cyan-600">+{result.expansionRatio}%</div>
                      <div className="text-xs text-slate-500">Expansion</div>
                    </div>
                  </div>

                  {/* Expansion Preview */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Expanded Content Preview</div>
                    <div className="text-sm text-slate-800 leading-relaxed bg-white/50 p-3 rounded-lg border max-h-48 overflow-y-auto">
                      {result.expandedText.length > 300
                        ? result.expandedText.substring(0, 300) + '...'
                        : result.expandedText
                      }
                    </div>
                  </div>

                  {/* Added Sections */}
                  {result.addedSections.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Key Additions</div>
                      <div className="space-y-1">
                        {result.addedSections.map((section, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-blue-500 mt-1">+</span>
                            <span>{section.trim().substring(0, 60)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => navigator.clipboard.writeText(result.expandedText)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a1 1 0 01-1-1z" />
                    </svg>
                    Copy Expanded Text
                  </button>
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard
                title="Expansion Results"
                subtitle="Expand content to see results"
                gradient="from-slate-50 to-slate-100"
              >
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-sm">Expansion results will appear here</p>
                  <p className="text-xs mt-1">Paste content and click Expand Content</p>
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <PremiumCard
          title="Expansion History"
          subtitle="Recent content expansions"
        >
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 mb-2">
                        Original: {item.originalText}
                      </div>
                      <div className="text-sm text-slate-700 mb-2">
                        Expanded: {item.expandedText}
                      </div>
                      <div className="text-xs text-slate-500">
                        +{item.expansionRatio}% expansion • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.expandedText)}
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
              <p className="text-sm">No expansion history yet</p>
              <p className="text-xs mt-1">Your recent expansions will appear here</p>
            </div>
          )}
        </PremiumCard>
      )}
    </div>
  );
}