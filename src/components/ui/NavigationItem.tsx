"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';

interface NavigationItemProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
  badge?: string;
  isSidebar?: boolean;
}

export default function NavigationItem({
  href,
  icon,
  children,
  badge,
  isSidebar = false
}: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const baseClasses = isSidebar
    ? 'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200'
    : 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200';

  const activeClasses = isSidebar
    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-depth'
    : 'bg-slate-100 text-indigo-600';

  const inactiveClasses = isSidebar
    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon && <span className={isSidebar ? 'text-base' : 'text-sm'}>{icon}</span>}
      <span className="truncate">{children}</span>
      {badge && (
        <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
          isActive ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}