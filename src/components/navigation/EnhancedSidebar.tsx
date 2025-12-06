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
      { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '/editor', icon: '✍️', label: 'Editor' },
      { href: '/ai-detection', icon: '🔍', label: 'AI Detection' },
      { href: '/history', icon: '📊', label: 'History' },
    ],
    features: [
      { href: '/pricing', icon: '💰', label: 'Pricing' },
      { href: '/settings', icon: '⚙️', label: 'Settings' },
    ],
    admin: [
      { href: '/support', icon: '💬', label: 'Contact Support' },
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
        h-screen border-r border-slate-200 bg-white/80 backdrop-blur-md
        shadow-soft flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-48'}
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
        </div>
      </nav>

      {/* Bottom Section - Upgrade and Logout */}
      <div className="p-4 border-t border-slate-100">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Upgrade Button (for non-Pro users) */}
            {user?.plan !== 'Pro' && user?.plan !== 'Enterprise' && (
              <Link href="/pricing" className="block">
                <PremiumButton
                  size="sm"
                  className="w-full justify-center"
                >
                  🚀 Upgrade Plan
                </PremiumButton>
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-slate-100 transition"
            >
              <span className="text-lg">⎋</span>
              <span>Logout</span>
            </button>

            {/* Version Info */}
            <div className="text-xs text-slate-400 text-center pt-2">
              v2.0.0 • Enterprise
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Upgrade Button (collapsed) */}
            {user?.plan !== 'Pro' && user?.plan !== 'Enterprise' && (
              <Link href="/pricing" className="block">
                <button className="w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center">
                  🚀
                </button>
              </Link>
            )}

            {/* Logout Button (collapsed) */}
            <button
              onClick={logout}
              className="w-10 h-10 text-red-600 hover:bg-slate-100 rounded-lg transition flex items-center justify-center"
            >
              ⎋
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}