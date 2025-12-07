"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import CreditDisplay from '@/components/ui/CreditDisplay';
import UpgradeModal from '@/components/ui/UpgradeModal';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToolUsage } from '@/hooks/useToolUsage';

interface SEOAnalysis {
  wordCount: number;
  topKeywords: Array<{ word: string; count: number; density: number }>;
  readabilityScore: number;
  suggestions: string[];
  titleSuggestions: string[];
  metaDescription: string;
  internalLinks: string[];
  headingStructure: { structure: string[]; suggestions: string[] };
}

interface SEOResult {
  originalAnalysis: SEOAnalysis;
  optimizedText: string;
  improvements: {
    addedKeywords: string[];
    readabilityImprovement: number;
    wordCountIncrease: number;
  };
}

export default function SEOMagicPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOResult | null>(null);
  const [history, setHistory] = useState<Array<{
    originalText: string;
    optimizedText: string;
    score: number;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingInput, setPendingInput] = useState('');

  const { user, setUser } = useUser();
  const router = useRouter();
  const { canUse: canUseSEO, remainingUses: seoRemainingUses, attemptUsage: attemptSEOUsage } = useToolUsage('seo');

  // Redirect to login if not authenticated, but preserve input
  useEffect(() => {
    if (!user) {
      if (text.trim()) {
        // Store input in sessionStorage to restore after login
        sessionStorage.setItem('pending-seo-input', text);
        sessionStorage.setItem('pending-return-url', '/seo');
      }
      router.push('/login');
    } else {
      // Restore pending input after login
      const pending = sessionStorage.getItem('pending-seo-input');
      if (pending) {
        setText(pending);
        sessionStorage.removeItem('pending-seo-input');
        sessionStorage.removeItem('pending-seo-return-url');
      }
    }
  }, [user, router, text]);

  const handleSEOAnalysis = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze');
      return;
    }

    if (!user) {
      setPendingInput(text);
      router.push('/login');
      return;
    }

    // Check tool usage (allow one free use per tool)
    if (!canUseSEO) {
      setShowUpgradeModal(true);
      return;
    }

    // Record tool usage
    if (!attemptSEOUsage()) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);

        // Refresh user credits
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: creditsData } = await supabase
            .from('users')
            .select('credits')
            .eq('id', userData.user.id)
            .single();

          if (creditsData && user) {
            // Update user context with new credits
            setUser({ ...user, credits: creditsData.credits });
          }
        }

        // Add to history
        setHistory(prev => [
          {
            originalText: text.substring(0, 100) + '...',
            optimizedText: data.optimizedText.substring(0, 100) + '...',
            score: data.originalAnalysis.readabilityScore,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 9) // Keep only last 10 items
        ]);
      } else {
        if (response.status === 402) {
          // Tool usage limit reached
          setShowUpgradeModal(true);
          setError('You have used your free SEO analysis. Upgrade to continue using this tool.');
        } else {
          setError(data.error || 'SEO analysis failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      console.error('SEO analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getReadabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReadabilityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SEO Magic</h1>
          <p className="text-slate-600 mt-2">
            Optimize your content for search engines with AI-powered SEO analysis and recommendations
          </p>
        </div>
        {user && <CreditDisplay />}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'analyze'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Analyze & Optimize
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Optimization History
          </button>
        </div>
      </div>

      {/* SEO Analysis Interface */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <PremiumCard
              title="Content to Optimize"
              subtitle="Paste or type content for SEO analysis and optimization"
              gradient="from-white to-slate-50"
            >
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your content for SEO optimization..."
                  className="w-full h-64 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {text.length} characters • {text.split(/\s+/).filter(w => w.length > 0).length} words
                    {seoRemainingUses > 0 && (
                      <span className="ml-2 text-indigo-600 font-medium">
                        • {seoRemainingUses} free use{seoRemainingUses !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                  </div>

                  <PremiumButton
                    onClick={handleSEOAnalysis}
                    disabled={loading || !text.trim()}
                    size="md"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60" strokeDashoffset="20" />
                        </svg>
                        Analyzing...
                      </>
                    ) : 'Analyze & Optimize'}
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
                title="SEO Analysis Results"
                subtitle={`Analyzed: ${new Date().toLocaleString()}`}
                gradient="from-green-50 to-emerald-50"
              >
                <div className="space-y-6">
                  {/* SEO Score */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Readability Score</div>
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
                            stroke="url(#seoGradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="188"
                            strokeDashoffset={188 * (1 - result.originalAnalysis.readabilityScore / 100)}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="seoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#10B981' }} />
                              <stop offset="100%" style={{ stopColor: '#059669' }} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-900">
                            {Math.round(result.originalAnalysis.readabilityScore)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {getReadabilityLabel(result.originalAnalysis.readabilityScore)}
                        </div>
                        <div className={`text-sm ${getReadabilityColor(result.originalAnalysis.readabilityScore)}`}>
                          {result.originalAnalysis.wordCount} words
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Keywords */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Top Keywords</div>
                    <div className="space-y-1">
                      {result.originalAnalysis.topKeywords.slice(0, 5).map((keyword, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-slate-700">{keyword.word}</span>
                          <span className="text-slate-500">{keyword.density}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Improvements Made</div>
                    <div className="space-y-1 text-xs text-slate-700">
                      <div>+{result.improvements.wordCountIncrease} words added</div>
                      <div>Readability: {result.improvements.readabilityImprovement}%</div>
                      <div>Keywords: {result.improvements.addedKeywords.join(', ')}</div>
                    </div>
                  </div>

                  {/* Copy Optimized Text */}
                  <button
                    onClick={() => navigator.clipboard.writeText(result.optimizedText)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a1 1 0 01-1-1z" />
                    </svg>
                    Copy Optimized Text
                  </button>
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard
                title="SEO Analysis Results"
                subtitle="Analyze content to see SEO insights"
                gradient="from-slate-50 to-slate-100"
              >
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm">SEO analysis results will appear here</p>
                  <p className="text-xs mt-1">Paste content and click Analyze & Optimize</p>
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <PremiumCard
          title="SEO Optimization History"
          subtitle="Recent SEO analyses and optimizations"
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
                        Optimized: {item.originalText}
                      </div>
                      <div className="text-xs text-slate-500">
                        Score: {item.score}/100 • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.optimizedText)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm">No SEO optimization history yet</p>
              <p className="text-xs mt-1">Your recent optimizations will appear here</p>
            </div>
          )}
        </PremiumCard>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message="You've used your free SEO analysis. Upgrade to continue using all AI writing tools unlimited."
      />
    </div>
  );
}