"use client";

import React from "react";
import classNames from "classnames";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "subtle" | "ghost" | "gradient";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-premium";

  const variants = {
    primary:
      "bg-ink-0 text-surface-0 hover:bg-ink-1",

    subtle:
      "bg-surface-2 text-ink-0 hover:bg-surface-3 border border-surface-3",

    ghost:
      "text-ink-0 hover:bg-surface-2",

    // New vibrant brand gradient button
    gradient:
      "text-white bg-gradient-to-br from-brand-indigo-start to-brand-pink-end hover:opacity-90 shadow-soft hover:shadow-depth",
  };

  return (
    <button
      className={classNames(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
