import { ReactNode } from 'react';

interface CortexCardProps {
  children: ReactNode;
}

export function CortexCard({ children }: CortexCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-card p-6">
      {children}
    </div>
  )
}
