"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface SummaryResult {
  summary: string;
  wordCount: number;
  compressionRatio: number;
  keyPoints: string[];
}

export default function SummarizeAIPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [history, setHistory] = useState<Array<{
    originalText: string;
    summary: string;
    wordCount: number;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summarize' | 'history'>('summarize');

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter text to summarize');
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
          intent: 'summarize',
          targetTone: 'neutral',
          targetLength: 'short'
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

      // Process the summary
      const originalWords = text.trim().split(/\s+/).length;
      const summaryWords = streamedContent.trim().split(/\s+/).length;
      const compressionRatio = Math.round((1 - summaryWords / originalWords) * 100);

      const summaryResult: SummaryResult = {
        summary: streamedContent,
        wordCount: summaryWords,
        compressionRatio,
        keyPoints: extractKeyPoints(streamedContent)
      };

      setResult(summaryResult);

      // Add to history
      setHistory(prev => [
        {
          originalText: text.substring(0, 100) + '...',
          summary: streamedContent.substring(0, 100) + '...',
          wordCount: summaryWords,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9) // Keep only last 10 items
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Summarization failed. Please try again.');
      console.error('Summarization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractKeyPoints = (summary: string): string[] => {
    // Simple extraction of sentences as key points
    return summary.split(/[.!?]+/).filter(point => point.trim().length > 10).slice(0, 5);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">SummarizeAI</h1>
        <p className="text-slate-600 mt-2">
          Generate instant, accurate summaries of your content with AI-powered analysis
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('summarize')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'summarize'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Create Summary
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Summary History
          </button>
        </div>
      </div>

      {/* Summarization Interface */}
      {activeTab === 'summarize' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <PremiumCard
              title="Content to Summarize"
              subtitle="Paste or type the text you want to summarize"
              gradient="from-white to-slate-50"
            >
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to summarize..."
                  className="w-full h-64 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {text.length} characters • {text.split(/\s+/).filter(w => w.length > 0).length} words
                  </div>

                  <PremiumButton
                    onClick={handleSummarize}
                    disabled={loading || !text.trim()}
                    size="md"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60" strokeDashoffset="20" />
                        </svg>
                        Summarizing...
                      </>
                    ) : 'Generate Summary'}
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
                title="Summary Results"
                subtitle={`Generated: ${new Date().toLocaleString()}`}
                gradient="from-emerald-50 to-teal-50"
              >
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{result.wordCount}</div>
                      <div className="text-xs text-slate-500">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-teal-600">{result.compressionRatio}%</div>
                      <div className="text-xs text-slate-500">Compression</div>
                    </div>
                  </div>

                  {/* Summary Content */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Summary</div>
                    <div className="text-sm text-slate-800 leading-relaxed bg-white/50 p-3 rounded-lg border">
                      {result.summary}
                    </div>
                  </div>

                  {/* Key Points */}
                  {result.keyPoints.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Key Points</div>
                      <div className="space-y-1">
                        {result.keyPoints.map((point, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{point.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => navigator.clipboard.writeText(result.summary)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a1 1 0 01-1-1z" />
                    </svg>
                    Copy Summary
                  </button>
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard
                title="Summary Results"
                subtitle="Generate a summary to see results"
                gradient="from-slate-50 to-slate-100"
              >
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">Summary results will appear here</p>
                  <p className="text-xs mt-1">Paste content and click Generate Summary</p>
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <PremiumCard
          title="Summary History"
          subtitle="Recent summarization sessions"
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
                        Summary: {item.summary}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.wordCount} words • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.summary)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm">No summary history yet</p>
              <p className="text-xs mt-1">Your recent summaries will appear here</p>
            </div>
          )}
        </PremiumCard>
      )}
    </div>
  );
}