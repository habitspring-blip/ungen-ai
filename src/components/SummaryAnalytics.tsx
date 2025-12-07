"use client";

import { useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

interface SummaryAnalyticsProps {
  originalText: string;
  summary: string;
  metrics?: {
    compressionRatio: number;
    wordCount: number;
    readability: number;
    coherence: number;
    rouge1?: number;
    semanticSimilarity?: number;
  };
}

export default function SummaryAnalytics({
  originalText,
  summary,
  metrics
}: SummaryAnalyticsProps) {
  // Calculate keyword frequency
  const keywordFrequency = useMemo(() => {
    const words = originalText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Filter out short words

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top 10 keywords
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }, [originalText]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const originalWords = originalText.trim().split(/\s+/).length;
    const summaryWords = summary.trim().split(/\s+/).length;
    const originalSentences = originalText.split(/[.!?]+/).filter(s => s.trim()).length;
    const summarySentences = summary.split(/[.!?]+/).filter(s => s.trim()).length;

    return {
      originalWords,
      summaryWords,
      originalSentences,
      summarySentences,
      compressionRatio: summaryWords / originalWords,
      avgWordsPerSentence: summaryWords / Math.max(summarySentences, 1)
    };
  }, [originalText, summary]);

  // Simple sentiment analysis (basic implementation)
  const sentimentScore = useMemo(() => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'brilliant', 'superb', 'incredible'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing', 'failed', 'broken', 'useless'];

    const words = summary.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) score += 1;
      if (negativeWords.some(nw => word.includes(nw))) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)));
  }, [summary]);

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600 bg-green-100';
    if (score < -0.1) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.1) return 'Positive';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {Math.round(summaryStats.compressionRatio * 100)}%
          </div>
          <div className="text-sm text-blue-600">Compression</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">
            {summaryStats.summaryWords}
          </div>
          <div className="text-sm text-emerald-600">Summary Words</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {summaryStats.avgWordsPerSentence.toFixed(1)}
          </div>
          <div className="text-sm text-purple-600">Avg Words/Sentence</div>
        </div>

        <div className={`p-4 rounded-xl border ${getSentimentColor(sentimentScore)}`}>
          <div className="text-2xl font-bold">
            {getSentimentLabel(sentimentScore)}
          </div>
          <div className="text-sm opacity-75">Sentiment</div>
        </div>
      </div>

      {/* Keyword Frequency Chart */}
      <PremiumCard
        title="Keyword Frequency"
        subtitle="Most frequent words in the original text"
        gradient="from-indigo-50 to-purple-50"
      >
        <div className="space-y-3">
          {keywordFrequency.map(([word, count], index) => (
            <div key={word} className="flex items-center gap-3">
              <div className="w-8 text-sm font-medium text-slate-600">
                #{index + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {word}
                  </span>
                  <span className="text-xs text-slate-500">
                    {count} times
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((count / keywordFrequency[0][1]) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Quality Metrics */}
      <PremiumCard
        title="Quality Metrics"
        subtitle="Detailed analysis of summary quality"
        gradient="from-emerald-50 to-teal-50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Readability & Coherence */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Readability Score</span>
              <span className="text-sm font-bold text-emerald-600">
                {metrics?.readability?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full"
                style={{ width: `${Math.min((metrics?.readability || 0) / 100 * 100, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Coherence</span>
              <span className="text-sm font-bold text-teal-600">
                {metrics?.coherence ? (metrics.coherence * 100).toFixed(0) + '%' : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full"
                style={{ width: `${(metrics?.coherence || 0) * 100}%` }}
              />
            </div>
          </div>

          {/* ROUGE Scores */}
          <div className="space-y-4">
            {metrics?.rouge1 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">ROUGE-1</span>
                  <span className="text-sm font-bold text-blue-600">
                    {(metrics.rouge1 * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full"
                    style={{ width: `${metrics.rouge1 * 100}%` }}
                  />
                </div>
              </>
            )}

            {metrics?.semanticSimilarity && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Semantic Similarity</span>
                  <span className="text-sm font-bold text-purple-600">
                    {(metrics.semanticSimilarity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                    style={{ width: `${metrics.semanticSimilarity * 100}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </PremiumCard>

      {/* Text Structure Comparison */}
      <PremiumCard
        title="Text Structure"
        subtitle="Comparison of original vs summary structure"
        gradient="from-amber-50 to-orange-50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {summaryStats.originalWords}
            </div>
            <div className="text-sm text-slate-600 mb-4">Original Words</div>
            <div className="text-2xl font-bold text-amber-500 mb-2">
              {summaryStats.originalSentences}
            </div>
            <div className="text-sm text-slate-600">Sentences</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {summaryStats.summaryWords}
            </div>
            <div className="text-sm text-slate-600 mb-4">Summary Words</div>
            <div className="text-2xl font-bold text-orange-500 mb-2">
              {summaryStats.summarySentences}
            </div>
            <div className="text-sm text-slate-600">Sentences</div>
          </div>
        </div>

        {/* Visual comparison bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Original</span>
            <span>Summary</span>
          </div>
          <div className="flex gap-2">
            <div
              className="bg-amber-400 h-4 rounded-l-full transition-all duration-500"
              style={{ width: '70%' }}
            />
            <div
              className="bg-orange-400 h-4 rounded-r-full transition-all duration-500"
              style={{ width: '30%' }}
            />
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}