"use client";

export default function CopyButton({ text }: { text: string }) {
  function copy() {
    navigator.clipboard.writeText(text);
  }

  return (
    <button
      onClick={copy}
      className="
        px-3 py-1.5 rounded-md text-sm font-medium
        bg-surface-2 text-ink-1 
        hover:bg-surface-3 transition
        shadow-soft
      "
    >
      Copy
    </button>
  );
}
