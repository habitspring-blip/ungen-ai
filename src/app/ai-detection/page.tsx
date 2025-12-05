"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number;
  modelConsensus: string;
  reasoning: string[];
  indicators: {
    sentenceStructure: number;
    vocabularyComplexity: number;
    repetitionPatterns: number;
    coherence: number;
    stylisticMarkers: number;
  };
}

export default function AIDetectionPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [history, setHistory] = useState<Array<{
    text: string;
    isAIGenerated: boolean;
    confidence: number;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detect' | 'history'>('detect');

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
      const response = await fetch('/api/ai-detect');
      const data = await response.json();
      if (data.success) {
        setHistory(data.detections || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleDetection = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        // Add to history
        setHistory(prev => [
          {
            text: text.substring(0, 100) + '...',
            isAIGenerated: data.isAIGenerated,
            confidence: data.confidence,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 9) // Keep only last 10 items
        ]);
      } else {
        setError(data.error || 'AI detection failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-red-600';
    if (confidence > 0.6) return 'text-amber-600';
    if (confidence > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.8) return 'Highly Likely AI';
    if (confidence > 0.6) return 'Likely AI';
    if (confidence > 0.4) return 'Possibly AI';
    return 'Likely Human';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">AI Detection</h1>
        <p className="text-slate-600 mt-2">
          Advanced AI content detection using multiple models for accurate results
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('detect')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'detect'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Detect Content
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Detection History
          </button>
        </div>
      </div>

      {/* Detection Interface */}
      {activeTab === 'detect' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <PremiumCard
              title="Content Analysis"
              subtitle="Paste or type content to analyze"
              gradient="from-white to-slate-50"
            >
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to analyze for AI content..."
                  className="w-full h-64 p-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {text.length} characters • {text.split(/\s+/).filter(w => w.length > 0).length} words
                  </div>

                  <PremiumButton
                    onClick={handleDetection}
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
                    ) : 'Detect AI Content'}
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
                title="Detection Results"
                subtitle={`Analyzed: ${new Date().toLocaleString()}`}
                gradient="from-purple-50 to-indigo-50"
              >
                <div className="space-y-6">
                  {/* Confidence Score */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Confidence Score</div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="#E2E8F0"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray="226"
                            strokeDashoffset={226 * (1 - result.confidence)}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#6366F1' }} />
                              <stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-slate-900">
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {getConfidenceLabel(result.confidence)}
                        </div>
                        <div className={`text-sm ${getConfidenceColor(result.confidence)}`}>
                          {result.isAIGenerated ? 'AI-Generated' : 'Human-Written'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Model Consensus */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Model Consensus</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <span className="text-sm font-medium">{result.modelConsensus}</span>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div>
                    <div className="text-sm text-slate-600 mb-3">Content Indicators</div>
                    <div className="space-y-2 text-xs">
                      {Object.entries(result.indicators).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize text-slate-500">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <span className="font-medium text-slate-900">
                            {Math.round(value * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard
                title="Detection Results"
                subtitle="Analyze content to see results"
                gradient="from-slate-50 to-slate-100"
              >
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm">Detection results will appear here</p>
                  <p className="text-xs mt-1">Paste content and click Detect AI Content</p>
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {activeTab === 'history' && (
        <PremiumCard
          title="Detection History"
          subtitle="Recent AI detection scans"
        >
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {item.text}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                        {Math.round(item.confidence * 100)}% {getConfidenceLabel(item.confidence)}
                      </div>
                      <div className={`text-xs ${item.isAIGenerated ? 'text-red-600' : 'text-green-600'}`}>
                        {item.isAIGenerated ? 'AI Content' : 'Human Content'}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm">No detection history yet</p>
              <p className="text-xs mt-1">Your recent scans will appear here</p>
            </div>
          )}
        </PremiumCard>
      )}
    </div>
  );
}