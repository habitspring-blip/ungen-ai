"use client";

export default function FloatingAIButton({
  onClick,
  loading
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="
        fixed bottom-8 right-8 z-50
        px-5 py-3 rounded-full
        shadow-xl border border-surface-3
        bg-gradient-to-r from-yellow-400 to-orange-500
        text-white font-semibold text-sm
        hover:opacity-90 active:scale-95
        transition-all
        animate-pulse-slow
      "
    >
      {loading ? "Thinking…" : "AI Suggest"}
    </button>
  );
}
