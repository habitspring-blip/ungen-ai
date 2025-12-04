"use client";

import { useEffect, useState } from "react";

const actions = [
  { key: "concise", label: "Make Concise" },
  { key: "expand", label: "Expand" },
  { key: "clarify", label: "Improve Clarity" },
  { key: "professional", label: "Professional Tone" },
  { key: "friendly", label: "Friendly Tone" },
  { key: "formal", label: "Formal" },
  { key: "simplified", label: "Simplify" },
];

export default function FloatingToolbar({ onAction }: { onAction: (m: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [selectionText, setSelectionText] = useState("");

  useEffect(() => {
    function handleSelection() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setVisible(false);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });

      setSelectionText(text);
      setVisible(true);
    }

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="
        fixed z-50 
        bg-surface-0 text-ink-0 
        px-3 py-2 rounded-md shadow-depth border border-surface-2
        flex items-center gap-2 text-xs
        animate-fadeIn
      "
      style={{
        top: coords.y,
        left: coords.x,
        transform: "translate(-50%, -100%)",
      }}
    >
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={() => onAction(a.key)}
          className="
            px-2 py-1 rounded 
            hover:bg-surface-2 transition
          "
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
