"use client";

export default function EditorHeader() {
  return (
    <div className="mb-10">
      <h1
        className="
          text-4xl font-bold tracking-tight 
          bg-gradient-to-r from-yellow-400 to-orange-500 
          text-transparent bg-clip-text
        "
      >
        CortexOne Transform Engine
      </h1>

      <p className="text-ink-2 text-base mt-2 max-w-xl">
        Refine, elevate, and humanise your writing with precision and intelligence.
      </p>
    </div>
  );
}
