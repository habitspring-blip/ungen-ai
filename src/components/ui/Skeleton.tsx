export default function Skeleton({
  className = "",
  variant = "neutral",
}: {
  className?: string;
  variant?: "neutral" | "subtle" | "gradient" | "strong";
}) {
  const variants = {
    neutral: "bg-surface-2",
    subtle: "bg-surface-3",

    // Vibrant shimmer version — matches Pricing Page brand gradients
    gradient:
      "bg-gradient-to-r from-brand-indigo-start/20 via-brand-pink-end/20 to-brand-indigo-start/20",

    // Higher contrast loading block (for charts, cards)
    strong:
      "bg-gradient-to-r from-brand-pink-start/30 via-brand-indigo-end/30 to-brand-pink-start/30",
  };

  return (
    <div
      className={`animate-pulse rounded-md ${variants[variant]} ${className}`}
    />
  );
}
