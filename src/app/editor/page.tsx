"use client";

import { useEffect, useRef, useState } from "react";
import { saveHistory } from "@/utils/history";

// Mock components
const Shimmer = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    <div className="h-4 bg-slate-200 rounded w-full"></div>
    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
  </div>
);

interface CopyButtonProps {
  text: string;
}

const CopyButton = ({ text }: CopyButtonProps) => (
  <button
    onClick={() => navigator.clipboard.writeText(text)}
    className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all duration-200"
  >
    Copy
  </button>
);

const Footer = () => (
  <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
    <p>© 2024 CortexOne AI Writing Studio</p>
  </footer>
);

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const Button = ({ children, className, ...props }: ButtonProps) => (
  <button className={className} {...props}>
    {children}
  </button>
);

export default function EditorPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);

  const [intent, setIntent] = useState<'humanize' | 'summarize' | 'expand' | 'simplify' | 'grammar'>('humanize');
  const [targetTone, setTargetTone] = useState("professional");
  const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [styleSamples, setStyleSamples] = useState<string[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);

  const [suggestLoading, setSuggestLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp?: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // auto resize input box
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 800) + "px";
  };

  useEffect(() => {
    if (textareaRef.current) adjustTextareaHeight(textareaRef.current);
  }, [input]);

  const rewriteIntents = [
    { key: "humanize" as const, label: "Humanize", description: "Make text sound more natural and human-written" },
    { key: "summarize" as const, label: "Summarize", description: "Condense content while preserving key information" },
    { key: "expand" as const, label: "Expand", description: "Add details and elaboration" },
    { key: "simplify" as const, label: "Simplify", description: "Use simpler words and clearer structure" },
    { key: "grammar" as const, label: "Grammar Check", description: "Fix grammar and improve writing quality" },
  ];

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
          intent,
          targetTone,
          targetLength,
          styleSamples,
          context
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      // Handle streaming response
      const reader = res.body?.getReader();
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
        setOutput(streamedContent);
      }

      // Save to history when streaming completes
      console.log("🔄 Saving transformation to history:", {
        input: input.substring(0, 50) + "...",
        output: streamedContent.substring(0, 50) + "..."
      });
      saveHistory(input, streamedContent);
      console.log("✅ History saved successfully");

      // Show visual feedback
      setSaveStatus("Saved to history!");
      setTimeout(() => setSaveStatus(""), 3000);

    } catch (error) {
      console.error("Rewrite error:", error);
      const errorMessage = error instanceof Error ? error.message : "Rewrite failed. Please try again.";
      setOutput(`Error: ${errorMessage}`);
    }

    setLoading(false);
  }

  function formatTimestamp() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const suffix = now.getHours() >= 12 ? "PM" : "AM";
    return `Today · ${hours}:${minutes} ${suffix}`;
  }

  function openCortexAI() {
    const greeting = {
      role: "assistant" as const,
      content: `Hi! I'm CortexAI, your AI Writing Assistant.

How can I help you today? I can assist with:
• Writing improvement
• Grammar and tone adjustments
• Ideas and brainstorming
• Rewriting in different styles

What would you like to do?`,
    };

    setChatHistory([greeting]);
    setIsChatOpen(true);
  }

  async function sendChatMessage() {
    if (!chatInput.trim()) return;

    const firstUserMessage = chatHistory.filter((m) => m.role === "user").length === 0;

    const userMsg = {
      role: "user" as const,
      content: chatInput,
      timestamp: firstUserMessage ? formatTimestamp() : undefined,
    };

    const newHistory = [...chatHistory, userMsg];

    setChatInput("");
    setSuggestLoading(true);
    setChatHistory(newHistory);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input || "No text provided",
          chatHistory: newHistory,
          message: userMsg.content,
        }),
      });

      const data = await res.json();

      const assistantReply = {
        role: "assistant" as const,
        content:
          data.suggestion ||
          "I’m having trouble generating a response. Try again.",
      };

      setChatHistory([...newHistory, assistantReply]);
    } catch {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: "Error connecting to CortexAI." },
      ]);
    }

    setSuggestLoading(false);
  }

  function closeChat() {
    setIsChatOpen(false);
    setChatInput("");
    setChatHistory([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "/" && !showMenu) {
      e.preventDefault();
      setShowMenu(true);
      setMenuIndex(0);
      return;
    }

    if (showMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenuIndex((i) => (i + 1) % rewriteIntents.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenuIndex((i) => (i - 1 + rewriteIntents.length) % rewriteIntents.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        setIntent(rewriteIntents[menuIndex].key);
        setShowMenu(false);
      }
      if (e.key === "Escape") setShowMenu(false);
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-[#FAFAFA]">
        {/* HEADER */}
        <div className="bg-white shadow-md">
          <div className="border-b border-black/5">
            <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 blur-lg opacity-40" />
                  <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-lg">C</span>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-[-0.02em] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    CortexOne
                  </h1>
                  <p className="text-[9px] tracking-[0.15em] text-slate-400 uppercase font-semibold">
                    AI Writing Studio
                  </p>
                </div>
              </div>

              {/* Floating Button */}
              <button
                onClick={openCortexAI}
                disabled={suggestLoading}
                className="
                  px-4 py-2 rounded-full
                  bg-white/80 backdrop-blur-md
                  border border-slate-200
                  shadow-md hover:shadow-lg
                  text-slate-700 text-xs font-semibold
                  flex items-center gap-2
                  transition-all
                "
              >
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 17l-1.5-3L7 12l3.5-2 1.5-3 1.5 3 3.5 2-3.5 2z"
                  />
                </svg>
                CortexAI
              </button>
            </div>
          </div>

          {/* INTENT/TONE/LENGTH CONTROLS */}
          <div className="bg-[#FAFAFA] border-b border-slate-200">
            <div className="max-w-[1400px] mx-auto px-8 py-3">
              <div className="flex flex-col gap-3">
                {/* INTENT */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase min-w-[50px] font-semibold">
                    Intent
                  </span>
                  {rewriteIntents.map((intentOption) => (
                    <button
                      key={intentOption.key}
                      onClick={() => setIntent(intentOption.key)}
                      className={`
                        px-3 py-1 text-[11px] rounded-full
                        ${
                          intent === intentOption.key
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }
                      `}
                      title={intentOption.description}
                    >
                      {intentOption.label}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* TONE */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase min-w-[50px] font-semibold">
                    Tone
                  </span>
                  {[
                    { key: "professional", label: "Professional" },
                    { key: "casual", label: "Casual" },
                    { key: "friendly", label: "Friendly" },
                    { key: "formal", label: "Formal" },
                    { key: "confident", label: "Confident" },
                    { key: "neutral", label: "Neutral" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTargetTone(t.key)}
                      className={`
                        px-3 py-1 text-[11px] rounded-full
                        ${
                          targetTone === t.key
                            ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }
                      `}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* LENGTH */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase min-w-[50px] font-semibold">
                    Length
                  </span>
                  {[
                    { key: "short" as const, label: "Short", description: "More concise" },
                    { key: "medium" as const, label: "Medium", description: "Balanced length" },
                    { key: "long" as const, label: "Long", description: "More detailed" },
                  ].map((l) => (
                    <button
                      key={l.key}
                      onClick={() => setTargetLength(l.key)}
                      className={`
                        px-3 py-1 text-[11px] rounded-full
                        ${
                          targetLength === l.key
                            ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }
                      `}
                      title={l.description}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CONTEXT FIELD */}
          <div className="bg-[#FAFAFA] border-b border-slate-200">
            <div className="max-w-[1400px] mx-auto px-8 py-2.5">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add context or instructions (optional)..."
                className="
                  w-full h-12 px-3 py-2 text-xs
                  bg-white border border-slate-200 rounded-lg
                  text-slate-700 placeholder-slate-400
                  focus:outline-none focus:border-indigo-500
                  focus:ring-1 focus:ring-indigo-500/20
                "
              />
            </div>
          </div>

          {/* STYLE SAMPLES */}
          <div className="bg-[#FAFAFA] border-b border-slate-200">
            <div className="max-w-[1400px] mx-auto px-8 py-2.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Style Samples
                </span>
                <span className="text-[9px] text-slate-500">
                  ({styleSamples.length}/3) - Add examples of your preferred writing style
                </span>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    type="text"
                    value={styleSamples[index] || ""}
                    onChange={(e) => {
                      const newSamples = [...styleSamples];
                      newSamples[index] = e.target.value;
                      setStyleSamples(newSamples.filter(s => s.trim()));
                    }}
                    placeholder={`Example ${index + 1}: Your writing style...`}
                    className="
                      w-full px-3 py-2 text-xs
                      bg-white border border-slate-200 rounded-lg
                      text-slate-700 placeholder-slate-400
                      focus:outline-none focus:border-indigo-500
                      focus:ring-1 focus:ring-indigo-500/20
                    "
                    maxLength={200}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN EDITOR */}
        <main className="max-w-[1400px] mx-auto px-8 pt-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* INPUT PANEL */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Original
                </span>
              </div>

              <textarea
                ref={textareaRef}
                placeholder="Start writing or paste your text here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="
                  w-full px-6 py-5
                  text-base leading-relaxed
                  text-slate-800 placeholder-slate-300
                  bg-transparent resize-none overflow-hidden
                  focus:outline-none
                "
                style={{ minHeight: "120px" }}
              />

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span>{input.length} characters</span>
                  {input.trim() && (
                    <span>{input.trim().split(/\s+/).length} words</span>
                  )}
                  {saveStatus && (
                    <span className="text-green-600 font-medium">{saveStatus}</span>
                  )}
                </div>

                <Button
                  onClick={handleRewrite}
                  disabled={!input.trim() || loading}
                  className="
                    px-6 py-2 rounded-lg
                    bg-gradient-to-r from-indigo-600 to-purple-600
                    text-white text-sm font-semibold
                    shadow-md hover:shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {loading ? "Enhancing..." : "Enhance Text"}
                </Button>
              </div>
            </div>

            {/* OUTPUT PANEL */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Enhanced
                </span>
                {output && !loading && <CopyButton text={output} />}
              </div>

              <div className="px-6 py-5" style={{ minHeight: "120px" }}>
                {loading ? (
                  <Shimmer />
                ) : output ? (
                  <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {output}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      Your enhanced text will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* PREMIUM CHATBOX */}
      {isChatOpen && (
        <div
          className="
            fixed bottom-8 right-8
            w-[320px] h-[480px]
            rounded-2xl border border-slate-200
            shadow-[0_8px_32px_rgba(0,0,0,0.08)]
            bg-gradient-to-br from-white to-slate-50
            flex flex-col overflow-hidden
            animate-[fadeIn_0.25s_ease-out]
          "
          style={{ zIndex: 9999 }}
        >
          {/* HEADER */}
          <div className="
            h-12 px-4
            bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50
            border-b border-slate-200
            flex items-center justify-between
          ">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-700">
                CortexAI
              </h3>
              <p className="text-[11px] text-slate-400">
                AI Writing Assistant
              </p>
            </div>

            <button
              onClick={closeChat}
              className="
                p-1.5 rounded-lg
                hover:bg-white/60 transition
              "
            >
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/50">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`
                    max-w-[75%] px-3 py-2 rounded-xl text-[13px]
                    ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                        : "bg-gradient-to-br from-white to-indigo-50 border border-slate-200 shadow-sm text-slate-800"
                    }
                  `}
                >
                  {msg.content}

                  {/* TIMESTAMP ONLY FOR FIRST USER MESSAGE */}
                  {msg.timestamp && (
                    <div className="mt-1 text-[10px] text-white/70">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {suggestLoading && (
              <div className="flex justify-start">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <div className="h-14 border-t border-slate-200 bg-white px-3 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !suggestLoading && sendChatMessage()
              }
              placeholder="Ask something..."
              className="
                flex-1 px-3 py-2
                text-[13px]
                bg-slate-50 border border-slate-200
                rounded-xl outline-none
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20
              "
            />

            <button
              onClick={sendChatMessage}
              disabled={!chatInput.trim() || suggestLoading}
              className="
                w-9 h-9 rounded-full
                bg-gradient-to-r from-indigo-600 to-purple-600
                text-white shadow-md
                flex items-center justify-center
                hover:shadow-lg hover:scale-[1.05]
                transition
                disabled:opacity-50
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON (BOTTOM) */}
      <div className="sticky bottom-8 z-50 max-w-[1400px] mx-auto px-8 pointer-events-none">
        <div className="flex justify-end">
          <button
            onClick={openCortexAI}
            disabled={suggestLoading}
            className="
              px-5 py-3 rounded-full pointer-events-auto
              bg-white/80 backdrop-blur-md
              border border-slate-200
              shadow-lg hover:shadow-xl
              flex items-center gap-2
              text-[13px] font-semibold text-slate-700
              transition-all
            "
          >
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 17l-1.5-3L7 12l3.5-2 1.5-3 1.5 3 3.5 2-3.5 2z"
              />
            </svg>
            CortexAI
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}
