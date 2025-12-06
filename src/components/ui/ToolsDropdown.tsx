"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ToolItem {
  name: string;
  description: string;
  link: string;
  icon: React.ReactNode;
}

export default function ToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const tools: ToolItem[] = [
    {
      name: "Summarizer",
      description: "Condense long text into concise summaries",
      link: "/summarise",
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: "Expander",
      description: "Expand short text into detailed content",
      link: "/expand",
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToolClick = (toolLink: string) => {
    setIsOpen(false);
    router.push(toolLink);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tools Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition ${
          isOpen
            ? 'bg-purple-100 text-purple-700'
            : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
        }`}
        aria-label="Writing Tools"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0 4a2 2 0 100-4m0 4a2 2 0 100 4m12-4a2 2 0 100-4m0 4a2 2 0 100 4" />
        </svg>
        <span>Tools</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-50">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 px-3 py-1">WRITING TOOLS</p>
          </div>

          <div className="divide-y divide-slate-50">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolClick(tool.link)}
                className="w-full text-left p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{tool.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tool.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}