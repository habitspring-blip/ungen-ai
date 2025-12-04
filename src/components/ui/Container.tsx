export default function Container({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "wide" | "narrow" | "gradient" | "section";
}) {
  const base = "mx-auto w-full transition-all duration-200 ease-premium";

  const variants = {
    default: "max-w-5xl px-6",
    wide: "max-w-7xl px-6",
    narrow: "max-w-3xl px-6",

    // Vibrant background section (Pricing-like)
    gradient:
      "max-w-none w-full px-6 py-10 bg-gradient-to-br from-brand-indigo-start to-brand-pink-end text-white",

    // Neutral soft section wrapper
    section:
      "max-w-6xl px-6 py-10 bg-surface-0 rounded-xl shadow-soft",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
