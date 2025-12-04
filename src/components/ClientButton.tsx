// src/components/ClientButton.tsx
"use client";

import React from "react";

type Props = {
  label: string;
  // don't accept handlers passed from server; implement handler here
  onClientClick?: () => void; // optional local handler
};

export default function ClientButton({ label, onClientClick }: Props) {
  function handleClick() {
    // local client behavior (fetch, router.push, open modal, etc.)
    if (onClientClick) onClientClick();
    // Example: call an API
    // fetch('/api/checkout', { method: 'POST' })
  }

  return (
    <button onClick={handleClick} className="w-full py-2 rounded bg-indigo-600 text-white">
      {label}
    </button>
  );
}
