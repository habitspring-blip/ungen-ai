"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface SummaryResult {
  summary: string;
  wordCount: number;
  compressionRatio: number;
  keyPoints: string[];
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
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
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Summarization parameters
  const [tone, setTone] = useState<'formal' | 'casual' | 'academic' | 'simple' | 'neutral' | 'angry' | 'sad' | 'inspirational' | 'sarcastic' | 'witty' | 'enthusiastic' | 'serious' | 'humorous' | 'optimistic' | 'pessimistic' | 'passionate' | 'diplomatic' | 'assertive' | 'empathetic' | 'critical' | 'encouraging'>('neutral');
  const [quality, setQuality] = useState<'standard' | 'premium' | 'creative'>('standard');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [mode, setMode] = useState<'extractive' | 'abstractive' | 'hybrid'>('abstractive');
  const [format, setFormat] = useState<'paragraphs' | 'bullets'>('paragraphs');

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && (text.trim() || uploadedFile) && !loading) {
        e.preventDefault();
        handleSummarize();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setText('');
        setUploadedFile(null);
        setUploadedDocumentId(null);
        setUploadProgress(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [text, uploadedFile, loading]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/html',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx|html|jpg|jpeg|png|gif|webp|bmp|tiff)$/i)) {
      setError('Unsupported file type. Supported: PDF, Word, Text, HTML, and images (JPG, PNG, GIF, WebP, BMP, TIFF)');
      return;
    }

    setUploadedFile(file);
    setUploadProgress(25);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setUploadProgress(100);

      // Store the document ID for later use
      setUploadedDocumentId(data.document_id);

      // File uploaded and processed successfully
      // The extracted text is now stored in the database

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'File upload failed';
      setError(errorMessage);
      setUploadedFile(null);
      setUploadProgress(0);
    }
  };

  const handleSummarize = async () => {
    if (!uploadedFile && !text.trim()) {
      setError('Please upload a file or enter text to summarize');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let textToSummarize = text.trim();
      let documentId: string | undefined;

      // If we have an uploaded file, fetch its processed content
      if (uploadedFile && uploadedDocumentId) {
        try {
          // Fetch the document content using the stored document ID
          const docResponse = await fetch(`/api/documents/${uploadedDocumentId}`, {
            credentials: 'include'
          });
          const docData = await docResponse.json();

          if (docData.success) {
            const fileContent = docData.document.original_text;

            // Combine file content with additional context
            if (textToSummarize) {
              // If user provided additional context, append it
              textToSummarize = `${fileContent}\n\nAdditional Context: ${textToSummarize}`;
            } else {
              // Use only file content
              textToSummarize = fileContent;
            }
          } else {
            throw new Error('Failed to fetch document content');
          }
        } catch (docError) {
          console.warn('Could not fetch document content:', docError);
          // Fallback: use placeholder
          textToSummarize = textToSummarize || `[File: ${uploadedFile.name}]`;
        }
      }

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
        keyPoints: extractKeyPoints(data.data.summary),
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

  const extractKeyPoints = (summary: string): string[] => {
    return summary.split(/[.!?]+/).filter(point => point.trim().length > 10).slice(0, 5);
  };

  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    const cleanedText = text.trim().replace(/\s+/g, ' ');
    const words = cleanedText.split(' ').filter(word => word.length > 0);
    return words.length;
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
  const maxChars = 5000;

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

          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            <div className="w-full lg:w-[480px] flex flex-col">
              <PremiumCard
                title={uploadedFile ? "Additional Context (Optional)" : "Input Text"}
                subtitle={uploadedFile ? "Add instructions or context for the uploaded file" : "Paste or type the content you want to summarize, or upload a file above"}
                gradient="from-white to-slate-50"
                className="flex-1 flex flex-col"
              >
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* File Upload Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept=".txt,.pdf,.doc,.docx,.html,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file);
                              }
                            }}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg">📎</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-700">
                                {uploadedFile ? 'File uploaded successfully' : 'Click to upload a file (optional)'}
                              </div>
                              {uploadedFile && (
                                <div className="text-xs font-medium text-blue-600 mt-1">
                                  📄 {uploadedFile.name}
                                </div>
                              )}
                              <div className="text-xs text-slate-500">
                                {uploadedFile
                                  ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • ${uploadedFile.type || 'Unknown type'}`
                                  : 'PDF, Word, Text, HTML, or Images (JPG, PNG, etc.)'
                                }
                              </div>
                            </div>
                          </label>
                        </div>
                        {uploadedFile && (
                          <button
                            onClick={() => {
                              setUploadedFile(null);
                              setUploadedDocumentId(null);
                              setUploadProgress(0);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
 
                      {/* Upload Progress */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">Processing file...</div>
                        </div>
                      )}
                    </div>
 
                    <div className="relative flex-1 min-h-[200px]">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={uploadedFile ? "Optional: Add additional context or instructions here..." : "Enter or paste your text here, or upload a file above..."}
                        className="w-full h-full min-h-[200px] max-h-[600px] p-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/50 overflow-y-auto"
                      />
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <div className={`text-xs bg-white/80 px-2 py-1 rounded-md ${
                          currentCharCount > maxChars ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {uploadedFile && <span className="mr-2">📄 {uploadedFile.name}</span>}
                          {currentWordCount} words • {currentCharCount}/{maxChars} chars
                        </div>
                        {(text || uploadedFile) && (
                          <button
                            onClick={() => {
                              setText('');
                              setUploadedFile(null);
                              setUploadedDocumentId(null);
                              setUploadProgress(0);
                            }}
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
                      disabled={loading || (!text.trim() && !uploadedFile)}
                      className={`px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all ${
                        (!text.trim() && !uploadedFile) || loading
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

            <div className="w-full lg:w-[480px] flex flex-col">
              {result ? (
                <PremiumCard
                  title="AI Summary"
                  subtitle={`Generated with ${result.config.quality} quality • ${result.method} method`}
                  gradient="from-emerald-50 to-teal-50"
                  className="flex-1"
                >
                  <div className="space-y-4">
                    {/* Quality Metrics - Above Output */}
                    <div className="bg-white/60 border border-white/40 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Quality Metrics</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">Compression Ratio</span>
                          <span className="text-xs font-medium text-emerald-600">{result.compressionRatio}%</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">Compression Ratio</div>
                            <div className="text-center">How much the original text was condensed. Higher = more concise.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">Word Count</span>
                          <span className="text-xs font-medium text-blue-600">{result.wordCount}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">Word Count</div>
                            <div className="text-center">Number of words in the summary. Ideal: 50-200 words.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">Sentences</span>
                          <span className="text-xs font-medium text-purple-600">{result.metrics.sentenceCount}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">Sentences</div>
                            <div className="text-center">Number of sentences in summary. Ideal: 3-6 sentences.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">Coherence</span>
                          <span className="text-xs font-medium text-indigo-600">{(result.metrics.coherence * 100)?.toFixed(0) || 'N/A'}%</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">Coherence</div>
                            <div className="text-center">How logically connected the summary is. Higher = more coherent.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">Confidence</span>
                          <span className="text-xs font-medium text-green-600">{result.confidence ? (result.confidence * 100).toFixed(0) + '%' : 'N/A'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">Confidence</div>
                            <div className="text-center">AI confidence in summary quality. Higher = more reliable.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">ROUGE-1</span>
                          <span className="text-xs font-medium text-blue-600">{result.metrics.rouge1 ? (result.metrics.rouge1 * 100).toFixed(1) + '%' : 'N/A'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">ROUGE-1 Score</div>
                            <div className="text-center">Unigram overlap with original text. Higher = better content retention. Ideal: 60-80%.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">ROUGE-2</span>
                          <span className="text-xs font-medium text-blue-600">{result.metrics.rouge2 ? (result.metrics.rouge2 * 100).toFixed(1) + '%' : 'N/A'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">ROUGE-2 Score</div>
                            <div className="text-center">Bigram overlap with original text. Higher = better phrase preservation. Ideal: 40-60%.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">ROUGE-L</span>
                          <span className="text-xs font-medium text-blue-600">{result.metrics.rougeL ? (result.metrics.rougeL * 100).toFixed(1) + '%' : 'N/A'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">ROUGE-L Score</div>
                            <div className="text-center">Longest common subsequence match. Higher = better structural similarity. Ideal: 50-70%.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">BLEU Score</span>
                          <span className="text-xs font-medium text-purple-600">{result.metrics.bleu ? (result.metrics.bleu * 100).toFixed(1) + '%' : 'N/A'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">BLEU Score</div>
                            <div className="text-center">Machine translation quality metric. Higher = more natural language. Ideal: 50-80%.</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group relative">
                          <span className="text-xs text-slate-600 cursor-help">Flesch-Kincaid</span>
                          <span className="text-xs font-medium text-orange-600">{result.metrics.readabilityScore?.toFixed(1) || 'N/A'}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-48 z-50 shadow-lg">
                            <div className="font-medium mb-0.5 text-center">Flesch-Kincaid Grade Level</div>
                            <div className="text-center">Reading grade level required. Lower = easier to read. Ideal: 6-12 (6th-12th grade).</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-3 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-white/60 border border-white/40 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Performance</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Processing Time</span>
                        <span className="text-xs font-medium text-slate-800">{result.processingTime}ms</span>
                      </div>
                    </div>

                    {/* Output Window - Summary Text */}
                    <div className="bg-white/70 border border-white/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Summary Output</h4>
                      <div className="text-sm text-slate-800 whitespace-pre-wrap">
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
                      <button
                        onClick={() => setShowKeyPoints(!showKeyPoints)}
                        className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        {showKeyPoints ? 'Hide' : 'Show'} Key Points
                      </button>
                    </div>

                    {/* Key Points */}
                    {showKeyPoints && result.keyPoints.length > 0 && (
                      <div className="bg-white/60 border border-white/40 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Key Points</h4>
                        <ul className="space-y-2">
                          {result.keyPoints.map((point, index) => (
                            <li key={index} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </PremiumCard>
              ) : (
                <PremiumCard
                  title="AI Summary Output"
                  subtitle="Your generated summary will appear here"
                  gradient="from-slate-50 to-slate-100"
                >
                  <div className="flex items-center justify-center h-96 text-slate-400">
                    Ready to generate
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