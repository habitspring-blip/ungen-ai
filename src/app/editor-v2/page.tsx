"use client";

import { useEffect, useRef, useState } from "react";
import { saveHistory } from "@/utils/history";
import PremiumButton from "@/components/ui/PremiumButton";
import { useRouter } from "next/navigation";

// Enhanced Shimmer Component
const EnhancedShimmer = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4"></div>
    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-full"></div>
    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-5/6"></div>
    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3"></div>
  </div>
);

// Enhanced Copy Button with Icon
const EnhancedCopyButton = ({ text }: { text: string }) => (
  <button
    onClick={() => navigator.clipboard.writeText(text)}
    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
    aria-label="Copy to clipboard"
  >
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a1 1 0 01-1-1z" />
    </svg>
    Copy
  </button>
);

// Enhanced Word Counter
const WordCounter = ({ text }: { text: string }) => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const chars = text.length;

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1 text-slate-500">
        <span className="font-medium text-slate-700">{words}</span>
        <span>words</span>
      </div>
      <div className="flex items-center gap-1 text-slate-500">
        <span className="font-medium text-slate-700">{chars}</span>
        <span>characters</span>
      </div>
    </div>
  );
};

// Enhanced Settings Panel
const SettingsPanel = ({
  mode,
  setMode,
  tone,
  setTone,
  model,
  setModel,
  strictness,
  setStrictness,
  context,
  setContext
}: {
  mode: string;
  setMode: (mode: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  model: string;
  setModel: (model: string) => void;
  strictness: number;
  setStrictness: (value: number) => void;
  context: string;
  setContext: (value: string) => void;
}) => {
  const rewriteModes = [
    { key: "humanise", label: "Humanise", icon: "👤" },
    { key: "professional", label: "Professional", icon: "💼" },
    { key: "email", label: "Email", icon: "✉️" },
    { key: "friendly", label: "Friendly", icon: "😊" },
    { key: "concise", label: "Concise", icon: "✂️" },
    { key: "linkedin", label: "LinkedIn", icon: "🔗" },
    { key: "formal", label: "Formal", icon: "📋" },
    { key: "simplified", label: "Simplified", icon: "📝" },
  ];

  const toneOptions = [
    { key: "neutral", label: "Neutral" },
    { key: "professional", label: "Professional" },
    { key: "casual", label: "Casual" },
    { key: "confident", label: "Confident" },
    { key: "friendly", label: "Friendly" },
  ];

  const modelOptions = [
    { key: "auto", label: "Auto" },
    { key: "claude", label: "Claude" },
    { key: "cloudflare", label: "Cloudflare" },
    { key: "gpt4", label: "GPT-4" },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Writing Settings</h3>
      </div>

      {/* Settings Content */}
      <div className="p-5 space-y-6">
        {/* Mode Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Rewrite Mode</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {rewriteModes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg transition-all ${
                  mode === m.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Tone</label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((t) => (
              <button
                key={t.key}
                onClick={() => setTone(t.key)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  tone === t.key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">AI Model</label>
          <div className="flex flex-wrap gap-2">
            {modelOptions.map((m) => (
              <button
                key={m.key}
                onClick={() => setModel(m.key)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  model === m.key
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strictness Slider */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Strictness Level</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="5"
              value={strictness}
              onChange={(e) => setStrictness(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg accent-indigo-600"
            />
            <span className="text-xs font-medium text-slate-700">{strictness}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Gentle</span>
            <span>Strict</span>
          </div>
        </div>

        {/* Context Input */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Context (Optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add specific instructions or context for the AI..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

// Enhanced Editor Panel
const EditorPanel = ({
  title,
  value,
  onChange,
  placeholder,
  footerContent,
  isOutput = false,
  loading = false,
  outputText = ""
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  footerContent?: React.ReactNode;
  isOutput?: boolean;
  loading?: boolean;
  outputText?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 600)}px`;
    }
  }, [value]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[200px]">
        {isOutput ? (
          <div className="px-5 py-4 min-h-[200px]">
            {loading ? (
              <EnhancedShimmer />
            ) : outputText ? (
              <div className="prose prose-slate max-w-none text-slate-800">
                {outputText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="w-12 h-12 mb-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Your enhanced text will appear here</p>
              </div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-5 py-4 text-base leading-relaxed text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none"
            style={{ minHeight: "200px" }}
          />
        )}
      </div>

      {/* Footer */}
      {footerContent && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default function EnterpriseEditorPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("neutral");
  const [mode, setMode] = useState("humanise");
  const [strictness, setStrictness] = useState(3);
  const [model, setModel] = useState("auto");
  const [saveStatus, setSaveStatus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const router = useRouter();

  async function handleRewrite() {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          tone,
          strictness,
          model,
          context,
          style: mode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutput(data.output);
        saveHistory(input, data.output);
        setSaveStatus("✅ Saved to history");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setOutput(`❌ Rewrite failed: ${data.error || "Please try again"}`);
        console.error("Rewrite error:", data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      setOutput("❌ Network error. Please check your connection.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Main Container with proper spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Writing Studio</h1>
              <p className="text-slate-600 mt-1">Enterprise-grade content transformation</p>
            </div>

            <div className="flex items-center gap-3">
              <PremiumButton
                onClick={() => router.push('/dashboard')}
                variant="secondary"
                size="sm"
                className="hidden sm:flex"
              >
                ← Back to Dashboard
              </PremiumButton>

              <PremiumButton
                onClick={() => setShowAdvanced(!showAdvanced)}
                size="sm"
                className="flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {showAdvanced ? "Hide Settings" : "Show Settings"}
              </PremiumButton>
            </div>
          </div>
        </div>

        {/* Main Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input */}
          <div className="lg:col-span-2">
            <EditorPanel
              title="Original Content"
              value={input}
              onChange={setInput}
              placeholder="Start writing or paste your text here..."
              footerContent={
                <div className="flex items-center justify-between w-full">
                  <WordCounter text={input} />
                  <div className="flex items-center gap-2">
                    {saveStatus && (
                      <span className="text-xs text-green-600 font-medium">{saveStatus}</span>
                    )}
                    <PremiumButton
                      onClick={handleRewrite}
                      disabled={!input.trim() || loading}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Transform Content
                        </>
                      )}
                    </PremiumButton>
                  </div>
                </div>
              }
            />
          </div>

          {/* Right Column - Output */}
          <div className="lg:col-span-1">
            <EditorPanel
              title="Enhanced Output"
              value=""
              onChange={() => {}}
              placeholder=""
              isOutput={true}
              loading={loading}
              outputText={output}
              footerContent={
                output && !loading && (
                  <div className="flex items-center justify-between w-full">
                    <WordCounter text={output} />
                    <EnhancedCopyButton text={output} />
                  </div>
                )
              }
            />
          </div>
        </div>

        {/* Advanced Settings - Collapsible */}
        {showAdvanced && (
          <div className="mt-6">
            <SettingsPanel
              mode={mode}
              setMode={setMode}
              tone={tone}
              setTone={setTone}
              model={model}
              setModel={setModel}
              strictness={strictness}
              setStrictness={setStrictness}
              context={context}
              setContext={setContext}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              setInput("");
              setOutput("");
              setSaveStatus("");
            }}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-xs font-medium text-slate-700">Clear All</span>
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(input)}
            disabled={!input}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-slate-700">Copy Input</span>
          </button>

          <button
            onClick={() => router.push('/history')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-slate-700">View History</span>
          </button>

          <button
            onClick={() => router.push('/ai-detection')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium text-slate-700">AI Detection</span>
          </button>
        </div>
      </div>
    </div>
  );
}