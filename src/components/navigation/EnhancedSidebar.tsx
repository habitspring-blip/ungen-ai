"use client";

import { useState } from 'react';
import NavigationItem from '@/components/ui/NavigationItem';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function EnhancedSidebar() {
  const { user, logout } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Navigation items grouped by section
  const navigationItems = {
    main: [
      ...(user ? [{
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        label: 'Dashboard'
      }] : []),
      {
        href: '/editor',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        label: 'Rewrite Editor'
      },
      {
        href: '/summarize',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        label: 'SummarizeAI'
      },
      {
        href: '/expand',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        label: 'LongForm Plus'
      },
      {
        href: '/seo',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
        label: 'SEO Magic'
      },
      {
        href: '/citation',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        label: 'Citation Generator'
      },
      {
        href: '/plagiarism',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        label: 'Plagiarism Shield'
      },
      {
        href: '/ai-detection',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
        label: 'AI Detection'
      },
      ...(user ? [{
        href: '/history',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'History'
      }] : []),
    ],
    features: [
      {
        href: '/pricing',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        label: 'Pricing'
      },
      ...(user ? [{
        href: '/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        label: 'Settings'
      }] : []),
    ],
    admin: [
      {
        href: '/support',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        label: 'Support'
      },
    ]
  };

  // Get all navigation items in order
  const allNavItems = [
    ...navigationItems.main,
    ...navigationItems.features,
    ...navigationItems.admin
  ];

  return (
    <aside
      className={`
        flex-1 border-r border-slate-200 bg-white/80 backdrop-blur-md
        shadow-soft flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-18' : 'w-56'}
      `}
    >
      {/* Top Section - Only Collapse Button */}
      <div className="flex items-center justify-end px-6 py-4 border-b border-slate-100">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-600 transition"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User Profile Section - REMOVED (shown in topbar) */}
      {/* Keep this section empty for cleaner sidebar */}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-1">
          {allNavItems.map((item) => (
            <NavigationItem
              key={item.href}
              href={item.href}
              icon={!isCollapsed ? item.icon : undefined}
              isSidebar
            >
              {!isCollapsed && item.label}
            </NavigationItem>
          ))}

          {/* Upgrade Button (for non-Pro users) - positioned prominently */}
          {!isCollapsed && user?.plan !== 'Pro' && user?.plan !== 'Enterprise' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link href="/pricing" className="block">
                <PremiumButton
                  size="sm"
                  className="w-full justify-center text-xs py-2"
                >
                  🚀 Upgrade
                </PremiumButton>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Section - Logout */}
      <div className="p-3">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* Logout Button */}
            {user && (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-ink-1 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 border border-transparent"
              >
                <span className="text-sm">↗️</span>
                <span className="font-premium text-xs">Logout</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Upgrade Button (collapsed) - moved to navigation area */}
            {user?.plan !== 'Pro' && user?.plan !== 'Enterprise' && (
              <div className="mb-2">
                <Link href="/pricing" className="block">
                  <button className="w-8 h-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center text-sm">
                    🚀
                  </button>
                </Link>
              </div>
            )}

            {/* Logout Button (collapsed) */}
            {user && (
              <button
                onClick={logout}
                className="w-8 h-8 text-ink-1 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200 flex items-center justify-center text-sm"
              >
                ↗️
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}