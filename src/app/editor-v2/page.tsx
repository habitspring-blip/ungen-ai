"use client";

import { useState, useEffect, useRef } from "react";

// Enhanced Editor v2.0 - Superior to QuillBot
export default function EditorV2Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [analysisResults, setAnalysisResults] = useState<{
    aiDetection?: {
      isAIGenerated: boolean;
      confidence: number;
      modelConsensus: string;
    } | null;
    grammarAnalysis?: {
      score: number;
      readabilityScore: number;
      complexityLevel: string;
      errors: { message: string; severity: string }[];
      suggestions: string[];
      toneAnalysis: string;
    } | null;
  }>({});
  
  // Enhanced features state
  const [loading, setLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'write' | 'analyze' | 'rewrite'>('write');
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Advanced options
  const [tone, setTone] = useState("professional");
  const [style, setStyle] = useState("humanise");
  const [strictness, setStrictness] = useState(3);
  const [context, setContext] = useState("");
  
  // Real-time analysis
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 800) + "px";
    }
  }, [input]);

  // Word count updated directly in input change handler

  async function performRealTimeAnalysis() {
    try {
      // AI Detection
      if (input.length > 100) {
        const aiResponse = await fetch('/api/ai-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input })
        });
        const aiData = await aiResponse.json();
        
        // Grammar Analysis
        const grammarResponse = await fetch('/api/grammar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input })
        });
        const grammarData = await grammarResponse.json();

        setAnalysisResults({
          aiDetection: aiData.success ? aiData : null,
          grammarAnalysis: grammarData.success ? grammarData : null
        });

        if (grammarData.success) {
          setReadabilityScore(grammarData.readabilityScore || 0);
        }
      }
    } catch (error) {
      console.error('Real-time analysis error:', error);
    }
  }

  // Real-time analysis (throttled)
  useEffect(() => {
    if (!realTimeAnalysis || input.length < 50) return;

    const timer = setTimeout(async () => {
      await performRealTimeAnalysis();
    }, 2000); // 2-second delay

    return () => clearTimeout(timer);
  }, [input, realTimeAnalysis]);

  async function handleRewrite() {
    if (!input.trim()) return;
    setLoading(true);
    setActiveAnalysis('rewrite');

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          tone,
          strictness,
          style,
          context,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutput(data.output);
        // Perform analysis on the rewritten text
        await performAnalysisOnText(data.output);
      } else {
        setOutput("Rewrite failed. Please try again.");
      }
    } catch {
      setOutput("Network error. Please check your connection.");
    }

    setLoading(false);
    setActiveAnalysis(null);
  }

  async function performAnalysisOnText(text: string) {
    try {
      // AI Detection on output
      const aiResponse = await fetch('/api/ai-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const aiData = await aiResponse.json();
      
      // Grammar Analysis on output
      const grammarResponse = await fetch('/api/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const grammarData = await grammarResponse.json();

      setAnalysisResults(prev => ({
        ...prev,
        aiDetection: aiData.success ? aiData : prev.aiDetection,
        grammarAnalysis: grammarData.success ? grammarData : prev.grammarAnalysis
      }));
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setAnalysisResults({});
    setContext("");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Enhanced Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Analysis Panel</h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time AI detection & grammar analysis
            </p>
          </div>

          {/* Analysis Results */}
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* AI Detection */}
            {analysisResults.aiDetection && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    analysisResults.aiDetection.isAIGenerated ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                  <h3 className="font-semibold text-gray-900">AI Detection</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Result:</span>
                    <span className={`font-medium ${
                      analysisResults.aiDetection.isAIGenerated ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {analysisResults.aiDetection.isAIGenerated ? 'AI-Generated' : 'Human-Written'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(analysisResults.aiDetection.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Model: {analysisResults.aiDetection.modelConsensus}
                  </div>
                </div>
              </div>
            )}

            {/* Grammar Analysis */}
            {analysisResults.grammarAnalysis && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="font-semibold text-gray-900 mb-3">Grammar Analysis</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Score:</span>
                    <span className={`font-medium ${
                      analysisResults.grammarAnalysis.score >= 80 ? 'text-green-600' :
                      analysisResults.grammarAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {analysisResults.grammarAnalysis.score}/100
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Readability:</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(analysisResults.grammarAnalysis.readabilityScore)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Complexity:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {analysisResults.grammarAnalysis.complexityLevel}
                    </span>
                  </div>
                  
                  {analysisResults.grammarAnalysis.errors?.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Errors found:</span>
                      <span className="font-medium text-red-600 ml-2">
                        {analysisResults.grammarAnalysis.errors.length}
                      </span>
                    </div>
                  )}
                  
                  {analysisResults.grammarAnalysis.toneAnalysis && (
                    <div className="text-sm">
                      <span className="text-gray-600">Tone:</span>
                      <span className="font-medium text-gray-900 ml-2 capitalize">
                        {analysisResults.grammarAnalysis.toneAnalysis}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Stats */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Text Statistics</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count:</span>
                  <span className="font-medium text-gray-900">{wordCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Character Count:</span>
                  <span className="font-medium text-gray-900">{input.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Paragraphs:</span>
                  <span className="font-medium text-gray-900">
                    {input.split(/\n\s*\n/).filter(p => p.trim()).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {analysisResults.grammarAnalysis?.suggestions && analysisResults.grammarAnalysis.suggestions.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-2">Suggestions</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  {analysisResults.grammarAnalysis.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={realTimeAnalysis}
                onChange={(e) => setRealTimeAnalysis(e.target.checked)}
                className="rounded border-gray-300"
              />
              Real-time analysis
            </label>
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">UngenAI Editor v2.0</h1>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Enhanced
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300"
              >
                {showSidebar ? 'Hide' : 'Show'} Analysis
              </button>
              
              <button
                onClick={clearAll}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:border-red-300"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="flex items-center gap-2 mb-4">
            {['write', 'analyze', 'rewrite'].map((mode) => (
              <button
                key={mode}
                onClick={() => setEditorMode(mode as 'write' | 'analyze' | 'rewrite')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  editorMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Options Panel */}
          {editorMode === 'rewrite' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="neutral">Neutral</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="confident">Confident</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="humanise">Humanise</option>
                  <option value="professional">Professional</option>
                  <option value="simplified">Simplified</option>
                  <option value="concise">Concise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Strictness: {strictness}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={strictness}
                  onChange={(e) => setStrictness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRewrite}
                  disabled={!input.trim() || loading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Rewrite'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Input Panel */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {editorMode === 'analyze' ? 'Text to Analyze' : 'Original Text'}
                  </span>
                  {activeAnalysis && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      {activeAnalysis === 'rewrite' ? 'Rewriting...' : 'Analyzing...'}
                    </div>
                  )}
                </div>
              </div>
              
              <textarea
                ref={textareaRef}
                placeholder={
                  editorMode === 'analyze' 
                    ? "Paste your text here for comprehensive analysis..." 
                    : editorMode === 'rewrite'
                    ? "Enter text to rewrite and enhance..."
                    : "Start writing or paste your text here..."
                }
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0).length;
                  setWordCount(words);
                }}
                className="w-full h-full p-6 resize-none border-none outline-none text-gray-900 placeholder-gray-400"
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>

          {/* Output Panel */}
          {editorMode === 'rewrite' && (
            <div className="flex-1 p-6 border-l border-gray-200">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
                <div className="p-4 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Enhanced Output</span>
                </div>
                
                <div className="p-6 h-full overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Enhancing your text...</p>
                      </div>
                    </div>
                  ) : output ? (
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {output}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-center text-gray-400">
                      <div>
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium">Enhanced text will appear here</p>
                        <p className="text-sm mt-1">Your rewritten content with AI analysis</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Context Input */}
        {(editorMode === 'rewrite' || realTimeAnalysis) && (
          <div className="bg-white border-t border-gray-200 p-4">
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add context or instructions (optional)..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}