import React from "react";
import classNames from "classnames";

export default function Input({
  className = "",
  variant = "default",
  ...props
}: {
  className?: string;
  variant?: "default" | "subtle" | "underline" | "gradient";
  [key: string]: any;
}) {
  const base =
    "w-full px-3 py-2 text-sm rounded-md transition-all duration-200 ease-premium";

  const variants = {
    // Your original input (unchanged)
    default:
      "bg-surface-0 border border-surface-3 text-ink-0 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",

    // Soft minimal input (lighter border)
    subtle:
      "bg-surface-0 border border-surface-2 text-ink-0 focus:border-ink-1 focus:ring-1 focus:ring-ink-1/20",

    // Underline-only input (for signup forms, editor panels)
    underline:
      "bg-transparent border-0 border-b border-surface-3 rounded-none text-ink-0 focus:border-accent focus:ring-0",

    // Vibrant gradient border on focus (matches PricingPage)
    gradient:
      "bg-surface-0 border border-surface-3 text-ink-0 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-offset-0 focus:ring-[3px] focus:ring-transparent focus:shadow-[0_0_0_3px_rgba(var(--brand-indigo-start),0.35)]",
  };

  return (
    <input
      className={classNames(base, variants[variant], className)}
      {...props}
    />
  );
}
