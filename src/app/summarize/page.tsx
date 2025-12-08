"use client";

import { useState, useEffect, useRef } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface SummaryResult {
  summary: string;
  wordCount: number;
  compressionRatio: number;
  method: string;
  config: {
    mode: string;
    quality: string;
    tone: string;
    length: string;
  };
  metrics: {
    compressionRatio: number;
    wordCount: number;
    sentenceCount: number;
    readabilityScore: number;
    coherence: number;
    rouge1?: number;
    rouge2?: number;
    rougeL?: number;
    bleu?: number;
  };
  processingTime: number;
  confidence?: number;
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

  // Summarization parameters
  const [tone, setTone] = useState<'formal' | 'casual' | 'academic' | 'simple' | 'neutral' | 'angry' | 'sad' | 'inspirational' | 'sarcastic' | 'witty' | 'enthusiastic' | 'serious' | 'humorous' | 'optimistic' | 'pessimistic' | 'passionate' | 'diplomatic' | 'assertive' | 'empathetic' | 'critical' | 'encouraging'>('neutral');
  const [quality, setQuality] = useState<'standard' | 'premium' | 'creative'>('standard');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [mode, setMode] = useState<'extractive' | 'abstractive' | 'hybrid'>('abstractive');
  const [format, setFormat] = useState<'paragraphs' | 'bullets'>('paragraphs');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    autoResizeTextarea();
  }, [text]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && text.trim() && !loading) {
        e.preventDefault();
        handleSummarize();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setText('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [text, loading]);


  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter text to summarize');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const textToSummarize = text.trim();

      if (!textToSummarize) {
        throw new Error('No content available for summarization');
      }

      // Step 1: Grammar check and correction
      const correctedText = applyGrammarCorrections(textToSummarize);
      if (correctedText !== textToSummarize) {
        console.log('Grammar corrections applied to input text');
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: correctedText,
          mode,
          quality,
          tone,
          length,
          format
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Summarization failed');
      }

      if (!data.data || !data.data.summary) {
        throw new Error('Invalid response format: missing summary data');
      }

      const summaryResult: SummaryResult = {
        summary: data.data.summary,
        wordCount: data.data.metrics?.wordCount || 0,
        compressionRatio: Math.round((data.data.metrics?.compressionRatio || 0) * 100),
        method: data.data.method || 'abstractive',
        config: data.data.config || { mode, quality, tone, length },
        metrics: data.data.metrics || {
          compressionRatio: 0,
          wordCount: 0,
          sentenceCount: 0,
          readability: 0,
          coherence: 0
        },
        processingTime: data.data.processingTime || 0,
        confidence: data.data.confidence
      };

      setResult(summaryResult);

      setHistory(prev => [
        {
          originalText: text.substring(0, 100) + '...',
          summary: data.data.summary.substring(0, 100) + '...',
          wordCount: data.data.metrics?.wordCount || 0,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9)
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Summarization failed. Please try again.';
      setError(errorMessage);
      console.error('Summarization error:', err);
    } finally {
      setLoading(false);
    }
  };


  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    const cleanedText = text.trim().replace(/\s+/g, ' ');
    const words = cleanedText.split(' ').filter(word => word.length > 0);
    return words.length;
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };


  // Grammar correction function
  const applyGrammarCorrections = (text: string): string => {
    let correctedText = text;

    // Common grammar and typo corrections
    const corrections = [
      // Capitalization
      { pattern: /\bi\b(?=\s+am)/g, replacement: 'I' },
      { pattern: /(^|[.!?]\s+)([a-z])/g, replacement: (match: string, p1: string, p2: string) => p1 + p2.toUpperCase() },

      // Contractions and possessives
      { pattern: /\bits\b(?=\s+(?:the|my|your|his|her|our|a|an))/g, replacement: 'its' },
      { pattern: /\bits\b/g, replacement: "it's" },
      { pattern: /\byour\b(?=\s+(?:going|re|ll|d|ve))/g, replacement: "you're" },

      // Punctuation spacing
      { pattern: /\s+,/g, replacement: ',' },
      { pattern: /,(\s*[.!?])/g, replacement: '$1' },
      { pattern: /\s+\./g, replacement: '.' },
      { pattern: /(\w)(\s+)(\?)/g, replacement: '$1?' },
      { pattern: /(\w)(\s+)(!)/g, replacement: '$1!' },

      // Common typos
      { pattern: /\bteh\b/g, replacement: 'the' },
      { pattern: /\brecieve\b/g, replacement: 'receive' },
      { pattern: /\boccured\b/g, replacement: 'occurred' },
      { pattern: /\bseperate\b/g, replacement: 'separate' },
      { pattern: /\bdefinately\b/g, replacement: 'definitely' },
      { pattern: /\bbegining\b/g, replacement: 'beginning' },
      { pattern: /\baccomodate\b/g, replacement: 'accommodate' },
      { pattern: /\boccassion\b/g, replacement: 'occasion' },
      { pattern: /\bexaggerate\b/g, replacement: 'exaggerate' }, // This one is correct, but often misspelled
      { pattern: /\bexagerate\b/g, replacement: 'exaggerate' },

      // Double spaces
      { pattern: /\s{2,}/g, replacement: ' ' },
    ];

    corrections.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        correctedText = correctedText.replace(pattern, replacement as any);
      } else {
        correctedText = correctedText.replace(pattern, replacement);
      }
    });

    return correctedText.trim();
  };

  const currentCharCount = text.length;
  const currentWordCount = countWords(text);
  const maxChars = 200000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SummarizeAI</h1>
          <p className="text-slate-600 mt-2">
            Generate instant, accurate summaries of your content with AI-powered analysis
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
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

      {activeTab === 'summarize' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">AI Settings</h3>
                <p className="text-xs text-slate-600">Configure summarization parameters</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/60 rounded-full text-xs font-medium text-slate-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Ready
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">M</span>
                  </div>
                  <span className="font-medium text-slate-700 text-sm">Mode</span>
                </div>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="extractive">Extractive</option>
                  <option value="abstractive">Abstractive</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">Q</span>
                  </div>
                  <span className="font-medium text-slate-700 text-sm">Quality</span>
                </div>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">T</span>
                  </div>
                  <span className="font-medium text-slate-700 text-sm">Tone</span>
                </div>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                >
                  <option value="neutral">Neutral</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="academic">Academic</option>
                  <option value="simple">Simple</option>
                  <option value="angry">Angry</option>
                  <option value="sad">Sad</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="sarcastic">Sarcastic</option>
                  <option value="witty">Witty</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="serious">Serious</option>
                  <option value="humorous">Humorous</option>
                  <option value="optimistic">Optimistic</option>
                  <option value="pessimistic">Pessimistic</option>
                  <option value="passionate">Passionate</option>
                  <option value="diplomatic">Diplomatic</option>
                  <option value="assertive">Assertive</option>
                  <option value="empathetic">Empathetic</option>
                  <option value="critical">Critical</option>
                  <option value="encouraging">Encouraging</option>
                </select>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">L</span>
                  </div>
                  <span className="font-medium text-slate-700 text-sm">Length</span>
                </div>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">F</span>
                  </div>
                  <span className="font-medium text-slate-700 text-sm">Format</span>
                </div>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs"
                >
                  <option value="paragraphs">Paragraphs</option>
                  <option value="bullets">Bullets</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col h-full">
              <PremiumCard
                title="Input Text"
                subtitle="Paste or type the content you want to summarize"
                gradient="from-white to-slate-50"
                className="flex-1 flex flex-col h-full"
              >
                <div className="flex-1 flex flex-col min-h-0 h-full">
                  <div className="flex-1 flex flex-col min-h-0">

                    <div className="relative flex-1 min-h-[200px]">
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter or paste your text here..."
                        className="w-full min-h-[200px] p-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/50 overflow-y-auto"
                      />
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <div className={`text-xs bg-white/80 px-2 py-1 rounded-md ${
                          currentCharCount > maxChars ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {currentWordCount} words • {currentCharCount}/{maxChars} chars
                        </div>
                        {text && (
                          <button
                            onClick={() => setText('')}
                            className="text-xs text-slate-400 hover:text-slate-600 bg-white/80 p-1 rounded-md"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleSummarize}
                      disabled={loading || !text.trim()}
                      className={`px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all ${
                        !text.trim() || loading
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                      }`}
                    >
                      {loading ? 'Generating...' : 'Generate Summary'}
                    </button>
                  </div>
                </div>
              </PremiumCard>
            </div>

            <div className="flex flex-col h-full">
              {result ? (
                <PremiumCard
                  title="AI Summary"
                  subtitle={`Generated with ${result.config.quality} quality • ${result.method} method`}
                  gradient="from-emerald-50 to-teal-50"
                  className="flex-1 h-full"
                >
                  <div className="space-y-4">
                    {/* Quality Metrics */}
                    <div className="bg-white/60 border border-white/40 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-slate-700 mb-3">Quality Metrics</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Compression</span>
                          <span className="text-xs font-medium text-emerald-600">{result.compressionRatio}%</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">Compression Ratio</div>
                            <div className="text-justify leading-tight text-slate-300">How much the original text was condensed. Higher = more concise summary. Ideal: 60-80%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Word Count</span>
                          <span className="text-xs font-medium text-blue-600">{result.wordCount}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">Word Count</div>
                            <div className="text-justify leading-tight text-slate-300">Number of words in the summary. Ideal range: 50-200 words.</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Sentences</span>
                          <span className="text-xs font-medium text-purple-600">{result.metrics.sentenceCount}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">Sentence Count</div>
                            <div className="text-justify leading-tight text-slate-300">Number of sentences in the summary. Ideal: 3-8 sentences.</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Coherence</span>
                          <span className="text-xs font-medium text-indigo-600">{(result.metrics.coherence * 100)?.toFixed(0) || '-'}%</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">Coherence Score</div>
                            <div className="text-justify leading-tight text-slate-300">How logically connected the summary is. Higher = more coherent. Ideal: 70%+</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Confidence</span>
                          <span className="text-xs font-medium text-green-600">{result.confidence ? (result.confidence * 100).toFixed(0) + '%' : '-'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">AI Confidence</div>
                            <div className="text-justify leading-tight text-slate-300">AI confidence in summary quality. Higher = more reliable. Ideal: 80%+</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Processing Time</span>
                          <span className="text-xs font-medium text-slate-800">{result.processingTime}ms</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">Processing Time</div>
                            <div className="text-justify leading-tight text-slate-300">Time taken to generate the summary. Lower = faster processing. Ideal: less than 2000ms</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">ROUGE-1</span>
                          <span className="text-xs font-medium text-blue-600">{result.metrics.rouge1 ? (result.metrics.rouge1 * 100).toFixed(1) + '%' : '-'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">ROUGE-1 Score</div>
                            <div className="text-justify leading-tight text-slate-300">Unigram overlap with original text. Higher = better content retention. Ideal: 40-70%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">ROUGE-2</span>
                          <span className="text-xs font-medium text-blue-600">{result.metrics.rouge2 ? (result.metrics.rouge2 * 100).toFixed(1) + '%' : '-'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">ROUGE-2 Score</div>
                            <div className="text-justify leading-tight text-slate-300">Bigram overlap with original text. Higher = better phrase retention. Ideal: 20-50%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">ROUGE-L</span>
                          <span className="text-xs font-medium text-blue-600">{result.metrics.rougeL ? (result.metrics.rougeL * 100).toFixed(1) + '%' : '-'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">ROUGE-L Score</div>
                            <div className="text-justify leading-tight text-slate-300">Longest common subsequence. Higher = better structure preservation. Ideal: 30-60%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">BLEU Score</span>
                          <span className="text-xs font-medium text-purple-600">{result.metrics.bleu ? (result.metrics.bleu * 100).toFixed(1) + '%' : '-'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">BLEU Score</div>
                            <div className="text-justify leading-tight text-slate-300">Bilingual evaluation understudy. Higher = better translation quality. Ideal: 30-70%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative cursor-help">
                          <span className="text-xs text-slate-600">Flesch-Kincaid</span>
                          <span className="text-xs font-medium text-orange-600">{result.metrics.readabilityScore?.toFixed(1) || '-'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-[10px] rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-auto whitespace-nowrap z-[9999] shadow-xl">
                            <div className="font-semibold mb-0.5 text-slate-200">Flesch-Kincaid Grade Level</div>
                            <div className="text-justify leading-tight text-slate-300">Reading grade level required. Lower = easier to read. Ideal: 6-12</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Output Window - Summary Text */}
                    <div className="bg-white/70 border border-white/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-orange-600 mb-3">Summary Output</h4>
                      <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                        {result.summary}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => navigator.clipboard.writeText(result.summary)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Copy Summary
                      </button>
                    </div>

                  </div>
                </PremiumCard>
              ) : (
                <PremiumCard
                  title="AI Summary Output"
                  subtitle="Your generated summary will appear here"
                  gradient="from-slate-50 to-slate-100"
                  className="flex-1 h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-700 tracking-tight">
                        AI-Powered Summary Ready
                      </h3>
                      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                        Enter your text in the input panel and click "Generate Summary" to create
                        intelligent, context-aware summaries with advanced quality metrics.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Advanced AI Models</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Quality Metrics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Enterprise Security</span>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <PremiumCard title="Summary History" subtitle="Recent summarization sessions">
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="p-4 border border-slate-100 rounded-lg">
                  <div className="text-sm">{item.summary}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">No history yet</div>
          )}
        </PremiumCard>
      )}
    </div>
  );
}