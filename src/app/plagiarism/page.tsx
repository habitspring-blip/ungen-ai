"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface PlagiarismAnalysis {
  overallScore: number;
  flaggedSentences: Array<{ sentence: string; score: number; matches: string[] }>;
  uniquePhrases: Array<{ phrase: string; frequency: number }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
}

interface RewriteSuggestion {
  original: string;
  rewritten: string;
}

interface PlagiarismResult {
  analysis: PlagiarismAnalysis;
  rewriteSuggestions: RewriteSuggestion[];
  summary: {
    totalSentences: number;
    flaggedSentences: number;
    riskLevel: string;
    overallScore: number;
  };
}

export default function PlagiarismShieldPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [history, setHistory] = useState<Array<{
    originalText: string;
    score: number;
    riskLevel: string;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [generateSuggestions, setGenerateSuggestions] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handlePlagiarismScan = async () => {
    if (!text.trim()) {
      setError('Please enter text to scan');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/plagiarism', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          generateSuggestions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);

        // Add to history
        setHistory(prev => [
          {
            originalText: text.substring(0, 100) + '...',
            score: data.analysis.overallScore,
            riskLevel: data.analysis.riskLevel,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 9) // Keep only last 10 items
        ]);
      } else {
        setError(data.error || 'Plagiarism scan failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      console.error('Plagiarism scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-50 border-green-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 40) return 'text-yellow-600';
    if (score < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Plagiarism Shield</h1>
        <p className="text-slate-600 mt-2">
          Scan your content for plagiarism and get AI-powered rewrite suggestions
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Scan Content
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Scan History
          </button>
        </div>
      </div>

      {/* Plagiarism Scan Interface */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <PremiumCard
              title="Content to Scan"
              subtitle="Paste or type content to check for plagiarism"
              gradient="from-white to-slate-50"
            >
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to scan for plagiarism..."
                  className="w-full h-64 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {/* Options */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={generateSuggestions}
                      onChange={(e) => setGenerateSuggestions(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Generate rewrite suggestions
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {text.length} characters • {text.split(/\s+/).filter(w => w.length > 0).length} words
                  </div>

                  <PremiumButton
                    onClick={handlePlagiarismScan}
                    disabled={loading || !text.trim()}
                    size="md"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60" strokeDashoffset="20" />
                        </svg>
                        Scanning...
                      </>
                    ) : 'Scan for Plagiarism'}
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
                title="Plagiarism Analysis"
                subtitle={`Scanned: ${new Date().toLocaleString()}`}
                gradient="from-red-50 to-orange-50"
              >
                <div className="space-y-6">
                  {/* Risk Score */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Plagiarism Risk Score</div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="30"
                            stroke="#E2E8F0"
                            strokeWidth="6"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="30"
                            stroke="url(#plagiarismGradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="188"
                            strokeDashoffset={188 * (1 - result.analysis.overallScore / 100)}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="plagiarismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: result.analysis.riskLevel === 'critical' ? '#EF4444' : result.analysis.riskLevel === 'high' ? '#F97316' : result.analysis.riskLevel === 'medium' ? '#EAB308' : '#10B981' }} />
                              <stop offset="100%" style={{ stopColor: result.analysis.riskLevel === 'critical' ? '#DC2626' : result.analysis.riskLevel === 'high' ? '#EA580C' : result.analysis.riskLevel === 'medium' ? '#CA8A04' : '#059669' }} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-900">
                            {result.analysis.overallScore}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className={`font-semibold text-lg capitalize ${getRiskColor(result.analysis.riskLevel)}`}>
                          {result.analysis.riskLevel}
                        </div>
                        <div className="text-sm text-slate-500">
                          Risk Level
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{result.summary.totalSentences}</div>
                      <div className="text-xs text-slate-500">Total Sentences</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{result.summary.flaggedSentences}</div>
                      <div className="text-xs text-slate-500">Flagged</div>
                    </div>
                  </div>

                  {/* Top Suggestions */}
                  {result.analysis.suggestions.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Recommendations</div>
                      <div className="space-y-1">
                        {result.analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewrite Suggestions */}
                  {result.rewriteSuggestions.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Rewrite Suggestions</div>
                      <div className="space-y-2">
                        {result.rewriteSuggestions.map((suggestion, index) => (
                          <div key={index} className="p-2 bg-white/50 rounded text-xs">
                            <div className="text-slate-500 mb-1">Original: {suggestion.original.substring(0, 50)}...</div>
                            <div className="text-slate-800">Rewritten: {suggestion.rewritten.substring(0, 50)}...</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard
                title="Plagiarism Analysis"
                subtitle="Scan content to see plagiarism results"
                gradient="from-slate-50 to-slate-100"
              >
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm">Plagiarism analysis results will appear here</p>
                  <p className="text-xs mt-1">Paste content and click Scan for Plagiarism</p>
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <PremiumCard
          title="Plagiarism Scan History"
          subtitle="Recent plagiarism scans"
        >
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className={`p-4 border rounded-lg transition ${getRiskBgColor(item.riskLevel)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 mb-2">
                        {item.originalText}
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        Score: {item.score}% • Risk: <span className={`font-medium capitalize ${getRiskColor(item.riskLevel)}`}>{item.riskLevel}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getScoreColor(item.score)}`}>
                        {item.score}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm">No scan history yet</p>
              <p className="text-xs mt-1">Your recent scans will appear here</p>
            </div>
          )}
        </PremiumCard>
      )}
    </div>
  );
}