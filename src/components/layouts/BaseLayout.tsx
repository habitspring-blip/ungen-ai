"use client";

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface BaseLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showTopbar?: boolean;
}

export default function BaseLayout({
  children,
  showSidebar = true,
  showTopbar = true
}: BaseLayoutProps) {
  const pathname = usePathname();

  // Pages that don't need sidebar/topbar
  const minimalPages = ['/login', '/forgot-password', '/reset-password'];
  const shouldShowUI = !minimalPages.includes(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      {shouldShowUI && showTopbar && (
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          {/* Topbar placeholder - will be implemented in navigation system */}
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="text-xl font-semibold text-slate-900">UngenAI</div>
          </div>
        </div>
      )}

      <div className="flex">
        {shouldShowUI && showSidebar && (
          <div className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-md min-h-[calc(100vh-4rem)]">
            {/* Sidebar placeholder - will be implemented in navigation system */}
            <div className="p-4">
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                Navigation
              </div>
              <div className="space-y-1">
                {/* Navigation items will be added here */}
              </div>
            </div>
          </div>
        )}

        <main className={`flex-1 ${shouldShowUI && showSidebar ? 'p-6' : 'p-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}