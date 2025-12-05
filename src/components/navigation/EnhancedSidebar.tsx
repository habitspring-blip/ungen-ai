"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import NavigationItem from '@/components/ui/NavigationItem';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function EnhancedSidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'settings'>('main');

  // Navigation items grouped by section
  const navigationItems = {
    main: [
      { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '/editor', icon: '✍️', label: 'Editor' },
      { href: '/ai-detection', icon: '🔍', label: 'AI Detection' },
      { href: '/history', icon: '📊', label: 'History' },
      { href: '/tools', icon: '🧰', label: 'Tools' },
    ],
    features: [
      { href: '/pricing', icon: '💰', label: 'Pricing' },
      { href: '/settings', icon: '⚙️', label: 'Settings' },
      { href: '/billing', icon: '💳', label: 'Billing' },
    ],
    admin: [
      { href: '/api', icon: '🔌', label: 'API' },
      { href: '/team', icon: '👥', label: 'Team' },
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
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Top Section with Logo and Collapse */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-xl font-semibold text-slate-900">UngenAI</span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? '›' : '‹'}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-600 transition mx-auto"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            ›
          </button>
        )}
      </div>

      {/* User Profile Section */}
      {!isCollapsed && user && (
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900 truncate">{user.name || 'User'}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      )}

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