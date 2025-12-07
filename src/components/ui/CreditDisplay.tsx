"use client";

import { useUser } from '@/context/UserContext';

export default function CreditDisplay() {
  const { user } = useUser();

  if (!user) return null;

  const credits = user.credits || 0;
  const wordsLimit = user.creditsLimit || 1000;
  const wordsRemaining = wordsLimit; // 1 credit = 1 word

  console.log('CreditDisplay values:', { credits, wordsLimit, wordsRemaining, user });

  const getCreditColor = () => {
    if (credits < 500) return 'text-red-600 bg-red-50 border-red-200';
    if (credits < 1500) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const usedCredits = wordsLimit - credits;
  const usagePercentage = (usedCredits / wordsLimit) * 100;

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border text-sm font-medium ${getCreditColor()}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>

      <div className="flex flex-col gap-1">
        <div className="text-xs">
          {credits.toLocaleString()} / {wordsLimit.toLocaleString()} credits
        </div>

        {/* Progress Bar */}
        <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden border border-white/30">
          <div
            className="h-full bg-white rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <div className="text-xs opacity-80">
          {usedCredits.toLocaleString()} used • {credits.toLocaleString()} remaining
        </div>
      </div>
    </div>
  );
}