import React from "react";
import classNames from "classnames";

export default function Badge({
  children,
  className = "",
  variant = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "neutral" | "subtle" | "outline" | "gradient" | "success" | "warning";
}) {
  const base =
    "text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap transition-all duration-200 ease-premium";

  const variants = {
    // Same as your current badge
    neutral: "bg-surface-2 text-ink-1",

    subtle: "bg-surface-0 text-ink-1 border border-surface-2",

    outline: "border border-ink-1 text-ink-1 bg-transparent",

    // Vibrant gradient badge (matches pricing style)
    gradient:
      "text-white bg-gradient-to-r from-brand-indigo-start to-brand-pink-end shadow-soft",

    // Optional status badges
    success:
      "bg-gradient-to-r from-brand-emerald-start to-brand-emerald-end text-white",

    warning:
      "bg-gradient-to-r from-brand-amber-start to-brand-amber-end text-white",
  };

  return (
    <span className={classNames(base, variants[variant], className)}>
      {children}
    </span>
  );
}
