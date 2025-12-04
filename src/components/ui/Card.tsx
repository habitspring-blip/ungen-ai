import React from "react";
import classNames from "classnames";

export default function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "gradient" | "outlined" | "glow";
}) {
  const base =
    "rounded-md p-5 transition-all duration-200 ease-premium";

  const variants = {
    default:
      "bg-surface-0 shadow-soft",

    elevated:
      "bg-surface-0 shadow-depth",

    outlined:
      "bg-surface-0 border border-surface-2",

    // subtle brand glow like Pricing Page highlight cards
    glow:
      "bg-surface-0 shadow-soft hover:shadow-depth border border-transparent hover:border-brand-indigo-start/40",

    // vibrant gradient background card (for hero sections or pricing highlights)
    gradient:
      "text-white bg-gradient-to-br from-brand-indigo-start to-brand-pink-end shadow-soft hover:shadow-depth",
  };

  return (
    <div
      className={classNames(base, variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
