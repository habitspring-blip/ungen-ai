"use client";

import { useEffect, useState } from "react";

export default function FadeIn({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timeout = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timeout);
  }, [children]);

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      {children}
    </div>
  );
}
