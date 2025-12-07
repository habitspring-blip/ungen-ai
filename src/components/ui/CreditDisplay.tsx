"use client";

import { useUser } from '@/context/UserContext';

export default function CreditDisplay() {
  const { user } = useUser();

  if (!user) return null;

  const credits = user.credits || 0;
  const wordsRemaining = Math.floor(credits / 5); // 5 credits per word

  const getCreditColor = () => {
    if (credits < 500) return 'text-red-600 bg-red-50 border-red-200';
    if (credits < 1500) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${getCreditColor()}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
      <span>{credits.toLocaleString()} credits</span>
      <span className="text-xs opacity-75">({wordsRemaining} words)</span>
    </div>
  );
}