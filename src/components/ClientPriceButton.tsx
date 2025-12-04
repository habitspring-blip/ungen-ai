"use client";

import React from "react";

export default function ClientPriceButton({
  label,
  href
}: {
  label: string;
  href: string;
}) {
  const handleClick = () => {
    // prefer client navigation for simple flows; replace with router.push if you use next/navigation
    window.location.href = href;
  };

  return (
    <button
      onClick={handleClick}
      className="w-full py-3 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
    >
      {label}
    </button>
  );
}
