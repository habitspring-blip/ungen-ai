import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
}

export default function GlassCard({ children }: GlassCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white/55 backdrop-blur-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  )
}
