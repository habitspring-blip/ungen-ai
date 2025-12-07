"use client";

import { useState, useEffect, useCallback } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';

interface SummarizationWorkspaceProps {
  text: string;
  onTextChange: (text: string) => void;
  config: {
    mode: 'extractive' | 'abstractive' | 'hybrid';
    length: 'short' | 'medium' | 'long';
    tone: 'formal' | 'casual' | 'neutral';
    format: 'paragraphs' | 'bullets';
    focus?: string[];
    quality?: 'standard' | 'premium' | 'creative';
  };
  onConfigChange: (config: Partial<SummarizationWorkspaceProps['config']>) => void;
  result?: {
    summary: string;
    method: string;
    metrics: {
      compressionRatio: number;
      wordCount: number;
      sentenceCount: number;
      readability: number;
      coherence: number;
      rouge1?: number;
      semanticSimilarity?: number;
    };
    processingTime: number;
    confidence?: number;
  };
  loading: boolean;
  onGenerate: () => void;
}

export default function SummarizationWorkspace({
  text,
  onTextChange,
  config,
  onConfigChange,
  result,
  loading,
  onGenerate
}: SummarizationWorkspaceProps) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [realTimePreview, setRealTimePreview] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Simple debounce for real-time preview (since useDebounce hook doesn't exist)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Real-time preview generation
  const generatePreview = useCallback(async (inputText: string) => {
    if (!inputText.trim() || inputText.length < 50) {
      setRealTimePreview('');
      return;
    }

    setPreviewLoading(true);
    try {
      // Call preview API (lighter version for real-time)
      const response = await fetch('/api/summarize/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.substring(0, 1000), // Limit for preview
          config: { ...config, length: 'short' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRealTimePreview(data.summary);
      }
    } catch (error) {
      console.warn('Preview generation failed:', error);
    } finally {
      setPreviewLoading(false);
    }
  }, [config]);

  // Trigger preview on text change with debounce
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (text && !result) {
      const timer = setTimeout(() => {
        generatePreview(text);
      }, 1000);
      setDebounceTimer(timer);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [text, generatePreview, result]);

  const currentWordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const currentCharCount = text.length;
  const maxChars = 50000;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
      {/* Input Section */}
      <div className="xl:col-span-5 space-y-6">
        {/* Configuration Panel */}
        <PremiumCard
          title="AI Configuration"
          subtitle="Customize your summarization settings"
          gradient="from-blue-50 to-indigo-50"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mode</label>
              <select
                value={config.mode}
                onChange={(e) => onConfigChange({ mode: e.target.value as 'extractive' | 'abstractive' | 'hybrid' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="extractive">Extractive</option>
                <option value="abstractive">Abstractive</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Length Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Length</label>
              <select
                value={config.length}
                onChange={(e) => onConfigChange({ length: e.target.value as 'short' | 'medium' | 'long' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tone</label>
              <select
                value={config.tone}
                onChange={(e) => onConfigChange({ tone: e.target.value as 'formal' | 'casual' | 'neutral' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="neutral">Neutral</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Format</label>
              <select
                value={config.format}
                onChange={(e) => onConfigChange({ format: e.target.value as 'paragraphs' | 'bullets' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="paragraphs">Paragraphs</option>
                <option value="bullets">Bullets</option>
              </select>
            </div>
          </div>

          {/* Focus Keywords */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Focus Keywords (Optional)</label>
            <input
              type="text"
              placeholder="e.g., technology, innovation, market"
              value={config.focus?.join(', ') || ''}
              onChange={(e) => onConfigChange({
                focus: e.target.value.split(',').map(k => k.trim()).filter(k => k)
              })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </PremiumCard>

        {/* Input Text Area */}
        <PremiumCard
          title="Input Text"
          subtitle={`${currentWordCount} words • ${currentCharCount}/${maxChars} characters`}
          gradient="from-white to-slate-50"
          className="flex-1"
        >
          <div className="relative h-96">
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste or type your text here... The summary will update automatically as you type."
              className="w-full h-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={maxChars}
            />

            {/* Character Counter */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded ${
                currentCharCount > maxChars * 0.9 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {currentCharCount}/{maxChars}
              </div>
              {text && (
                <button
                  onClick={() => onTextChange('')}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                  title="Clear text"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-4 flex justify-center">
            <PremiumButton
              onClick={onGenerate}
              disabled={loading || !text.trim()}
              className="px-8 py-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Summary...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Summary
                </>
              )}
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>

      {/* Output Section */}
      <div className="xl:col-span-7 space-y-6">
        {/* Analytics Toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              showAnalytics
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <PremiumCard
            title="Summary Analytics"
            subtitle="Real-time quality metrics and insights"
            gradient="from-emerald-50 to-teal-50"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {result?.metrics?.compressionRatio ? Math.round(result.metrics.compressionRatio * 100) : 0}%
                </div>
                <div className="text-xs text-slate-500">Compression</div>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">
                  {result?.metrics?.readability ? result.metrics.readability.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-slate-500">Readability</div>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result?.processingTime || 0}ms
                </div>
                <div className="text-xs text-slate-500">Processing Time</div>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result?.confidence ? Math.round(result.confidence * 100) : 0}%
                </div>
                <div className="text-xs text-slate-500">Confidence</div>
              </div>
            </div>
          </PremiumCard>
        )}

        {/* Summary Output */}
        <PremiumCard
          title={result ? "AI Summary" : "Real-Time Preview"}
          subtitle={
            result
              ? `Generated with ${config.quality || 'standard'} quality • ${result.method} method`
              : "Live preview updates as you type"
          }
          gradient={result ? "from-emerald-50 to-teal-50" : "from-amber-50 to-orange-50"}
          className="flex-1"
        >
          <div className="h-96 relative">
            {result ? (
              <div className="h-full p-4 bg-white/70 border border-white/50 rounded-lg overflow-y-auto">
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </div>
              </div>
            ) : realTimePreview ? (
              <div className="h-full p-4 bg-white/70 border border-white/50 rounded-lg overflow-y-auto">
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap opacity-75">
                  {realTimePreview}
                </div>
                <div className="absolute top-2 right-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  Preview
                </div>
              </div>
            ) : previewLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
                  <div className="text-sm text-slate-500">Generating preview...</div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Ready for Summarization</h3>
                  <p className="text-sm text-slate-500">
                    Start typing or paste your text to see a live preview. Configure settings above for customized results.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {result && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(result.summary)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          )}
        </PremiumCard>
      </div>
    </div>
  );
}